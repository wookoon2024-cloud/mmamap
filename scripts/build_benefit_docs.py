import json
import re
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import requests
import urllib3

urllib3.disable_warnings()

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

TIMEOUT = 30
RETRIES = 3
DELAY_SEC = 0.15

OUT_DIR = Path("outputs")
OUT_JSON = OUT_DIR / "benefits_integrated.json"
OUT_MD = OUT_DIR / "benefits_by_segment.md"

REGIONS = [
    ("02", "서울"),
    ("03", "부산울산"),
    ("04", "대구경북"),
    ("05", "경인"),
    ("06", "광주전남"),
    ("07", "대전충남"),
    ("08", "강원"),
    ("09", "충북"),
    ("10", "전북"),
    ("11", "경남"),
    ("12", "제주"),
    ("13", "인천"),
    ("14", "경기북부"),
    ("15", "강원영동"),
]

CATEGORIES = [
    ("01", "공원"),
    ("02", "교육"),
    ("03", "궁능원/유적지"),
    ("04", "기념관/박물관"),
    ("05", "기타"),
    ("06", "문화"),
    ("07", "병원"),
    ("08", "숙박"),
    ("09", "스포츠/레저"),
    ("10", "은행"),
    ("11", "음식점"),
    ("12", "자연휴양림"),
    ("13", "관광지"),
    ("14", "주차장"),
    ("15", "장례시설"),
    ("16", "안경점"),
    ("17", "미용실"),
    ("18", "카페"),
    ("19", "여행사"),
    ("20", "전자제품"),
    ("21", "사진관"),
    ("22", "학원"),
]

BENEFIT_CODE_MAP = {"01": "면제", "02": "할인", "03": "기타"}
HALL_REGION_KEYS = [
    "list11",
    "list09",
    "list08",
    "list06",
    "list05",
    "list07",
    "list02",
    "list14",
    "list12",
    "list04",
    "list13",
    "list10",
    "list03",
    "list01",
]


def _parse_jsonp(text: str) -> Dict[str, Any]:
    m = re.search(r"^[^(]+\((.*)\)\s*;?\s*$", text, re.S)
    if not m:
        raise ValueError("JSONP 파싱 실패")
    return json.loads(m.group(1))


def _get_jsonp(url: str) -> Dict[str, Any]:
    last_error = None
    for attempt in range(RETRIES):
        try:
            r = requests.get(
                url,
                timeout=TIMEOUT,
                verify=False,
                headers={"User-Agent": UA},
            )
            r.raise_for_status()
            return _parse_jsonp(r.text)
        except Exception as e:  # noqa: BLE001
            last_error = e
            if attempt < RETRIES - 1:
                time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"요청 실패: {url} / {last_error}") from last_error


def _to_float(v: Any) -> float | None:
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _norm_text(v: Any) -> str:
    if v is None:
        return ""
    return re.sub(r"\s+", " ", str(v)).strip()


def _dedupe_key(source_type: str, name: str, address: str) -> Tuple[str, str, str]:
    return source_type, _norm_text(name).lower(), _norm_text(address).lower()


def collect_nara_sarang() -> List[Dict[str, Any]]:
    seen_codes: set[str] = set()
    rows: List[Dict[str, Any]] = []
    for region_code, _ in REGIONS:
        for category_code, _ in CATEGORIES:
            url = (
                "https://open.mma.go.kr/caisGGGS/mmanrsrListAjaxJsonCallNew.json"
                f"?jbc_cd={region_code}&udggeopjong_gbcd={category_code}&callback=cb"
            )
            data = _get_jsonp(url)
            if not data.get("success"):
                continue
            for item in data.get("list", []):
                code = _norm_text(item.get("udgigwan_cd"))
                if not code or code in seen_codes:
                    continue
                seen_codes.add(code)
                detail_url = (
                    "https://open.mma.go.kr/caisGGGS/mmanrsrSangSeAjaxJsonCall.json"
                    f"?udgigwan_cd={code}&callback=cb"
                )
                detail_obj = _get_jsonp(detail_url)
                vo = detail_obj.get("udgigwanVO", {}) if detail_obj.get("success") else {}
                benefit_type = BENEFIT_CODE_MAP.get(_norm_text(item.get("udae_gbcd")), "")
                row = {
                    "id": f"nara_{code}",
                    "source_type": "nara_sarang_store",
                    "name": _norm_text(item.get("udae_ggm")),
                    "category": _norm_text(item.get("udggeopjong_gbnm")),
                    "region": _norm_text(item.get("jbc_nm")),
                    "address": _norm_text(item.get("addr")),
                    "lat": _to_float(item.get("wido_vl")),
                    "lng": _to_float(item.get("gyeongdo_vl")),
                    "phone": _norm_text(item.get("udgigwan_telno")),
                    "benefit": _norm_text(vo.get("udsangse_cn") or item.get("udsangse_cn")),
                    "benefit_type": benefit_type,
                    "eligible_for": ["현역", "전역"],
                    "conditions": [_norm_text(vo.get("udjbjaryo_cn")) or "나라사랑카드"],
                    "detail_url": (
                        "https://www.mma.go.kr/udgg/listdetail.do"
                        f"?udgigwan_cd={code}&mcValue=0003357"
                    ),
                    "source_code": code,
                }
                rows.append(row)
                time.sleep(DELAY_SEC)
    return rows


def collect_myeongmunga() -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    base = "https://open.mma.go.kr/caisGGGS/bymmgPartAjaxJsonCallNew.json"
    data = _get_jsonp(f"{base}?udjiyeok_cd=&udae_ggm=&callback=cb")
    if not data.get("success"):
        return rows
    merged: List[Dict[str, Any]] = []
    for key in HALL_REGION_KEYS:
        merged.extend(data.get(key, []))
    seen_codes: set[str] = set()
    for item in merged:
        code = _norm_text(item.get("mmgudgigwan_cd"))
        if not code or code in seen_codes:
            continue
        seen_codes.add(code)
        detail_url = (
            "https://open.mma.go.kr/caisGGGS/bymmgSangSeAjaxJsonCall.json"
            f"?mmgudgigwan_cd={code}&callback=cb"
        )
        detail_obj = _get_jsonp(detail_url)
        vo = detail_obj.get("udgigwanVO", {}) if detail_obj.get("success") else {}
        benefit_type = BENEFIT_CODE_MAP.get(_norm_text(item.get("udae_gbcd")), "")
        row = {
            "id": f"mmg_{code}",
            "source_type": "myeongmunga_facility",
            "name": _norm_text(item.get("udae_ggm")),
            "category": _norm_text(item.get("udggeopjong_gbnm")),
            "region": _norm_text(item.get("udjiyeok_nm")),
            "address": _norm_text(item.get("addr")),
            "lat": _to_float(item.get("wido_vl")),
            "lng": _to_float(item.get("gyeongdo_vl")),
            "phone": _norm_text(item.get("udgigwan_telno")),
            "benefit": _norm_text(vo.get("udsangse_cn") or item.get("udsangse_cn")),
            "benefit_type": benefit_type,
            "eligible_for": ["병역명문가"],
            "conditions": ["병역명문가증"],
            "detail_url": (
                "https://www.mma.go.kr/temple/listdetail.do"
                f"?mmgudgigwan_cd={code}"
            ),
            "source_code": code,
        }
        rows.append(row)
        time.sleep(DELAY_SEC)
    return rows


def dedupe_rows(rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    seen = set()
    for r in rows:
        key = _dedupe_key(r["source_type"], r["name"], r["address"])
        if key in seen:
            continue
        seen.add(key)
        result.append(r)
    return result


def write_markdown(rows: List[Dict[str, Any]]) -> None:
    grouped: Dict[str, Dict[str, Dict[str, List[Dict[str, Any]]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    for r in rows:
        src = r["source_type"]
        bt = r.get("benefit_type") or "미분류"
        cat = r.get("category") or "미분류"
        grouped[src][bt][cat].append(r)

    lines: List[str] = []
    lines.append("# 병역 혜택 구분 문서")
    lines.append("")
    lines.append(f"- 생성시각: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"- 총 건수(중복 제거 후): {len(rows)}")
    lines.append("")

    for src in ["nara_sarang_store", "myeongmunga_facility"]:
        src_rows = [r for r in rows if r["source_type"] == src]
        src_title = "나라사랑가게" if src == "nara_sarang_store" else "병역명문가 예우시설"
        lines.append(f"## {src_title} ({len(src_rows)}건)")
        lines.append("")
        for bt in ["면제", "할인", "기타", "미분류"]:
            bt_map = grouped[src].get(bt, {})
            if not bt_map:
                continue
            bt_count = sum(len(v) for v in bt_map.values())
            lines.append(f"### {bt} ({bt_count}건)")
            lines.append("")
            for cat in sorted(bt_map.keys()):
                items = bt_map[cat]
                lines.append(f"#### 업종: {cat} ({len(items)}건)")
                lines.append("")
                lines.append("| 시설명 | 지역 | 전화 | 혜택 | 주소 |")
                lines.append("|---|---|---|---|---|")
                for r in sorted(items, key=lambda x: (x.get("region") or "", x.get("name") or "")):
                    benefit = (r.get("benefit") or "").replace("|", "/")
                    lines.append(
                        f"| {r.get('name','')} | {r.get('region','')} | {r.get('phone','')} | "
                        f"{benefit} | {r.get('address','')} |"
                    )
                lines.append("")

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    nara = collect_nara_sarang()
    mmg = collect_myeongmunga()
    all_rows = dedupe_rows([*nara, *mmg])
    OUT_JSON.write_text(
        json.dumps(all_rows, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    write_markdown(all_rows)
    print(f"saved: {OUT_JSON} ({len(all_rows)} rows)")
    print(f"saved: {OUT_MD}")


if __name__ == "__main__":
    main()
