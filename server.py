import argparse
import asyncio
import base64
import hashlib
import hmac
import json
import os
import sqlite3
import uuid
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
DEFAULT_DB_PATH = BASE_DIR / "outputs" / "military_benefits.db"


def now_ms() -> int:
    import time

    return int(time.time() * 1000)


def make_password_hash(password: str) -> str:
    salt = os.urandom(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return "scrypt$" + base64.b64encode(salt).decode("ascii") + "$" + base64.b64encode(derived).decode("ascii")


def verify_password_hash(password: str, password_hash: str) -> bool:
    h = str(password_hash or "")
    if h.startswith("scrypt$"):
        try:
            _prefix, b64_salt, b64_hash = h.split("$", 2)
            salt = base64.b64decode(b64_salt.encode("ascii"))
            target = base64.b64decode(b64_hash.encode("ascii"))
            derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
            return hmac.compare_digest(derived, target)
        except Exception:
            return False
    # backward compatibility for older rows (sha256 hex)
    legacy = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy, h)


def get_db_url() -> str:
    return os.environ.get("DATABASE_URL")


class PostgresConnWrapper:
    def __init__(self, db_url):
        import psycopg2
        import psycopg2.extras
        self.conn = psycopg2.connect(db_url, sslmode="require")
        
    def execute(self, sql, params=None):
        sql_pg = sql.replace('?', '%s')
        cur = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        try:
            cur.execute(sql_pg, params)
            return cur
        except Exception:
            self.conn.rollback()
            raise
            
    def commit(self):
        self.conn.commit()
        
    def close(self):
        self.conn.close()


class SQLiteConnWrapper:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        
    def execute(self, sql, params=None):
        if params is None:
            return self.conn.execute(sql)
        return self.conn.execute(sql, params)
        
    def commit(self):
        self.conn.commit()
        
    def close(self):
        self.conn.close()


def init_review_table(db_path: Path) -> None:
    db_url = get_db_url()
    if db_url:
        import psycopg2
        conn = psycopg2.connect(db_url, sslmode="require")
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS review_posts (
                      id VARCHAR(255) PRIMARY KEY,
                      author VARCHAR(255) NOT NULL DEFAULT '',
                      content TEXT NOT NULL,
                      password_hash VARCHAR(255) NOT NULL,
                      created_at BIGINT NOT NULL,
                      updated_at BIGINT
                    )
                    """
                )
                cur.execute("CREATE INDEX IF NOT EXISTS idx_review_posts_created_at ON review_posts (created_at DESC)")
                conn.commit()
        finally:
            conn.close()
        return

    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS review_posts (
              id TEXT PRIMARY KEY,
              author TEXT NOT NULL DEFAULT '',
              content TEXT NOT NULL,
              password_hash TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              updated_at INTEGER
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_review_posts_created_at ON review_posts (created_at DESC)")
        conn.commit()
    finally:
        conn.close()


def init_engagement_tables(db_path: Path) -> None:
    db_url = get_db_url()
    if db_url:
        import psycopg2
        conn = psycopg2.connect(db_url, sslmode="require")
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS facility_click_events (
                      event_id SERIAL PRIMARY KEY,
                      facility_id VARCHAR(255) NOT NULL,
                      client_token VARCHAR(255) NOT NULL,
                      created_at BIGINT NOT NULL
                    )
                    """
                )
                cur.execute("CREATE INDEX IF NOT EXISTS idx_click_facility ON facility_click_events (facility_id)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_click_client ON facility_click_events (client_token)")

                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS facility_action_states (
                      client_token VARCHAR(255) NOT NULL,
                      facility_id VARCHAR(255) NOT NULL,
                      action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('like', 'favorite')),
                      active INTEGER NOT NULL CHECK (active IN (0, 1)),
                      updated_at BIGINT NOT NULL,
                      PRIMARY KEY (client_token, facility_id, action_type)
                    )
                    """
                )
                cur.execute("CREATE INDEX IF NOT EXISTS idx_action_facility_type ON facility_action_states (facility_id, action_type)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_action_client_type ON facility_action_states (client_token, action_type)")
                
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS qr_scan_events (
                      event_id SERIAL PRIMARY KEY,
                      facility_id VARCHAR(255) NOT NULL,
                      created_at BIGINT NOT NULL
                    )
                    """
                )
                cur.execute("CREATE INDEX IF NOT EXISTS idx_qr_facility ON qr_scan_events (facility_id)")
                conn.commit()
        finally:
            conn.close()
        return

    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS facility_click_events (
              event_id INTEGER PRIMARY KEY AUTOINCREMENT,
              facility_id TEXT NOT NULL,
              client_token TEXT NOT NULL,
              created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_click_facility ON facility_click_events (facility_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_click_client ON facility_click_events (client_token)")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS facility_action_states (
              client_token TEXT NOT NULL,
              facility_id TEXT NOT NULL,
              action_type TEXT NOT NULL CHECK (action_type IN ('like', 'favorite')),
              active INTEGER NOT NULL CHECK (active IN (0, 1)),
              updated_at INTEGER NOT NULL,
              PRIMARY KEY (client_token, facility_id, action_type)
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_action_facility_type ON facility_action_states (facility_id, action_type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_action_client_type ON facility_action_states (client_token, action_type)")
        
        # QR Code Scan Tracking Table
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS qr_scan_events (
              event_id INTEGER PRIMARY KEY AUTOINCREMENT,
              facility_id TEXT NOT NULL,
              created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_qr_facility ON qr_scan_events (facility_id)")
        conn.commit()
    finally:
        conn.close()


class MMAMapHandler(SimpleHTTPRequestHandler):
    db_path: Path = DEFAULT_DB_PATH

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def _db(self):
        db_url = get_db_url()
        if db_url:
            return PostgresConnWrapper(db_url)
        return SQLiteConnWrapper(self.db_path)

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            data = {}
        return data if isinstance(data, dict) else {}

    def _parse_review_path(self):
        path = urlparse(self.path).path
        if path == "/api/reviews":
            return ("collection", "")
        if path.startswith("/api/reviews/"):
            suffix = path[len("/api/reviews/") :]
            if suffix.endswith("/verify"):
                review_id = suffix[: -len("/verify")].strip("/")
                return ("verify", review_id)
            return ("item", suffix.strip("/"))
        return ("other", "")

    def _parse_engagement_path(self):
        path = urlparse(self.path).path
        if path == "/api/engagement/snapshot":
            return ("snapshot", "")
        if path == "/api/engagement/click":
            return ("click", "")
        if path == "/api/engagement/toggle":
            return ("toggle", "")
        return ("other", "")

    def _handle_qr_scan(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        facility_id = (q.get("facility_id") or [""])[0]
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing facility_id"})
            return
        conn = self._db()
        try:
            conn.execute(
                "INSERT INTO qr_scan_events (facility_id, created_at) VALUES (?, ?)",
                (facility_id, now_ms())
            )
            conn.commit()
        finally:
            conn.close()
    def _handle_qr_stats(self):
        conn = self._db()
        try:
            rows = conn.execute(
                """
                SELECT facility_id, COUNT(*) AS scan_count 
                FROM qr_scan_events 
                GROUP BY facility_id 
                ORDER BY scan_count DESC
                """
            ).fetchall()
            stats = [{"facilityId": r["facility_id"], "scanCount": r["scan_count"]} for r in rows]
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "stats": stats})

    def _handle_print_poster(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        facility_id = (q.get("facility_id") or [""])[0]
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing facility_id"})
            return
        
        # Check cache folder first
        cache_dir = BASE_DIR / "outputs" / "poster_cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path = cache_dir / f"poster_{facility_id}.png"
        
        if cache_path.exists():
            print(f"[Server] Serving cached poster for {facility_id}")
            with open(cache_path, "rb") as f:
                img_bytes = f.read()
        else:
            print(f"[Server] Rendering poster dynamically for {facility_id}")
            import asyncio
            from poster_renderer import generate_poster
            
            try:
                port = 8080
                if hasattr(self.server, "server_port"):
                    port = self.server.server_port
                
                # Run the renderer in an event loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                img_bytes = loop.run_until_complete(generate_poster(facility_id, port=port))
                loop.close()
                
                # Cache it
                with open(cache_path, "wb") as f:
                    f.write(img_bytes)
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
                return
                
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(img_bytes)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(img_bytes)

    def _handle_print_stand(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        facility_id = (q.get("facility_id") or [""])[0]
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing facility_id"})
            return
        
        # Check cache folder first
        cache_dir = BASE_DIR / "outputs" / "stand_cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path = cache_dir / f"stand_{facility_id}.png"
        
        if cache_path.exists():
            print(f"[Server] Serving cached stand for {facility_id}")
            with open(cache_path, "rb") as f:
                img_bytes = f.read()
        else:
            print(f"[Server] Rendering stand dynamically for {facility_id}")
            from stand_renderer import generate_stand
            
            try:
                port = 8080
                if hasattr(self.server, "server_port"):
                    port = self.server.server_port
                elif hasattr(self.server, "server_address"):
                    port = self.server.server_address[1]
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                img_bytes = loop.run_until_complete(generate_stand(facility_id, port=port))
                loop.close()
                
                # Cache it
                with open(cache_path, "wb") as f:
                    f.write(img_bytes)
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
                return
                
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(img_bytes)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(img_bytes)

    def _handle_print_hanger(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        facility_id = (q.get("facility_id") or [""])[0]
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing facility_id"})
            return
        
        # Check cache folder first
        cache_dir = BASE_DIR / "outputs" / "hanger_cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path = cache_dir / f"hanger_{facility_id}.png"
        
        if cache_path.exists():
            print(f"[Server] Serving cached hanger for {facility_id}")
            with open(cache_path, "rb") as f:
                img_bytes = f.read()
        else:
            print(f"[Server] Rendering hanger dynamically for {facility_id}")
            from hanger_renderer import draw_door_hanger, get_store_info
            
            try:
                store = get_store_info(facility_id)
                if not store:
                    self._json(HTTPStatus.NOT_FOUND, {"error": "Store not found"})
                    return
                img_bytes = draw_door_hanger(store)
                
                # Cache it
                with open(cache_path, "wb") as f:
                    f.write(img_bytes)
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
                return
                
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(img_bytes)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(img_bytes)

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == "/api/print_hanger":
            self._handle_print_hanger()
            return
        if parsed_url.path == "/api/print_stand":
            self._handle_print_stand()
            return
        if parsed_url.path == "/api/print_poster":
            self._handle_print_poster()
            return
        if parsed_url.path == "/api/qr_scan":
            self._handle_qr_scan()
            return
        if parsed_url.path == "/api/qr_stats":
            self._handle_qr_stats()
            return

        route_type, review_id = self._parse_review_path()
        engagement_route, _ = self._parse_engagement_path()
        if route_type == "collection":
            self._handle_list_reviews()
            return
        if route_type == "item" and review_id:
            self._handle_get_review(review_id)
            return
        if engagement_route == "snapshot":
            self._handle_engagement_snapshot()
            return
        if parsed_url.path == "/api/health":
            self._json(HTTPStatus.OK, {"ok": True})
            return
        super().do_GET()

    def do_POST(self):
        route_type, review_id = self._parse_review_path()
        engagement_route, _ = self._parse_engagement_path()
        if route_type == "collection":
            self._handle_create_review()
            return
        if route_type == "verify" and review_id:
            self._handle_verify_review_password(review_id)
            return
        if engagement_route == "click":
            self._handle_engagement_click()
            return
        if engagement_route == "toggle":
            self._handle_engagement_toggle()
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_PUT(self):
        route_type, review_id = self._parse_review_path()
        if route_type == "item" and review_id:
            self._handle_update_review(review_id)
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_DELETE(self):
        route_type, review_id = self._parse_review_path()
        if route_type == "item" and review_id:
            self._handle_delete_review(review_id)
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def _serialize_row(self, row: sqlite3.Row) -> dict:
        return {
            "id": row["id"],
            "author": row["author"],
            "content": row["content"],
            "createdAt": int(row["created_at"] or 0),
            "updatedAt": int(row["updated_at"] or 0),
        }

    def _handle_list_reviews(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        try:
            page = max(1, int((q.get("page") or ["1"])[0]))
        except ValueError:
            page = 1
        try:
            page_size = int((q.get("page_size") or ["10"])[0])
        except ValueError:
            page_size = 10
        page_size = max(1, min(page_size, 200))
        offset = (page - 1) * page_size

        conn = self._db()
        try:
            total = conn.execute("SELECT COUNT(*) AS cnt FROM review_posts").fetchone()["cnt"]
            rows = conn.execute(
                """
                SELECT id, author, content, created_at, updated_at
                FROM review_posts
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
                (page_size, offset),
            ).fetchall()
        finally:
            conn.close()

        total_pages = max(1, (total + page_size - 1) // page_size)
        self._json(
            HTTPStatus.OK,
            {
                "items": [self._serialize_row(row) for row in rows],
                "total": int(total),
                "page": page,
                "pageSize": page_size,
                "totalPages": total_pages,
            },
        )

    def _handle_get_review(self, review_id: str):
        conn = self._db()
        try:
            row = conn.execute(
                "SELECT id, author, content, created_at, updated_at FROM review_posts WHERE id = ?",
                (review_id,),
            ).fetchone()
        finally:
            conn.close()
        if not row:
            self._json(HTTPStatus.NOT_FOUND, {"error": "해당 후기를 찾을 수 없습니다."})
            return
        self._json(HTTPStatus.OK, {"item": self._serialize_row(row)})

    def _handle_create_review(self):
        body = self._read_json_body()
        author = str(body.get("author", "")).strip()[:20]
        content = str(body.get("content", "")).strip()[:500]
        password = str(body.get("password", "")).strip()[:20]
        if not content:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "후기 내용을 입력해 주세요."})
            return
        if not password:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "비밀번호를 입력해 주세요."})
            return

        review_id = f"rb_{uuid.uuid4().hex}"
        created_at = now_ms()
        conn = self._db()
        try:
            conn.execute(
                """
                INSERT INTO review_posts (id, author, content, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NULL)
                """,
                (review_id, author, content, make_password_hash(password), created_at),
            )
            conn.commit()
        finally:
            conn.close()

        self._json(
            HTTPStatus.CREATED,
            {"ok": True, "item": {"id": review_id, "author": author, "content": content, "createdAt": created_at, "updatedAt": 0}},
        )

    def _verify_password(self, review_id: str, password: str):
        conn = self._db()
        try:
            row = conn.execute("SELECT password_hash FROM review_posts WHERE id = ?", (review_id,)).fetchone()
        finally:
            conn.close()
        if not row:
            return False, "not_found"
        return verify_password_hash(password, str(row["password_hash"] or "")), ""

    def _handle_verify_review_password(self, review_id: str):
        body = self._read_json_body()
        password = str(body.get("password", "")).strip()[:20]
        if not password:
            self._json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "비밀번호를 입력해 주세요."})
            return
        ok, status = self._verify_password(review_id, password)
        if status == "not_found":
            self._json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "해당 후기를 찾을 수 없습니다."})
            return
        if not ok:
            self._json(HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "비밀번호가 일치하지 않습니다."})
            return
        self._json(HTTPStatus.OK, {"ok": True})

    def _handle_update_review(self, review_id: str):
        body = self._read_json_body()
        author = str(body.get("author", "")).strip()[:20]
        content = str(body.get("content", "")).strip()[:500]
        current_password = str(body.get("currentPassword", "")).strip()[:20]
        new_password = str(body.get("newPassword", "")).strip()[:20]
        if not content:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "후기 내용을 입력해 주세요."})
            return
        if not current_password:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "비밀번호 확인이 필요합니다."})
            return
        ok, status = self._verify_password(review_id, current_password)
        if status == "not_found":
            self._json(HTTPStatus.NOT_FOUND, {"error": "해당 후기를 찾을 수 없습니다."})
            return
        if not ok:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "비밀번호가 일치하지 않습니다."})
            return

        updated_at = now_ms()
        conn = self._db()
        try:
            if new_password:
                conn.execute(
                    """
                    UPDATE review_posts
                    SET author = ?, content = ?, password_hash = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (author, content, make_password_hash(new_password), updated_at, review_id),
                )
            else:
                conn.execute(
                    """
                    UPDATE review_posts
                    SET author = ?, content = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (author, content, updated_at, review_id),
                )
            conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True})

    def _handle_delete_review(self, review_id: str):
        body = self._read_json_body()
        password = str(body.get("password", "")).strip()[:20]
        if not password:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "비밀번호를 입력해 주세요."})
            return
        ok, status = self._verify_password(review_id, password)
        if status == "not_found":
            self._json(HTTPStatus.NOT_FOUND, {"error": "해당 후기를 찾을 수 없습니다."})
            return
        if not ok:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "비밀번호가 일치하지 않습니다."})
            return

        conn = self._db()
        try:
            conn.execute("DELETE FROM review_posts WHERE id = ?", (review_id,))
            conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True})

    def _validate_engagement_inputs(self, body: dict):
        client_token = str(body.get("clientToken", "")).strip()[:120]
        facility_id = str(body.get("facilityId", "")).strip()[:120]
        if not client_token or not facility_id:
            return "", "", False
        return client_token, facility_id, True

    def _handle_engagement_snapshot(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        client_token = str((q.get("clientToken") or [""])[0]).strip()[:120]
        if not client_token:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "clientToken is required"})
            return

        conn = self._db()
        try:
            click_rows = conn.execute(
                """
                SELECT facility_id, COUNT(*) AS cnt
                FROM facility_click_events
                GROUP BY facility_id
                """
            ).fetchall()
            like_rows = conn.execute(
                """
                SELECT facility_id, SUM(active) AS cnt
                FROM facility_action_states
                WHERE action_type = 'like'
                GROUP BY facility_id
                """
            ).fetchall()
            favorite_rows = conn.execute(
                """
                SELECT facility_id, SUM(active) AS cnt
                FROM facility_action_states
                WHERE action_type = 'favorite'
                GROUP BY facility_id
                """
            ).fetchall()
            my_rows = conn.execute(
                """
                SELECT facility_id, action_type
                FROM facility_action_states
                WHERE client_token = ? AND active = 1
                """,
                (client_token,),
            ).fetchall()
        finally:
            conn.close()

        click_counts = {str(r["facility_id"]): int(r["cnt"] or 0) for r in click_rows}
        like_counts = {str(r["facility_id"]): int(r["cnt"] or 0) for r in like_rows}
        favorite_counts = {str(r["facility_id"]): int(r["cnt"] or 0) for r in favorite_rows}
        my_likes = [str(r["facility_id"]) for r in my_rows if str(r["action_type"]) == "like"]
        my_favorites = [str(r["facility_id"]) for r in my_rows if str(r["action_type"]) == "favorite"]

        self._json(
            HTTPStatus.OK,
            {
                "ok": True,
                "clickCounts": click_counts,
                "likeCounts": like_counts,
                "favoriteCounts": favorite_counts,
                "myLikes": my_likes,
                "myFavorites": my_favorites,
            },
        )

    def _handle_engagement_click(self):
        body = self._read_json_body()
        client_token, facility_id, ok = self._validate_engagement_inputs(body)
        if not ok:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "clientToken/facilityId is required"})
            return
        conn = self._db()
        try:
            conn.execute(
                """
                INSERT INTO facility_click_events (facility_id, client_token, created_at)
                VALUES (?, ?, ?)
                """,
                (facility_id, client_token, now_ms()),
            )
            row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM facility_click_events WHERE facility_id = ?",
                (facility_id,),
            ).fetchone()
            conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "facilityId": facility_id, "clickCount": int(row["cnt"] or 0)})

    def _handle_engagement_toggle(self):
        body = self._read_json_body()
        client_token, facility_id, ok = self._validate_engagement_inputs(body)
        action_type = str(body.get("actionType", "")).strip()
        if not ok or action_type not in {"like", "favorite"}:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "invalid action payload"})
            return

        conn = self._db()
        try:
            row = conn.execute(
                """
                SELECT active
                FROM facility_action_states
                WHERE client_token = ? AND facility_id = ? AND action_type = ?
                """,
                (client_token, facility_id, action_type),
            ).fetchone()
            next_active = 0 if row and int(row["active"] or 0) == 1 else 1
            conn.execute(
                """
                INSERT INTO facility_action_states (client_token, facility_id, action_type, active, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(client_token, facility_id, action_type)
                DO UPDATE SET active = excluded.active, updated_at = excluded.updated_at
                """,
                (client_token, facility_id, action_type, next_active, now_ms()),
            )
            count_row = conn.execute(
                """
                SELECT SUM(active) AS cnt
                FROM facility_action_states
                WHERE facility_id = ? AND action_type = ?
                """,
                (facility_id, action_type),
            ).fetchone()
            conn.commit()
        finally:
            conn.close()

        self._json(
            HTTPStatus.OK,
            {
                "ok": True,
                "facilityId": facility_id,
                "actionType": action_type,
                "active": bool(next_active),
                "count": int(count_row["cnt"] or 0),
            },
        )


def main():
    port_env = os.environ.get("PORT")
    default_port = int(port_env) if port_env else 8080

    parser = argparse.ArgumentParser(description="MMAMap web + review/engagement API server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=default_port)
    parser.add_argument("--db", default=str(DEFAULT_DB_PATH))
    args = parser.parse_args()

    db_path = Path(args.db).resolve()
    init_review_table(db_path)
    init_engagement_tables(db_path)
    MMAMapHandler.db_path = db_path
    server = ThreadingHTTPServer((args.host, args.port), MMAMapHandler)
    print(f"Serving MMAMap at http://{args.host}:{args.port}")
    print(f"Data DB: {db_path}")
    server.serve_forever()


if __name__ == "__main__":
    main()
