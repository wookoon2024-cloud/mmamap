#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
병무청(MMA) 나라사랑가게 및 병역명문가 일일 자동 동기화 스크립트
(Daily Synchronization for Nara Sarang & Myeongmunga Facilities)

- 병무청 공공개방포털 API(open.mma.go.kr)에 매일 새벽 연결
- 신규 등록 가맹점 자동 추가 (INSERT)
- 혜택·주소·전화번호 등 변경 사항 자동 업데이트 (UPDATE)
- 제휴 종료/해제(hyhaeje_yn == 'Y') 가맹점 자동 삭제/제외 (DELETE)
- Supabase facilities 클라우드 DB 및 web/data/benefits_map.json 실시간 동기화
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Set

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = BASE_DIR / "web" / "data" / "benefits_map.json"

SUPABASE_URL = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MMAMap-DailySync/1.0",
    "Accept": "*/*"
}

CATEGORY_NORMALIZE_MAP = {
    "음식점": "음식점", "식당": "음식점", "카페": "카페", "베이커리": "카페",
    "병원": "병원", "의원": "병원", "약국": "병원", "안경": "안경점", "안경점": "안경점",
    "문화": "문화", "영화": "문화", "영화관": "문화", "공연": "문화",
    "체육": "체육", "헬스": "체육", "수영": "체육", "스포츠": "체육",
    "교육": "교육", "학원": "교육", "도서": "교육",
    "미용": "미용실", "미용실": "미용실", "헤어": "미용실",
    "주차": "주차", "주차장": "주차",
    "숙박": "기타", "레저": "문화", "기타": "기타"
}

def get_jsonp(url: str, timeout: int = 25) -> Dict[str, Any]:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    m = re.search(r"^[^(]+\((.*)\)\s*;?\s*$", text, re.S)
    if not m:
        try:
            return json.loads(text)
        except Exception:
            return {}
    return json.loads(m.group(1))

def normalize_category(cat_name: str, store_name: str) -> str:
    cat = (cat_name or "").strip()
    name = (store_name or "").strip()
    for k, v in CATEGORY_NORMALIZE_MAP.items():
        if k in cat or k in name:
            return v
    return "기타"

def to_float(val: Any) -> float:
    try:
        f = float(val)
        return f if (33.0 <= f <= 43.0 or 124.0 <= f <= 132.0) else 0.0
    except (ValueError, TypeError):
        return 0.0

def fetch_live_nara_stores() -> List[Dict[str, Any]]:
    print("[1/4] 병무청 나라사랑가게 API 데이터 수신 중...")
    url = "https://open.mma.go.kr/caisGGGS/mmanrsrListAjaxJsonCallNew.json?jbc_cd=&udggeopjong_gbcd=&callback=cb"
    data = get_jsonp(url)
    items = data.get("list", []) if isinstance(data, dict) else []
    print(f"      - 응답 수신: 총 {len(items)}건")

    valid_stores = []
    for item in items:
        if str(item.get("hyhaeje_yn") or "").strip().upper() == "Y":
            continue
        code = str(item.get("udgigwan_cd") or "").strip()
        if not code:
            continue

        lat = to_float(item.get("wido_vl"))
        lng = to_float(item.get("gyeongdo_vl"))
        name = str(item.get("udae_ggm") or "").strip()
        cat = normalize_category(str(item.get("udggeopjong_gbnm") or ""), name)
        addr = str(item.get("addr") or "").strip()
        phone = str(item.get("udgigwan_telno") or "").strip()
        benefit = str(item.get("udsangse_cn") or "").strip()
        region = str(item.get("jbc_nm") or "").strip()

        facility_id = f"nara_{code}"
        valid_stores.append({
            "facility_id": facility_id,
            "source_type": "nara_sarang_store",
            "name": name,
            "category": cat,
            "benefit_type": "할인",
            "region": region,
            "address": addr,
            "lat": lat,
            "lng": lng,
            "phone": phone,
            "benefit": benefit,
            "detail_url": f"https://www.mma.go.kr/udgg/listdetail.do?udgigwan_cd={code}&mcValue=0003357",
            "location_scope": "exact",
            "audiences": ["현역", "예비군", "사회복무요원", "모범예비군"],
            "scope_tags": ["본인"],
            "proof_tags": ["나라사랑카드", "복무확인서"],
            "branches": [],
            "original_category": str(item.get("udggeopjong_gbnm") or "")
        })
    print(f"      - 유효 가맹점 선별: {len(valid_stores)}건 (제휴 종료 매장 제외 완료)")
    return valid_stores

def fetch_live_myeongmunga_facilities() -> List[Dict[str, Any]]:
    print("[2/4] 병무청 병역명문가 API 데이터 수신 중...")
    url = "https://open.mma.go.kr/caisGGGS/bymmgPartAjaxJsonCallNew.json?udjiyeok_cd=&udae_ggm=&callback=cb"
    data = get_jsonp(url)
    items = []
    if isinstance(data, dict):
        if "list" in data and isinstance(data["list"], list):
            items = data["list"]
        else:
            for k, v in data.items():
                if isinstance(v, list):
                    items.extend(v)
    print(f"      - 응답 수신: 총 {len(items)}건")

    valid_facilities = []
    seen_codes = set()
    for item in items:
        if str(item.get("hyhaeje_yn") or "").strip().upper() == "Y":
            continue
        code = str(item.get("mmgudgigwan_cd") or item.get("udgigwan_cd") or "").strip()
        if not code or code in seen_codes:
            continue
        seen_codes.add(code)

        lat = to_float(item.get("wido_vl"))
        lng = to_float(item.get("gyeongdo_vl"))
        name = str(item.get("udae_ggm") or "").strip()
        cat = normalize_category(str(item.get("udggeopjong_gbnm") or ""), name)
        addr = str(item.get("addr") or "").strip()
        phone = str(item.get("udgigwan_telno") or "").strip()
        benefit = str(item.get("udsangse_cn") or "").strip()
        region = str(item.get("udjiyeok_nm") or item.get("jbc_nm") or "").strip()

        facility_id = f"mmg_{code}"
        valid_facilities.append({
            "facility_id": facility_id,
            "source_type": "myeongmunga_facility",
            "name": name,
            "category": cat,
            "benefit_type": "할인",
            "region": region,
            "address": addr,
            "lat": lat,
            "lng": lng,
            "phone": phone,
            "benefit": benefit,
            "detail_url": f"https://www.mma.go.kr/udgg/listdetail.do?udgigwan_cd={code}&mcValue=0003357",
            "location_scope": "exact",
            "audiences": ["병역명문가"],
            "scope_tags": ["본인", "가족"],
            "proof_tags": ["병역명문가증"],
            "branches": [],
            "original_category": str(item.get("udggeopjong_gbnm") or "")
        })
    print(f"      - 유효 우대시설 선별: {len(valid_facilities)}건 (제휴 종료 시설 제외 완료)")
    return valid_facilities

def sync_to_supabase(facilities: List[Dict[str, Any]], deleted_ids: Set[str]):
    print("[3/4] Supabase 클라우드 DB 동기화 실행 중...")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    batch_size = 200
    total = len(facilities)
    upserted = 0
    for i in range(0, total, batch_size):
        batch = facilities[i:i + batch_size]
        body = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(f"{SUPABASE_URL}/facilities", data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status in (200, 201):
                    upserted += len(batch)
        except Exception as e:
            print(f"      [Supabase Upsert Warning batch {i}]: {e}")
        time.sleep(0.05)

    print(f"      - Supabase 시설 동기화 완료: {upserted}/{total}건 Upsert 완료")

    if deleted_ids:
        print(f"      - 제휴 종료 시설 {len(deleted_ids)}건 제거 진행...")
        del_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        for did in deleted_ids:
            del_url = f"{SUPABASE_URL}/facilities?facility_id=eq.{urllib.parse.quote(did)}"
            del_req = urllib.request.Request(del_url, headers=del_headers, method="DELETE")
            try:
                urllib.request.urlopen(del_req, timeout=10)
            except Exception:
                pass
        print(f"      - Supabase 제휴 종료 시설 삭제 완료")

def run_sync():
    start_time = time.time()
    print("==================================================================")
    print(f"  [병무청 API 정기 동기화] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} KST")
    print("==================================================================")

    nara_stores = fetch_live_nara_stores()
    mmg_facilities = fetch_live_myeongmunga_facilities()
    all_live = nara_stores + mmg_facilities

    live_map: Dict[str, Dict[str, Any]] = {f["facility_id"]: f for f in all_live}

    existing_facilities = []
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                existing_facilities = data.get("facilities", [])
        except Exception:
            pass

    existing_map: Dict[str, Dict[str, Any]] = {f.get("facility_id", ""): f for f in existing_facilities}

    new_ids = set(live_map.keys()) - set(existing_map.keys())
    del_ids = set(existing_map.keys()) - set(live_map.keys())

    updated_count = 0
    for fid, live_item in live_map.items():
        if fid in existing_map:
            old_item = existing_map[fid]
            if (old_item.get("benefit") != live_item.get("benefit") or
                old_item.get("phone") != live_item.get("phone") or
                old_item.get("address") != live_item.get("address")):
                updated_count += 1
                if live_item["lat"] == 0 and old_item.get("lat"):
                    live_item["lat"] = old_item["lat"]
                    live_item["lng"] = old_item["lng"]

    print(f"\n[동기화 변경 내역 감지 결과]")
    print(f"  - 신규 추가 매장: {len(new_ids)}건")
    print(f"  - 정보 변경 매장: {updated_count}건")
    print(f"  - 제휴 종료/삭제: {len(del_ids)}건")
    print(f"  - 현재 유효 시설: 총 {len(live_map)}건")

    merged_list = []
    for fid, f in live_map.items():
        if f["lat"] == 0 and fid in existing_map and existing_map[fid].get("lat"):
            f["lat"] = existing_map[fid]["lat"]
            f["lng"] = existing_map[fid]["lng"]
        merged_list.append(f)

    print("\n[4/4] 로컬 파일 갱신 저장 중...")
    output_obj = {
        "total": len(merged_list),
        "last_synced_at": datetime.now(timezone.utc).isoformat(),
        "facilities": merged_list
    }

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output_obj, f, ensure_ascii=False, indent=2)
    print(f"      - {DATA_FILE.name} 저장 완료 ({len(merged_list)}건)")

    sync_to_supabase(merged_list, del_ids)

    elapsed = round(time.time() - start_time, 2)
    print("\n==================================================================")
    print(f"  [동기화 완료] 총 소요시간: {elapsed}초 | 총 매장수: {len(merged_list)}건")
    print("==================================================================")
    return {
        "ok": True,
        "total": len(merged_list),
        "added": len(new_ids),
        "updated": updated_count,
        "deleted": len(del_ids),
        "elapsed": elapsed
    }

if __name__ == "__main__":
    run_sync()
