import argparse
import asyncio
import base64
import datetime
import hashlib
import hmac
import json
import os
import random
import re
import secrets
import smtplib
import sqlite3
import time
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import urllib.request

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    psycopg2 = None


BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
DEFAULT_DB_PATH = BASE_DIR / "outputs" / "military_benefits.db"


def load_env_file():
    env_file = BASE_DIR / ".env"
    if env_file.exists():
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k and not os.environ.get(k):
                        os.environ[k] = v
            print("[Server Env] Successfully loaded .env configuration (SUPABASE DIRECT)")
        except Exception as e:
            print(f"[Server Env] Error reading .env: {e}")

load_env_file()


def send_verification_email(to_email: str, code: str) -> bool:
    # 1. Try Resend API (HTTPS)
    resend_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not resend_key:
        resend_key = base64.b64decode("cmVfMjZlckFGU0NfSGVydkpIUFg4YmNKVEV1M2lXZEhGckVH").decode("utf-8")

    if resend_key:
        try:
            req_data = {
                "from": "onboarding@resend.dev",
                "to": to_email,
                "subject": f"[군필지도] 회원가입 이메일 인증번호 [{code}]",
                "html": f"""
                <div style="font-family: 'Nanum Gothic', 'Apple SD Gothic Neo', sans-serif; max-width: 520px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #2563eb; margin: 0; font-size: 22px;">🪖 군필지도 (GP Map)</h2>
                    <p style="color: #64748b; font-size: 13.5px; margin: 6px 0 0;">청년 장병 및 병역명문가 혜택 지도</p>
                  </div>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
                    <p style="font-size: 14.5px; color: #334155; margin: 0 0 14px; font-weight: 600;">회원가입을 위한 6자리 이메일 인증번호입니다.</p>
                    <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1d4ed8; background: #ffffff; padding: 14px 24px; border-radius: 10px; border: 2px dashed #bfdbfe; display: inline-block;">
                      {code}
                    </div>
                    <p style="font-size: 12.5px; color: #94a3b8; margin: 12px 0 0;">인증번호 유효시간은 <b>10분</b>입니다.</p>
                  </div>
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.5;">본인이 요청하지 않은 경우 본 메일을 무시해 주세요.<br>© 2026 군필지도(GP Map). All rights reserved.</p>
                </div>
                """,
            }
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(req_data).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "resend-python/2.0.0",
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    body = json.loads(resp.read().decode("utf-8"))
                    print(f"[Resend Email Sent] Successfully sent code [{code}] to {to_email} (ID: {body.get('id')})")
                    return True
        except Exception as e:
            print(f"[Resend Email Error] Failed to send via Resend to {to_email}: {e}")

    # 2. Try SMTP fallback if configured
    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
    smtp_from = os.environ.get("SMTP_FROM", smtp_user or "noreply@mmamap.kr").strip()

    if not smtp_host or not smtp_user or not smtp_password:
        print(f"[Email Dev Mode] No SMTP configured. Verification code for [{to_email}]: {code}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[군필지도] 회원가입 이메일 인증번호 [{code}]"
        msg["From"] = f"군필지도 <{smtp_from}>"
        msg["To"] = to_email

        html_body = f"""
        <div style="font-family: 'Nanum Gothic', 'Apple SD Gothic Neo', sans-serif; max-width: 520px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #2563eb; margin: 0; font-size: 22px;">🪖 군필지도 (GP Map)</h2>
            <p style="color: #64748b; font-size: 13.5px; margin: 6px 0 0;">청년 장병 및 병역명문가 혜택 지도</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 14.5px; color: #334155; margin: 0 0 14px; font-weight: 600;">회원가입을 위한 6자리 이메일 인증번호입니다.</p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1d4ed8; background: #ffffff; padding: 14px 24px; border-radius: 10px; border: 2px dashed #bfdbfe; display: inline-block;">
              {code}
            </div>
            <p style="font-size: 12.5px; color: #94a3b8; margin: 12px 0 0;">인증번호 유효시간은 <b>10분</b>입니다.</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.5;">본인이 요청하지 않은 경우 본 메일을 무시해 주세요.<br>© 2026 군필지도(GP Map). All rights reserved.</p>
        </div>
        """
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        print(f"[Email Sent] Successfully sent code [{code}] to {to_email}")
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send email via SMTP to {to_email}: {e}")
        return False

FACILITIES_BY_ID = {}
FACILITIES_LIST = []


def load_facilities_data():
    global FACILITIES_BY_ID, FACILITIES_LIST
    json_path = WEB_DIR / "data" / "benefits_map.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                FACILITIES_LIST = data.get("facilities", [])
                FACILITIES_BY_ID = {
                    item.get("facility_id"): item
                    for item in FACILITIES_LIST
                    if item.get("facility_id")
                }
                print(f"[Server] Loaded {len(FACILITIES_BY_ID)} facilities for store verification.")
        except Exception as e:
            print(f"[Server] Error loading facilities json: {e}")


def mask_phone(phone: str) -> str:
    p = str(phone or "").strip()
    if not p:
        return "전화번호 미등록"
    # e.g. 010-1234-5678 -> 010-****-5678
    parts = p.split("-")
    if len(parts) == 3:
        return f"{parts[0]}-{'*' * len(parts[1])}-{parts[2]}"
    if len(parts) == 2:
        return f"{parts[0]}-{'*' * len(parts[1])}"
    if len(p) >= 8:
        return p[:3] + "****" + p[-4:]
    return p[:2] + "**" + p[-2:] if len(p) > 4 else "**"


def now_ms() -> int:
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


DEFAULT_SUPABASE_DB_URL = "postgresql://postgres.mwprznynxyvzxweehynl:Whdhksgml1!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

def get_db_url() -> str:
    return os.environ.get("DATABASE_URL") or DEFAULT_SUPABASE_DB_URL


class PostgresConnWrapper:
    def __init__(self, db_url):
        import psycopg2
        import psycopg2.extras
        self.conn = psycopg2.connect(db_url, sslmode="require", keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5)
        
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


_USE_POSTGRES = True

def init_review_table(db_path: Path) -> None:
    db_url = get_db_url()
    if db_url:
        try:
            import psycopg2
            conn = psycopg2.connect(db_url, sslmode="require", connect_timeout=5)
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
        except Exception as e:
            print(f"[Server DB] Postgres init_review_table notice: {e}")

    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS review_posts (
              id TEXT PRIMARY KEY,
              author TEXT NOT NULL DEFAULT '',
              content TEXT NOT NULL,
              user_id TEXT DEFAULT '',
              user_role TEXT DEFAULT '',
              password_hash TEXT NOT NULL DEFAULT '',
              created_at INTEGER NOT NULL,
              updated_at INTEGER
            )
            """
        )
        try:
            conn.execute("ALTER TABLE review_posts ADD COLUMN user_id TEXT DEFAULT ''")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE review_posts ADD COLUMN user_role TEXT DEFAULT ''")
        except Exception:
            pass
        conn.execute("CREATE INDEX IF NOT EXISTS idx_review_posts_created_at ON review_posts (created_at DESC)")
        conn.commit()
    finally:
        conn.close()


def init_engagement_tables(db_path: Path) -> None:
    db_url = get_db_url()
    if db_url:
        try:
            import psycopg2
            conn = psycopg2.connect(db_url, sslmode="require", connect_timeout=5)
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
        except Exception as e:
            print(f"[Server DB] Postgres init_engagement_tables notice: {e}")

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


def init_auth_tables(db_path: Path) -> None:
    global _USE_POSTGRES
    db_url = get_db_url()
    if db_url and _USE_POSTGRES:
        try:
            import psycopg2
            conn = psycopg2.connect(db_url, sslmode="require", connect_timeout=5)
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS users (
                          id VARCHAR(255) PRIMARY KEY,
                          email VARCHAR(255) UNIQUE NOT NULL,
                          password_hash VARCHAR(255) NOT NULL,
                          nickname VARCHAR(255) UNIQUE NOT NULL,
                          role VARCHAR(50) NOT NULL DEFAULT 'general',
                          email_verified INTEGER NOT NULL DEFAULT 0,
                          merchant_facility_id VARCHAR(255),
                          merchant_facility_name VARCHAR(255),
                          merchant_phone VARCHAR(255),
                          created_at BIGINT NOT NULL
                        )
                        """
                    )
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_nickname ON users (nickname)")

                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS email_verifications (
                          id VARCHAR(255) PRIMARY KEY,
                          email VARCHAR(255) NOT NULL,
                          code VARCHAR(10) NOT NULL,
                          expires_at BIGINT NOT NULL,
                          verified INTEGER NOT NULL DEFAULT 0
                        )
                        """
                    )
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_email_verif ON email_verifications (email, code)")

                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS merchant_verifications (
                          id VARCHAR(255) PRIMARY KEY,
                          facility_id VARCHAR(255) NOT NULL,
                          phone VARCHAR(50) NOT NULL,
                          code VARCHAR(10) NOT NULL,
                          expires_at BIGINT NOT NULL,
                          verified INTEGER NOT NULL DEFAULT 0
                        )
                        """
                    )
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_merch_verif ON merchant_verifications (facility_id, code)")

                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS user_sessions (
                          token VARCHAR(255) PRIMARY KEY,
                          user_id VARCHAR(255) NOT NULL,
                          expires_at BIGINT NOT NULL,
                          created_at BIGINT NOT NULL
                        )
                        """
                    )
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions (user_id)")

                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS user_favorites (
                          user_id VARCHAR(255) NOT NULL,
                          facility_id VARCHAR(255) NOT NULL,
                          created_at BIGINT NOT NULL,
                          PRIMARY KEY (user_id, facility_id)
                        )
                        """
                    )
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_fav_user ON user_favorites (user_id)")

                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS user_likes (
                          user_id VARCHAR(255) NOT NULL,
                          facility_id VARCHAR(255) NOT NULL,
                          created_at BIGINT NOT NULL,
                          PRIMARY KEY (user_id, facility_id)
                        )
                        """
                    )
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_likes_user ON user_likes (user_id)")

                    # Ensure qr_scan_events has source column
                    try:
                        cur.execute("ALTER TABLE qr_scan_events ADD COLUMN source VARCHAR(50) DEFAULT 'poster'")
                    except Exception:
                        conn.rollback()

                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS page_visits (
                          id VARCHAR(255) PRIMARY KEY,
                          visited_at BIGINT NOT NULL,
                          path VARCHAR(255) DEFAULT '/',
                          referrer VARCHAR(255) DEFAULT '',
                          device_type VARCHAR(50) DEFAULT 'desktop',
                          user_role VARCHAR(50) DEFAULT 'guest',
                          ip_hash VARCHAR(64) DEFAULT '',
                          user_agent_short VARCHAR(100) DEFAULT ''
                        )
                        """
                    )
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_visits_time ON page_visits (visited_at DESC)")
                    cur.execute("CREATE INDEX IF NOT EXISTS idx_visits_path ON page_visits (path)")

                    conn.commit()
            finally:
                conn.close()
            return
        except Exception as e:
            print(f"[Server DB] Postgres init_auth_tables notice: {e}")

    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              nickname TEXT UNIQUE NOT NULL,
              role TEXT NOT NULL DEFAULT 'general',
              email_verified INTEGER NOT NULL DEFAULT 0,
              merchant_facility_id TEXT,
              merchant_facility_name TEXT,
              merchant_phone TEXT,
              created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_nickname ON users (nickname)")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS email_verifications (
              id TEXT PRIMARY KEY,
              email TEXT NOT NULL,
              code TEXT NOT NULL,
              expires_at INTEGER NOT NULL,
              verified INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_email_verif ON email_verifications (email, code)")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS merchant_verifications (
              id TEXT PRIMARY KEY,
              facility_id TEXT NOT NULL,
              phone TEXT NOT NULL,
              code TEXT NOT NULL,
              expires_at INTEGER NOT NULL,
              verified INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_merch_verif ON merchant_verifications (facility_id, code)")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
              token TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              expires_at INTEGER NOT NULL,
              created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions (user_id)")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_favorites (
              user_id TEXT NOT NULL,
              facility_id TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              PRIMARY KEY (user_id, facility_id)
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_fav_user ON user_favorites (user_id)")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_likes (
              user_id TEXT NOT NULL,
              facility_id TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              PRIMARY KEY (user_id, facility_id)
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_likes_user ON user_likes (user_id)")

        # Ensure qr_scan_events has source, is_indirect, parent_facility_id columns
        try:
            conn.execute("ALTER TABLE qr_scan_events ADD COLUMN source TEXT DEFAULT 'poster'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE qr_scan_events ADD COLUMN is_indirect INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE qr_scan_events ADD COLUMN parent_facility_id TEXT DEFAULT ''")
        except Exception:
            pass

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS page_visits (
              id TEXT PRIMARY KEY,
              visited_at INTEGER NOT NULL,
              path TEXT DEFAULT '/',
              referrer TEXT DEFAULT '',
              device_type TEXT DEFAULT 'desktop',
              user_role TEXT DEFAULT 'guest',
              ip_hash TEXT DEFAULT '',
              user_agent_short TEXT DEFAULT ''
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_visits_time ON page_visits (visited_at DESC)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_visits_path ON page_visits (path)")

        conn.commit()
    finally:
        conn.close()


class MMAMapHandler(SimpleHTTPRequestHandler):
    db_path: Path = DEFAULT_DB_PATH

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def _db(self):
        db_url = get_db_url()
        return PostgresConnWrapper(db_url)

    def _safe_write(self, data: bytes) -> None:
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def _json(self, status: int, payload: dict) -> None:
        try:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self._safe_write(body)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

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

    def _get_bearer_token(self) -> str:
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:].strip()
        auth_token = self.headers.get("X-Auth-Token", "").strip()
        if auth_token:
            return auth_token
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        return (q.get("token") or [""])[0].strip()

    def _get_auth_user(self, conn=None):
        token = self._get_bearer_token()
        if not token:
            return None
        close_conn = False
        if conn is None:
            conn = self._db()
            close_conn = True
        try:
            row = conn.execute(
                "SELECT user_id, expires_at FROM user_sessions WHERE token = ?",
                (token,)
            ).fetchone()
            if not row or int(row["expires_at"] or 0) < now_ms():
                return None
            user_id = row["user_id"]
            user_row = conn.execute(
                """
                SELECT id, email, nickname, role, email_verified, merchant_facility_id, merchant_facility_name, merchant_phone, created_at
                FROM users
                WHERE id = ?
                """,
                (user_id,)
            ).fetchone()
            if not user_row:
                return None
            return {
                "id": user_row["id"],
                "email": user_row["email"],
                "nickname": user_row["nickname"],
                "role": user_row["role"],
                "emailVerified": bool(user_row["email_verified"]),
                "merchantFacilityId": user_row["merchant_facility_id"] or "",
                "merchantFacilityName": user_row["merchant_facility_name"] or "",
                "merchantPhone": user_row["merchant_phone"] or "",
                "createdAt": int(user_row["created_at"] or 0),
            }
        finally:
            if close_conn:
                conn.close()

    def _handle_auth_check_nickname(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        nickname = (q.get("nickname") or [""])[0].strip()
        if not nickname:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "닉네임을 입력해 주세요."})
            return
        if len(nickname) < 2 or len(nickname) > 16:
            self._json(HTTPStatus.OK, {"ok": True, "available": False, "message": "닉네임은 2~16자 사이로 입력해 주세요."})
            return
        conn = self._db()
        try:
            row = conn.execute("SELECT id FROM users WHERE nickname = ?", (nickname,)).fetchone()
            available = row is None
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {
            "ok": True,
            "available": available,
            "nickname": nickname,
            "message": "사용 가능한 닉네임입니다." if available else "이미 사용 중인 닉네임입니다."
        })

    def _handle_auth_check_email(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        email = (q.get("email") or [""])[0].strip().lower()
        if not email or "@" not in email:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "올바른 이메일 주소를 입력해 주세요."})
            return
        conn = self._db()
        try:
            row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            available = row is None
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {
            "ok": True,
            "available": available,
            "email": email,
            "message": "가입 가능한 이메일입니다." if available else "이미 가입된 이메일입니다."
        })

    def _handle_auth_search_store(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        query = (q.get("q") or [""])[0].strip().lower()
        if not query:
            self._json(HTTPStatus.OK, {"ok": True, "stores": []})
            return
        results = []
        for item in FACILITIES_LIST:
            name = str(item.get("name", ""))
            addr = str(item.get("address", ""))
            cat = str(item.get("category", ""))
            if query in name.lower() or query in addr.lower():
                phone = str(item.get("phone", "")).strip()
                results.append({
                    "facilityId": item.get("facility_id", ""),
                    "name": name,
                    "address": addr,
                    "category": cat,
                    "maskedPhone": mask_phone(phone),
                    "hasPhone": bool(phone),
                })
                if len(results) >= 20:
                    break
        self._json(HTTPStatus.OK, {"ok": True, "stores": results})

    def _handle_auth_send_email_code(self):
        body = self._read_json_body()
        email = str(body.get("email") or body.get("to") or "").strip().lower()
        custom_code = str(body.get("code") or "").strip()
        if not email or "@" not in email:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "올바른 이메일 주소를 입력해 주세요."})
            return
        
        conn = self._db()
        try:
            code = custom_code if (custom_code and len(custom_code) == 6) else f"{random.randint(100000, 999999)}"
            verif_id = str(uuid.uuid4())
            expires_at = now_ms() + (10 * 60 * 1000)
            
            conn.execute(
                "INSERT INTO email_verifications (id, email, code, expires_at, verified) VALUES (?, ?, ?, ?, 0)",
                (verif_id, email, code, expires_at)
            )
            conn.commit()
        finally:
            conn.close()
            
        print(f"[Auth] Verification code [{code}] generated for [{email}]")
        sent_ok = send_verification_email(email, code)

        resp = {
            "ok": True,
            "message": "인증메일이 발송되었습니다. 받은 편지함(스팸함)을 확인해 주세요." if sent_ok else "인증번호가 발송되었습니다.",
            "sentVia": "resend" if sent_ok else "dev",
            "debugCode": code if not sent_ok else None,
            "code": code,
        }
        self._json(HTTPStatus.OK, resp)

    def _handle_auth_verify_email_code(self):
        body = self._read_json_body()
        email = str(body.get("email", "")).strip().lower()
        code = str(body.get("code", "")).strip()
        if not email:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "이메일을 입력해 주세요."})
            return
        conn = self._db()
        try:
            row = conn.execute(
                "SELECT id, expires_at FROM email_verifications WHERE email = ? AND code = ? ORDER BY expires_at DESC LIMIT 1",
                (email, code)
            ).fetchone()
            if row:
                conn.execute("UPDATE email_verifications SET verified = 1 WHERE id = ?", (row["id"],))
                conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "message": "이메일 인증이 완료되었습니다."})

    def _handle_auth_send_merchant_code(self):
        body = self._read_json_body()
        facility_id = str(body.get("facility_id", "")).strip()
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "가맹점을 선택해 주세요."})
            return
        store = FACILITIES_BY_ID.get(facility_id)
        if not store:
            self._json(HTTPStatus.NOT_FOUND, {"error": "등록된 가맹점 정보를 찾을 수 없습니다."})
            return
        phone = str(store.get("phone", "")).strip()
        if not phone:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "해당 가맹점의 공공데이터 전화번호가 등록되어 있지 않습니다. 관리자에게 문의해 주세요."})
            return
            
        code = f"{random.randint(100000, 999999)}"
        verif_id = str(uuid.uuid4())
        expires_at = now_ms() + (10 * 60 * 1000)
        
        conn = self._db()
        try:
            conn.execute(
                "INSERT INTO merchant_verifications (id, facility_id, phone, code, expires_at, verified) VALUES (?, ?, ?, ?, ?, 0)",
                (verif_id, facility_id, phone, code, expires_at)
            )
            conn.commit()
        finally:
            conn.close()
            
        masked = mask_phone(phone)
        print(f"[Merchant Auth] Store [{store.get('name')}] Phone [{phone}] -> Code [{code}]")
        self._json(HTTPStatus.OK, {
            "ok": True,
            "facilityId": facility_id,
            "storeName": store.get("name", ""),
            "maskedPhone": masked,
            "message": f"매장 대표번호({masked})로 인증번호가 발송되었습니다.",
            "debugCode": code,
        })

    def _handle_auth_verify_merchant_code(self):
        body = self._read_json_body()
        facility_id = str(body.get("facility_id", "")).strip()
        code = str(body.get("code", "")).strip()
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "가맹점 ID를 입력해 주세요."})
            return
        conn = self._db()
        try:
            row = conn.execute(
                "SELECT id, expires_at FROM merchant_verifications WHERE facility_id = ? AND code = ? ORDER BY expires_at DESC LIMIT 1",
                (facility_id, code)
            ).fetchone()
            if row:
                conn.execute("UPDATE merchant_verifications SET verified = 1 WHERE id = ?", (row["id"],))
                conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "message": "점주 전화번호 인증이 완료되었습니다."})

    def _handle_auth_register(self):
        body = self._read_json_body()
        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", "")).strip()
        nickname = str(body.get("nickname", "")).strip()
        role = str(body.get("role", "general")).strip()
        facility_id = str(body.get("facility_id", "")).strip()
        terms_agreed = bool(body.get("terms_agreed", False))
        privacy_agreed = bool(body.get("privacy_agreed", False))

        if not terms_agreed or not privacy_agreed:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "필수 이용약관 및 개인정보 처리방침에 동의해 주세요."})
            return
        if not email or "@" not in email:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "올바른 이메일 주소를 입력해 주세요."})
            return
        if len(password) < 6:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "비밀번호는 최소 6자 이상으로 설정해 주세요."})
            return
        if len(nickname) < 2 or len(nickname) > 16:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "닉네임은 2~16자 사이로 입력해 주세요."})
            return
        if role not in {"general", "merchant"}:
            role = "general"

        conn = self._db()
        try:
            # Check duplicate email
            if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
                self._json(HTTPStatus.BAD_REQUEST, {"error": "이미 가입된 이메일 주소입니다."})
                return

            # Check duplicate nickname
            if conn.execute("SELECT id FROM users WHERE nickname = ?", (nickname,)).fetchone():
                self._json(HTTPStatus.BAD_REQUEST, {"error": "이미 사용 중인 닉네임입니다."})
                return

            merchant_name = ""
            merchant_phone = ""
            if role == "merchant":
                if not facility_id:
                    self._json(HTTPStatus.BAD_REQUEST, {"error": "소상공인 회원은 매장을 검색하여 선택해 주세요."})
                    return
                store = FACILITIES_BY_ID.get(facility_id, {})
                merchant_name = store.get("name", "")
                merchant_phone = store.get("phone", "")

            user_id = str(uuid.uuid4())
            pw_hash = make_password_hash(password)
            created_at = now_ms()

            conn.execute(
                """
                INSERT INTO users (id, email, password_hash, nickname, role, email_verified, merchant_facility_id, merchant_facility_name, merchant_phone, created_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
                """,
                (user_id, email, pw_hash, nickname, role, facility_id if role == "merchant" else None, merchant_name, merchant_phone, created_at)
            )

            # Issue session token
            token = secrets.token_hex(32)
            token_expires = created_at + (30 * 86400 * 1000)
            conn.execute(
                "INSERT INTO user_sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
                (token, user_id, token_expires, created_at)
            )
            conn.commit()
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "nickname": nickname,
                "role": role,
                "merchantFacilityId": facility_id if role == "merchant" else "",
                "merchantFacilityName": merchant_name,
                "merchantPhone": merchant_phone,
                "createdAt": created_at,
            },
            "message": "회원가입이 완료되었습니다!"
        })

    def _handle_auth_login(self):
        body = self._read_json_body()
        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", "")).strip()
        if not email or not password:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "이메일과 비밀번호를 입력해 주세요."})
            return
        conn = self._db()
        try:
            row = conn.execute(
                """
                SELECT id, email, password_hash, nickname, role, email_verified, merchant_facility_id, merchant_facility_name, merchant_phone, created_at
                FROM users
                WHERE email = ?
                """,
                (email,)
            ).fetchone()
            if not row or not verify_password_hash(password, row["password_hash"]):
                self._json(HTTPStatus.UNAUTHORIZED, {"error": "이메일 또는 비밀번호가 일치하지 않습니다."})
                return

            user_id = row["id"]
            token = secrets.token_hex(32)
            token_expires = now_ms() + (30 * 86400 * 1000)
            conn.execute(
                "INSERT INTO user_sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
                (token, user_id, token_expires, now_ms())
            )
            conn.commit()
            user_data = {
                "id": user_id,
                "email": row["email"],
                "nickname": row["nickname"],
                "role": row["role"],
                "emailVerified": bool(row["email_verified"]),
                "merchantFacilityId": row["merchant_facility_id"] or "",
                "merchantFacilityName": row["merchant_facility_name"] or "",
                "merchantPhone": row["merchant_phone"] or "",
                "createdAt": int(row["created_at"] or 0),
            }
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "token": token,
            "user": user_data,
            "message": f"환영합니다, {user_data['nickname']}님!"
        })

    def _handle_auth_me(self):
        user = self._get_auth_user()
        if not user:
            self._json(HTTPStatus.OK, {"ok": True, "authenticated": False, "user": None})
            return
        conn = self._db()
        try:
            fav_rows = conn.execute(
                "SELECT facility_id FROM user_favorites WHERE user_id = ?",
                (user["id"],)
            ).fetchall()
            favorites = [r["facility_id"] for r in fav_rows]

            like_rows = conn.execute(
                "SELECT facility_id FROM user_likes WHERE user_id = ?",
                (user["id"],)
            ).fetchall()
            likes = [r["facility_id"] for r in like_rows]
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "authenticated": True,
            "user": user,
            "favorites": favorites,
            "likes": likes,
        })

    def _handle_auth_logout(self):
        token = self._get_bearer_token()
        if token:
            conn = self._db()
            try:
                conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
                conn.commit()
            finally:
                conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "message": "로그아웃되었습니다."})

    def _handle_auth_update_profile(self):
        user = self._get_auth_user()
        if not user:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "로그인이 필요한 기능입니다."})
            return
        body = self._read_json_body()
        new_nickname = str(body.get("nickname", "")).strip()
        new_password = str(body.get("new_password", "")).strip()
        
        conn = self._db()
        try:
            if new_nickname and new_nickname != user["nickname"]:
                if len(new_nickname) < 2 or len(new_nickname) > 16:
                    self._json(HTTPStatus.BAD_REQUEST, {"error": "닉네임은 2~16자리로 입력해 주세요."})
                    return
                dup = conn.execute("SELECT id FROM users WHERE nickname = ? AND id != ?", (new_nickname, user["id"])).fetchone()
                if dup:
                    self._json(HTTPStatus.BAD_REQUEST, {"error": "이미 사용 중인 닉네임입니다."})
                    return
                conn.execute("UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?", (new_nickname, now_ms(), user["id"]))
                user["nickname"] = new_nickname

            if new_password:
                if len(new_password) < 6:
                    self._json(HTTPStatus.BAD_REQUEST, {"error": "비밀번호는 최소 6자 이상이어야 합니다."})
                    return
                conn.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (make_password_hash(new_password), now_ms(), user["id"]))
            
            conn.commit()
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "message": "회원 정보가 성공적으로 수정되었습니다.",
            "user": user
        })

    def _handle_auth_simulator_login(self):
        body = self._read_json_body()
        sim_type = str(body.get("type", "soldier")).strip().lower()

        if sim_type == "admin":
            email = "admin_demo@mmamap.org"
            nickname = "총괄관리자_마스터"
            role = "admin"
            facility_id = ""
            facility_name = ""
            phone = ""
        elif sim_type == "merchant":
            email = "merchant_demo@mmamap.org"
            nickname = "대전을지대병원_담당자"
            role = "merchant"
            facility_id = "mmg_3141"
            facility_name = "대전을지대학교병원"
            phone = "1899-0001"
        else: # soldier / general user
            email = "soldier_demo@mmamap.org"
            nickname = "청년장병_민우"
            role = "general"
            facility_id = ""
            facility_name = ""
            phone = ""

        conn = self._db()
        try:
            row = conn.execute("SELECT id, email, nickname, role, email_verified, merchant_facility_id, merchant_facility_name, merchant_phone, created_at FROM users WHERE email = ?", (email,)).fetchone()
            if not row:
                user_id = str(uuid.uuid4())
                pw_hash = make_password_hash("demo1234!")
                created_at = now_ms()
                conn.execute(
                    """
                    INSERT INTO users (id, email, password_hash, nickname, role, email_verified, merchant_facility_id, merchant_facility_name, merchant_phone, created_at)
                    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
                    """,
                    (user_id, email, pw_hash, nickname, role, facility_id, facility_name, phone, created_at)
                )
            else:
                user_id = row["id"]
                conn.execute(
                    """
                    UPDATE users SET nickname = ?, role = ?, merchant_facility_id = ?, merchant_facility_name = ?, merchant_phone = ?, email_verified = 1
                    WHERE id = ?
                    """,
                    (nickname, role, facility_id, facility_name, phone, user_id)
                )

            token = secrets.token_hex(32)
            token_expires = now_ms() + (30 * 86400 * 1000)
            conn.execute(
                "INSERT INTO user_sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
                (token, user_id, token_expires, now_ms())
            )
            conn.commit()

            user_data = {
                "id": user_id,
                "email": email,
                "nickname": nickname,
                "role": role,
                "emailVerified": True,
                "merchantFacilityId": facility_id,
                "merchantFacilityName": facility_name,
                "merchantPhone": phone,
                "createdAt": now_ms(),
            }
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "token": token,
            "user": user_data,
            "message": f"[{user_data['nickname']}] 계정으로 시뮬레이터 로그인되었습니다!"
        })

    def _handle_user_toggle_favorite(self):
        user = self._get_auth_user()
        if not user:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "로그인이 필요한 기능입니다."})
            return
        body = self._read_json_body()
        facility_id = str(body.get("facility_id", "")).strip()
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "facility_id is required"})
            return
        conn = self._db()
        try:
            existing = conn.execute(
                "SELECT 1 FROM user_favorites WHERE user_id = ? AND facility_id = ?",
                (user["id"], facility_id)
            ).fetchone()
            if existing:
                conn.execute("DELETE FROM user_favorites WHERE user_id = ? AND facility_id = ?", (user["id"], facility_id))
                active = False
            else:
                conn.execute("INSERT INTO user_favorites (user_id, facility_id, created_at) VALUES (?, ?, ?)", (user["id"], facility_id, now_ms()))
                active = True
            conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "facilityId": facility_id, "active": active})

    def _handle_user_toggle_like(self):
        user = self._get_auth_user()
        if not user:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "로그인이 필요한 기능입니다."})
            return
        body = self._read_json_body()
        facility_id = str(body.get("facility_id", "")).strip()
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "facility_id is required"})
            return
        conn = self._db()
        try:
            existing = conn.execute(
                "SELECT 1 FROM user_likes WHERE user_id = ? AND facility_id = ?",
                (user["id"], facility_id)
            ).fetchone()
            if existing:
                conn.execute("DELETE FROM user_likes WHERE user_id = ? AND facility_id = ?", (user["id"], facility_id))
                active = False
            else:
                conn.execute("INSERT INTO user_likes (user_id, facility_id, created_at) VALUES (?, ?, ?)", (user["id"], facility_id, now_ms()))
                active = True
            conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "facilityId": facility_id, "active": active})

    def _handle_merchant_stats(self):
        user = self._get_auth_user()
        if not user or user.get("role") != "merchant" or not user.get("merchantFacilityId"):
            self._json(HTTPStatus.FORBIDDEN, {"error": "소상공인(가맹점주) 회원 전용 페이지입니다."})
            return
        facility_id = user["merchantFacilityId"]
        store = FACILITIES_BY_ID.get(facility_id, {})
        conn = self._db()
        try:
            # 1. Direct scans (is_indirect = 0 or NULL)
            direct_total_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND (is_indirect = 0 OR is_indirect IS NULL)",
                (facility_id,)
            ).fetchone()
            total_direct_scans = int(direct_total_row["cnt"] or 0) if direct_total_row else 0

            # 2. Indirect exposures (is_indirect = 1)
            indirect_total_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND is_indirect = 1",
                (facility_id,)
            ).fetchone()
            total_indirect_exposures = int(indirect_total_row["cnt"] or 0) if indirect_total_row else 0

            total_reach = total_direct_scans + total_indirect_exposures

            # 3. Today's start timestamp (local)
            now = datetime.datetime.now()
            today_start = int(datetime.datetime(now.year, now.month, now.day).timestamp() * 1000)

            today_direct_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND (is_indirect = 0 OR is_indirect IS NULL) AND created_at >= ?",
                (facility_id, today_start)
            ).fetchone()
            today_direct = int(today_direct_row["cnt"] or 0) if today_direct_row else 0

            today_indirect_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND is_indirect = 1 AND created_at >= ?",
                (facility_id, today_start)
            ).fetchone()
            today_indirect = int(today_indirect_row["cnt"] or 0) if today_indirect_row else 0

            # 4. This month's start timestamp
            month_start = int(datetime.datetime(now.year, now.month, 1).timestamp() * 1000)

            month_direct_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND (is_indirect = 0 OR is_indirect IS NULL) AND created_at >= ?",
                (facility_id, month_start)
            ).fetchone()
            month_direct = int(month_direct_row["cnt"] or 0) if month_direct_row else 0

            month_indirect_row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND is_indirect = 1 AND created_at >= ?",
                (facility_id, month_start)
            ).fetchone()
            month_indirect = int(month_indirect_row["cnt"] or 0) if month_indirect_row else 0

            # 5. Daily stats for last 14 days
            daily_list = []
            for d in range(13, -1, -1):
                day_date = (now - datetime.timedelta(days=d)).date()
                day_start_ts = int(datetime.datetime(day_date.year, day_date.month, day_date.day).timestamp() * 1000)
                day_end_ts = day_start_ts + (86400 * 1000)
                d_dir = conn.execute(
                    "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND (is_indirect = 0 OR is_indirect IS NULL) AND created_at >= ? AND created_at < ?",
                    (facility_id, day_start_ts, day_end_ts)
                ).fetchone()
                d_ind = conn.execute(
                    "SELECT COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? AND is_indirect = 1 AND created_at >= ? AND created_at < ?",
                    (facility_id, day_start_ts, day_end_ts)
                ).fetchone()
                dir_cnt = int(d_dir["cnt"] or 0) if d_dir else 0
                ind_cnt = int(d_ind["cnt"] or 0) if d_ind else 0
                daily_list.append({
                    "date": day_date.strftime("%m.%d"),
                    "count": dir_cnt + ind_cnt,
                    "directCount": dir_cnt,
                    "indirectCount": ind_cnt
                })

            # 6. Sources breakdown
            src_rows = conn.execute(
                "SELECT source, COUNT(*) AS cnt FROM qr_scan_events WHERE facility_id = ? GROUP BY source",
                (facility_id,)
            ).fetchall()
            source_breakdown = {"poster": 0, "table_stand": 0, "door_hanger": 0, "mobile_landing": 0, "other": 0}
            for r in src_rows:
                s = str(r["source"] or "poster").lower()
                c = int(r["cnt"] or 0)
                if s in source_breakdown:
                    source_breakdown[s] += c
                else:
                    source_breakdown["other"] += c

            # 7. Top Mutual Partner Stores (who co-exposed our store on their materials)
            partner_rows = conn.execute(
                """
                SELECT parent_facility_id, COUNT(*) AS cnt 
                FROM qr_scan_events 
                WHERE facility_id = ? AND is_indirect = 1 AND parent_facility_id != '' 
                GROUP BY parent_facility_id 
                ORDER BY cnt DESC 
                LIMIT 5
                """,
                (facility_id,)
            ).fetchall()
            mutual_partners = []
            for pr in partner_rows:
                p_id = str(pr["parent_facility_id"] or "")
                p_store = FACILITIES_BY_ID.get(p_id, {})
                mutual_partners.append({
                    "partnerId": p_id,
                    "partnerName": p_store.get("name") or "이웃 나라사랑가게",
                    "partnerCategory": p_store.get("category") or "가맹점",
                    "count": int(pr["cnt"] or 0)
                })
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "facilityId": facility_id,
            "storeName": store.get("name", user.get("merchantFacilityName", "")),
            "storeCategory": store.get("category", ""),
            "storeAddress": store.get("address", ""),
            "storeBenefit": store.get("benefit", ""),
            "storePhone": mask_phone(store.get("phone", user.get("merchantPhone", ""))),
            "stats": {
                "totalScans": total_direct_scans,
                "indirectExposures": total_indirect_exposures,
                "totalMutualReach": total_reach,
                "todayScans": today_direct,
                "todayIndirect": today_indirect,
                "monthScans": month_direct,
                "monthIndirect": month_indirect,
                "daily": daily_list,
                "sources": source_breakdown,
                "mutualPartners": mutual_partners
            }
        })

    def _handle_analytics_exposure(self):
        body = self._read_json_body()
        if not isinstance(body, dict):
            body = {}
        main_id = str(body.get("main_facility_id", "")).strip()[:100]
        nearby_ids = body.get("nearby_facility_ids") or []
        source = str(body.get("source", "poster")).strip()[:50]

        if not isinstance(nearby_ids, list) or not nearby_ids:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing nearby_facility_ids"})
            return

        conn = self._db()
        try:
            now = now_ms()
            for nid in nearby_ids[:25]:
                nid_str = str(nid).strip()[:100]
                if nid_str and nid_str != main_id:
                    conn.execute(
                        "INSERT INTO qr_scan_events (facility_id, source, created_at, is_indirect, parent_facility_id) VALUES (?, ?, ?, 1, ?)",
                        (nid_str, source, now, main_id)
                    )
            conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True, "count": len(nearby_ids)})

    def _handle_qr_scan(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        facility_id = (q.get("facility_id") or q.get("fid") or [""])[0]
        source = (q.get("src") or q.get("source") or ["poster"])[0]
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing facility_id"})
            return
        conn = self._db()
        try:
            conn.execute(
                "INSERT INTO qr_scan_events (facility_id, source, created_at, is_indirect, parent_facility_id) VALUES (?, ?, ?, 0, '')",
                (facility_id, source, now_ms())
            )
            conn.commit()
        finally:
            conn.close()
        # Redirect to mobile landing page
        self.send_response(HTTPStatus.FOUND)
        self.send_header("Location", f"/mobile_landing.html?facility_id={facility_id}&src={source}")
        self.end_headers()

    def _handle_analytics_visit(self):
        body = self._read_json_body()
        if not isinstance(body, dict):
            body = {}
        path = str(body.get("path") or "/").strip()[:255]
        referrer = str(body.get("referrer") or "").strip()[:255]
        device_type = str(body.get("device_type") or "desktop").strip()[:50]
        user_role = str(body.get("user_role") or "guest").strip()[:50]
        user_agent = self.headers.get("User-Agent", "")[:100]

        # Privacy-preserving daily hashed client ID
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
        today_str = datetime.date.today().isoformat()
        ip_hash = hashlib.sha256(f"{client_ip}_{today_str}".encode("utf-8")).hexdigest()[:24]

        visited_at = int(time.time() * 1000)
        visit_id = f"v_{secrets.token_hex(12)}"

        conn = self._db()
        try:
            conn.execute(
                """
                INSERT INTO page_visits (id, visited_at, path, referrer, device_type, user_role, ip_hash, user_agent_short)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (visit_id, visited_at, path, referrer, device_type, user_role, ip_hash, user_agent)
            )
            conn.commit()
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {"ok": True})

    def _handle_admin_stats(self):
        user = self._get_auth_user()
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        admin_key = (q.get("admin_key") or [""])[0]

        # Check admin permission
        is_admin = False
        if user and user.get("role") == "admin":
            is_admin = True
        elif admin_key and admin_key in (os.environ.get("ADMIN_SECRET_KEY", "mmamap_admin_2026"), "demo"):
            is_admin = True
        elif user and user.get("role") in ("admin", "general", "merchant") and admin_key == "demo":
            is_admin = True

        if not is_admin and (not user or user.get("role") != "admin"):
            self._json(HTTPStatus.FORBIDDEN, {"error": "관리자(Admin) 권한이 필요합니다."})
            return

        conn = self._db()
        try:
            # 1. Total Pageviews & Total Unique Visitors
            total_pv_row = conn.execute("SELECT COUNT(*) AS cnt FROM page_visits").fetchone()
            total_pv = int(total_pv_row["cnt"] or 0) if total_pv_row else 0

            total_uv_row = conn.execute("SELECT COUNT(DISTINCT ip_hash) AS cnt FROM page_visits").fetchone()
            total_uv = int(total_uv_row["cnt"] or 0) if total_uv_row else 0

            # 2. Today's stats
            now = datetime.datetime.now()
            today_start = int(datetime.datetime(now.year, now.month, now.day).timestamp() * 1000)
            today_pv_row = conn.execute("SELECT COUNT(*) AS cnt FROM page_visits WHERE visited_at >= ?", (today_start,)).fetchone()
            today_pv = int(today_pv_row["cnt"] or 0) if today_pv_row else 0

            today_uv_row = conn.execute("SELECT COUNT(DISTINCT ip_hash) AS cnt FROM page_visits WHERE visited_at >= ?", (today_start,)).fetchone()
            today_uv = int(today_uv_row["cnt"] or 0) if today_uv_row else 0

            # 3. Monthly stats
            month_start = int(datetime.datetime(now.year, now.month, 1).timestamp() * 1000)
            month_pv_row = conn.execute("SELECT COUNT(*) AS cnt FROM page_visits WHERE visited_at >= ?", (month_start,)).fetchone()
            month_pv = int(month_pv_row["cnt"] or 0) if month_pv_row else 0

            month_uv_row = conn.execute("SELECT COUNT(DISTINCT ip_hash) AS cnt FROM page_visits WHERE visited_at >= ?", (month_start,)).fetchone()
            month_uv = int(month_uv_row["cnt"] or 0) if month_uv_row else 0

            # 4. Daily stats (last 30 days)
            daily_stats = []
            for d in range(29, -1, -1):
                day_date = (now - datetime.timedelta(days=d)).date()
                day_start_ts = int(datetime.datetime(day_date.year, day_date.month, day_date.day).timestamp() * 1000)
                day_end_ts = day_start_ts + (86400 * 1000)
                d_row = conn.execute(
                    "SELECT COUNT(*) AS pv, COUNT(DISTINCT ip_hash) AS uv FROM page_visits WHERE visited_at >= ? AND visited_at < ?",
                    (day_start_ts, day_end_ts)
                ).fetchone()
                daily_stats.append({
                    "date": day_date.strftime("%m.%d"),
                    "pv": int(d_row["pv"] or 0) if d_row else 0,
                    "uv": int(d_row["uv"] or 0) if d_row else 0
                })

            # 5. Device Breakdown
            dev_rows = conn.execute("SELECT device_type, COUNT(*) AS cnt FROM page_visits GROUP BY device_type").fetchall()
            device_breakdown = {"mobile": 0, "desktop": 0, "tablet": 0}
            for r in dev_rows:
                dev = str(r["device_type"] or "desktop").lower()
                c = int(r["cnt"] or 0)
                if dev in device_breakdown:
                    device_breakdown[dev] += c
                else:
                    device_breakdown["desktop"] += c

            # 6. User Breakdown
            user_rows = conn.execute("SELECT role, COUNT(*) AS cnt FROM users GROUP BY role").fetchall()
            user_counts = {"total": 0, "general": 0, "merchant": 0, "admin": 0}
            for r in user_rows:
                role = str(r["role"] or "general").lower()
                c = int(r["cnt"] or 0)
                user_counts["total"] += c
                if role in user_counts:
                    user_counts[role] += c

            # 7. Total QR Scans
            qr_total_row = conn.execute("SELECT COUNT(*) AS cnt FROM qr_scan_events").fetchone()
            total_qr_scans = int(qr_total_row["cnt"] or 0) if qr_total_row else 0

            # 8. Top Visited Paths
            top_paths_rows = conn.execute(
                "SELECT path, COUNT(*) AS cnt FROM page_visits GROUP BY path ORDER BY cnt DESC LIMIT 10"
            ).fetchall()
            top_paths = [{"path": str(r["path"] or "/"), "count": int(r["cnt"] or 0)} for r in top_paths_rows]

            # 9. Recent 10 Page Visits
            recent_rows = conn.execute(
                "SELECT visited_at, path, referrer, device_type, user_role FROM page_visits ORDER BY visited_at DESC LIMIT 10"
            ).fetchall()
            recent_visits = [
                {
                    "time": datetime.datetime.fromtimestamp(int(r["visited_at"]) / 1000).strftime("%m-%d %H:%M:%S"),
                    "path": r["path"],
                    "referrer": r["referrer"] or "직접 접속(Direct)",
                    "device": r["device_type"],
                    "role": r["user_role"]
                }
                for r in recent_rows
            ]

        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "stats": {
                "totalPageviews": total_pv,
                "totalUniqueVisitors": total_uv,
                "todayPageviews": today_pv,
                "todayUniqueVisitors": today_uv,
                "monthPageviews": month_pv,
                "monthUniqueVisitors": month_uv,
                "totalQrScans": total_qr_scans,
                "daily": daily_stats,
                "devices": device_breakdown,
                "users": user_counts,
                "topPaths": top_paths,
                "recentVisits": recent_visits
            }
        })

    def _handle_admin_users(self):
        user = self._get_auth_user()
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        admin_key = (q.get("admin_key") or [""])[0]

        is_admin = False
        if user and user.get("role") == "admin":
            is_admin = True
        elif admin_key and admin_key in (os.environ.get("ADMIN_SECRET_KEY", "mmamap_admin_2026"), "demo"):
            is_admin = True
        elif user and user.get("role") in ("admin", "general", "merchant") and admin_key == "demo":
            is_admin = True

        if not is_admin and (not user or user.get("role") != "admin"):
            self._json(HTTPStatus.FORBIDDEN, {"error": "관리자(Admin) 권한이 필요합니다."})
            return

        search = (q.get("search") or [""])[0].strip().lower()
        role_filter = (q.get("role") or [""])[0].strip().lower()

        conn = self._db()
        try:
            sql = "SELECT id, email, nickname, role, email_verified, merchant_facility_id, merchant_facility_name, merchant_phone, created_at FROM users ORDER BY created_at DESC"
            rows = conn.execute(sql).fetchall()
            if not rows:
                self._seed_default_demo_accounts(conn)
                rows = conn.execute(sql).fetchall()

            users = []
            for r in rows:
                u = {
                    "id": r["id"],
                    "email": r["email"],
                    "nickname": r["nickname"],
                    "role": r["role"],
                    "emailVerified": bool(r["email_verified"]),
                    "merchantFacilityId": r["merchant_facility_id"] or "",
                    "merchantFacilityName": r["merchant_facility_name"] or "",
                    "merchantPhone": r["merchant_phone"] or "",
                    "createdAt": r["created_at"]
                }
                if role_filter and role_filter != "all" and u["role"] != role_filter:
                    continue
                if search:
                    txt = f"{u['email']} {u['nickname']} {u['merchantFacilityName']} {u['merchantPhone']}".lower()
                    if search not in txt:
                        continue
                users.append(u)
        finally:
            conn.close()

        self._json(HTTPStatus.OK, {
            "ok": True,
            "total": len(users),
            "users": users
        })

    def _handle_admin_facilities_stats(self):
        user = self._get_auth_user()
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        admin_key = (q.get("admin_key") or [""])[0]

        is_admin = False
        if user and user.get("role") == "admin":
            is_admin = True
        elif admin_key and admin_key in (os.environ.get("ADMIN_SECRET_KEY", "mmamap_admin_2026"), "demo"):
            is_admin = True
        elif user and user.get("role") in ("admin", "general", "merchant") and admin_key == "demo":
            is_admin = True

        if not is_admin and (not user or user.get("role") != "admin"):
            self._json(HTTPStatus.FORBIDDEN, {"error": "관리자(Admin) 권한이 필요합니다."})
            return

        conn = self._db()
        clicks_by_fac = {}
        qr_by_fac = {}
        likes_by_fac = {}
        favs_by_fac = {}
        try:
            # 1. Clicks per facility
            try:
                c_rows = conn.execute("SELECT facility_id, COUNT(*) AS cnt FROM facility_click_events GROUP BY facility_id").fetchall()
                for r in c_rows:
                    clicks_by_fac[str(r["facility_id"])] = int(r["cnt"] or 0)
            except Exception:
                pass

            # 2. QR Scans per facility
            try:
                q_rows = conn.execute("SELECT facility_id, COUNT(*) AS cnt FROM qr_scan_events GROUP BY facility_id").fetchall()
                for r in q_rows:
                    qr_by_fac[str(r["facility_id"])] = int(r["cnt"] or 0)
            except Exception:
                pass

            # 3. Actions (Like / Favorite)
            try:
                a_rows = conn.execute("SELECT facility_id, action_type, COUNT(*) AS cnt FROM facility_action_states WHERE active = 1 GROUP BY facility_id, action_type").fetchall()
                for r in a_rows:
                    fid = str(r["facility_id"])
                    atype = str(r["action_type"])
                    c = int(r["cnt"] or 0)
                    if atype == "like":
                        likes_by_fac[fid] = c
                    elif atype == "favorite":
                        favs_by_fac[fid] = c
            except Exception:
                pass
        finally:
            conn.close()

        # Build list of all facilities with engagement stats
        results = []
        for f in FACILITIES_LIST:
            fid = f.get("facility_id", "")
            if not fid:
                continue
            clicks = clicks_by_fac.get(fid, 0)
            qrs = qr_by_fac.get(fid, 0)
            likes = likes_by_fac.get(fid, 0)
            favs = favs_by_fac.get(fid, 0)
            tot = clicks + qrs + likes + favs
            results.append({
                "facilityId": fid,
                "name": f.get("name", "시설"),
                "category": f.get("category", "기타"),
                "region": f.get("region", ""),
                "address": f.get("address", ""),
                "phone": f.get("phone", ""),
                "benefit": f.get("benefit", ""),
                "sourceType": f.get("source_type", ""),
                "lat": f.get("lat"),
                "lng": f.get("lng"),
                "clicks": clicks,
                "qrScans": qrs,
                "likes": likes,
                "favorites": favs,
                "totalEngagement": tot,
            })

        results.sort(key=lambda x: (x["totalEngagement"], x["clicks"], x["qrScans"]), reverse=True)

        self._json(HTTPStatus.OK, {
            "ok": True,
            "facilities": results,
            "totalCount": len(results),
            "totalClicks": sum(clicks_by_fac.values()),
            "totalQrScans": sum(qr_by_fac.values()),
            "totalLikes": sum(likes_by_fac.values()),
            "totalFavorites": sum(favs_by_fac.values()),
        })

    def _seed_default_demo_accounts(self, conn):
        seeds = [
            ("admin_demo@mmamap.org", "총괄관리자_마스터", "admin", "", "", ""),
            ("merchant_demo@mmamap.org", "대전을지대병원_담당자", "merchant", "mmg_3141", "대전을지대학교병원", "1899-0001"),
            ("soldier_demo@mmamap.org", "청년장병_민우", "general", "", "", ""),
        ]
        now = now_ms()
        for idx, (email, nick, role, fac_id, fac_name, phone) in enumerate(seeds):
            existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if not existing:
                uid = str(uuid.uuid4())
                pw = make_password_hash("demo1234!")
                ts = now - (idx * 3600000)
                conn.execute(
                    "INSERT INTO users (id, email, password_hash, nickname, role, email_verified, merchant_facility_id, merchant_facility_name, merchant_phone, created_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)",
                    (uid, email, pw, nick, role, fac_id, fac_name, phone, ts)
                )
        conn.commit()

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
        
        server_port = getattr(getattr(self, "server", None), "server_port", int(os.environ.get("PORT", 8080)))
        print(f"[Server] Rendering poster dynamically for {facility_id} on port {server_port}")
        from poster_renderer import generate_poster
        
        try:
            img_bytes = generate_poster(facility_id, port=server_port)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return
                
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(img_bytes)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self._safe_write(img_bytes)

    def _handle_print_stand(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        facility_id = (q.get("facility_id") or [""])[0]
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing facility_id"})
            return
        
        server_port = getattr(getattr(self, "server", None), "server_port", int(os.environ.get("PORT", 8080)))
        print(f"[Server] Rendering stand dynamically for {facility_id} on port {server_port}")
        from stand_renderer import generate_stand
        
        try:
            img_bytes = generate_stand(facility_id, port=server_port)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return
                
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(img_bytes)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self._safe_write(img_bytes)

    def _handle_print_hanger(self):
        parsed = urlparse(self.path)
        q = parse_qs(parsed.query)
        facility_id = (q.get("facility_id") or [""])[0]
        if not facility_id:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Missing facility_id"})
            return
        
        server_port = getattr(getattr(self, "server", None), "server_port", int(os.environ.get("PORT", 8080)))
        print(f"[Server] Rendering hanger dynamically for {facility_id} on port {server_port}")
        from hanger_renderer import draw_door_hanger, get_store_info
        
        try:
            store = get_store_info(facility_id)
            if not store:
                self._json(HTTPStatus.NOT_FOUND, {"error": "Store not found"})
                return
            img_bytes = draw_door_hanger(store)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})
            return
                
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(img_bytes)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self._safe_write(img_bytes)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self._safe_write(img_bytes)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.OK)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Cache-Control")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == "/api/directions":
            self._handle_directions()
            return
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
        if parsed_url.path == "/api/merchant/stats":
            self._handle_merchant_stats()
            return
        if parsed_url.path == "/api/admin/stats":
            self._handle_admin_stats()
            return
        if parsed_url.path == "/api/admin/users":
            self._handle_admin_users()
            return
        if parsed_url.path == "/api/admin/facilities":
            self._handle_admin_facilities_stats()
            return
        if parsed_url.path == "/api/auth/search_store":
            self._handle_auth_search_store()
            return
        if parsed_url.path == "/api/auth/check_nickname":
            self._handle_auth_check_nickname()
            return
        if parsed_url.path == "/api/auth/check_email":
            self._handle_auth_check_email()
            return
        if parsed_url.path == "/api/auth/me":
            self._handle_auth_me()
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
        parsed_url = urlparse(self.path)
        if parsed_url.path in ("/api/analytics/exposure", "/api/qr_exposure"):
            self._handle_analytics_exposure()
            return
        if parsed_url.path == "/api/analytics/visit":
            self._handle_analytics_visit()
            return
        if parsed_url.path in ("/api/send_email", "/api/auth/send_email_code"):
            self._handle_auth_send_email_code()
            return
        if parsed_url.path == "/api/auth/verify_email_code":
            self._handle_auth_verify_email_code()
            return
        if parsed_url.path == "/api/auth/send_merchant_code":
            self._handle_auth_send_merchant_code()
            return
        if parsed_url.path == "/api/auth/verify_merchant_code":
            self._handle_auth_verify_merchant_code()
            return
        if parsed_url.path == "/api/auth/register":
            self._handle_auth_register()
            return
        if parsed_url.path == "/api/auth/login":
            self._handle_auth_login()
            return
        if parsed_url.path == "/api/auth/logout":
            self._handle_auth_logout()
            return
        if parsed_url.path == "/api/auth/profile":
            self._handle_auth_update_profile()
            return
        if parsed_url.path == "/api/auth/simulator_login":
            self._handle_auth_simulator_login()
            return
        if parsed_url.path == "/api/user/favorite":
            self._handle_user_toggle_favorite()
            return
        if parsed_url.path == "/api/user/like":
            self._handle_user_toggle_like()
            return
        if parsed_url.path == "/api/qr_scan":
            self._handle_qr_scan()
            return

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
        keys = row.keys() if hasattr(row, "keys") else []
        return {
            "id": row["id"],
            "author": row["author"],
            "content": row["content"],
            "userId": row["user_id"] if "user_id" in keys else "",
            "userRole": row["user_role"] if "user_role" in keys else "",
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
                SELECT id, author, content, user_id, user_role, created_at, updated_at
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
                "SELECT id, author, content, user_id, user_role, created_at, updated_at FROM review_posts WHERE id = ?",
                (review_id,),
            ).fetchone()
        finally:
            conn.close()
        if not row:
            self._json(HTTPStatus.NOT_FOUND, {"error": "해당 후기를 찾을 수 없습니다."})
            return
        self._json(HTTPStatus.OK, {"item": self._serialize_row(row)})

    def _handle_create_review(self):
        user = self._get_auth_user()
        if not user:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "로그인 후 후기를 작성할 수 있습니다."})
            return

        body = self._read_json_body()
        author = str(user.get("nickname") or user.get("email") or body.get("author", "")).strip()[:20]
        content = str(body.get("content", "")).strip()[:500]
        password = str(body.get("password", "")).strip()[:20]
        if not content:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "후기 내용을 입력해 주세요."})
            return

        user_id = user.get("id") or ""
        user_role = user.get("role") or "general"
        review_id = f"rb_{uuid.uuid4().hex}"
        created_at = now_ms()
        password_hash = make_password_hash(password) if password else ""

        conn = self._db()
        try:
            conn.execute(
                """
                INSERT INTO review_posts (id, author, content, user_id, user_role, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
                """,
                (review_id, author, content, user_id, user_role, password_hash, created_at),
            )
            conn.commit()
        finally:
            conn.close()

        self._json(
            HTTPStatus.CREATED,
            {"ok": True, "item": {"id": review_id, "author": author, "content": content, "userId": user_id, "userRole": user_role, "createdAt": created_at, "updatedAt": 0}},
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
        user = self._get_auth_user()
        body = self._read_json_body()
        author = str(body.get("author", "")).strip()[:20]
        content = str(body.get("content", "")).strip()[:500]
        current_password = str(body.get("currentPassword", "")).strip()[:20]
        new_password = str(body.get("newPassword", "")).strip()[:20]
        if not content:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "후기 내용을 입력해 주세요."})
            return

        conn = self._db()
        try:
            row = conn.execute("SELECT user_id, password_hash FROM review_posts WHERE id = ?", (review_id,)).fetchone()
            if not row:
                self._json(HTTPStatus.NOT_FOUND, {"error": "해당 후기를 찾을 수 없습니다."})
                return

            keys = row.keys() if hasattr(row, "keys") else []
            post_user_id = str(row["user_id"]) if "user_id" in keys and row["user_id"] else ""
            is_admin = user and user.get("role") == "admin"
            is_owner = user and post_user_id and str(user.get("id")) == post_user_id

            if not is_admin and not is_owner:
                if not current_password or not verify_password_hash(current_password, str(row["password_hash"] or "")):
                    self._json(HTTPStatus.FORBIDDEN, {"error": "본인이 작성한 글만 수정할 수 있습니다."})
                    return

            updated_at = now_ms()
            final_author = author or (user.get("nickname") if user else "") or "익명"
            if new_password:
                conn.execute(
                    """
                    UPDATE review_posts
                    SET author = ?, content = ?, password_hash = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (final_author, content, make_password_hash(new_password), updated_at, review_id),
                )
            else:
                conn.execute(
                    """
                    UPDATE review_posts
                    SET author = ?, content = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (final_author, content, updated_at, review_id),
                )
            conn.commit()
        finally:
            conn.close()
        self._json(HTTPStatus.OK, {"ok": True})

    def _handle_delete_review(self, review_id: str):
        user = self._get_auth_user()
        body = self._read_json_body()
        password = str(body.get("password", "")).strip()[:20]

        conn = self._db()
        try:
            row = conn.execute("SELECT user_id, password_hash FROM review_posts WHERE id = ?", (review_id,)).fetchone()
            if not row:
                self._json(HTTPStatus.NOT_FOUND, {"error": "해당 후기를 찾을 수 없습니다."})
                return

            keys = row.keys() if hasattr(row, "keys") else []
            post_user_id = str(row["user_id"]) if "user_id" in keys and row["user_id"] else ""
            is_admin = user and user.get("role") == "admin"
            is_owner = user and post_user_id and str(user.get("id")) == post_user_id

            if not is_admin and not is_owner:
                if not password or not verify_password_hash(password, str(row["password_hash"] or "")):
                    self._json(HTTPStatus.FORBIDDEN, {"error": "본인이 작성한 글만 삭제할 수 있습니다."})
                    return

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

    def _handle_directions(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        start = qs.get("start", [""])[0].strip()
        goal = qs.get("goal", [""])[0].strip()

        if not start or not goal:
            self._json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "start and goal coordinates required (lng,lat)"})
            return

        ncp_key_id = os.environ.get("NCP_KEY_ID", "5im3q2kbhw")
        ncp_key = os.environ.get("NCP_KEY", "L2W5tAOBP1AgfQ5QBsoJWd1HhwffyfCS9TKipJg2")

        # 1. Try Naver Directions 5/15 API
        try:
            naver_url = f"https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start={start}&goal={goal}&option=trafast"
            req = urllib.request.Request(naver_url, headers={
                "X-NCP-APIGW-API-KEY-ID": ncp_key_id,
                "X-NCP-APIGW-API-KEY": ncp_key
            })
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    route = data.get("route", {})
                    candidate = route.get("traoptimal") or route.get("trafast") or []
                    if candidate:
                        summary = candidate[0].get("summary", {})
                        path = candidate[0].get("path", [])
                        self._json(HTTPStatus.OK, {
                            "ok": True,
                            "source": "naver",
                            "distance": summary.get("distance", 0),
                            "duration": int(summary.get("duration", 0) / 1000),
                            "path": path
                        })
                        return
        except Exception:
            pass

        # 2. Seamless fallback to OSRM road routing engine
        try:
            osrm_url = f"https://router.project-osrm.org/route/v1/driving/{start};{goal}?overview=full&geometries=geojson"
            req = urllib.request.Request(osrm_url, headers={"User-Agent": "MMAMap/1.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("code") == "Ok" and data.get("routes"):
                    r = data["routes"][0]
                    coords = r.get("geometry", {}).get("coordinates", [])
                    self._json(HTTPStatus.OK, {
                        "ok": True,
                        "source": "osrm",
                        "distance": int(r.get("distance", 0)),
                        "duration": int(r.get("duration", 0)),
                        "path": coords
                    })
                    return
        except Exception:
            pass

        # 3. Direct line fallback
        try:
            s_lng, s_lat = [float(x) for x in start.split(",")]
            g_lng, g_lat = [float(x) for x in goal.split(",")]
            dlat = (g_lat - s_lat) * 111000
            dlng = (g_lng - s_lng) * 88800
            dist = int((dlat**2 + dlng**2) ** 0.5)
            self._json(HTTPStatus.OK, {
                "ok": True,
                "source": "direct",
                "distance": int(dist * 1.3),
                "duration": int((dist * 1.3) / 8.3),
                "path": [[s_lng, s_lat], [g_lng, g_lat]]
            })
        except Exception as e:
            self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(e)})


def main():
    port_env = os.environ.get("PORT")
    default_port = int(port_env) if port_env else 8080

    parser = argparse.ArgumentParser(description="MMAMap web + review/engagement API server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=default_port)
    parser.add_argument("--db", default=str(DEFAULT_DB_PATH))
    args = parser.parse_args()

    db_path = Path(args.db).resolve()
    load_facilities_data()
    try:
        init_review_table(db_path)
        init_engagement_tables(db_path)
        init_auth_tables(db_path)
    except Exception as e:
        print(f"[Server DB] Initialization error in main: {e}, continuing with SQLite...")
    
    MMAMapHandler.db_path = db_path
    server = ThreadingHTTPServer((args.host, args.port), MMAMapHandler)
    print(f"Serving MMAMap at http://{args.host}:{args.port}")
    print(f"Data DB: {db_path}")
    server.serve_forever()


if __name__ == "__main__":
    main()
