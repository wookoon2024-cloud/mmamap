import json
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "outputs" / "military_benefits.db"
OUT_DIR = BASE_DIR / "web" / "data"
OUT_FILE = OUT_DIR / "benefits_map.json"


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"missing db: {DB_PATH}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        facility_rows = conn.execute(
            """
            SELECT
              facility_id, source_type, name, category, benefit_type, region, address,
              lat, lng, phone, benefit, detail_url, location_scope
            FROM facilities
            """
        ).fetchall()

        audience_map = {}
        for row in conn.execute(
            """
            SELECT fa.facility_id, a.audience_name
            FROM facility_audience fa
            JOIN audience_types a ON a.audience_code = fa.audience_code
            """
        ):
            audience_map.setdefault(row["facility_id"], []).append(row["audience_name"])

        scope_map = {}
        for row in conn.execute(
            """
            SELECT fs.facility_id, s.scope_name
            FROM facility_scope fs
            JOIN scope_types s ON s.scope_code = fs.scope_code
            """
        ):
            scope_map.setdefault(row["facility_id"], []).append(row["scope_name"])

        proof_map = {}
        for row in conn.execute(
            """
            SELECT fp.facility_id, p.proof_name
            FROM facility_proof fp
            JOIN proof_types p ON p.proof_code = fp.proof_code
            """
        ):
            proof_map.setdefault(row["facility_id"], []).append(row["proof_name"])

        branch_map = {}
        for row in conn.execute(
            """
            SELECT facility_id, brand, branch_name, address, lat, lng
            FROM facility_branches
            """
        ):
            branch_map.setdefault(row["facility_id"], []).append(
                {
                    "brand": row["brand"],
                    "branch_name": row["branch_name"],
                    "address": row["address"],
                    "lat": row["lat"],
                    "lng": row["lng"],
                }
            )

        facilities = []
        for r in facility_rows:
            fid = r["facility_id"]
            facilities.append(
                {
                    "facility_id": fid,
                    "source_type": r["source_type"],
                    "name": r["name"],
                    "category": r["category"],
                    "benefit_type": r["benefit_type"],
                    "region": r["region"],
                    "address": r["address"],
                    "lat": r["lat"],
                    "lng": r["lng"],
                    "phone": r["phone"],
                    "benefit": r["benefit"],
                    "detail_url": r["detail_url"],
                    "location_scope": r["location_scope"],
                    "audiences": sorted(set(audience_map.get(fid, []))),
                    "scope_tags": sorted(set(scope_map.get(fid, []))),
                    "proof_tags": sorted(set(proof_map.get(fid, []))),
                    "branches": branch_map.get(fid, []),
                }
            )

        payload = {"total": len(facilities), "facilities": facilities}
        OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        print(f"exported {len(facilities)} facilities -> {OUT_FILE}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
