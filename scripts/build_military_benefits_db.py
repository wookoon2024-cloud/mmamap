import json
import re
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import requests
import urllib3

urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = BASE_DIR / "outputs"
DB_PATH = OUT_DIR / "military_benefits.db"
INTEGRATED_JSON = OUT_DIR / "benefits_integrated.json"
NARA_JSONP = OUT_DIR / "jQuery112405409454349741589_1775538.txt"
SCHEMA_SQL = BASE_DIR / "sql" / "military_benefits_schema.sql"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
UA = "MMAMap/1.0 (benefit-data-build)"


def parse_jsonp(text: str) -> Dict[str, Any]:
    m = re.search(r"^[^(]+\((.*)\)\s*;?\s*$", text, re.S)
    if not m:
        raise ValueError("JSONP parse failed")
    return json.loads(m.group(1))


def normalize_text(v: Any) -> str:
    if v is None:
        return ""
    return re.sub(r"\s+", " ", str(v)).strip()


def detect_location_scope(address: str, region_limit_text: str) -> str:
    addr = normalize_text(address)
    region_limit = normalize_text(region_limit_text)
    if (not addr) or ("전국" in addr):
        return "nationwide"
    if region_limit and region_limit not in {"없음", "해당없음", "제한없음", "제한 없음", "없다", "없 음"}:
        if "전국" not in region_limit:
            return "regional_limited"
    return "exact"


AUDIENCE_PATTERNS: Sequence[Tuple[str, Sequence[str]]] = (
    ("active_duty", ("현역", "현역병", "복무중", "복무 중")),
    ("social_service", ("사회복무요원",)),
    ("specialized_research_industry", ("전문연구", "산업기능", "전문.산업기능", "전문·산업기능")),
    ("reservist_trained", ("예비군", "동원훈련")),
    ("model_reservist", ("모범예비군",)),
    ("myeongmunga", ("병역명문가",)),
)

SCOPE_PATTERNS: Sequence[Tuple[str, Sequence[str]]] = (
    ("self", ("본인",)),
    ("family", ("가족", "배우자", "직계", "자녀", "부모")),
    ("companion", ("동반", "동행")),
)

PROOF_PATTERNS: Sequence[Tuple[str, Sequence[str]]] = (
    ("service_certificate", ("복무확인서", "군복무확인서")),
    ("training_certificate", ("동원훈련이수증", "훈련이수필증", "입영확인서", "동원훈련 입영확인서")),
    ("myeongmunga_card", ("병역명문가증", "명문가증")),
    ("id_card", ("신분증",)),
    ("nara_card", ("나라사랑카드",)),
    ("other_proof", ("증빙", "증명")),
)

CHAIN_BRANDS = ("CGV", "롯데시네마", "메가박스")


def infer_audience(text: str, source_type: str) -> List[str]:
    hits: List[str] = []
    for code, kws in AUDIENCE_PATTERNS:
        if any(k in text for k in kws):
            hits.append(code)
    if not hits:
        if source_type == "myeongmunga_facility":
            hits.append("myeongmunga")
        else:
            hits.extend(["active_duty", "reservist_trained"])
    return sorted(set(hits))


def infer_scope(text: str) -> List[str]:
    hits: List[str] = []
    for code, kws in SCOPE_PATTERNS:
        if any(k in text for k in kws):
            hits.append(code)
    if "self" not in hits:
        hits.insert(0, "self")
    return sorted(set(hits))


def infer_proof(text: str) -> List[str]:
    hits: List[str] = []
    for code, kws in PROOF_PATTERNS:
        if any(k in text for k in kws):
            hits.append(code)
    if not hits and normalize_text(text):
        hits.append("other_proof")
    return sorted(set(hits))


def parse_nara_raw_map() -> Dict[str, Dict[str, str]]:
    if not NARA_JSONP.exists():
        return {}
    obj = parse_jsonp(NARA_JSONP.read_text(encoding="utf-8", errors="replace"))
    result: Dict[str, Dict[str, str]] = {}
    for row in obj.get("list", []):
        code = normalize_text(row.get("udgigwan_cd"))
        if not code:
            continue
        result[code] = {
            "audience_text": normalize_text(row.get("uddaesang_cn")),
            "proof_text": normalize_text(row.get("udjbjaryo_cn")),
            "region_limit_text": normalize_text(row.get("udjyjehan_cn")),
        }
    return result


def to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    s = normalize_text(v)
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def detect_brand(name: str) -> Optional[str]:
    n = normalize_text(name).upper()
    if "CGV" in n:
        return "CGV"
    if "롯데시네마" in normalize_text(name):
        return "롯데시네마"
    if "메가박스" in normalize_text(name):
        return "메가박스"
    return None


def fetch_brand_branches(brand: str, limit: int = 80) -> List[Dict[str, Any]]:
    try:
        r = requests.get(
            NOMINATIM_URL,
            params={
                "q": brand,
                "countrycodes": "kr",
                "format": "jsonv2",
                "limit": limit,
                "dedupe": 1,
            },
            timeout=30,
            verify=False,
            headers={"User-Agent": UA},
        )
        r.raise_for_status()
        arr = r.json()
    except Exception:
        return []

    rows: List[Dict[str, Any]] = []
    for item in arr:
        name = normalize_text(item.get("name")) or brand
        display = normalize_text(item.get("display_name"))
        lat = to_float(item.get("lat"))
        lng = to_float(item.get("lon"))
        if not display:
            continue
        rows.append(
            {
                "brand": brand,
                "branch_name": name,
                "address": display,
                "lat": lat,
                "lng": lng,
                "source": "nominatim",
                "source_url": str(r.url),
            }
        )
    return rows


def init_db(conn: sqlite3.Connection) -> None:
    sql = SCHEMA_SQL.read_text(encoding="utf-8")
    conn.executescript(sql)


def seed_dimensions(conn: sqlite3.Connection) -> None:
    audience_rows = [
        ("active_duty", "현역병"),
        ("social_service", "사회복무요원"),
        ("specialized_research_industry", "전문연구/산업기능"),
        ("reservist_trained", "예비군(동원훈련)"),
        ("model_reservist", "모범예비군"),
        ("myeongmunga", "병역명문가"),
    ]
    conn.executemany(
        "INSERT OR REPLACE INTO audience_types (audience_code, audience_name) VALUES (?, ?)",
        audience_rows,
    )

    scope_rows = [
        ("self", "본인"),
        ("family", "가족 포함"),
        ("companion", "동반 포함"),
    ]
    conn.executemany(
        "INSERT OR REPLACE INTO scope_types (scope_code, scope_name) VALUES (?, ?)",
        scope_rows,
    )

    proof_rows = [
        ("service_certificate", "복무확인서"),
        ("training_certificate", "동원훈련 이수/입영확인"),
        ("myeongmunga_card", "병역명문가증"),
        ("id_card", "신분증"),
        ("nara_card", "나라사랑카드"),
        ("other_proof", "기타 증빙"),
    ]
    conn.executemany(
        "INSERT OR REPLACE INTO proof_types (proof_code, proof_name) VALUES (?, ?)",
        proof_rows,
    )


def insert_main(conn: sqlite3.Connection, rows: Iterable[Dict[str, Any]], nara_map: Dict[str, Dict[str, str]]) -> None:
    for row in rows:
        source_type = normalize_text(row.get("source_type"))
        source_code = normalize_text(row.get("source_code"))
        raw_audience = ""
        raw_proof = normalize_text(", ".join(row.get("conditions", [])))
        raw_region_limit = ""
        if source_type == "nara_sarang_store":
            raw = nara_map.get(source_code, {})
            raw_audience = normalize_text(raw.get("audience_text"))
            raw_proof = normalize_text(raw.get("proof_text")) or raw_proof
            raw_region_limit = normalize_text(raw.get("region_limit_text"))

        location_scope = detect_location_scope(normalize_text(row.get("address")), raw_region_limit)
        audience_text_for_infer = " ".join([raw_audience, normalize_text(row.get("benefit")), raw_proof])
        scope_text_for_infer = " ".join([raw_audience, normalize_text(row.get("benefit"))])
        proof_text_for_infer = raw_proof

        conn.execute(
            """
            INSERT OR REPLACE INTO facilities (
              facility_id, source_type, source_code, name, category, benefit_type,
              region, address, lat, lng, phone, benefit, detail_url, location_scope,
              region_limit_text, audience_text, proof_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                normalize_text(row.get("id")),
                source_type,
                source_code,
                normalize_text(row.get("name")),
                normalize_text(row.get("category")),
                normalize_text(row.get("benefit_type")),
                normalize_text(row.get("region")),
                normalize_text(row.get("address")),
                to_float(row.get("lat")),
                to_float(row.get("lng")),
                normalize_text(row.get("phone")),
                normalize_text(row.get("benefit")),
                normalize_text(row.get("detail_url")),
                location_scope,
                raw_region_limit,
                raw_audience,
                raw_proof,
            ),
        )

        audiences = infer_audience(audience_text_for_infer, source_type)
        for code in audiences:
            conn.execute(
                "INSERT OR IGNORE INTO facility_audience (facility_id, audience_code) VALUES (?, ?)",
                (normalize_text(row.get("id")), code),
            )

        scopes = infer_scope(scope_text_for_infer)
        for code in scopes:
            conn.execute(
                "INSERT OR IGNORE INTO facility_scope (facility_id, scope_code) VALUES (?, ?)",
                (normalize_text(row.get("id")), code),
            )

        proofs = infer_proof(proof_text_for_infer)
        for code in proofs:
            conn.execute(
                "INSERT OR IGNORE INTO facility_proof (facility_id, proof_code) VALUES (?, ?)",
                (normalize_text(row.get("id")), code),
            )


def insert_branches_for_nationwide(conn: sqlite3.Connection) -> None:
    cur = conn.execute(
        """
        SELECT facility_id, name
        FROM facilities
        WHERE location_scope='nationwide'
        """
    )
    nationwide = cur.fetchall()
    if not nationwide:
        return

    branch_cache: Dict[str, List[Dict[str, Any]]] = {}
    for facility_id, name in nationwide:
        brand = detect_brand(name)
        if not brand:
            conn.execute(
                """
                INSERT INTO enrichment_queue (facility_id, brand, reason, status)
                VALUES (?, NULL, 'nationwide address requires external branch source', 'pending')
                """,
                (facility_id,),
            )
            continue

        if brand not in branch_cache:
            branch_cache[brand] = fetch_brand_branches(brand)
            time.sleep(1.0)

        branches = branch_cache[brand]
        if not branches:
            conn.execute(
                """
                INSERT INTO enrichment_queue (facility_id, brand, reason, status)
                VALUES (?, ?, 'brand search returned no branches', 'pending')
                """,
                (facility_id, brand),
            )
            continue

        for b in branches:
            conn.execute(
                """
                INSERT INTO facility_branches (
                  facility_id, brand, branch_name, address, lat, lng, source, source_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    facility_id,
                    b["brand"],
                    b["branch_name"],
                    b["address"],
                    b["lat"],
                    b["lng"],
                    b["source"],
                    b["source_url"],
                ),
            )


def print_summary(conn: sqlite3.Connection) -> None:
    total = conn.execute("SELECT COUNT(*) FROM facilities").fetchone()[0]
    by_source = conn.execute(
        "SELECT source_type, COUNT(*) FROM facilities GROUP BY source_type ORDER BY source_type"
    ).fetchall()
    by_scope = conn.execute(
        "SELECT location_scope, COUNT(*) FROM facilities GROUP BY location_scope ORDER BY location_scope"
    ).fetchall()
    aud = conn.execute(
        """
        SELECT a.audience_name, COUNT(*)
        FROM facility_audience fa
        JOIN audience_types a ON a.audience_code = fa.audience_code
        GROUP BY a.audience_name
        ORDER BY COUNT(*) DESC
        """
    ).fetchall()
    scope = conn.execute(
        """
        SELECT s.scope_name, COUNT(*)
        FROM facility_scope fs
        JOIN scope_types s ON s.scope_code = fs.scope_code
        GROUP BY s.scope_name
        ORDER BY COUNT(*) DESC
        """
    ).fetchall()
    branch_cnt = conn.execute("SELECT COUNT(*) FROM facility_branches").fetchone()[0]
    queue_cnt = conn.execute("SELECT COUNT(*) FROM enrichment_queue").fetchone()[0]

    print(f"DB: {DB_PATH}")
    print(f"facilities: {total}")
    print(f"by_source: {by_source}")
    print(f"location_scope: {by_scope}")
    print(f"audience_tags: {aud}")
    print(f"scope_tags: {scope}")
    print(f"branches: {branch_cnt}")
    print(f"enrichment_queue: {queue_cnt}")


def main() -> None:
    if not INTEGRATED_JSON.exists():
        raise FileNotFoundError(f"missing {INTEGRATED_JSON}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = json.loads(INTEGRATED_JSON.read_text(encoding="utf-8"))
    nara_map = parse_nara_raw_map()

    conn = sqlite3.connect(DB_PATH)
    try:
        init_db(conn)
        seed_dimensions(conn)
        insert_main(conn, rows, nara_map)
        insert_branches_for_nationwide(conn)
        conn.commit()
        print_summary(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
