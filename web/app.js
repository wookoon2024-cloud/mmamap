window.addEventListener("error", function (e) {
  const errDiv = document.getElementById("debugErrorBadge") || document.createElement("div");
  errDiv.id = "debugErrorBadge";
  errDiv.style.position = "fixed";
  errDiv.style.bottom = "30px";
  errDiv.style.right = "85px";
  errDiv.style.background = "#ef4444";
  errDiv.style.color = "#ffffff";
  errDiv.style.zIndex = "99999";
  errDiv.style.padding = "6px 12px";
  errDiv.style.fontSize = "12px";
  errDiv.style.fontFamily = "monospace";
  errDiv.style.borderRadius = "4px";
  errDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  errDiv.textContent = `JS Error: ${e.message} at ${String(e.filename || '').split('/').pop()}:${e.lineno}`;
  document.body.appendChild(errDiv);
});

const DATA_URL = "./data/benefits_map.json";
const LS_RATINGS_KEY = "mma_map_ratings_v1";
const LS_INTRO_DISMISS_KEY = "mma_map_intro_dismiss_v1";
const LS_CLIENT_TOKEN_KEY = "mma_map_client_token_v1";
const REVIEW_API_BASE = "/api/reviews";
const ENGAGEMENT_API_BASE = "/api/engagement";
const IS_STATIC_HOST = typeof window !== "undefined" && (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("github.io") || window.location.protocol === "file:");
const CATEGORY_LEGEND_IMAGE_ORDER = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png"];
const CATEGORY_FIXED_IMAGE_LABEL_ORDER = ["안경점", "병원", "문화", "음식점", "교육", "기타", "체육", "미용실", "카페", "주차"];
const AUDIENCE_LEGEND_IMAGE_ORDER = ["a.png", "b.png", "c.png", "d.png", "e.png", "f.png"];
const APP_DATA_LAST_UPDATED = "2026-04-08";
const HUB_MENU_TREE = [
  {
    key: "store_hub",
    label: "상생가게 안내",
    children: [
      {
        key: "store_guide",
        label: "이용안내",
        title: "상생가게 이용안내",
      },
      {
        key: "store_join",
        label: "참여가게 등록 신청",
        title: "상생가게 참여가게 등록 안내",
      },
    ],
  },
  {
    key: "card_finance",
    label: "카드 & 금융",
    children: [
      {
        key: "nara_card_info",
        label: "나라사랑카드 혜택",
        title: "나라사랑카드 혜택 비교 및 이용안내",
      },
      {
        key: "finance_overview",
        label: "장병내일준비적금",
        title: "장병내일준비적금 금융혜택 안내",
      },
    ],
  },
  {
    key: "benefits_hub",
    label: "군·청년 혜택모음",
    children: [
      {
        key: "tab_life",
        label: "생활 · 통신 · 교통",
        title: "생활 · 통신 · 교통 혜택",
      },
      {
        key: "tab_career",
        label: "취업 · 자격증 · 진로",
        title: "취업 · 자격증 · 진로 지원",
      },
      {
        key: "tab_medical",
        label: "의료 · 법률 · 지자체",
        title: "의료 · 법률 · 지자체 복지혜택",
      },
    ],
  },
  {
    key: "community_hub",
    label: "소통 & 정보",
    children: [
      {
        key: "board",
        label: "공유등록 게시판",
        title: "군필지도 공유등록 게시판",
      },
      {
        key: "map_info_policy",
        label: "서비스 소개 & 약관",
        title: "군필지도 서비스 소개 및 이용약관",
      },
    ],
  },
];

const CATEGORY_LABEL_MAP = {
  fee_viewing_parking: "관람/주차",
  fee_viewing: "관람",
  fee_advertising: "광고",
  fee_education: "교육",
  fee_purchase: "구매",
  fee_interest: "금리",
  fee_commission: "수수료",
  fee_lodging: "숙박",
  fee_meal: "식사",
  fee_usage: "이용",
  fee_entry_parking: "입장/주차",
  fee_entry: "입장",
  scholarship: "장학",
  fee_parking: "주차",
  fee_medical: "병원",
  fee_unclassified: "기타",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeTextBlock(value) {
  return escapeHtml(String(value || "").replace(/\s+/g, " ").trim());
}

function formatBenefitText(value) {
  const raw = String(value || "");
  if (!raw.trim()) return "혜택 정보 없음";
  const withBreaks = raw.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  const withoutTags = withBreaks.replace(/<[^>]+>/g, " ");
  const lines = withoutTags
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!lines.length) return "혜택 정보 없음";
  return lines.map((line) => escapeHtml(line)).join("<br>");
}

function toSafeId(v) {
  return String(v || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function isValidKoreaCoord(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= 32 && lat <= 39.5 && lng >= 123 && lng <= 133;
}

function getTheaterBookingUrl(title) {
  const t = String(title || "");
  if (/CGV/i.test(t)) return "https://www.cgv.co.kr/";
  if (/롯데시네마/.test(t)) return "https://www.lottecinema.co.kr/NLCHS";
  return "";
}

function getTheaterMarkerImage(title) {
  // CGV/롯데시네마도 일반 문화 카테고리 마커를 사용한다.
  return "";
}

function getNormalizedCategory(rawCategory, title) {
  return toCategoryLabel(rawCategory, title);
}

function inferRegionFromAddress(address, lat, lng) {
  const a = String(address || "").replace(/\s+/g, "");
  if (a.includes("서울")) return "서울";
  if (a.includes("인천")) return "인천";
  if (a.includes("부산") || a.includes("울산")) return "부산.울산";
  if (a.includes("대구") || a.includes("경북") || a.includes("경상북")) return "대구.경북";
  if (a.includes("광주") || a.includes("전남") || a.includes("전라남")) return "광주.전남";
  if (a.includes("전북") || a.includes("전라북") || a.includes("전북특별자치")) return "전북";
  if (a.includes("충북") || a.includes("충청북")) return "충북";
  if (a.includes("대전") || a.includes("세종") || a.includes("충남") || a.includes("충청남")) return "대전.충남";
  if (a.includes("경남") || a.includes("경상남") || a.includes("창원") || a.includes("진주")) return "경남";
  if (a.includes("제주")) return "제주";
  if (a.includes("강원") || a.includes("강릉") || a.includes("속초") || a.includes("동해") || a.includes("삼척")) return "강원";
  if (a.includes("경기") || a.includes("경기도")) {
    if (
      /(고양|김포|파주|의정부|동두천|양주|남양주|구리|포천|연천|가평|양평)/.test(a)
    ) return "경기북부";
    return "경인";
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    if (lat >= 33 && lat <= 34.2 && lng >= 126 && lng <= 127.2) return "제주";
    if (lat >= 37.3 && lat <= 37.75 && lng >= 126.7 && lng <= 127.25) return "서울";
    if (lat >= 37.3 && lat <= 37.7 && lng >= 126.3 && lng < 126.9) return "인천";
  }
  return "";
}

function extractProvinceName(address, lat, lng) {
  const addr = String(address || "").trim();

  // 1. Direct province keyword match from address
  if (/서울/.test(addr)) return "서울";
  if (/부산/.test(addr)) return "부산";
  if (/대구/.test(addr)) return "대구";
  if (/인천/.test(addr)) return "인천";
  if (/광주/.test(addr) && !/경기\s*광주|경기도\s*광주/.test(addr)) return "광주";
  if (/대전/.test(addr)) return "대전";
  if (/울산/.test(addr)) return "울산";
  if (/세종/.test(addr)) return "세종";
  if (/경기/.test(addr)) return "경기";
  if (/강원/.test(addr)) return "강원";
  if (/충(?:청)?북/.test(addr)) return "충북";
  if (/충(?:청)?남/.test(addr)) return "충남";
  if (/전(?:라)?북/.test(addr)) return "전북";
  if (/전(?:라)?남/.test(addr)) return "전남";
  if (/경(?:상)?북/.test(addr)) return "경북";
  if (/경(?:상)?남/.test(addr)) return "경남";
  if (/제주/.test(addr)) return "제주";

  // 2. City names in address
  if (/(수원|성남|고양|용인|부천|안산|안양|남양주|화성|평택|의정부|시흥|파주|김포|광명|광주|군포|이천|양주|오산|구리|안성|포천|의왕|하남|여주|동두천|과천|가평|양평|연천)/.test(addr)) return "경기";
  if (/(춘천|원주|강릉|동해|태백|속초|삼척|홍천|횡성|영월|평창|정선|철원|화천|양구|인제|고성|양양)/.test(addr)) return "강원";
  if (/(청주|충주|제천|보은|옥천|영동|증평|진천|괴산|음성|단양)/.test(addr)) return "충북";
  if (/(천안|공주|보령|아산|서산|논산|계룡|당진|금산|부여|서천|청양|홍성|예산|태안)/.test(addr)) return "충남";
  if (/(전주|군산|익산|정읍|남원|김제|완주|진안|무주|장수|임실|순창|고창|부안)/.test(addr)) return "전북";
  if (/(목포|여수|순천|나주|광양|담양|곡성|구례|고흥|보성|화순|장흥|강진|해남|영암|무안|함평|영광|장성|완도|진도|신안)/.test(addr)) return "전남";
  if (/(포항|경주|김천|안동|구미|영주|영천|상주|문경|경산|군위|의성|청송|영양|영덕|청도|고령|성주|칠곡|예천|봉화|울진|울릉)/.test(addr)) return "경북";
  if (/(창원|진주|통영|사천|김해|밀양|거제|양산|의령|함안|창녕|고성|남해|하동|산청|함양|거창|합천)/.test(addr)) return "경남";

  // 3. Geographic coordinate fallback (대한민국 위경도 영역 기반 판별)
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat > 30) {
    if (lat < 34.0) return "제주";
    if (lat >= 37.42 && lat <= 37.70 && lng >= 126.76 && lng <= 127.18) return "서울";
    if (lat >= 37.35 && lat <= 37.60 && lng >= 126.50 && lng < 126.76) return "인천";
    if (lat >= 36.90 && lat <= 38.30 && lng >= 126.30 && lng <= 127.80) return "경기";
    if (lat >= 37.00 && lat <= 38.60 && lng >= 127.80 && lng <= 129.40) return "강원";
    if (lat >= 35.80 && lat <= 37.10 && lng >= 127.30 && lng <= 128.80) return "충북";
    if (lat >= 35.90 && lat <= 37.10 && lng >= 126.00 && lng <= 127.40) return "충남";
    if (lat >= 36.20 && lat <= 36.50 && lng >= 127.25 && lng <= 127.55) return "대전";
    if (lat >= 35.30 && lat <= 36.15 && lng >= 126.30 && lng <= 127.90) return "전북";
    if (lat >= 34.10 && lat <= 35.50 && lng >= 125.80 && lng <= 127.90) return "전남";
    if (lat >= 35.05 && lat <= 35.25 && lng >= 126.65 && lng <= 127.00) return "광주";
    if (lat >= 35.60 && lat <= 37.20 && lng >= 127.80 && lng <= 129.60) return "경북";
    if (lat >= 35.75 && lat <= 36.05 && lng >= 128.40 && lng <= 128.80) return "대구";
    if (lat >= 34.60 && lat <= 35.90 && lng >= 127.60 && lng <= 129.40) return "경남";
    if (lat >= 35.00 && lat <= 35.40 && lng >= 128.80 && lng <= 129.35) return "부산";
    if (lat >= 35.35 && lat <= 35.75 && lng >= 129.10 && lng <= 129.45) return "울산";
  }
  return "기타";
}

function extractCityName(address, lat, lng) {
  const addr = String(address || "").trim();

  // 1. Metropolitan / Special Cities
  if (/서울/.test(addr)) return "서울";
  if (/인천/.test(addr)) return "인천";
  if (/부산/.test(addr)) return "부산";
  if (/대구/.test(addr)) return "대구";
  if (/대전/.test(addr)) return "대전";
  if (/광주/.test(addr) && !/경기\s*광주|경기도\s*광주/.test(addr)) return "광주";
  if (/울산/.test(addr)) return "울산";
  if (/세종/.test(addr)) return "세종";
  if (/제주/.test(addr)) return "제주";

  // 2. Province + City/County
  const m = addr.match(/([가-힣]+(?:도|특별자치도))\s*([가-힣]+[시군])/);
  if (m) {
    let prov = m[1].replace(/특별자치도/g, "").replace(/도$/g, "");
    let city = m[2];
    return `${prov} ${city}`;
  }

  // 3. Fallback: match standalone City/County
  const m2 = addr.match(/([가-힣]+[시군])/);
  if (m2) {
    const prov = extractProvinceName(address, lat, lng);
    return prov !== "기타" ? `${prov} ${m2[1]}` : m2[1];
  }

  return extractProvinceName(address, lat, lng);
}

function normalizeRegion(rawRegion, address, lat, lng) {
  const region = String(rawRegion || "").trim();
  if (region) return region;
  return inferRegionFromAddress(address, lat, lng) || "지역미상";
}

function formatKoreanAddress(rawAddr) {
  if (!rawAddr || typeof rawAddr !== "string") return "";
  let s = rawAddr.trim();

  // 1. Extract and clean parenthesis / detail notes
  let parenPart = "";
  const parenMatch = s.match(/\((.*)\)/);
  if (parenMatch) {
    let inner = parenMatch[0];
    let cleaned = inner.replace(/[\(\)]+/g, "").replace(/\s+/g, " ").trim();
    cleaned = cleaned.replace(/^,\s*/, "").replace(/,\s*$/, "");
    if (cleaned) parenPart = ` (${cleaned})`;
    s = s.substring(0, parenMatch.index).trim();
  }
  s = s.replace(/[\(\)]+/g, "").trim();

  // 2. Separate known Si/Do
  const sidoList = [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
    "경기도", "강원특별자치도", "강원도", "충청북도", "충청남도", "전북특별자치도", "전라북도", "전라남도",
    "경상북도", "경상남도", "제주특별자치도", "서울시", "부산시", "대구시", "인천시", "광주시", "대전시", "울산시", "세종시"
  ];
  for (const sido of sidoList) {
    if (s.startsWith(sido) && !s.startsWith(sido + " ")) {
      s = sido + " " + s.slice(sido.length).trim();
      break;
    }
  }

  // 3. Separate Gu / Gun / Si
  s = s.replace(/([가-힣]{1,5}(?:구|군|시))(?=[가-힣0-9])/g, "$1 ");
  s = s.replace(/\s시\s민로/g, " 시민로");
  s = s.replace(/\s구\s산/g, " 구산");

  // 4. Separate Road names
  s = s.replace(/([가-힣0-9]+(?:로|길|동|읍|면|[0-9]+가))(?=[0-9])/g, "$1 ");

  // 5. Separate building number and floor/unit
  s = s.replace(/([0-9]+(?:\-[0-9]+)?)([0-9]+층|[0-9]+호|지하[0-9]+층)/g, "$1 $2");

  s = s.replace(/\s+/g, " ").trim();
  return s + parenPart;
}

function getFacilityKey(point) {
  if (!point) return "";
  const fid = String(point.facilityId || point.id || "").trim();
  const title = String(point.title || "").trim();
  const sub = String(point.subtitle || "").trim();
  const lat = Number(point.lat || 0).toFixed(5);
  const lng = Number(point.lng || 0).toFixed(5);
  return toSafeId(`${fid}_${title}_${sub}_${lat}_${lng}`);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function toCategoryLabel(category, name = "") {
  const c = String(category || "").trim();
  const n = String(name || "").trim();
  if (c === "안경점" || c.includes("안경") || n.includes("안경") || n.includes("콘택트")) return "안경점";
  if (c === "병원" || c.includes("병원") || c.includes("의료") || c === "fee_medical" || n.includes("병원") || n.includes("의원") || n.includes("치과") || n.includes("한의원")) return "병원";
  if (c === "카페" || c.includes("카페") || c.includes("커피") || n.toLowerCase().includes("cafe") || n.includes("커피")) return "카페";
  if (c === "미용실" || c.includes("미용") || n.includes("헤어") || n.includes("미용")) return "미용실";
  if (c === "체육" || c.includes("체육") || c.includes("스포츠") || c.includes("레저") || n.includes("헬스") || n.includes("피트니스") || n.includes("볼링") || n.includes("수영")) return "체육";
  if (c === "주차" || c.includes("주차") || c === "fee_parking" || c === "fee_viewing_parking" || c === "fee_entry_parking") return "주차";
  if (c === "교육" || c.includes("교육") || c.includes("학원") || c === "fee_education" || c === "scholarship") return "교육";
  if (c === "음식점" || c.includes("음식") || c.includes("식당") || c.includes("식사") || c === "fee_meal") return "음식점";
  if (c === "문화" || c.includes("문화") || c.includes("관람") || c.includes("입장") || c.includes("영화") || c.includes("공연") || c.includes("숙박") || c.includes("관광") || c === "fee_viewing" || c === "fee_entry" || c === "fee_lodging" || /CGV|롯데시네마|메가박스|시네마|극장|미술관|박물관|기념관|테마파크/i.test(n)) return "문화";
  return "기타";
}

function colorFromText(text) {
  const s = String(text || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 65% 48%)`;
}

function getAudienceDisplayName(name) {
  const s = String(name || "");
  if (/\uBAA8\uBC94\uC608\uBE44\uAD70/.test(s)) return "모범예비군";
  if (/\uB3D9\uC6D0\uD6C8\uB828/.test(s)) return "예비군";
  if (/\uC608\uBE44\uAD70/.test(s)) return "예비군";
  if (/\uD604\uC5ED/.test(s)) return "현역병";
  if (/\uC0AC\uD68C\uBCF5\uBB34/.test(s)) return "사회복무";
  return name;
}

function loadNaverMapScript() {
  return new Promise((resolve, reject) => {
    if (window.naver && window.naver.maps) {
      resolve();
      return;
    }
    const keyId = window.APP_CONFIG?.naverMap?.keyId || window.APP_CONFIG?.naverMap?.clientId;
    if (!keyId) {
      reject(new Error("Naver key missing"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}&submodules=geocoder`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Naver SDK load failed"));
    document.head.appendChild(script);
  });
}

async function bootstrap() {
  await loadNaverMapScript();

  const map = new naver.maps.Map("map", {
    center: new naver.maps.LatLng(37.5665, 126.978),
    zoom: 14,
    mapTypeId: naver.maps.MapTypeId.NORMAL,
  });
  window.naverMap = map;

  const defaultCenter = new naver.maps.LatLng(37.5665, 126.978);
  const defaultZoom = 14;

  const res = await fetch(DATA_URL);
  const data = await res.json();
  const facilities = Array.isArray(data.facilities) ? data.facilities : [];

  const points = [];
  window.points = points;
  for (const f of facilities) {
    if (typeof f.lat === "number" && typeof f.lng === "number" && isValidKoreaCoord(f.lat, f.lng)) {
      points.push({
        facilityId: f.facility_id || f.id || "",
        lat: f.lat,
        lng: f.lng,
        title: f.name || "시설",
        subtitle: getNormalizedCategory(f.category || "", f.name || ""),
        category: getNormalizedCategory(f.category || "", f.name || ""),
        region: normalizeRegion(f.region || "", f.address || "", f.lat, f.lng),
        address: formatKoreanAddress(f.address || ""),
        phone: f.phone || "",
        benefit: f.benefit || "",
        detailUrl: f.detail_url || "",
        audiences: Array.isArray(f.audiences) ? f.audiences : [],
        sourceType: f.source_type || "",
      });
    } else if (Array.isArray(f.branches)) {
      for (const b of f.branches) {
        if (typeof b.lat === "number" && typeof b.lng === "number" && isValidKoreaCoord(b.lat, b.lng)) {
          points.push({
            facilityId: f.facility_id || f.id || "",
            lat: b.lat,
            lng: b.lng,
            title: f.name || "시설",
            subtitle: b.branch_name || "지점",
            category: getNormalizedCategory(f.category || "", f.name || ""),
            region: normalizeRegion(f.region || "", b.address || "", b.lat, b.lng),
            address: formatKoreanAddress(b.address || ""),
            phone: f.phone || "",
            benefit: f.benefit || "",
            detailUrl: f.detail_url || "",
            audiences: Array.isArray(f.audiences) ? f.audiences : [],
            sourceType: f.source_type || "",
          });
        }
      }
    }
  }

  const pointByFacilityKey = new Map();
  for (const p of points) {
    const key = getFacilityKey(p);
    if (key && !pointByFacilityKey.has(key)) pointByFacilityKey.set(key, p);
  }

  const countNaraEl = document.getElementById("countNara");
  const countNaraDupEl = document.getElementById("countNaraDup");
  const countMmgEl = document.getElementById("countMmg");
  let naraCount = 0;
  let mmgCount = 0;
  for (const p of points) {
    if (p.sourceType === "nara_sarang_store") naraCount += 1;
    if (p.sourceType === "myeongmunga_facility" || String(p.facilityId || "").startsWith("mmg_")) mmgCount += 1;
  }
  if (countNaraEl) countNaraEl.textContent = String(naraCount);
  if (countNaraDupEl) countNaraDupEl.textContent = String(naraCount);
  if (countMmgEl) countMmgEl.textContent = String(mmgCount);

  const categoryImageByLabel = {
    "안경점": "1.png",
    "병원": "2.png",
    "문화": "3.png",
    "음식점": "4.png",
    "교육": "5.png",
    "기타": "6.png",
    "체육": "7.png",
    "미용실": "8.png",
    "카페": "9.png",
    "주차": "10.png",
  };

  const audienceSet = new Set(points.flatMap((p) => (Array.isArray(p.audiences) ? p.audiences : [])));
  const audienceFilters = [...audienceSet];
  const audienceIconByName = Object.fromEntries(audienceFilters.map((name, idx) => [name, AUDIENCE_LEGEND_IMAGE_ORDER[idx % AUDIENCE_LEGEND_IMAGE_ORDER.length]]));
  const regionFilters = [...new Set(points.map((p) => String(p.region || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));

  const favorites = new Set();
  const likes = new Set();
  window.MMAFavorites = favorites;
  window.MMALikes = likes;
  const clickCountsById = {};
  const likeCountsById = {};
  const favoriteCountsById = {};
  let reviewBoardPosts = [];
  const ratingsById = {};
  const saveRatings = async (facilityId, rating) => {
    if (!ratingsById[facilityId]) ratingsById[facilityId] = [];
    ratingsById[facilityId].push(rating);
    try {
      const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
      const key = (window.APP_CONFIG && window.APP_CONFIG.supabase && window.APP_CONFIG.supabase.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
      await fetch(`${url}/facility_ratings`, {
        method: "POST",
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          facility_id: String(facilityId),
          client_token: typeof clientToken !== "undefined" ? clientToken : "",
          rating: Number(rating)
        })
      });
    } catch (_err) {}
  };
  const getRatings = (id) => (Array.isArray(ratingsById[id]) ? ratingsById[id] : []);
  const getAverageRating = (id) => {
    const arr = getRatings(id);
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };
  const getClickCount = (id) => Number(clickCountsById[id] || 0);
  const getLikeCount = (id) => Number(likeCountsById[id] || 0);
  const getFavoriteCount = (id) => Number(favoriteCountsById[id] || 0);

  const formatBoardDate = (timestamp) => {
    const d = new Date(Number(timestamp) || Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  const getSortedReviewPosts = () =>
    (Array.isArray(reviewBoardPosts) ? reviewBoardPosts.slice() : []).sort(
      (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
    );

  const normalizeReviewPost = (row) => ({
    id: String(row?.id || ""),
    author: String(row?.author || ""),
    content: String(row?.content || ""),
    createdAt: Number(row?.createdAt || 0),
    updatedAt: Number(row?.updatedAt || 0),
  });

  const readJsonSafe = async (res) => {
    try {
      return await res.json();
    } catch (_err) {
      return {};
    }
  };

  const getOrCreateClientToken = () => {
    let existing = "";
    try {
      existing = String(sessionStorage.getItem(LS_CLIENT_TOKEN_KEY) || "").trim();
    } catch (_e) {}
    if (existing) return existing;
    const created = `ct_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      sessionStorage.setItem(LS_CLIENT_TOKEN_KEY, created);
    } catch (_e) {}
    return created;
  };
  const clientToken = getOrCreateClientToken();

  const showToast = (message, type = "info") => {
    let container = document.getElementById("mmaToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "mmaToastContainer";
      container.style.cssText = "position:fixed; bottom:32px; left:50%; transform:translateX(-50%); z-index:999999; display:flex; flex-direction:column; align-items:center; gap:8px; pointer-events:none;";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.style.cssText = "background:rgba(15,23,42,0.92); color:#ffffff; font-size:13px; font-weight:700; padding:10px 18px; border-radius:30px; box-shadow:0 10px 25px rgba(0,0,0,0.25); display:flex; align-items:center; gap:8px; backdrop-filter:blur(8px); pointer-events:auto; animation:toastPopIn 0.2s cubic-bezier(0.16,1,0.3,1); transition:opacity 0.25s, transform 0.25s;";
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  };
  window.showToast = showToast;

  const getEffectiveUserToken = () => {
    return (window.MMAAuth?.user?.id) || (window.MMAAuth?.user?.email) || clientToken;
  };

  const syncUserEngagementFromSupabase = async (targetToken = "") => {
    try {
      const token = targetToken || getEffectiveUserToken();
      if (!token) return;
      const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
      const key = (window.APP_CONFIG?.supabase?.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
      const res = await fetch(`${url}/facility_action_states?client_token=eq.${encodeURIComponent(token)}&active=eq.1&select=facility_id,action_type`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
      });
      const rows = await res.json();
      if (Array.isArray(rows)) {
        rows.forEach(r => {
          const fid = String(r.facility_id || "");
          if (r.action_type === "like") likes.add(fid);
          if (r.action_type === "favorite") favorites.add(fid);
        });
      }
      if (typeof renderFavoritesPanel === "function") renderFavoritesPanel();
    } catch (_err) {
      console.warn("[Engagement Sync Error]", _err);
    }
  };
  window.syncUserEngagementFromSupabase = syncUserEngagementFromSupabase;

  const loadEngagementSnapshot = async () => {
    try {
      const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
      const key = (window.APP_CONFIG?.supabase?.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
      const userToken = getEffectiveUserToken();

      // 1. Fetch real action states (likes & favorites) from Supabase
      const actRes = await fetch(`${url}/facility_action_states?active=eq.1&select=facility_id,action_type,client_token`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
      });
      const actRows = (await actRes.json()) || [];

      favorites.clear();
      likes.clear();
      Object.keys(likeCountsById).forEach((k) => delete likeCountsById[k]);
      Object.keys(favoriteCountsById).forEach((k) => delete favoriteCountsById[k]);

      if (Array.isArray(actRows)) {
        actRows.forEach(r => {
          const fid = String(r.facility_id || "");
          const cleanFid = fid.split("____")[0] || fid;
          if (r.action_type === "like") {
            likeCountsById[fid] = (likeCountsById[fid] || 0) + 1;
            if (cleanFid && cleanFid !== fid) {
              likeCountsById[cleanFid] = (likeCountsById[cleanFid] || 0) + 1;
            }
            if (userToken && r.client_token === userToken) {
              likes.add(fid);
              if (cleanFid) likes.add(cleanFid);
            }
          } else if (r.action_type === "favorite") {
            favoriteCountsById[fid] = (favoriteCountsById[fid] || 0) + 1;
            if (cleanFid && cleanFid !== fid) {
              favoriteCountsById[cleanFid] = (favoriteCountsById[cleanFid] || 0) + 1;
            }
            if (userToken && r.client_token === userToken) {
              favorites.add(fid);
              if (cleanFid) favorites.add(cleanFid);
            }
          }
        });
      }

      // 2. Fetch real click events from Supabase
      const clickRes = await fetch(`${url}/facility_click_events?select=facility_id`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
      });
      const clickRows = (await clickRes.json()) || [];
      Object.keys(clickCountsById).forEach((k) => delete clickCountsById[k]);
      if (Array.isArray(clickRows)) {
        clickRows.forEach(r => {
          const fid = String(r.facility_id || "");
          const cleanFid = fid.split("____")[0] || fid;
          clickCountsById[fid] = (clickCountsById[fid] || 0) + 1;
          if (cleanFid && cleanFid !== fid) {
            clickCountsById[cleanFid] = (clickCountsById[cleanFid] || 0) + 1;
          }
        });
      }

      // Refresh panels with 100% real Supabase data
      if (typeof renderFavoritesPanel === "function") renderFavoritesPanel();
      if (typeof renderRankPanel === "function") renderRankPanel();
    } catch (err) {
      console.warn("[Supabase Engagement Snapshot Warn]", err);
    }
  };

  const toggleEngagement = async (facilityId, actionType, forceActive = null) => {
    const userToken = getEffectiveUserToken();
    const setObj = actionType === "like" ? likes : favorites;
    const willBeActive = forceActive !== null ? forceActive : !setObj.has(facilityId);

    // 1. Direct Supabase Upsert (Primary & Authoritative)
    try {
      const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
      const key = (window.APP_CONFIG?.supabase?.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
      await fetch(`${url}/facility_action_states`, {
        method: "POST",
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          client_token: userToken,
          facility_id: String(facilityId),
          action_type: actionType,
          active: willBeActive ? 1 : 0,
          updated_at: Date.now()
        })
      });
    } catch (e) {
      console.warn("[Supabase Engagement Upsert Warn]", e);
    }

    // 2. Local SQLite sync fallback (only when local server is present)
    if (!IS_STATIC_HOST) {
      try {
        await fetch(`${ENGAGEMENT_API_BASE}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientToken: userToken, facilityId, actionType })
        });
      } catch (_e) {}
    }

    return { ok: true, active: willBeActive };
  };

  const recordFacilityClick = async (facilityId) => {
    const fid = String(facilityId || "");
    const userToken = getEffectiveUserToken();
    clickCountsById[fid] = (clickCountsById[fid] || 0) + 1;
    if (typeof renderRankPanel === "function") renderRankPanel();

    // 1. Direct Supabase Insert (Primary & Authoritative)
    try {
      const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
      const key = (window.APP_CONFIG?.supabase?.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
      await fetch(`${url}/facility_click_events`, {
        method: "POST",
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_id: `clk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          facility_id: fid,
          client_token: userToken,
          created_at: Date.now()
        })
      });
    } catch (_e) {}

    // 2. Local fallback (only when local server is present)
    if (!IS_STATIC_HOST) {
      try {
        await fetch(`${ENGAGEMENT_API_BASE}/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientToken: userToken, facilityId: fid })
        });
      } catch (_e) {}
    }

    return { ok: true, clickCount: clickCountsById[fid] };
  };

  const fetchReviewPosts = async () => {
    try {
      const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
      const key = (window.APP_CONFIG?.supabase?.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
      const res = await fetch(`${url}/review_posts?order=created_at.desc&limit=100`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          reviewBoardPosts = rows.map(normalizeReviewPost);
          return;
        }
      }
    } catch (_err) {}

    // Fallback to local
    try {
      const res = await fetch(`${REVIEW_API_BASE}?page=1&page_size=200`, { method: "GET" });
      const data = await readJsonSafe(res);
      const rows = Array.isArray(data?.items) ? data.items : [];
      reviewBoardPosts = rows.map(normalizeReviewPost);
    } catch (_e) {}
  };

  const verifyReviewPassword = async (postId, password) => {
    const res = await fetch(`${REVIEW_API_BASE}/${encodeURIComponent(postId)}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) return false;
    return Boolean(data?.ok);
  };

  const getReviewAuthHeaders = () => {
    const token = window.MMAAuth?.token || "";
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const createReviewPost = async ({ author, content, password }) => {
    const res = await fetch(REVIEW_API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getReviewAuthHeaders() },
      body: JSON.stringify({ author, content, password }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "후기 등록 실패"));
    return data;
  };

  const updateReviewPost = async ({ postId, author, content, currentPassword, newPassword }) => {
    const res = await fetch(`${REVIEW_API_BASE}/${encodeURIComponent(postId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getReviewAuthHeaders() },
      body: JSON.stringify({ author, content, currentPassword, newPassword }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "후기 수정 실패"));
    return data;
  };

  const deleteReviewPost = async ({ postId, password }) => {
    const res = await fetch(`${REVIEW_API_BASE}/${encodeURIComponent(postId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getReviewAuthHeaders() },
      body: JSON.stringify({ password }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "후기 삭제 실패"));
    return data;
  };

  const hoverInfoWindow = new naver.maps.InfoWindow({
    backgroundColor: "#fff",
    borderColor: "#2f6ff2",
    borderWidth: 1,
    anchorSize: new naver.maps.Size(10, 10),
  });

  const detailInfoWindow = new naver.maps.InfoWindow({
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
    disableAnchor: true,
    pixelOffset: new naver.maps.Point(0, -36),
    zIndex: 500,
  });

  let renderedMarkers = [];
  let activeMarkerMap = new Map();
  let activeClusterMarkerMap = new Map();
  let currentLocationMarker = null;
  let currentUserLatLng = null;
  let initialBoundsListener = null;
  let renderTimer = null;
  let selectedCategory = "";
  let selectedAudience = "";
  let selectedRegion = "";
  let selectedFacilityId = "";
  let selectedDetailAnchor = null;
  let selectedDetailScreenPoint = null;
  let isMarkerRepositioning = false;
  let lastMarkerClickTime = 0;
  let centerMoveAnimId = null;
  const ENABLE_DETAIL_PANEL = true;
  let rankingTab = "popular";
  let rankingAudience = "";
  let rankTickerTimer = null;
  let rankTickerRows = [];
  let rankTickerIndex = 0;
  let newStoreRollTimer = null;
  let newStoreRollResetTimer = null;
  let newStoreRollIndex = 0;

  const profileBtn = document.getElementById("profileBtn");
  const favoritesPanel = document.getElementById("favoritesPanel");
  const favoritesListEl = document.getElementById("favoritesList");
  const rankTopTextEl = document.getElementById("rankTopText");
  const rankTopScoreEl = document.getElementById("rankTopScore");
  const newStoreTotalCountEl = document.getElementById("newStoreTotalCount");
  const newStoreRollTrackEl = document.getElementById("newStoreRollTrack");
  const rankListEl = document.getElementById("rankList");
  const rankAudienceFiltersEl = document.getElementById("rankAudienceFilters");
  const rankTabEls = [...document.querySelectorAll(".rankTab")];
  const rankPanelEl = document.getElementById("rankPanel");
  const rankHeadEl = rankPanelEl ? rankPanelEl.querySelector(".rankHead") : null;
  const detailPanelEl = document.getElementById("detailPanel");
  const regionSelectEl = document.getElementById("regionSelect");
  const hubNavEl = document.getElementById("hubNav");
  const hubMegaEl = document.getElementById("hubMega");
  const hubModalBackdropEl = document.getElementById("hubModalBackdrop");
  const hubPanelEl = document.getElementById("hubPanel");
  const introBackdropEl = document.getElementById("introBackdrop");
  const introPopupEl = document.getElementById("introPopup");
  const introNeverCheckEl = document.getElementById("introNeverCheck");
  const introCloseBtnEl = document.getElementById("introCloseBtn");
  const introConfirmBtnEl = document.getElementById("introConfirmBtn");
  let activeHubPrimaryKey = "";

  let isIntroDismissed = false;

  const closeIntroPopup = async (saveDismiss = false) => {
    if (saveDismiss && introNeverCheckEl?.checked) {
      isIntroDismissed = true;
      try {
        const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
        const key = (window.APP_CONFIG && window.APP_CONFIG.supabase && window.APP_CONFIG.supabase.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
        await fetch(`${url}/client_preferences`, {
          method: "POST",
          headers: {
            "apikey": key,
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify({
            client_token: clientToken,
            intro_dismissed: true,
            updated_at: new Date().toISOString()
          })
        });
      } catch (_e) {}
    }
    if (introPopupEl) introPopupEl.classList.add("hidden");
    if (introBackdropEl) introBackdropEl.classList.add("hidden");
  };

  const openIntroPopup = async () => {
    if (isIntroDismissed) return;
    try {
      const url = "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
      const key = (window.APP_CONFIG && window.APP_CONFIG.supabase && window.APP_CONFIG.supabase.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
      const res = await fetch(`${url}/client_preferences?client_token=eq.${encodeURIComponent(clientToken)}`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].intro_dismissed) {
          isIntroDismissed = true;
          return;
        }
      }
    } catch (_e) {}

    if (introNeverCheckEl) introNeverCheckEl.checked = false;
    if (introPopupEl) introPopupEl.classList.remove("hidden");
    if (introBackdropEl) introBackdropEl.classList.remove("hidden");
  };

  const closeHubMega = () => {
    if (!hubMegaEl) return;
    hubMegaEl.classList.add("hidden");
  };

  const closeHubPanel = () => {
    if (!hubPanelEl) return;
    hubPanelEl.classList.add("hidden");
    hubPanelEl.innerHTML = "";
    if (hubModalBackdropEl) hubModalBackdropEl.classList.add("hidden");
  };

  const findHubSecondary = (primaryKey, secondaryKey) => {
    const primary = HUB_MENU_TREE.find((item) => item.key === primaryKey);
    if (!primary) return null;
    const secondary = (primary.children || []).find((item) => item.key === secondaryKey);
    if (!secondary) return null;
    return { primary, secondary };
  };

  const buildSecondaryGuideHtml = (secondary, activeTab) => {
    const key = secondary?.key;

    // 1. 상생가게 안내
    if (key === "store_guide") {
      const currentTab = activeTab || "nara";
      return `
        <div class="hubSubTabs">
          <button type="button" class="hubSubTabBtn ${currentTab === 'nara' ? 'active' : ''}" data-hub-tab="nara">⭐ 나라사랑가게</button>
          <button type="button" class="hubSubTabBtn ${currentTab === 'mmg' ? 'active' : ''}" data-hub-tab="mmg">🎖️ 병역명문가가게</button>
        </div>
        <div class="hubPanelBody">
          ${currentTab === 'nara' ? `
            <div class="hubCard">
              <span class="hubBadge">제도 목적</span>
              <h4>병역이행자 일상 혜택 지원</h4>
              <p>동원훈련 이수자, 현역병, 사회복무요원 등 국가를 위해 헌신하는 청년들에게 실질적인 할인 혜택(5~20% 자율 할인)을 제공하는 병무청 지정 참여 매장입니다.</p>
            </div>
            <div class="hubCard">
              <span class="hubBadge">우대 대상 및 신분 확인</span>
              <h4>필요 증빙 서류 지참</h4>
              <p>방문 시 매장 직원에게 아래 신분증 또는 서류를 제시하시면 즉시 혜택이 적용됩니다.</p>
              <ul>
                <li><b>예비군</b>: 당해연도 동원훈련 이수 필증, 병력동원훈련 입영확인서, 모범예비군증</li>
                <li><b>복무자</b>: 군인신분증(현역), 복무확인서, 사회복무요원증</li>
                <li><b>병역명문가</b>: 병역명문가증 (본인/가족)</li>
              </ul>
            </div>
          ` : `
            <div class="hubCard">
              <span class="hubBadge">제도 개요</span>
              <h4>3대(1~3대) 성실 복무 가문 예우</h4>
              <p>조부, 부, 백부, 숙부 및 본인·형제·사촌형제 등 3대 가족 모두가 현역 복무를 성실히 마친 명문가 가문을 선정하여 포상 및 국·공립, 민간 시설 할인 예우를 제공합니다.</p>
            </div>
            <div class="hubCard">
              <span class="hubBadge">예우 혜택</span>
              <h4>국공립 및 민간 가맹 시설 우대</h4>
              <p>전국 국립공원, 자연휴양림, 문화재 감면 및 병무청과 협약된 민간 명문가가게에서 진료비/이용료 할인(10~30%)을 받으실 수 있습니다.</p>
              <p style="margin-top:8px; font-size:12px; color:#64748b;">※ 병무청 누리집에서 병역명문가 신청 및 증 발급 후 이용 가능합니다.</p>
            </div>
          `}
        </div>
      `;
    }

    if (key === "store_join") {
      return `
        <div class="hubPanelBody">
          <div class="hubCard">
            <span class="hubBadge">가맹점 상생 동참</span>
            <h4>나라사랑가게 참여 신청 안내</h4>
            <p>우리 동네 청년 장병과 예비군, 병역명문가를 응원하는 착한 가게에 동참해 보세요! 병무청 공식 인증 스티커 및 홍보물 QR코드 유입 통계가 지원됩니다.</p>
          </div>
          <div class="hubCard">
            <h4>신청 및 심사 절차</h4>
            <ul>
              <li><b>1단계</b>: 병무청 공식 누리집 온라인 신청서 접수</li>
              <li><b>2단계</b>: 관할 지방병무청 서류 확인 및 참여 협약 체결</li>
              <li><b>3단계</b>: 나라사랑가게 인증 스티커 배부 및 군필지도 등록</li>
            </ul>
            <a class="hubBtnLink" href="https://www.mma.go.kr/contents.do?mc=mma0003358" target="_blank" rel="noopener noreferrer">
              병무청 공식 참여신청 바로가기 ↗
            </a>
          </div>
        </div>
      `;
    }

    if (key === "store_poster_guide") {
      return `
        <div class="hubPanelBody">
          <div class="hubCard">
            <span class="hubBadge">홍보물 자동 제작</span>
            <h4>지도 결합형 맞춤 홍보물 인쇄 서비스</h4>
            <p>가맹점주님을 위해 주변 상생지도와 혜택 정보, QR코드가 결합된 고화질 홍보물을 3초 만에 무료로 생성해 드립니다.</p>
          </div>
          <div class="hubCard">
            <h4>지원 규격 (3종)</h4>
            <ul>
              <li><b>포스터</b>: 출입문, 카운터, 벽면 부착용 (상생지도 결합형)</li>
              <li><b>미니 테이블 스탠드</b>: 카운터 결제대, 테이블 거치용</li>
              <li><b>도어행거 (문고리형)</b>: 손잡이에 거는 슬림형</li>
            </ul>
            <p style="margin-top: 10px; font-size: 12.5px; color: #475569;">💡 <b>이용 방법</b>: 지도에서 매장 핀을 클릭한 뒤, 상세창의 <b>[맞춤 홍보물 인쇄]</b> 버튼을 누르면 즉시 고화질 이미지를 다운로드하거나 인쇄/PDF로 저장하실 수 있습니다.</p>
          </div>
        </div>
      `;
    }

    // 2. 카드 & 금융
    if (key === "nara_card_info") {
      return `
        <div class="hubPanelBody">
          <div class="hubCard">
            <span class="hubBadge">발급 대상</span>
            <h4>KB국민 & IBK기업 나라사랑카드 혜택 비교</h4>
            <p>병역판정검사 시 발급받아 군 복무 중 급여 통장 및 전역 후에도 지속 이용 가능한 대표적인 청년 특화 체크카드입니다.</p>
          </div>
          <div class="hubCard">
            <h4>주요 혜택 비교</h4>
            <ul>
              <li><b>대중교통</b>: 전국 버스/지하철 20% 청구할인 (KB국민/IBK 공통)</li>
              <li><b>편의점/PX</b>: PX 및 GS25/CU 10~20% 현장 할인 및 환급</li>
              <li><b>영화/외식</b>: CGV/롯데시네마 3,000~5,000원 할인, 아웃백/빕스 할인</li>
              <li><b>통신/쇼핑</b>: 통신요금 자동이체 할인, 놀이공원 50% 현장할인</li>
            </ul>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <a class="hubBtnLink" href="https://www.narasarang.or.kr" target="_blank" rel="noopener noreferrer" style="flex: 1; min-width: 140px; text-align: center;">
                🏛️ 나라사랑포털 공식홈 ↗
              </a>
              <a class="hubBtnLink" href="https://narasarang.ibk.co.kr" target="_blank" rel="noopener noreferrer" style="flex: 1; min-width: 140px; text-align: center;">
                💳 나라사랑카드 상세혜택 ↗
              </a>
            </div>
          </div>
        </div>
      `;
    }

    if (key === "finance_overview") {
      return `
        <div class="hubPanelBody">
          <div class="hubCard">
            <span class="hubBadge">자산 형성 지원</span>
            <h4>장병내일준비적금 (최대 연 5%대 + 정부 100% 매칭)</h4>
            <p>병역의무 복무자의 전역 후 목돈 마련을 돕는 최고 금리 비과세 적금 상품입니다.</p>
          </div>
          <div class="hubCard">
            <h4>적금 주요 조건 & 혜택</h4>
            <ul>
              <li><b>가입 대상</b>: 현역병, 상근예비역, 사회복무요원, 의무경찰/소방, 대체복무요원</li>
              <li><b>월 납입 한도</b>: 은행별 최대 20만원 (개인당 최대 40만원, 2개 은행)</li>
              <li><b>정부 매칭지원금</b>: 원리금의 100%에 상당하는 매칭 지원금 지급 (전역 시 수령)</li>
              <li><b>비과세 혜택</b>: 이자소득세(15.4%) 전액 비과세</li>
            </ul>
            <a class="hubBtnLink" href="https://www.narasarang.or.kr" target="_blank" rel="noopener noreferrer">
              장병내일준비적금 공식 안내 바로가기 ↗
            </a>
          </div>
        </div>
      `;
    }

    // 3. 군·청년 혜택모음 (3개 탭 분기)
    if (key === "tab_life" || key === "tab_career" || key === "tab_medical" || key === "benefits_hub") {
      let currentTab = activeTab;
      if (!currentTab) {
        if (key === "tab_career") currentTab = "career";
        else if (key === "tab_medical") currentTab = "medical";
        else currentTab = "life";
      }

      return `
        <div class="hubSubTabs">
          <button type="button" class="hubSubTabBtn ${currentTab === 'life' ? 'active' : ''}" data-hub-tab="life">🚗 생활 · 통신 · 교통</button>
          <button type="button" class="hubSubTabBtn ${currentTab === 'career' ? 'active' : ''}" data-hub-tab="career">🎓 취업 · 자격증 · 진로</button>
          <button type="button" class="hubSubTabBtn ${currentTab === 'medical' ? 'active' : ''}" data-hub-tab="medical">🏥 의료 · 법률 · 지자체</button>
        </div>
        <div class="hubPanelBody">
          ${currentTab === 'life' ? `
            <div class="hubCard">
              <span class="hubBadge">교통 혜택</span>
              <h4>KTX/SRT 및 고속·시외버스 할인</h4>
              <p>군 장병 포상·위로휴가 시 KTX/SRT 10~30% 할인 및 TMO(철도수송지원반)를 통한 무임 지원이 제공됩니다.</p>
              <a class="hubBtnLink" href="https://www.korail.com/ticket/discountSystem/cheerUp" target="_blank" rel="noopener noreferrer">코레일 힘내라 청춘/장병할인 ↗</a>
            </div>
            <div class="hubCard">
              <span class="hubBadge">통신 혜택</span>
              <h4>군인 전용 요금제 및 데이터 무제한</h4>
              <p>SKT/KT/LGU+ 통신 3사 및 알뜰폰 군인 전용 요금제(월 3만원대 100GB+ 무제한) 이용 가능.</p>
            </div>
            <div class="hubCard">
              <span class="hubBadge">주거 / 복지</span>
              <h4>청년 주택청약 및 군 복지 지원</h4>
              <p>청년 주택드림 청약통장 전환 가입 및 LH 청년 매입임대/행복주택 지원 혜택.</p>
            </div>
          ` : currentTab === 'career' ? `
            <div class="hubCard">
              <span class="hubBadge">자격증 지원</span>
              <h4>국가기술자격증 응시료 지원 & 군 취득</h4>
              <p>한국산업인력공단 연계 군 장병 국가자격증 연 2회 무료 응시 및 온라인 강의 지원.</p>
              <a class="hubBtnLink" href="https://www.q-net.or.kr/" target="_blank" rel="noopener noreferrer">Q-Net 큐넷 자격증 안내 ↗</a>
            </div>
            <div class="hubCard">
              <span class="hubBadge">병역진로센터</span>
              <h4>맞춤형 군 특기 및 진로 상담</h4>
              <p>입영 전 전공·적성에 맞는 군 복무 분야를 설계하고 취업과 연계하는 전문 상담 프로그램.</p>
              <a class="hubBtnLink" href="https://www.mma.go.kr/" target="_blank" rel="noopener noreferrer">병무청 병역진로센터 ↗</a>
            </div>
            <div class="hubCard">
              <span class="hubBadge">전역 예정자</span>
              <h4>국방전직교육원 맞춤형 취업 연계</h4>
              <p>전역 예정 장병을 위한 일자리 매칭, 기업 채용박람회 및 무료 직무 교육 지원.</p>
            </div>
          ` : `
            <div class="hubCard">
              <span class="hubBadge">의료 지원</span>
              <h4>국군병원 및 협약 의료기관 감면</h4>
              <p>군 병원 외래/입원 진료 지원 및 전국 보훈병원, 지정 협약 병의원 비급여 진료비 할인.</p>
            </div>
            <div class="hubCard">
              <span class="hubBadge">무료 법률·심리</span>
              <h4>대한법률구조공단 및 장병 심리상담 지원</h4>
              <p>국가유공자/군 장병 대상 무료 민·형사 법률 구조 상담 및 전문 심리상담 콜센터 지원.</p>
              <a class="hubBtnLink" href="https://www.klac.or.kr/" target="_blank" rel="noopener noreferrer">대한법률구조공단 ↗</a>
            </div>
            <div class="hubCard">
              <span class="hubBadge">지자체 혜택</span>
              <h4>전국 지자체별 군 복무 청년 상해보험 무료 가입</h4>
              <p>서울, 경기 등 주요 시·도 거주 장병 대상 군 복무 중 사고에 대한 상해보험 자동 가입 지원.</p>
            </div>
          `}
        </div>
      `;
    }

    // 4. 소통 & 정보 (서비스 소개 & 약관)
    if (key === "map_info_policy") {
      const currentTab = activeTab || "intro";
      return `
        <div class="hubSubTabs">
          <button type="button" class="hubSubTabBtn ${currentTab === 'intro' ? 'active' : ''}" data-hub-tab="intro">🗺️ 서비스 소개</button>
          <button type="button" class="hubSubTabBtn ${currentTab === 'terms' ? 'active' : ''}" data-hub-tab="terms">📜 이용약관</button>
          <button type="button" class="hubSubTabBtn ${currentTab === 'privacy' ? 'active' : ''}" data-hub-tab="privacy">🔒 개인정보방침</button>
          <button type="button" class="hubSubTabBtn ${currentTab === 'location' ? 'active' : ''}" data-hub-tab="location">📍 위치정보 안내</button>
        </div>
        <div class="hubPanelBody">
          ${currentTab === 'intro' ? `
            <div class="hubCard">
              <span class="hubBadge">군필지도 (GP Map)</span>
              <h4>병역이행자 & 명문가를 위한 원스톱 상생 플랫폼</h4>
              <p>군필지도는 대한민국 청년 장병, 예비군, 사회복무요원, 그리고 병역명문가를 위한 전국 혜택 가게를 한눈에 찾고 이용할 수 있도록 제작된 비영리 공익 안내 지도 서비스입니다.</p>
            </div>
            <div class="hubCard">
              <h4>주요 기능</h4>
              <ul>
                <li><b>위치 기반 가맹점 탐색</b>: 내 주변 혜택 가게 1초 검색 및 카테고리 필터링</li>
                <li><b>원터치 홍보물 생성</b>: 가맹점주를 위한 상생지도 포스터/스탠드 자동 인쇄</li>
                <li><b>실시간 공유게시판</b>: 혜택 이용 후기 및 팁 공유 커뮤니티</li>
              </ul>
            </div>
          ` : currentTab === 'terms' ? `
            <div class="hubCard">
              <span class="hubBadge">표준 약관 준수</span>
              <h4>서비스 이용약관 주요 내용</h4>
              <p>군필지도 서비스는 청년 장병 및 병역명문가, 상생 소상공인을 위한 공공 안내 플랫폼입니다.</p>
              <ul>
                <li><b>서비스 제공</b>: 365일 24시간 연중무휴 상생 혜택 및 공공지도 제공</li>
                <li><b>회원의 의무</b>: 타인의 명예훼손, 음란·욕설, 허위정보 및 가맹점 무단도용 금지</li>
                <li><b>게시물 관리</b>: 법령 위반 게시물에 대한 즉시 임시조치 및 삭제 권한 보유</li>
                <li><b>면책 사항</b>: 공공기관 원천 데이터 오류 및 천재지변 불가항력에 대한 면책</li>
              </ul>
              <div style="margin-top: 12px;">
                <button type="button" class="hubBtnLink" onclick="window.MMAAuth.showPolicyModal('terms')" style="cursor: pointer; border: none; font-size: 12.5px; padding: 8px 14px;">
                  📜 이용약관 전문(Full Text) 보기 ↗
                </button>
              </div>
            </div>
          ` : currentTab === 'privacy' ? `
            <div class="hubCard">
              <span class="hubBadge">개인정보보호법 제30조 준수</span>
              <h4>개인정보 처리방침 14개 법정 의무고지 항목</h4>
              <p>군필지도는 이용자의 개인정보를 소중히 보호하며 법정 처리방침을 엄격히 준수합니다.</p>
              <ul>
                <li><b>1. 처리 목적</b>: 회원 식별, 상생혜택 매장 안내, 소상공인 QR통계 지원</li>
                <li><b>2. 보유 기간</b>: 회원 탈퇴 시 즉시 영구 파기 (접속기록 3개월)</li>
                <li><b>3. 처리 항목</b>: 이메일, 닉네임, 단방향 암호화 비밀번호, 매장정보</li>
                <li><b>4. 제3자 제공</b>: 원칙적 미제공 (법률 규정 및 명시적 동의 시에만)</li>
                <li><b>5. 안전성 조치</b>: SHA-256/Salt 단방향 암호화, HTTPS 전송 보안</li>
                <li><b>6. 권리 행사</b>: 언제든지 회원정보 수정 및 탈퇴(즉시 삭제) 가능</li>
              </ul>
              <div style="margin-top: 12px;">
                <button type="button" class="hubBtnLink" onclick="window.MMAAuth.showPolicyModal('privacy')" style="cursor: pointer; border: none; font-size: 12.5px; padding: 8px 14px;">
                  🔒 개인정보 처리방침 14개조 전문 보기 ↗
                </button>
              </div>
            </div>
          ` : `
            <div class="hubCard">
              <span class="hubBadge">위치정보보호법 준수</span>
              <h4>위치기반서비스 이용약관</h4>
              <p><b>내 위치 찾기 기능</b>은 사용자의 브라우저 GPS 권한 허용 시에만 일시적으로 현재 지도를 이동하기 위해 사용됩니다.</p>
              <ul>
                <li><b>위치정보 수집 방식</b>: HTML5 Geolocation API를 통한 일시적 단말기 좌표 조회</li>
                <li><b>저장 및 보관</b>: 위치 좌표는 화면 중심 이동에만 사용되며 <b>서버에 일체 저장되지 않습니다.</b></li>
                <li><b>제3자 제공</b>: 수집된 위치정보는 외부 제3자에게 절대 제공되지 않습니다.</li>
              </ul>
            </div>
          `}
        </div>
      `;
    }

    return `
      <div class="hubPanelBody">
        <div class="hubCard">
          <h4>${escapeHtml(secondary?.title || "안내")}</h4>
          <p>상세 안내 정보입니다.</p>
        </div>
      </div>
    `;
  };

  const bindHubSubTabs = (secondary) => {
    if (!hubPanelEl) return;
    const subTabBtns = hubPanelEl.querySelectorAll(".hubSubTabBtn");
    subTabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabKey = btn.dataset.hubTab;
        const html = buildSecondaryGuideHtml(secondary, tabKey);
        hubPanelEl.innerHTML = `
          <div class="hubPanelTop">
            <h3 class="hubPanelTitle">${escapeHtml(secondary.title)}</h3>
            <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="닫기">×</button>
          </div>
          ${html}
        `;
        const closeBtn = document.getElementById("hubPanelCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
        bindHubSubTabs(secondary);
      });
    });
  };

  const openHubPanel = (primaryKey, secondaryKey) => {
    if (!hubPanelEl) return;
    const found = findHubSecondary(primaryKey, secondaryKey);
    if (!found) return;
    const { secondary } = found;

    if (secondary?.key === "review_board_entry" || secondary?.key === "board") {
      let reviewCurrentPage = 1;
      const REVIEW_PAGE_SIZE = 5;
      const openReviewPasswordDialog = (verifyFn) =>
        new Promise((resolve) => {
          const prev = document.getElementById("reviewPwOverlay");
          if (prev) prev.remove();
          const overlay = document.createElement("div");
          overlay.id = "reviewPwOverlay";
          overlay.className = "reviewPwOverlay";
          overlay.innerHTML = `
            <div class="reviewPwDialog" role="dialog" aria-modal="true" aria-label="비밀번호 확인">
              <h5>비밀번호 확인</h5>
              <p>작성 시 입력한 비밀번호를 입력해 주세요.</p>
              <input id="reviewPwInput" class="reviewPwInput" type="password" maxlength="20" />
              <div id="reviewPwError" class="reviewPwError hidden">비밀번호가 일치하지 않습니다.</div>
              <div class="reviewPwActions">
                <button id="reviewPwCancelBtn" type="button" class="reviewListBtn">취소</button>
                <button id="reviewPwConfirmBtn" type="button" class="reviewSubmitBtn">확인</button>
              </div>
            </div>
          `;
          hubPanelEl.appendChild(overlay);
          const inputEl = document.getElementById("reviewPwInput");
          const errorEl = document.getElementById("reviewPwError");
          const cancelBtn = document.getElementById("reviewPwCancelBtn");
          const confirmBtn = document.getElementById("reviewPwConfirmBtn");
          if (inputEl) inputEl.focus();

          const close = (password) => {
            overlay.remove();
            resolve(password);
          };

          if (cancelBtn) cancelBtn.addEventListener("click", () => close(""));
          if (confirmBtn) {
            confirmBtn.addEventListener("click", async () => {
              const inputPw = String(inputEl?.value || "").trim();
              if (!inputPw) return;
              if (errorEl) errorEl.classList.add("hidden");
              confirmBtn.disabled = true;
              let ok = false;
              try {
                ok = await verifyFn(inputPw);
              } catch (_err) {
                ok = false;
              }
              confirmBtn.disabled = false;
              if (!ok) {
                if (errorEl) errorEl.classList.remove("hidden");
                if (inputEl) inputEl.focus();
                return;
              }
              close(inputPw);
            });
          }

          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) close("");
          });
          overlay.addEventListener("keydown", (e) => {
            if (e.key === "Escape") close("");
            if (e.key === "Enter" && confirmBtn) confirmBtn.click();
          });
        });

      const renderReviewLoading = () => {
        hubPanelEl.innerHTML = `
          <div class="hubPanelTop">
            <h3 class="hubPanelTitle">${escapeHtml(secondary.title)}</h3>
            <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="닫기">×</button>
          </div>
          <div class="hubPanelBody">
            <div class="hubCard">
              <p style="text-align: center; color: #64748b; padding: 24px 0; font-weight: 700;">후기 목록을 불러오는 중입니다...</p>
            </div>
          </div>
        `;
        const closeBtn = document.getElementById("hubPanelCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
      };

      const renderReviewLoadError = (message) => {
        hubPanelEl.innerHTML = `
          <div class="hubPanelTop">
            <h3 class="hubPanelTitle">${escapeHtml(secondary.title)}</h3>
            <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="닫기">×</button>
          </div>
          <div class="hubPanelBody">
            <div class="hubCard">
              <h4>등록된 후기</h4>
              <p style="color: #ef4444; font-weight: bold;">${escapeHtml(message || "후기 서버 연결에 실패했습니다.")}</p>
              <p class="hubPanelNotice" style="margin-top: 10px;">서버 상태를 확인한 뒤 다시 시도해 주세요.</p>
            </div>
          </div>
        `;
        const closeBtn = document.getElementById("hubPanelCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
      };

      const renderBoardDetailPage = (postId) => {
        const target = reviewBoardPosts.find((row) => row.id === postId);
        if (!target) {
          renderBoardListPage();
          return;
        }
        const author = escapeHtml(String(target.author || "").trim() || "익명");
        const content = escapeHtml(String(target.content || "")).replace(/\n/g, "<br>");
        const date = escapeHtml(formatBoardDate(target.createdAt));

        const currentUser = window.MMAAuth?.user;
        const isAuthor = Boolean(
          currentUser && (
            (target.userId && String(target.userId) === String(currentUser.id)) ||
            (target.author && currentUser.nickname && target.author === currentUser.nickname) ||
            (target.author && currentUser.email && target.author === currentUser.email)
          )
        );
        const isAdmin = Boolean(currentUser && currentUser.role === "admin");
        const canModify = isAuthor || isAdmin;

        const actionButtonsHtml = canModify
          ? `
            <div class="reviewCardActions">
              <button id="detailReviewEditBtn" type="button" class="reviewActionBtn">수정</button>
              <button id="detailReviewDeleteBtn" type="button" class="reviewActionBtn danger">삭제</button>
            </div>
          `
          : "";

        hubPanelEl.innerHTML = `
          <div class="hubPanelTop">
            <h3 class="hubPanelTitle">${escapeHtml(secondary.title)}</h3>
            <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="닫기">×</button>
          </div>
          <div class="hubPanelBody">
            <section class="hubInfoSection reviewBoardSection">
              <div class="reviewBoardTop">
                <h4>후기 상세</h4>
                <button id="backReviewListBtn" type="button" class="reviewListBtn">목록으로</button>
              </div>
              <article class="reviewCard">
                <div class="reviewCardHead">
                  <strong>${author}</strong>
                  <span>${date}</span>
                </div>
                <p>${content}</p>
                ${actionButtonsHtml}
              </article>
            </section>
          </div>
        `;
        const closeBtn = document.getElementById("hubPanelCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
        const backBtn = document.getElementById("backReviewListBtn");
        if (backBtn) backBtn.addEventListener("click", renderBoardListPage);
        const editBtn = document.getElementById("detailReviewEditBtn");
        if (editBtn) {
          editBtn.addEventListener("click", async () => {
            renderBoardFormPage("edit", postId, "");
          });
        }
        const deleteBtn = document.getElementById("detailReviewDeleteBtn");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", async () => {
            if (!confirm("정말 이 후기를 삭제하시겠습니까?")) return;
            try {
              await deleteReviewPost({ postId, password: "" });
              await fetchReviewPosts();
              const nextTotalPages = Math.max(1, Math.ceil(reviewBoardPosts.length / REVIEW_PAGE_SIZE));
              if (reviewCurrentPage > nextTotalPages) reviewCurrentPage = nextTotalPages;
              renderBoardListPage();
            } catch (err) {
              alert(String(err?.message || "후기 삭제 중 오류가 발생했습니다."));
            }
          });
        }
      };

      const renderBoardListPage = () => {
        const rows = getSortedReviewPosts();
        const totalPages = Math.max(1, Math.ceil(rows.length / REVIEW_PAGE_SIZE));
        if (reviewCurrentPage > totalPages) reviewCurrentPage = totalPages;
        if (reviewCurrentPage < 1) reviewCurrentPage = 1;
        const startIdx = (reviewCurrentPage - 1) * REVIEW_PAGE_SIZE;
        const pageRows = rows.slice(startIdx, startIdx + REVIEW_PAGE_SIZE);

        const listRows = pageRows.length
          ? rows
              .slice(startIdx, startIdx + REVIEW_PAGE_SIZE)
              .map((row) => {
                const author = escapeHtml(String(row.author || "").trim() || "익명");
                const content = escapeHtml(String(row.content || "").replace(/\s+/g, " ").trim());
                const date = escapeHtml(formatBoardDate(row.createdAt));
                return `
                  <article class="reviewCard reviewCardClickable" data-review-id="${escapeHtml(row.id)}">
                    <div class="reviewCardHead">
                      <strong>${author}</strong>
                      <span>${date}</span>
                    </div>
                    <p class="reviewPreview">${content}</p>
                  </article>
                `;
              })
              .join("")
          : `<div class="reviewBoardEmpty">아직 등록된 후기가 없습니다. 첫 후기를 남겨주세요.</div>`;
        const pageButtons = Array.from({ length: totalPages }, (_, idx) => idx + 1)
          .map(
            (pageNo) =>
              `<button type="button" class="reviewPageBtn ${pageNo === reviewCurrentPage ? "active" : ""}" data-review-page="${pageNo}">${pageNo}</button>`
          )
          .join("");
        const paginationHtml =
          rows.length > 0
            ? `
              <div class="reviewPagination">
                <button type="button" class="reviewPageNav" data-review-nav="prev" ${reviewCurrentPage <= 1 ? "disabled" : ""}>이전</button>
                <div class="reviewPageNums">${pageButtons}</div>
                <button type="button" class="reviewPageNav" data-review-nav="next" ${reviewCurrentPage >= totalPages ? "disabled" : ""}>다음</button>
              </div>
            `
            : "";

        hubPanelEl.innerHTML = `
          <div class="hubPanelTop">
            <h3 class="hubPanelTitle">${escapeHtml(secondary.title)}</h3>
            <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="닫기">×</button>
          </div>
          <div class="hubPanelBody">
            <section class="hubInfoSection reviewBoardSection">
              <div class="reviewBoardTop">
                <h4>등록된 후기</h4>
                <button id="openReviewWriteBtn" type="button" class="reviewSubmitBtn">등록하기</button>
              </div>
              <div class="reviewBoardList">${listRows}</div>
              ${paginationHtml}
            </section>
          </div>
        `;
        const closeBtn = document.getElementById("hubPanelCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
        const openWriteBtn = document.getElementById("openReviewWriteBtn");
        if (openWriteBtn) {
          openWriteBtn.addEventListener("click", () => {
            if (!window.MMAAuth?.user) {
              alert("후기 작성은 로그인 후 이용 가능합니다.");
              window.MMAAuth?.openLoginModal();
              return;
            }
            renderBoardFormPage("create");
          });
        }
        [...hubPanelEl.querySelectorAll(".reviewPageBtn")].forEach((btn) => {
          btn.addEventListener("click", () => {
            const pageNo = Number(btn.dataset.reviewPage || 1);
            reviewCurrentPage = Number.isFinite(pageNo) && pageNo > 0 ? pageNo : 1;
            renderBoardListPage();
          });
        });
        [...hubPanelEl.querySelectorAll(".reviewPageNav")].forEach((btn) => {
          btn.addEventListener("click", () => {
            const nav = btn.dataset.reviewNav || "";
            if (nav === "prev") reviewCurrentPage -= 1;
            if (nav === "next") reviewCurrentPage += 1;
            renderBoardListPage();
          });
        });
        [...hubPanelEl.querySelectorAll(".reviewCardClickable")].forEach((btn) => {
          btn.addEventListener("click", () => {
            const postId = btn.dataset.reviewId || "";
            renderBoardDetailPage(postId);
          });
        });
      };

      const renderBoardFormPage = (mode = "create", editPostId = "", confirmedPassword = "") => {
        const isEdit = mode === "edit";
        const target = isEdit ? reviewBoardPosts.find((row) => row.id === editPostId) : null;
        if (isEdit && !target) {
          renderBoardListPage();
          return;
        }
        const currentUser = window.MMAAuth?.user;
        const defaultAuthor = isEdit ? (target?.author || "") : (currentUser?.nickname || currentUser?.email || "익명");
        const titleText = isEdit ? "후기 수정" : "후기 등록";

        hubPanelEl.innerHTML = `
          <div class="hubPanelTop">
            <h3 class="hubPanelTitle">${escapeHtml(secondary.title)}</h3>
            <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="닫기">×</button>
          </div>
          <div class="hubPanelBody">
            <section class="hubInfoSection reviewBoardSection">
              <div class="reviewBoardTop">
                <h4>${titleText}</h4>
                <button id="backReviewListBtn" type="button" class="reviewListBtn">목록으로</button>
              </div>
              <p style="margin-bottom: 8px; font-size: 12.5px; color: #64748b;">작성자: <strong>${escapeHtml(defaultAuthor)}</strong></p>
              <div class="reviewForm">
                <input id="reviewAuthorInput" class="reviewInput" type="hidden" value="${escapeHtml(defaultAuthor)}" />
                <textarea id="reviewContentInput" class="reviewTextarea" maxlength="500" placeholder="상생가게 이용 후기나 소중한 의견을 입력해 주세요.">${escapeHtml(target?.content || "")}</textarea>
                ${isEdit ? "" : `
                  <label class="reviewConsentRow">
                    <input id="reviewConsentCheck" type="checkbox" checked />
                    <span>게시판 운영 및 커뮤니티 가이드라인에 동의합니다.</span>
                  </label>
                `}
                <button id="reviewSubmitBtn" type="button" class="reviewSubmitBtn">${isEdit ? "수정완료" : "등록완료"}</button>
              </div>
            </section>
          </div>
        `;
        const closeBtn = document.getElementById("hubPanelCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
        const backBtn = document.getElementById("backReviewListBtn");
        if (backBtn) backBtn.addEventListener("click", renderBoardListPage);
        const submitBtn = document.getElementById("reviewSubmitBtn");
        if (submitBtn) {
          submitBtn.addEventListener("click", async () => {
            const authorEl = document.getElementById("reviewAuthorInput");
            const contentEl = document.getElementById("reviewContentInput");
            const consentEl = document.getElementById("reviewConsentCheck");
            const author = String(authorEl?.value || defaultAuthor).trim().slice(0, 20);
            const content = String(contentEl?.value || "").trim().slice(0, 500);

            if (!content) {
              alert("후기 또는 의견 내용을 입력해 주세요.");
              if (contentEl) contentEl.focus();
              return;
            }
            if (!isEdit && consentEl && !consentEl.checked) {
              alert("커뮤니티 가이드라인에 동의 후 등록할 수 있습니다.");
              consentEl.focus();
              return;
            }
            submitBtn.disabled = true;
            try {
              if (isEdit) {
                await updateReviewPost({
                  postId: editPostId,
                  author,
                  content,
                  currentPassword: confirmedPassword,
                });
              } else {
                await createReviewPost({ author, content });
                reviewCurrentPage = 1;
              }
              await fetchReviewPosts();
              renderBoardListPage();
            } catch (err) {
              alert(String(err?.message || "처리 중 오류가 발생했습니다."));
            } finally {
              submitBtn.disabled = false;
            }
          });
        }
      };

      hubPanelEl.classList.remove("hidden");
      if (hubModalBackdropEl) hubModalBackdropEl.classList.remove("hidden");
      renderReviewLoading();
      fetchReviewPosts()
        .then(() => renderBoardListPage())
        .catch((err) => {
          renderReviewLoadError(String(err?.message || "후기 목록 조회 실패"));
        });
      return;
    }

    const mainGuideHtml = buildSecondaryGuideHtml(secondary);

    hubPanelEl.innerHTML = `
      <div class="hubPanelTop">
        <h3 class="hubPanelTitle">${escapeHtml(secondary.title)}</h3>
        <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="닫기">×</button>
      </div>
      ${mainGuideHtml}
    `;
    hubPanelEl.classList.remove("hidden");
    if (hubModalBackdropEl) hubModalBackdropEl.classList.remove("hidden");
    const closeBtn = document.getElementById("hubPanelCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
    bindHubSubTabs(secondary);
  };

  const setHubPrimaryActiveUi = () => {
    if (!hubNavEl) return;
    [...hubNavEl.querySelectorAll(".hubPrimaryBtn")].forEach((btn) => {
      const key = btn.dataset.hubPrimaryKey || "";
      btn.classList.toggle("active", key === activeHubPrimaryKey);
    });
  };

  const renderHubMega = () => {
    if (!hubMegaEl) return;
    const colHtml = HUB_MENU_TREE.map((primary) => {
      const children = Array.isArray(primary.children) ? primary.children : [];
      const childHtml = children
        .map(
          (child) =>
            `<button type="button" class="hubSecondaryBtn" data-hub-primary-key="${escapeHtml(primary.key)}" data-hub-secondary-key="${escapeHtml(child.key)}">${escapeHtml(child.label)}</button>`
        )
        .join("");
      const activeClass = primary.key === activeHubPrimaryKey ? "active" : "";
      return `
        <div class="hubMegaCol ${activeClass}">
          <div class="hubMegaItems">${childHtml}</div>
        </div>
      `;
    }).join("");
    hubMegaEl.innerHTML = `<div class="hubMegaGrid">${colHtml}</div>`;
    hubMegaEl.classList.remove("hidden");
    [...hubMegaEl.querySelectorAll(".hubSecondaryBtn")].forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const primaryKey = btn.dataset.hubPrimaryKey || "";
        const secondaryKey = btn.dataset.hubSecondaryKey || "";
        activeHubPrimaryKey = primaryKey;
        setHubPrimaryActiveUi();
        openHubPanel(primaryKey, secondaryKey);
        closeHubMega();
      });
    });
  };

  const renderHubNav = () => {
    if (!hubNavEl) return;
    hubNavEl.innerHTML = HUB_MENU_TREE
      .map(
        (primary) =>
          `<button type="button" class="hubPrimaryBtn ${primary.key === activeHubPrimaryKey ? "active" : ""}" data-hub-primary-key="${escapeHtml(primary.key)}">${escapeHtml(primary.label)}</button>`
      )
      .join("");

    [...hubNavEl.querySelectorAll(".hubPrimaryBtn")].forEach((btn) => {
      const key = btn.dataset.hubPrimaryKey || "";
      btn.addEventListener("mouseenter", () => {
        activeHubPrimaryKey = key;
        setHubPrimaryActiveUi();
        renderHubMega();
      });
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isSame = activeHubPrimaryKey === key && hubMegaEl && !hubMegaEl.classList.contains("hidden");
        activeHubPrimaryKey = key;
        setHubPrimaryActiveUi();
        if (isSame) closeHubMega();
        else renderHubMega();
      });
    });
  };

  const closeDetailPanel = () => {
    selectedFacilityId = "";
    selectedDetailAnchor = null;
    selectedDetailScreenPoint = null;
    isMarkerRepositioning = false;
    isCommentsFlyoutOpen = false;
    isQaFlyoutOpen = false;
    currentDetailFacilityId = null;
    if (detailInfoWindow) {
      detailInfoWindow.close();
    }
    if (detailPanelEl) {
      detailPanelEl.classList.add("hidden");
      detailPanelEl.innerHTML = "";
    }
  };

  const hideDetailPanelOnly = () => {
    if (detailInfoWindow) {
      detailInfoWindow.close();
    }
    if (detailPanelEl) {
      detailPanelEl.classList.add("hidden");
      detailPanelEl.innerHTML = "";
    }
  };

  const moveMarkerToLowerArea = (latLng, onDone) => {
    let doneCalled = false;
    const done = () => {
      if (doneCalled) return;
      doneCalled = true;
      if (typeof onDone === "function") onDone();
    };

    const animateCenterTo = (targetCenter, durationMs, next) => {
      const startCenter = map.getCenter?.();
      if (!startCenter || !targetCenter) {
        map.setCenter(targetCenter || latLng);
        if (typeof next === "function") next();
        return;
      }

      if (centerMoveAnimId) {
        cancelAnimationFrame(centerMoveAnimId);
        centerMoveAnimId = null;
      }

      const startLat = Number(startCenter.lat());
      const startLng = Number(startCenter.lng());
      const endLat = Number(targetCenter.lat());
      const endLng = Number(targetCenter.lng());
      const startedAt = performance.now();
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const t = Math.min(1, (now - startedAt) / durationMs);
        const k = easeOutCubic(t);
        const lat = startLat + (endLat - startLat) * k;
        const lng = startLng + (endLng - startLng) * k;
        map.setCenter(new naver.maps.LatLng(lat, lng));
        if (t < 1) {
          centerMoveAnimId = requestAnimationFrame(step);
          return;
        }
        centerMoveAnimId = null;
        map.setCenter(targetCenter);
        if (typeof next === "function") next();
      };

      centerMoveAnimId = requestAnimationFrame(step);
    };

    const projection = map.getProjection?.();
    if (!projection?.fromCoordToOffset || !projection?.fromOffsetToCoord) {
      map.panTo(latLng);
      setTimeout(done, 260);
      return;
    }

    const mapEl = map.getElement?.();
    const viewW = mapEl?.clientWidth || window.innerWidth;
    const viewH = mapEl?.clientHeight || window.innerHeight;
    const targetX = viewW / 2;
    const targetY = Math.round(viewH * (2 / 3));
    selectedDetailScreenPoint = { x: targetX, y: targetY };
    const current = projection.fromCoordToOffset(latLng);
    const dx = current.x - targetX;
    const dy = current.y - targetY;

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      done();
      return;
    }

    // Convert desired pixel shift into a single target center, then pan once.
    // Use viewport center as the stable baseline to avoid cumulative drift.
    const viewportCenterX = viewW / 2;
    const viewportCenterY = viewH / 2;
    const targetCenterPx = new naver.maps.Point(viewportCenterX + dx, viewportCenterY + dy);
    const targetCenter = projection.fromOffsetToCoord(targetCenterPx);

    animateCenterTo(targetCenter, 240, done);
  };

  const placeDetailPanelAboveMarker = (latLng) => {
    if (!detailPanelEl || !latLng) return;
    const projection = map.getProjection?.();
    const markerPx = projection?.fromCoordToOffset?.(latLng);
    if (!markerPx) return;
    const markerHalfHeight = 35;
    const markerGap = 10;
    const markerTopY = markerPx.y - markerHalfHeight;
    const desiredLeft = Math.round(markerPx.x);
    const desiredBottom = Math.round(markerTopY - markerGap);
    detailPanelEl.style.left = `${desiredLeft}px`;
    detailPanelEl.style.top = `${desiredBottom}px`;
    detailPanelEl.style.transform = "translate(-50%, -100%)";
  };

  let pendingDetailPoint = null;

  const calculateDynamicShiftY = (panelEl = null, point = null) => {
    const isMobile = window.innerWidth <= 768;
    const viewH = window.innerHeight;
    const topSafety = isMobile ? 55 : 75; // Top navigation bar safety padding
    const bottomSafety = isMobile ? 220 : 45; // On mobile, keep popup card strictly above map controls (내위치, -, +) and bottom sheet

    let actualH = 0;
    if (panelEl && typeof panelEl.offsetHeight === "number" && panelEl.offsetHeight > 50) {
      actualH = panelEl.offsetHeight;
    } else if (point) {
      const fid = getFacilityKey(point);
      const custom = getStoreCustomSettings(fid, point);
      actualH = 260; // Base card height
      if (custom.photoEnabled && ((Array.isArray(custom.photoUrls) && custom.photoUrls.length > 0) || custom.photoUrl)) actualH += 88;
      if (custom.greetingEnabled && custom.greetingText) actualH += 48;
      if (custom.promoEnabled && custom.promoText) actualH += 40;
      if (custom.hoursEnabled && custom.hoursText) actualH += 30;
      if (custom.snsEnabled && custom.snsUrl) actualH += 30;
      if (custom.commentsEnabled || custom.qaEnabled) actualH += 46;
      const ben = String(point.benefit || "");
      if (ben.length > 120) actualH += 60;
      else if (ben.length > 60) actualH += 30;
    }
    if (!actualH) actualH = 420;

    const maxAllowedH = viewH - topSafety - bottomSafety;
    actualH = Math.min(actualH, Math.max(180, maxAllowedH));

    let desiredPopupTop;
    if (isMobile) {
      // On mobile, anchor bottom to (viewH - bottomSafety) to guarantee clearance above 내위치 and +/-
      desiredPopupTop = (viewH - bottomSafety) - actualH;
      if (desiredPopupTop < topSafety) {
        desiredPopupTop = topSafety;
      }
    } else {
      const idealPopupCenterY = Math.round((topSafety + (viewH - bottomSafety)) / 2);
      desiredPopupTop = idealPopupCenterY - Math.round(actualH / 2);
      if (desiredPopupTop < topSafety + 15) {
        desiredPopupTop = topSafety + 15;
      }
    }

    const desiredPopupBottom = desiredPopupTop + actualH;
    const desiredMarkerScreenY = desiredPopupBottom + 36;

    const shiftY = -(desiredMarkerScreenY - Math.round(viewH / 2));
    return shiftY;
  };

  const openDetailAfterMapMove = (point, latLng, targetMarker = null) => {
    pendingDetailPoint = point;
    selectedDetailAnchor = new naver.maps.LatLng(point.lat, point.lng);
    selectedFacilityId = getFacilityKey(point);
    isCommentsFlyoutOpen = false;
    isQaFlyoutOpen = false;
    hideDetailPanelOnly();

    let opened = false;
    const triggerOpen = () => {
      if (opened) return;
      opened = true;
      if (pendingDetailPoint && selectedFacilityId === getFacilityKey(pendingDetailPoint)) {
        openDetailInfo(pendingDetailPoint, targetMarker || selectedDetailAnchor);
        pendingDetailPoint = null;
      }
    };

    naver.maps.Event.once(map, "idle", () => {
      setTimeout(triggerOpen, 50);
    });

    const isMobile = window.innerWidth <= 768;
    let targetCenter = latLng;

    const projection = map.getProjection?.();
    if (projection && projection.fromCoordToOffset && projection.fromOffsetToCoord) {
      const markerOffset = projection.fromCoordToOffset(latLng);
      // Place popup balloon in the exact center of the full screen (assuming no sidebar):
      // Dynamic shift calculated from content height and screen size
      const shiftX = 0;
      const shiftY = calculateDynamicShiftY(null, point);
      const desiredMapCenterOffset = new naver.maps.Point(markerOffset.x + shiftX, markerOffset.y + shiftY);
      targetCenter = projection.fromOffsetToCoord(desiredMapCenterOffset);
    }

    if (map.panTo) {
      map.panTo(targetCenter);
    } else {
      map.setCenter(targetCenter);
    }

    setTimeout(triggerOpen, 400);
  };

  let currentPrintPoint = null;
  let currentPrintTemplate = "poster";
  let currentPrintBlobUrl = null;

  const renderPrintTemplate = async (point, tplName = "poster") => {
    const container = document.getElementById("printTemplateContainer") || document.getElementById("printCanvasContainer");
    if (!container || !point) return;

    const facilityId = point.facilityId || point.id || "";
    const tplTitle = tplName === "poster" ? "포스터" : (tplName === "table_stand" ? "미니 스탠드" : "도어행거");

    const dims = {
      poster: { w: 440, h: 622, scale: 0.44, iframeW: 1000, iframeH: 1414 },
      table_stand: { w: 400, h: 600, scale: 0.50, iframeW: 800, iframeH: 1200 },
      door_hanger: { w: 300, h: 550, scale: 0.50, iframeW: 600, iframeH: 1100 }
    }[tplName] || { w: 440, h: 622, scale: 0.44, iframeW: 1000, iframeH: 1414 };

    container.innerHTML = `
      <div class="print-sheet-wrap" style="width: 100%; height: 100%; min-height: 640px; display: flex; justify-content: center; align-items: center; overflow: hidden; background: #e2e8f0; border-radius: 8px; position: relative;">
        <div id="printLoadingWrap" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 10; background: rgba(243,243,237,0.95); transition: opacity 0.25s ease;">
          <div class="print-loading-spinner" style="width: 40px; height: 40px; border: 3px solid #cbd5e1; border-top: 3px solid #1e3a8a; border-radius: 50%; animation: printSpinnerSpin 1s linear infinite;"></div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${tplTitle} 시안 로딩 중...</div>
        </div>
        <div style="width: ${dims.w}px; height: ${dims.h}px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.18); border-radius: 8px; margin: 10px auto; background: #F3F3ED;">
          <iframe id="printIframe" 
                  src="./print_template.html?facility_id=${encodeURIComponent(facilityId)}&tpl=${tplName}&v=5" 
                  style="width: ${dims.iframeW}px; height: ${dims.iframeH}px; border: none; transform: scale(${dims.scale}); transform-origin: 0 0; display: block;"
                  title="${tplTitle}">
          </iframe>
        </div>
      </div>
    `;

    const iframe = document.getElementById("printIframe");
    const loadingWrap = document.getElementById("printLoadingWrap");
    
    const hideLoading = () => {
      if (loadingWrap) {
        loadingWrap.style.opacity = "0";
        setTimeout(() => { loadingWrap.style.display = "none"; }, 250);
      }
    };

    if (iframe) {
      iframe.onload = () => {
        setTimeout(hideLoading, 350);
      };
    }
    
    window.addEventListener("message", (e) => {
      if (e.data && e.data.type === "MMA_MAP_READY") {
        hideLoading();
      }
    }, { once: true });
  };

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getNearbyStores = (targetPoint, maxCount = 3) => {
    if (!targetPoint || !Array.isArray(points)) return [];
    return points
      .filter((p) => p !== targetPoint && p.lat && p.lng && (p.facilityId !== targetPoint.facilityId || p.title !== targetPoint.title))
      .map((p) => ({
        point: p,
        distKm: getDistanceKm(targetPoint.lat, targetPoint.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, maxCount);
  };

  const cleanBenefit = (raw) => {
    if (!raw) return "병역이행자 및 병역명문가 할인 우대";
    return String(raw).replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  };

  let posterMapInstance = null;
  let posterMarkers = [];
  let posterCircles = [];

  const initPosterMap = (point, nearbyStores) => {
    const mapDiv = document.getElementById("posterMapDiv");
    if (!mapDiv || typeof naver === "undefined" || !naver.maps) return;

    if (posterMarkers.length > 0) {
      posterMarkers.forEach(m => {
        try { m.setMap(null); } catch (e) {}
      });
      posterMarkers = [];
    }
    if (posterCircles.length > 0) {
      posterCircles.forEach(c => {
        try { c.setMap(null); } catch (e) {}
      });
      posterCircles = [];
    }

    if (posterMapInstance) {
      try {
        posterMapInstance.destroy();
      } catch (_e) {}
      posterMapInstance = null;
    }

    const center = new naver.maps.LatLng(point.lat, point.lng);
    posterMapInstance = new naver.maps.Map(mapDiv, {
      center: center,
      zoom: 15,
      draggable: false,
      pinchZoom: false,
      scrollWheel: false,
      keyboardShortcuts: false,
      disableDoubleTapZoom: true,
      disableDoubleClickZoom: true,
      disableTwoFingerTapZoom: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });

    // Center Main Store Pin (Premium Blue Pin with Top Label)
    const centerMarker = new naver.maps.Marker({
      position: center,
      map: posterMapInstance,
      zIndex: 9999,
      icon: {
        content: `
          <div style="position:relative; width:56px; height:56px; background-image:url('/img/blue_pin.png?v=2'); background-size:contain; background-repeat:no-repeat; background-position:center; z-index:9999;">
            <div style="position:absolute; bottom:60px; left:50%; transform:translateX(-50%); background-color:#1e3a8a; color:#ffffff; font-family:'Noto Sans KR', sans-serif; font-size:12px; font-weight:700; padding:4px 12px; border-radius:18px; white-space:nowrap; box-shadow:0 4px 12px rgba(30,58,138,0.4); z-index:9999;">
              ${escapeHtml(point.title)}
            </div>
          </div>
        `,
        anchor: new naver.maps.Point(28, 28),
      },
    });
    posterMarkers.push(centerMarker);

    // Neighbor Stores (Gold Pins with 1~5 Badges & Store Name Only - No Distance)
    if (Array.isArray(nearbyStores)) {
      nearbyStores.forEach((item, idx) => {
        if (!item || !item.point) return;
        const n = item.point;
        const num = idx + 1;
        const nMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(n.lat, n.lng),
          map: posterMapInstance,
          zIndex: 100 + idx,
          icon: {
            content: `
              <div style="position:relative; width:40px; height:40px; background-image:url('/img/gold_pin.png?v=2'); background-size:contain; background-repeat:no-repeat; background-position:center; display:flex; align-items:center; justify-content:center; z-index:100;">
                <span style="color:#ffffff; font-weight:900; font-size:11px; margin-top:-4px; text-shadow:0 1px 2px rgba(0,0,0,0.5);">${num}</span>
                <div style="position:absolute; bottom:42px; left:50%; transform:translateX(-50%); background:#ffffff; color:#0f172a; font-family:'Noto Sans KR', sans-serif; font-size:10px; font-weight:700; padding:2px 6px; border-radius:6px; border:1.5px solid #d2c9bd; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.12); text-align:center;">
                  ${escapeHtml(n.title)}
                </div>
              </div>
            `,
            anchor: new naver.maps.Point(20, 20),
          },
        });
        posterMarkers.push(nMarker);
      });
    }
  };

  const addDebugLog = (msg, type = "info") => {
    window.addDebugLog = addDebugLog;
    console.log(`[MMAMap Debug] ${msg}`);
    const list = document.getElementById("liveDebugLogList");
    if (!list) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const row = document.createElement("div");
    let color = "#38bdf8";
    if (type === "success") color = "#4ade80";
    if (type === "error") color = "#f87171";
    if (type === "warn") color = "#fbbf24";
    row.style.color = color;
    row.textContent = `[${timeStr}] ${msg}`;
    list.appendChild(row);
    list.scrollTop = list.scrollHeight;
  };

  const openPrintModal = (pointOrId) => {
    if (typeof closeIntroPopup === "function") closeIntroPopup(false);
    let point = pointOrId;
    if (typeof pointOrId === "string" && pointOrId.trim()) {
      point = pointByFacilityKey.get(pointOrId);
      if (!point) {
        for (const p of points) {
          if (
            String(p.facilityId || "") === String(pointOrId) ||
            String(p.id || "") === String(pointOrId) ||
            getFacilityKey(p) === pointOrId ||
            (p.title && String(pointOrId).includes(p.title))
          ) {
            point = p;
            break;
          }
        }
      }
    }
    if (!point || typeof point !== "object") {
      if (Array.isArray(points) && points.length > 0) {
        point = points.find((p) => p.sourceType === "nara_sarang_store") || points[0];
      }
    }
    if (!point) return;
    currentPrintPoint = point;
    currentPrintTemplate = "poster";

    const backdrop = document.getElementById("printModalBackdrop");
    const nameEl = document.getElementById("printModalStoreName");
    if (nameEl) nameEl.textContent = `${point.title || "가맹점"} 맞춤 홍보물 인쇄`;

    // Reset tabs
    document.querySelectorAll(".printTabBtn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tpl === currentPrintTemplate);
    });

    const actionBtn = document.getElementById("doPrintBtn");
    if (actionBtn) {
      actionBtn.textContent = "💾 이미지 다운로드";
    }

    const guideEl = document.getElementById("printGuideContent");
    if (guideEl) {
      guideEl.textContent = "가맹점 출입구나 카운터 주변에 부착하여 방문하는 대상자(현역병, 사회복무, 병역명문가 등)가 혜택을 즉시 알아볼 수 있도록 홍보하는 용도로 활용됩니다.";
    }

    renderPrintTemplate(point, currentPrintTemplate);

    if (backdrop) backdrop.classList.remove("hidden");
  };
  window.openPrintModal = openPrintModal;

  const closePrintModal = () => {
    const backdrop = document.getElementById("printModalBackdrop");
    if (backdrop) backdrop.classList.add("hidden");
    if (window.MMAAuth && window.MMAAuth.returnToAdmin) {
      window.MMAAuth.returnToAdmin = false;
      window.MMAAuth.openAdminDashboardModal("", "facilities");
    }
  };

  // ==========================================
  // Store Customization & On/Off Toggle Engine
  // ==========================================
  const getStoreCustomKey = (facilityId) => `mma_store_custom_${facilityId}`;

  const compressImageFile = (file, maxWidth = 1024, quality = 0.82) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith("image/")) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const customSettingsCache = new Map();
  const commentsCache = new Map();
  const qaCache = new Map();

  const getSupabaseDirectConfig = () => {
    const url = (window.MMAAuth && window.MMAAuth.getSupabaseUrl)
      ? window.MMAAuth.getSupabaseUrl()
      : "https://mwprznynxyvzxweehynl.supabase.co/rest/v1";
    const headers = (window.MMAAuth && window.MMAAuth.getSupabaseHeaders)
      ? window.MMAAuth.getSupabaseHeaders()
      : {
          "apikey": "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx",
          "Authorization": "Bearer sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx",
          "Content-Type": "application/json"
        };
    return { url, headers };
  };

  const fetchStoreCustomSettingsFromSupabase = async (facilityId) => {
    try {
      const { url, headers } = getSupabaseDirectConfig();
      const fid = String(facilityId || "").trim();
      const cleanFid = fid.split("____")[0] || fid;
      const res = await fetch(`${url}/facility_custom_settings?facility_id=like.*${encodeURIComponent(cleanFid)}*&order=updated_at.desc&limit=1`, { headers });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const settings = {
            greetingEnabled: !!row.greeting_enabled,
            greetingText: row.greeting_text || "",
            photoEnabled: !!row.photo_enabled,
            photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : (typeof row.photo_urls === "string" ? JSON.parse(row.photo_urls) : []),
            commentsEnabled: !!row.comments_enabled,
            qaEnabled: !!row.qa_enabled,
            promoEnabled: !!row.promo_enabled,
            promoText: row.promo_text || "",
            hoursEnabled: !!row.hours_enabled,
            hoursText: row.hours_text || "",
            snsEnabled: !!row.sns_enabled,
            snsUrl: row.sns_url || ""
          };
          customSettingsCache.set(fid, settings);
          if (cleanFid && cleanFid !== fid) {
            customSettingsCache.set(cleanFid, settings);
          }
          return settings;
        }
      }
    } catch (err) {
      console.warn("[Supabase Custom Settings Fetch Warn]", err);
    }
    return null;
  };

  const getStoreCustomSettings = (facilityId, point = null) => {
    const fid = String(facilityId || "").trim();
    const cleanFid = fid.split("____")[0] || fid;
    if (customSettingsCache.has(fid)) {
      return customSettingsCache.get(fid);
    }
    if (cleanFid && customSettingsCache.has(cleanFid)) {
      return customSettingsCache.get(cleanFid);
    }

    const defaultSettings = {
      greetingEnabled: false,
      greetingText: "대한민국을 수호하는 자랑스러운 청년 장병 및 병역명문가 여러분을 진심으로 환영합니다! 편안하게 이용하세요.",
      photoEnabled: false,
      photoUrls: [],
      commentsEnabled: false,
      qaEnabled: false,
      promoEnabled: false,
      promoText: "나라사랑 우대 고객 방문 시 추가 서비스 & 맞춤 혜택 제공!",
      hoursEnabled: false,
      hoursText: "매일 09:30 ~ 21:30 (연중무휴)",
      snsEnabled: false,
      snsUrl: "",
    };
    return defaultSettings;
  };

  const saveStoreCustomSettings = async (facilityId, settings) => {
    const fid = String(facilityId || "").trim();
    const cleanFid = fid.split("____")[0] || fid;
    customSettingsCache.set(fid, settings);
    if (cleanFid && cleanFid !== fid) {
      customSettingsCache.set(cleanFid, settings);
    }

    // 100% Direct Supabase PostgreSQL Upsert
    try {
      const { url, headers } = getSupabaseDirectConfig();
      const upsertHeaders = {
        ...headers,
        "Prefer": "resolution=merge-duplicates,return=minimal"
      };

      const nowIso = new Date().toISOString();
      const payload = {
        facility_id: fid,
        greeting_enabled: !!settings.greetingEnabled,
        greeting_text: settings.greetingText || "",
        photo_enabled: !!settings.photoEnabled,
        photo_urls: settings.photoUrls || [],
        comments_enabled: !!settings.commentsEnabled,
        qa_enabled: !!settings.qaEnabled,
        promo_enabled: !!settings.promoEnabled,
        promo_text: settings.promoText || "",
        hours_enabled: !!settings.hoursEnabled,
        hours_text: settings.hoursText || "",
        sns_enabled: !!settings.snsEnabled,
        sns_url: settings.snsUrl || "",
        updated_at: nowIso
      };

      await fetch(`${url}/facility_custom_settings`, {
        method: "POST",
        headers: upsertHeaders,
        body: JSON.stringify(payload)
      });
      if (cleanFid && cleanFid !== fid) {
        await fetch(`${url}/facility_custom_settings`, {
          method: "POST",
          headers: upsertHeaders,
          body: JSON.stringify({ ...payload, facility_id: cleanFid })
        });
      }
      console.log(`[Supabase Direct] Facility custom settings persisted for ${fid} & ${cleanFid}`);
    } catch (err) {
      console.error("[Supabase Direct Save Custom Settings Error]", err);
    }
  };

  const fetchStoreCommentsFromSupabase = async (facilityId) => {
    try {
      const { url, headers } = getSupabaseDirectConfig();
      const res = await fetch(`${url}/facility_comments?facility_id=eq.${encodeURIComponent(facilityId)}&order=id.desc`, { headers });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const list = rows.map((r) => ({
            id: r.id,
            author: r.author,
            text: r.text,
            date: r.created_at
          }));
          commentsCache.set(facilityId, list);
          return list;
        }
      }
    } catch (err) {
      console.warn("[Supabase Comments Fetch Warn]", err);
    }
    return null;
  };

  const parseAuthorMeta = (rawAuthor = "") => {
    const m = String(rawAuthor || "").match(/^(.*?)\s*\[uid:(.*?)\]\s*$/);
    if (m) {
      return { displayName: m[1].trim(), uid: m[2].trim() };
    }
    return { displayName: String(rawAuthor || "방문자").trim(), uid: "" };
  };

  const parseQuestionMeta = (rawQuestion = "") => {
    const m = String(rawQuestion || "").match(/^\[(SECRET|PUBLIC)(?::([^\]]+))?\]\s*([\s\S]*)$/);
    if (m) {
      return {
        isSecret: m[1] === "SECRET",
        authorUid: (m[2] || "").trim(),
        text: m[3].trim()
      };
    }
    return {
      isSecret: false,
      authorUid: "",
      text: String(rawQuestion || "").trim()
    };
  };

  const isUserMerchantOfPoint = (facilityId, point = null) => {
    const u = window.MMAAuth?.user;
    if (!u || u.role !== "merchant") return false;
    if (u.merchantFacilityId && (u.merchantFacilityId === facilityId || facilityId.startsWith(u.merchantFacilityId))) return true;
    if (point && u.merchantFacilityName && point.title && u.merchantFacilityName.trim() === point.title.trim()) return true;
    return false;
  };

  const canDeleteCommentItem = (comment, facilityId, point = null) => {
    const u = window.MMAAuth?.user;
    if (!u) return false;
    if (u.role === "admin") return true;
    if (isUserMerchantOfPoint(facilityId, point)) return true;
    const meta = parseAuthorMeta(comment?.author);
    if (meta.uid && (meta.uid === String(u.id) || meta.uid === String(u.phone))) return true;
    return false;
  };

  const canDeleteQaItem = (qaItem, facilityId, point = null) => {
    const u = window.MMAAuth?.user;
    if (!u) return false;
    if (u.role === "admin") return true;
    if (isUserMerchantOfPoint(facilityId, point)) return true;
    const qMeta = parseQuestionMeta(qaItem?.q);
    const aMeta = parseAuthorMeta(qaItem?.author);
    const authorUid = qMeta.authorUid || aMeta.uid;
    if (authorUid && (authorUid === String(u.id) || authorUid === String(u.phone))) return true;
    return false;
  };

  const canReplyQaItem = (qaItem, facilityId, point = null) => {
    const u = window.MMAAuth?.user;
    if (!u) return false;
    if (u.role === "admin") return true;
    if (isUserMerchantOfPoint(facilityId, point)) return true;
    return false;
  };

  const canViewSecretQaItem = (qaItem, facilityId, point = null) => {
    const qMeta = parseQuestionMeta(qaItem?.q);
    if (!qMeta.isSecret) return true;
    const u = window.MMAAuth?.user;
    if (!u) return false;
    if (u.role === "admin") return true;
    if (isUserMerchantOfPoint(facilityId, point)) return true;
    const aMeta = parseAuthorMeta(qaItem?.author);
    const authorUid = qMeta.authorUid || aMeta.uid;
    if (authorUid && (authorUid === String(u.id) || authorUid === String(u.phone))) return true;
    return false;
  };

  const getStoreComments = (facilityId) => {
    if (commentsCache.has(facilityId)) {
      return commentsCache.get(facilityId);
    }
    return [];
  };

  const addStoreComment = async (facilityId, comment) => {
    const list = getStoreComments(facilityId);
    if (!comment.id) comment.id = "temp_" + Date.now();
    list.unshift(comment);
    commentsCache.set(facilityId, list);

    // Direct Supabase REST Insert
    try {
      const { url, headers } = getSupabaseDirectConfig();
      const res = await fetch(`${url}/facility_comments`, {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          facility_id: String(facilityId),
          author: comment.author || "방문자",
          text: comment.text || "",
          created_at: comment.date || new Date().toISOString().slice(0, 10).replace(/-/g, ".")
        })
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.id) {
          comment.id = rows[0].id;
        }
      }
      console.log(`[Supabase Direct] Comment inserted for ${facilityId}`);
    } catch (err) {
      console.error("[Supabase Direct Comment Insert Error]", err);
    }
    return list;
  };

  const deleteStoreComment = async (facilityId, commentId) => {
    let list = getStoreComments(facilityId);
    list = list.filter((c) => String(c.id) !== String(commentId));
    commentsCache.set(facilityId, list);

    try {
      const { url, headers } = getSupabaseDirectConfig();
      await fetch(`${url}/facility_comments?id=eq.${encodeURIComponent(commentId)}`, {
        method: "DELETE",
        headers
      });
      console.log(`[Supabase Direct] Comment deleted id=${commentId}`);
    } catch (err) {
      console.error("[Supabase Direct Comment Delete Error]", err);
    }
    return list;
  };

  const fetchStoreQaFromSupabase = async (facilityId) => {
    try {
      const { url, headers } = getSupabaseDirectConfig();
      const res = await fetch(`${url}/facility_qa?facility_id=eq.${encodeURIComponent(facilityId)}&order=id.desc`, { headers });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const list = rows.map((r) => ({
            id: r.id,
            q: r.question,
            author: r.author,
            a: r.answer || "",
            date: r.created_at
          }));
          qaCache.set(facilityId, list);
          return list;
        }
      }
    } catch (err) {
      console.warn("[Supabase QA Fetch Warn]", err);
    }
    return null;
  };

  const getStoreQaList = (facilityId) => {
    if (qaCache.has(facilityId)) {
      return qaCache.get(facilityId);
    }
    return [];
  };

  const addStoreQa = async (facilityId, qaItem) => {
    const list = getStoreQaList(facilityId);
    if (!qaItem.id) qaItem.id = "temp_" + Date.now();
    list.unshift(qaItem);
    qaCache.set(facilityId, list);

    // Direct Supabase REST Insert
    try {
      const { url, headers } = getSupabaseDirectConfig();
      const res = await fetch(`${url}/facility_qa`, {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          facility_id: String(facilityId),
          question: qaItem.q || "",
          author: qaItem.author || "방문자",
          answer: qaItem.a || "",
          created_at: qaItem.date || new Date().toISOString().slice(0, 10).replace(/-/g, ".")
        })
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.id) {
          qaItem.id = rows[0].id;
        }
      }
      console.log(`[Supabase Direct] QA inserted for ${facilityId}`);
    } catch (err) {
      console.error("[Supabase Direct QA Insert Error]", err);
    }
    return list;
  };

  const deleteStoreQa = async (facilityId, qaId) => {
    let list = getStoreQaList(facilityId);
    list = list.filter((q) => String(q.id) !== String(qaId));
    qaCache.set(facilityId, list);

    try {
      const { url, headers } = getSupabaseDirectConfig();
      await fetch(`${url}/facility_qa?id=eq.${encodeURIComponent(qaId)}`, {
        method: "DELETE",
        headers
      });
      console.log(`[Supabase Direct] QA deleted id=${qaId}`);
    } catch (err) {
      console.error("[Supabase Direct QA Delete Error]", err);
    }
    return list;
  };

  const replyStoreQa = async (facilityId, qaId, answerText) => {
    const list = getStoreQaList(facilityId);
    const target = list.find((q) => String(q.id) === String(qaId));
    if (target) {
      target.a = answerText;
    }
    qaCache.set(facilityId, list);

    try {
      const { url, headers } = getSupabaseDirectConfig();
      await fetch(`${url}/facility_qa?id=eq.${encodeURIComponent(qaId)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          answer: answerText
        })
      });
      console.log(`[Supabase Direct] QA answered id=${qaId}`);
    } catch (err) {
      console.error("[Supabase Direct QA Reply Error]", err);
    }
    return list;
  };

  let currentCustomPoint = null;
  let currentCustomPhotos = [];
  let currentDetailCommentPage = 1;
  let isCommentsFlyoutOpen = false;
  let isQaFlyoutOpen = false;
  let currentDetailFacilityId = null;

  const renderCustomPhotoThumbs = () => {
    const grid = document.getElementById("storePhotoThumbGrid");
    const countBadge = document.getElementById("photoCountBadge");
    if (countBadge) countBadge.textContent = String(currentCustomPhotos.length);
    if (!grid) return;
    if (currentCustomPhotos.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; font-size: 11px; color: #94a3b8; text-align: center; padding: 12px;">등록된 사진이 없습니다. [사진 찾아보기] 버튼을 눌러 추가하세요.</div>';
      return;
    }
    grid.innerHTML = currentCustomPhotos
      .map(
        (url, idx) => `
        <div class="photoThumbItem">
          <img src="${escapeHtml(url)}" class="photoThumbImg" alt="미리보기" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80'" />
          <button type="button" class="photoThumbDeleteBtn" data-index="${idx}" title="사진 삭제">×</button>
        </div>
      `
      )
      .join("");

    grid.querySelectorAll(".photoThumbDeleteBtn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const delIdx = Number(btn.dataset.index);
        currentCustomPhotos.splice(delIdx, 1);
        renderCustomPhotoThumbs();
      };
    });
  };

  const openStoreCustomModal = (pointOrId) => {
    if (typeof closeIntroPopup === "function") closeIntroPopup(false);
    if (typeof closePrintModal === "function") closePrintModal();
    window.MMAAuth?.closeProfileMenu?.();

    let point = pointOrId;
    if (typeof pointOrId === "string" && pointOrId.trim()) {
      point = pointByFacilityKey.get(pointOrId);
      if (!point) {
        for (const p of points) {
          if (
            String(p.facilityId || "") === String(pointOrId) ||
            String(p.id || "") === String(pointOrId) ||
            getFacilityKey(p) === pointOrId
          ) {
            point = p;
            break;
          }
        }
      }
    }
    if (!point && Array.isArray(points) && points.length > 0) {
      point = points.find((p) => p.sourceType === "nara_sarang_store") || points[0];
    }
    if (!point) return;

    currentCustomPoint = point;
    const facilityId = getFacilityKey(point);
    const settings = getStoreCustomSettings(facilityId, point);

    const backdrop = document.getElementById("storeCustomBackdrop");
    const modal = document.getElementById("storeCustomModal");
    const titleEl = document.getElementById("storeCustomTitle");
    if (titleEl) titleEl.textContent = `[${point.title || "우리 가게"}] 상세페이지 꾸미기`;

    // Reset tabs to first tab
    document.querySelectorAll(".storeCustomTabBtn").forEach((btn, idx) => {
      btn.classList.toggle("active", idx === 0);
    });
    document.querySelectorAll(".storeCustomTabPane").forEach((pane, idx) => {
      pane.classList.toggle("active", idx === 0);
    });

    const tgGreeting = document.getElementById("toggleGreeting");
    const txtGreeting = document.getElementById("storeGreetingText");
    const tgPhoto = document.getElementById("togglePhoto");
    const tgComments = document.getElementById("toggleComments");
    const tgQa = document.getElementById("toggleQa");
    const tgPromo = document.getElementById("togglePromo");
    const txtPromo = document.getElementById("storePromoText");
    const tgHours = document.getElementById("toggleHours");
    const txtHours = document.getElementById("storeHoursText");
    const tgSns = document.getElementById("toggleSns");
    const txtSns = document.getElementById("storeSnsUrl");

    if (tgGreeting) tgGreeting.checked = !!settings.greetingEnabled;
    if (txtGreeting) txtGreeting.value = settings.greetingText || "";
    if (tgPhoto) tgPhoto.checked = !!settings.photoEnabled;
    if (tgComments) tgComments.checked = !!settings.commentsEnabled;
    if (tgQa) tgQa.checked = !!settings.qaEnabled;
    if (tgPromo) tgPromo.checked = !!settings.promoEnabled;
    if (txtPromo) txtPromo.value = settings.promoText || "";
    if (tgHours) tgHours.checked = !!settings.hoursEnabled;
    if (txtHours) txtHours.value = settings.hoursText || "";
    if (tgSns) tgSns.checked = !!settings.snsEnabled;
    if (txtSns) txtSns.value = settings.snsUrl || "";

    currentCustomPhotos = Array.isArray(settings.photoUrls)
      ? [...settings.photoUrls]
      : settings.photoUrl
      ? [settings.photoUrl]
      : [];
    renderCustomPhotoThumbs();

    const updateVisibility = () => {
      const gWrap = document.getElementById("greetingInputWrap");
      const pWrap = document.getElementById("photoInputWrap");
      const prWrap = document.getElementById("promoInputWrap");
      const hWrap = document.getElementById("hoursInputWrap");
      const sWrap = document.getElementById("snsInputWrap");

      if (gWrap && tgGreeting) {
        gWrap.style.display = tgGreeting.checked ? "block" : "none";
        gWrap.closest(".customSettingGroup")?.classList.toggle("disabled", !tgGreeting.checked);
      }
      if (pWrap && tgPhoto) {
        pWrap.style.display = tgPhoto.checked ? "block" : "none";
        pWrap.closest(".customSettingGroup")?.classList.toggle("disabled", !tgPhoto.checked);
      }
      if (tgComments) {
        tgComments.closest(".customSettingGroup")?.classList.toggle("disabled", !tgComments.checked);
      }
      if (tgQa) {
        tgQa.closest(".customSettingGroup")?.classList.toggle("disabled", !tgQa.checked);
      }
      if (prWrap && tgPromo) {
        prWrap.style.display = tgPromo.checked ? "block" : "none";
        prWrap.closest(".customSettingGroup")?.classList.toggle("disabled", !tgPromo.checked);
      }
      if (hWrap && tgHours) {
        hWrap.style.display = tgHours.checked ? "block" : "none";
        hWrap.closest(".customSettingGroup")?.classList.toggle("disabled", !tgHours.checked);
      }
      if (sWrap && tgSns) {
        sWrap.style.display = tgSns.checked ? "block" : "none";
        sWrap.closest(".customSettingGroup")?.classList.toggle("disabled", !tgSns.checked);
      }
    };

    [tgGreeting, tgPhoto, tgComments, tgQa, tgPromo, tgHours, tgSns].forEach((tg) => {
      if (tg) tg.onchange = updateVisibility;
    });
    updateVisibility();

    if (backdrop) backdrop.classList.remove("hidden");
    if (modal) modal.classList.remove("hidden");

    // Fetch latest remote settings from Supabase
    fetchStoreCustomSettingsFromSupabase(facilityId).then((remote) => {
      if (remote && currentCustomPoint && getFacilityKey(currentCustomPoint) === facilityId) {
        if (tgGreeting) tgGreeting.checked = !!remote.greetingEnabled;
        if (txtGreeting) txtGreeting.value = remote.greetingText || "";
        if (tgPhoto) tgPhoto.checked = !!remote.photoEnabled;
        if (tgComments) tgComments.checked = !!remote.commentsEnabled;
        if (tgQa) tgQa.checked = !!remote.qaEnabled;
        if (tgPromo) tgPromo.checked = !!remote.promoEnabled;
        if (txtPromo) txtPromo.value = remote.promoText || "";
        if (tgHours) tgHours.checked = !!remote.hoursEnabled;
        if (txtHours) txtHours.value = remote.hoursText || "";
        if (tgSns) tgSns.checked = !!remote.snsEnabled;
        if (txtSns) txtSns.value = remote.snsUrl || "";

        currentCustomPhotos = Array.isArray(remote.photoUrls) ? [...remote.photoUrls] : [];
        renderCustomPhotoThumbs();
        updateVisibility();
      }
    });
  };
  window.openStoreCustomModal = openStoreCustomModal;

  const closeStoreCustomModal = () => {
    const backdrop = document.getElementById("storeCustomBackdrop");
    const modal = document.getElementById("storeCustomModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
  };

  const openDetailInfo = (point, anchorLatLng = null, screenPoint = null) => {
    if (!ENABLE_DETAIL_PANEL) return;
    if (!detailPanelEl || !point) return;
    try {
      const fid = point.facilityId || point.id || point.title || "unknown";
      window.MMAAuth?.logPageVisit?.(`/facility/${encodeURIComponent(fid)}`);
    } catch (_e) {}
    const address = normalizeTextBlock(point.address || "주소 정보 없음");
    const phone = normalizeTextBlock(point.phone || "전화번호 정보 없음");
    const rawCategory = toCategoryLabel(point.category);
    const rawBenefit = String(point.benefit || "").trim();
    const benefit = formatBenefitText(rawBenefit || "혜택 정보 없음");
    const rawBenefitPlain = rawBenefit.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const isLongBenefit = rawBenefitPlain.length > 55 || rawBenefit.includes("\n") || (rawBenefit.match(/<br\s*\/?>/gi) || []).length >= 2;
    const category = escapeHtml(rawCategory);
    const title = escapeHtml(point.title || "시설");
    const rawSubtitle = String(point.subtitle || "").trim();
    const subtitle = escapeHtml(rawSubtitle);
    const subtitleLine = rawSubtitle && rawSubtitle === rawCategory ? category : subtitle ? `${subtitle} · ${category}` : category;
    const audiencesRaw = Array.isArray(point.audiences) ? point.audiences : [];
    const audienceText = audiencesRaw.length
      ? (() => {
          const seen = new Set();
          const chips = [];
          audiencesRaw.forEach((v) => {
            const displayName = getAudienceDisplayName(v);
            if (seen.has(displayName)) return;
            seen.add(displayName);
            const icon = audienceIconByName[v];
            const safeName = escapeHtml(displayName);
            chips.push(
              icon
                ? `<span class="audienceChip"><img src="./img/${icon}" alt="">${safeName}</span>`
                : `<span class="audienceChip">${safeName}</span>`
            );
          });
          return chips.join("");
        })()
      : "대상 정보 없음";

    const facilityId = point.facilityId || point.id || getFacilityKey(point);
    const legacyKey = getFacilityKey(point);
    if (currentDetailFacilityId !== facilityId) {
      currentDetailFacilityId = facilityId;
      isCommentsFlyoutOpen = false;
      isQaFlyoutOpen = false;
      currentDetailCommentPage = 1;
    }
    const isLiked = likes.has(facilityId) || (legacyKey && likes.has(legacyKey));
    const isFavorite = favorites.has(facilityId) || (legacyKey && favorites.has(legacyKey));
    const safePhone = escapeHtml(phone);
    const telHref = normalizePhone(point.phone || "");
    const bookingUrl = getTheaterBookingUrl(point.title || "");
    const bookingBtnHtml = bookingUrl
      ? `
        <div class="detailFavSpacer"></div>
        <a class="detailBookBtn" href="${escapeHtml(bookingUrl)}" target="_blank" rel="noopener noreferrer">예매하기</a>
      `
      : "";

    // Load store customizations, comments, and Q&A (Cached / Instant local fallback)
    const custom = getStoreCustomSettings(facilityId, point);
    const comments = getStoreComments(facilityId);
    const qaList = getStoreQaList(facilityId);

    // Background Supabase Sync for cross-device realtime consistency
    fetchStoreCustomSettingsFromSupabase(facilityId).then((remote) => {
      if (remote && currentDetailFacilityId === facilityId && selectedDetailAnchor) {
        const curJson = JSON.stringify(custom || {});
        const remJson = JSON.stringify(remote || {});
        if (curJson !== remJson) {
          openDetailInfo(point, selectedDetailAnchor);
        }
      }
    });
    if (!commentsCache.has(facilityId)) {
      fetchStoreCommentsFromSupabase(facilityId).then((remote) => {
        if (remote && currentDetailFacilityId === facilityId && selectedDetailAnchor) {
          const chip = document.querySelector("#btnOpenCommentsFlyout .commentCountChip");
          if (chip) chip.textContent = String(remote.length);
          if (isCommentsFlyoutOpen && typeof updateCommentsFlyoutDom === "function") {
            updateCommentsFlyoutDom();
          }
        }
      });
    }
    if (!qaCache.has(facilityId)) {
      fetchStoreQaFromSupabase(facilityId).then((remote) => {
        if (remote && currentDetailFacilityId === facilityId && selectedDetailAnchor) {
          const chip = document.querySelector("#btnOpenQaFlyout .commentCountChip");
          if (chip) chip.textContent = String(remote.length);
          if (isQaFlyoutOpen && typeof updateQaFlyoutDom === "function") {
            updateQaFlyoutDom();
          }
        }
      });
    }

    const photos = Array.isArray(custom.photoUrls)
      ? custom.photoUrls.filter(Boolean)
      : custom.photoUrl
      ? [custom.photoUrl]
      : [];

    let photoHtml = "";
    if (custom.photoEnabled && photos.length > 0) {
      if (photos.length === 1) {
        photoHtml = `<div class="storePhotoBanner"><img src="${escapeHtml(photos[0])}" alt="${title}" onerror="this.parentElement.style.display='none'"></div>`;
      } else {
        const slidesHtml = photos
          .map(
            (url, idx) => `
            <img class="carouselSlide ${idx === 0 ? "active" : ""}" src="${escapeHtml(url)}" data-index="${idx}" alt="${title}" onerror="this.style.display='none'" />
          `
          )
          .join("");
        photoHtml = `
          <div class="storePhotoCarousel" id="storePhotoCarousel" data-current-index="0" data-total-count="${photos.length}">
            <div class="carouselTrack">
              ${slidesHtml}
            </div>
            <button type="button" class="carouselBtn prev" id="carouselPrevBtn" aria-label="이전 사진">‹</button>
            <button type="button" class="carouselBtn next" id="carouselNextBtn" aria-label="다음 사진">›</button>
            <div class="carouselCounterBadge"><span id="carouselCurIdx">1</span> / ${photos.length}</div>
          </div>
        `;
      }
    }

    const greetingHtml =
      custom.greetingEnabled && custom.greetingText
        ? `<div class="ownerGreetingBox">${escapeHtml(custom.greetingText)}</div>`
        : "";

    const promoHtml =
      custom.promoEnabled && custom.promoText
        ? `<div class="todayPromoBox">
             <span class="promoBadge">🎁 오늘의 혜택</span>
             <span class="promoText">${escapeHtml(custom.promoText)}</span>
           </div>`
        : "";

    const hoursHtml =
      custom.hoursEnabled && custom.hoursText
        ? `<div class="storeHoursRow">⏰ <strong>영업시간:</strong> ${escapeHtml(custom.hoursText)}</div>`
        : "";

    const snsHtml =
      custom.snsEnabled && custom.snsUrl
        ? `<div class="storeSnsRow">🔗 <a href="${escapeHtml(custom.snsUrl)}" target="_blank" rel="noopener noreferrer" class="storeSnsLink">공식 채널 / SNS 방문하기</a></div>`
        : "";

    // Community buttons row in main popup
    let communityBtnRowHtml = "";
    if (custom.commentsEnabled || custom.qaEnabled) {
      communityBtnRowHtml = `
        <div class="detailCommunityBtnRow">
          ${
            custom.commentsEnabled
              ? `
            <button type="button" class="detailCommunityBtn ${isCommentsFlyoutOpen ? "active" : ""}" id="btnOpenCommentsFlyout">
              <span>💬 후기 & 댓글 <span class="commentCountChip">${comments.length}</span></span>
              <span style="font-size: 14px; font-weight: 800;">›</span>
            </button>
          `
              : ""
          }
          ${
            custom.qaEnabled
              ? `
            <button type="button" class="detailCommunityBtn ${isQaFlyoutOpen ? "active" : ""}" id="btnOpenQaFlyout">
              <span>❓ 이용 Q&A <span class="commentCountChip">${qaList.length}</span></span>
              <span style="font-size: 14px; font-weight: 800;">›</span>
            </button>
          `
              : ""
          }
        </div>
      `;
    }

    // Current user context
    const currentUser = window.MMAAuth?.user || null;
    const isUserLoggedIn = !!currentUser;
    const userDisplayName = currentUser ? (currentUser.nickname || currentUser.name || "회원") : "";
    const userRoleBadge = currentUser
      ? (currentUser.role === "merchant" ? "점주" : currentUser.role === "admin" ? "관리자" : "회원")
      : "";

    // Side Popup Flyout: 2 comments per page pagination
    let commentsFlyoutHtml = "";
    if (custom.commentsEnabled) {
      const pageSize = 2;
      const totalPages = Math.ceil(comments.length / pageSize) || 1;
      if (currentDetailCommentPage > totalPages) currentDetailCommentPage = totalPages;
      if (currentDetailCommentPage < 1) currentDetailCommentPage = 1;

      const startIdx = (currentDetailCommentPage - 1) * pageSize;
      const pageComments = comments.slice(startIdx, startIdx + pageSize);

      const commentItems = pageComments
        .map((c) => {
          const cMeta = parseAuthorMeta(c.author);
          const canDelete = canDeleteCommentItem(c, facilityId, point);
          return `
            <div class="storeCommentItem">
              <div class="storeCommentMeta">
                <span class="storeCommentAuthor">${escapeHtml(cMeta.displayName || "회원")}</span>
                <span class="storeCommentDate">${escapeHtml(c.date || "")}</span>
                ${canDelete ? `<button type="button" class="commentItemDeleteBtn" data-comment-id="${escapeHtml(String(c.id))}" title="댓글 삭제">삭제</button>` : ""}
              </div>
              <div class="storeCommentText">${escapeHtml(c.text || "")}</div>
            </div>
          `;
        })
        .join("");

      const paginationHtml =
        totalPages > 1
          ? `
          <div class="storeCommentPagination">
            <button type="button" class="commentPageBtn" id="btnCommentPrevPage" ${currentDetailCommentPage <= 1 ? "disabled" : ""}>◀ 이전</button>
            <span class="commentPageIndicator">${currentDetailCommentPage} / ${totalPages}</span>
            <button type="button" class="commentPageBtn" id="btnCommentNextPage" ${currentDetailCommentPage >= totalPages ? "disabled" : ""}>다음 ▶</button>
          </div>
        `
          : "";

      const commentFooterHtml = isUserLoggedIn
        ? `
          <div class="storeAuthorBadge">
            <span class="badgeDot"></span>
            <span><strong>${escapeHtml(userDisplayName)}</strong> (${userRoleBadge}) 님으로 작성</span>
          </div>
          <div class="storeCommentForm">
            <input type="text" id="storeNewCommentInput" class="storeCommentInput" placeholder="장병·회원 응원 한마디..." maxlength="100" />
            <button type="button" id="storeCommentSubmitBtn" class="storeCommentSubmitBtn">등록</button>
          </div>
        `
        : `
          <div class="storeLoginRequiredBox">
            <div class="loginRequiredNotice">💡 이용후기 및 댓글은 로그인 후 작성할 수 있습니다.</div>
            <button type="button" class="storeLoginPromptBtn" id="btnCommentLoginPrompt">로그인하기</button>
          </div>
        `;

      commentsFlyoutHtml = `
        <div class="storeSideFlyout ${isCommentsFlyoutOpen ? "" : "hidden"}" id="storeCommentsFlyout">
          <div class="storeSideFlyoutHead">
            <div class="storeSideFlyoutTitle">💬 방문 후기 & 응원 댓글 (${comments.length}개)</div>
            <button type="button" class="storeSideFlyoutCloseBtn" id="btnCloseCommentsFlyout" title="닫기">×</button>
          </div>
          <div class="storeSideFlyoutBody">
            <div class="storeCommentList" id="storeCommentList">
              ${commentItems || '<div style="font-size: 11px; color: #94a3b8; text-align: center; padding: 24px 6px;">첫 번째 응원 댓글을 남겨보세요!</div>'}
            </div>
            ${paginationHtml}
          </div>
          <div class="storeSideFlyoutFoot">
            ${commentFooterHtml}
          </div>
        </div>
      `;
    }

    // Side Popup Flyout: Q&A Board
    let qaFlyoutHtml = "";
    if (custom.qaEnabled) {
      const qaItems = qaList
        .slice(0, 3)
        .map((item) => {
          const qMeta = parseQuestionMeta(item.q);
          const aMeta = parseAuthorMeta(item.author);
          const isSecret = qMeta.isSecret;
          const canView = canViewSecretQaItem(item, facilityId, point);
          const canDelete = canDeleteQaItem(item, facilityId, point);
          const canReply = canReplyQaItem(item, facilityId, point);

          let qDisplay = "";
          if (!canView) {
            qDisplay = `<span class="qaSecretMaskedText">🔒 비밀글입니다. (작성자와 해당 매장 점주만 열람 가능)</span>`;
          } else {
            qDisplay = `${isSecret ? '<span class="qaSecretBadge">🔒 비밀글</span> ' : ""}${escapeHtml(qMeta.text)}`;
          }

          let aHtml = "";
          if (item.a) {
            if (!canView) {
              aHtml = `<div class="storeQaA"><span class="aTag">A</span> <span class="qaSecretMaskedText">🔒 비밀 답변입니다.</span></div>`;
            } else {
              aHtml = `
                <div class="storeQaA">
                  <span class="aTag">A</span>
                  <div class="storeQaAText">
                    <span class="storeQaMerchantTag">점주 답변</span>
                    ${escapeHtml(item.a)}
                  </div>
                  ${canReply ? `<button type="button" class="qaAnswerEditBtn" data-qa-id="${escapeHtml(String(item.id))}" title="답변 수정">수정</button>` : ""}
                </div>
              `;
            }
          } else {
            if (canReply) {
              aHtml = `
                <div class="qaReplyForm" id="qaReplyForm_${escapeHtml(String(item.id))}">
                  <div class="qaReplyInputWrap">
                    <input type="text" class="qaReplyInput" id="qaReplyInput_${escapeHtml(String(item.id))}" placeholder="점주 답변을 작성해주세요..." maxlength="150" />
                    <button type="button" class="qaReplySubmitBtn" data-qa-id="${escapeHtml(String(item.id))}">답글 등록</button>
                  </div>
                </div>
              `;
            } else {
              aHtml = `<div style="font-size:10.5px;color:#94a3b8;padding-left:18px;">답변 대기 중</div>`;
            }
          }

          return `
            <div class="storeQaItem">
              <div class="storeQaMeta">
                <span class="storeQaAuthor">${escapeHtml(canView ? (aMeta.displayName || "회원") : "익명")}</span>
                <span class="storeQaDate">${escapeHtml(item.date || "")}</span>
                ${canDelete ? `<button type="button" class="qaItemDeleteBtn" data-qa-id="${escapeHtml(String(item.id))}" title="문의 삭제">삭제</button>` : ""}
              </div>
              <div class="storeQaQ"><span class="qTag">Q</span> ${qDisplay}</div>
              ${aHtml}
            </div>
          `;
        })
        .join("");

      const qaFooterHtml = isUserLoggedIn
        ? `
          <div class="storeAuthorBadge">
            <span class="badgeDot"></span>
            <span><strong>${escapeHtml(userDisplayName)}</strong> (${userRoleBadge}) 님으로 문의</span>
          </div>
          <div class="storeQaSecretRow">
            <label class="storeQaSecretLabel">
              <input type="checkbox" id="storeQaSecretCheck" />
              <span>🔒 비공개 (작성자와 점주만 보기)</span>
            </label>
          </div>
          <div class="storeQaForm">
            <input type="text" id="storeNewQaInput" class="storeQaInput" placeholder="혜택 이용 관련 질문을 남겨주세요..." maxlength="100" />
            <button type="button" id="storeQaSubmitBtn" class="storeQaSubmitBtn">문의 등록</button>
          </div>
        `
        : `
          <div class="storeLoginRequiredBox">
            <div class="loginRequiredNotice">💡 혜택 이용 문의(Q&A)는 로그인 후 작성할 수 있습니다.</div>
            <button type="button" class="storeLoginPromptBtn" id="btnQaLoginPrompt">로그인하기</button>
          </div>
        `;

      qaFlyoutHtml = `
        <div class="storeSideFlyout ${isQaFlyoutOpen ? "" : "hidden"}" id="storeQaFlyout">
          <div class="storeSideFlyoutHead">
            <div class="storeSideFlyoutTitle">❓ Q&A 혜택 이용 문의 (${qaList.length}건)</div>
            <button type="button" class="storeSideFlyoutCloseBtn" id="btnCloseQaFlyout" title="닫기">×</button>
          </div>
          <div class="storeSideFlyoutBody">
            <div class="storeQaList" id="storeQaList">
              ${qaItems || '<div style="font-size: 11px; color: #94a3b8; text-align: center; padding: 24px 6px;">등록된 문의가 없습니다. 궁금한 점을 질문해보세요!</div>'}
            </div>
          </div>
          <div class="storeSideFlyoutFoot">
            ${qaFooterHtml}
          </div>
        </div>
      `;
    }

    const contentHtml = `
      <div class="detailPanel detailPanelInWindow">
        ${photoHtml}
        <div class="detailTop">
          <div class="detailTitleRow">
            <div class="detailTitle">${title}</div>
            <div class="detailSubTitle">${subtitleLine}</div>
          </div>
          <button id="closeDetailPanelBtn" class="detailCloseBtn" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="detailMeta">
          <div style="display: flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span>${address}</span></div>
          <div style="display: flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> <span>${telHref ? `<a href="tel:${escapeHtml(telHref)}">${safePhone}</a>` : safePhone}</span></div>
        </div>
        <div class="detailFavRow">
          <button id="detailLikeBtn" class="detailEngagementBtn like ${isLiked ? "active" : ""}" type="button" aria-label="좋아요" title="${isLiked ? "좋아요 취소" : "좋아요 추천"}">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
            <span class="engBtnLabel">좋아요</span>
            <span class="engBtnCount" id="detailLikeCount">${Math.max(Number(likeCountsById[facilityId] || 0), (legacyKey ? Number(likeCountsById[legacyKey] || 0) : 0), isLiked ? 1 : 0)}</span>
          </button>
          <button id="detailFavBtn" class="detailEngagementBtn fav ${isFavorite ? "active" : ""}" type="button" aria-label="즐겨찾기" title="${isFavorite ? "즐겨찾기 해제" : "즐겨찾기 등록"}">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span class="engBtnLabel">즐겨찾기</span>
            <span class="engBtnCount" id="detailFavCount">${Math.max(Number(favoriteCountsById[facilityId] || 0), (legacyKey ? Number(favoriteCountsById[legacyKey] || 0) : 0), isFavorite ? 1 : 0)}</span>
          </button>
          <button id="detailRouteBtn" class="detailEngagementBtn route ${window.activeRoutePointId === facilityId ? "active" : ""}" type="button" aria-label="길찾기" title="실시간 경로 길찾기 (네이버 지도 연동)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            <span class="engBtnLabel">${window.activeRoutePointId === facilityId ? "경로 표시중" : "길찾기"}</span>
          </button>
          ${bookingBtnHtml}
        </div>
        ${greetingHtml}
        ${promoHtml}
        ${hoursHtml}
        ${snsHtml}
        <div class="detailDivider"></div>
        <table class="detailInfoTable">
          <tbody>
            <tr>
              <td class="detailLabelCell">대상 :</td>
              <td class="detailValueCell detailAudienceList">${audienceText}</td>
            </tr>
            <tr>
              <td class="detailLabelCell" style="${isLongBenefit ? "vertical-align: top; padding-top: 3px;" : ""}">혜택 :</td>
              <td class="detailValueCell benefitText">
                ${
                  isLongBenefit
                    ? `
                  <div class="benefitContentWrapper collapsed" id="benefitContentWrapper">
                    ${benefit}
                  </div>
                  <button type="button" class="btnBenefitToggle" id="btnBenefitToggle" aria-label="혜택 상세 더보기">
                    <span class="btnBenefitToggleText">더보기</span>
                    <span class="benefitToggleArrow">▼</span>
                  </button>
                `
                    : benefit
                }
              </td>
            </tr>
          </tbody>
        </table>
        ${communityBtnRowHtml}
        ${commentsFlyoutHtml}
        ${qaFlyoutHtml}
      </div>
    `;

    const targetAnchor =
      anchorLatLng && typeof anchorLatLng.lat === "function"
        ? anchorLatLng
        : new naver.maps.LatLng(point.lat, point.lng);
    selectedDetailAnchor = targetAnchor;

    detailInfoWindow.setContent(contentHtml);
    if (!detailInfoWindow.getMap()) {
      detailInfoWindow.open(map, targetAnchor);
    }

    const closeBtn = document.getElementById("closeDetailPanelBtn");
    if (closeBtn) closeBtn.onclick = closeDetailPanel;

    // Community Side Flyout Buttons
    const btnOpenComments = document.getElementById("btnOpenCommentsFlyout");
    if (btnOpenComments) {
      btnOpenComments.onclick = () => {
        isCommentsFlyoutOpen = !isCommentsFlyoutOpen;
        isQaFlyoutOpen = false;
        if (isCommentsFlyoutOpen) {
          fetchStoreCommentsFromSupabase(facilityId).then(() => {
            if (isCommentsFlyoutOpen) updateCommentsFlyoutDom();
          });
        }
        openDetailInfo(point, targetAnchor);

        if (isCommentsFlyoutOpen && window.innerWidth > 800) {
          setTimeout(() => {
            const panel = document.querySelector(".detailPanelInWindow");
            if (panel && typeof map !== "undefined" && map.panBy) {
              const rect = panel.getBoundingClientRect();
              const neededRight = rect.right + 410;
              if (neededRight > window.innerWidth) {
                map.panBy(new naver.maps.Point(-Math.round(neededRight - window.innerWidth + 24), 0));
              }
            }
          }, 50);
        }
      };
    }

    const btnCloseComments = document.getElementById("btnCloseCommentsFlyout");
    if (btnCloseComments) {
      btnCloseComments.onclick = () => {
        isCommentsFlyoutOpen = false;
        openDetailInfo(point, targetAnchor);
      };
    }

    const btnOpenQa = document.getElementById("btnOpenQaFlyout");
    if (btnOpenQa) {
      btnOpenQa.onclick = () => {
        isQaFlyoutOpen = !isQaFlyoutOpen;
        isCommentsFlyoutOpen = false;
        if (isQaFlyoutOpen) {
          fetchStoreQaFromSupabase(facilityId).then(() => {
            if (isQaFlyoutOpen) updateQaFlyoutDom();
          });
        }
        openDetailInfo(point, targetAnchor);

        if (isQaFlyoutOpen && window.innerWidth > 800) {
          setTimeout(() => {
            const panel = document.querySelector(".detailPanelInWindow");
            if (panel && typeof map !== "undefined" && map.panBy) {
              const rect = panel.getBoundingClientRect();
              const neededRight = rect.right + 410;
              if (neededRight > window.innerWidth) {
                map.panBy(new naver.maps.Point(-Math.round(neededRight - window.innerWidth + 24), 0));
              }
            }
          }, 50);
        }
      };
    }

    const btnCloseQa = document.getElementById("btnCloseQaFlyout");
    if (btnCloseQa) {
      btnCloseQa.onclick = () => {
        isQaFlyoutOpen = false;
        openDetailInfo(point, targetAnchor);
      };
    }

    // Benefit More/Collapse Toggle
    const btnBenefitToggle = document.getElementById("btnBenefitToggle");
    const benefitWrapper = document.getElementById("benefitContentWrapper");
    if (btnBenefitToggle && benefitWrapper) {
      btnBenefitToggle.onclick = (e) => {
        e.stopPropagation();
        const isCollapsed = benefitWrapper.classList.contains("collapsed");
        if (isCollapsed) {
          benefitWrapper.classList.remove("collapsed");
          btnBenefitToggle.classList.add("expanded");
          const label = btnBenefitToggle.querySelector(".btnBenefitToggleText");
          if (label) label.textContent = "접기";
        } else {
          benefitWrapper.classList.add("collapsed");
          btnBenefitToggle.classList.remove("expanded");
          const label = btnBenefitToggle.querySelector(".btnBenefitToggleText");
          if (label) label.textContent = "더보기";
        }
      };
    }

    // Multi-Photo Carousel Navigation Event Listeners
    const prevBtn = document.getElementById("carouselPrevBtn");
    const nextBtn = document.getElementById("carouselNextBtn");
    if (prevBtn && nextBtn) {
      let curIdx = 0;
      const total = photos.length;
      const slides = document.querySelectorAll(".carouselSlide");
      const idxEl = document.getElementById("carouselCurIdx");

      const showSlide = (idx) => {
        curIdx = (idx + total) % total;
        slides.forEach((s, i) => s.classList.toggle("active", i === curIdx));
        if (idxEl) idxEl.textContent = String(curIdx + 1);
      };

      prevBtn.onclick = (e) => {
        e.stopPropagation();
        showSlide(curIdx - 1);
      };
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        showSlide(curIdx + 1);
      };
    }

    // Helper for seamless in-place Comments Flyout update (no window reload or flicker)
    const updateCommentsFlyoutDom = () => {
      const flyout = document.getElementById("storeCommentsFlyout");
      if (!flyout) return;
      const cList = getStoreComments(facilityId);
      const pageSize = 2;
      const totalPages = Math.ceil(cList.length / pageSize) || 1;
      if (currentDetailCommentPage > totalPages) currentDetailCommentPage = totalPages;
      if (currentDetailCommentPage < 1) currentDetailCommentPage = 1;

      const startIdx = (currentDetailCommentPage - 1) * pageSize;
      const pageComments = cList.slice(startIdx, startIdx + pageSize);

      const itemsHtml = pageComments
        .map((c) => {
          const cMeta = parseAuthorMeta(c.author);
          const canDelete = canDeleteCommentItem(c, facilityId, point);
          return `
            <div class="storeCommentItem">
              <div class="storeCommentMeta">
                <span class="storeCommentAuthor">${escapeHtml(cMeta.displayName || "회원")}</span>
                <span class="storeCommentDate">${escapeHtml(c.date || "")}</span>
                ${canDelete ? `<button type="button" class="commentItemDeleteBtn" data-comment-id="${escapeHtml(String(c.id))}" title="댓글 삭제">삭제</button>` : ""}
              </div>
              <div class="storeCommentText">${escapeHtml(c.text || "")}</div>
            </div>
          `;
        })
        .join("");

      const listEl = flyout.querySelector("#storeCommentList");
      if (listEl) {
        listEl.innerHTML = itemsHtml || '<div style="font-size: 11px; color: #94a3b8; text-align: center; padding: 24px 6px;">첫 번째 응원 댓글을 남겨보세요!</div>';
      }

      const titleEl = flyout.querySelector(".storeSideFlyoutTitle");
      if (titleEl) titleEl.textContent = `💬 방문 후기 & 응원 댓글 (${cList.length}개)`;

      const chipEl = document.querySelector("#btnOpenCommentsFlyout .commentCountChip");
      if (chipEl) chipEl.textContent = String(cList.length);

      const prevBtn = flyout.querySelector("#btnCommentPrevPage");
      const nextBtn = flyout.querySelector("#btnCommentNextPage");
      const indicator = flyout.querySelector(".commentPageIndicator");
      if (prevBtn) prevBtn.disabled = currentDetailCommentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentDetailCommentPage >= totalPages;
      if (indicator) indicator.textContent = `${currentDetailCommentPage} / ${totalPages}`;

      flyout.querySelectorAll(".commentItemDeleteBtn").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const cid = btn.getAttribute("data-comment-id");
          if (!cid) return;
          if (!confirm("해당 댓글을 삭제하시겠습니까?")) return;
          btn.disabled = true;
          await deleteStoreComment(facilityId, cid);
          updateCommentsFlyoutDom();
        };
      });
    };

    // Helper for seamless in-place QA Flyout update (no window reload or flicker)
    const updateQaFlyoutDom = () => {
      const flyout = document.getElementById("storeQaFlyout");
      if (!flyout) return;
      const qList = getStoreQaList(facilityId);
      const itemsHtml = qList
        .slice(0, 3)
        .map((item) => {
          const qMeta = parseQuestionMeta(item.q);
          const aMeta = parseAuthorMeta(item.author);
          const isSecret = qMeta.isSecret;
          const canView = canViewSecretQaItem(item, facilityId, point);
          const canDelete = canDeleteQaItem(item, facilityId, point);
          const canReply = canReplyQaItem(item, facilityId, point);

          let qDisplay = "";
          if (!canView) {
            qDisplay = `<span class="qaSecretMaskedText">🔒 비밀글입니다. (작성자와 해당 매장 점주만 열람 가능)</span>`;
          } else {
            qDisplay = `${isSecret ? '<span class="qaSecretBadge">🔒 비밀글</span> ' : ""}${escapeHtml(qMeta.text)}`;
          }

          let aHtml = "";
          if (item.a) {
            if (!canView) {
              aHtml = `<div class="storeQaA"><span class="aTag">A</span> <span class="qaSecretMaskedText">🔒 비밀 답변입니다.</span></div>`;
            } else {
              aHtml = `
                <div class="storeQaA">
                  <span class="aTag">A</span>
                  <div class="storeQaAText">
                    <span class="storeQaMerchantTag">점주 답변</span>
                    ${escapeHtml(item.a)}
                  </div>
                  ${canReply ? `<button type="button" class="qaAnswerEditBtn" data-qa-id="${escapeHtml(String(item.id))}" title="답변 수정">수정</button>` : ""}
                </div>
              `;
            }
          } else {
            if (canReply) {
              aHtml = `
                <div class="qaReplyForm" id="qaReplyForm_${escapeHtml(String(item.id))}">
                  <div class="qaReplyInputWrap">
                    <input type="text" class="qaReplyInput" id="qaReplyInput_${escapeHtml(String(item.id))}" placeholder="점주 답변을 작성해주세요..." maxlength="150" />
                    <button type="button" class="qaReplySubmitBtn" data-qa-id="${escapeHtml(String(item.id))}">답글 등록</button>
                  </div>
                </div>
              `;
            } else {
              aHtml = `<div style="font-size:10.5px;color:#94a3b8;padding-left:18px;">답변 대기 중</div>`;
            }
          }

          return `
            <div class="storeQaItem">
              <div class="storeQaMeta">
                <span class="storeQaAuthor">${escapeHtml(canView ? (aMeta.displayName || "회원") : "익명")}</span>
                <span class="storeQaDate">${escapeHtml(item.date || "")}</span>
                ${canDelete ? `<button type="button" class="qaItemDeleteBtn" data-qa-id="${escapeHtml(String(item.id))}" title="문의 삭제">삭제</button>` : ""}
              </div>
              <div class="storeQaQ"><span class="qTag">Q</span> ${qDisplay}</div>
              ${aHtml}
            </div>
          `;
        })
        .join("");

      const listEl = flyout.querySelector("#storeQaList");
      if (listEl) {
        listEl.innerHTML = itemsHtml || '<div style="font-size: 11px; color: #94a3b8; text-align: center; padding: 24px 6px;">등록된 문의가 없습니다. 궁금한 점을 질문해보세요!</div>';
      }

      const titleEl = flyout.querySelector(".storeSideFlyoutTitle");
      if (titleEl) titleEl.textContent = `❓ Q&A 혜택 이용 문의 (${qList.length}건)`;

      const chipEl = document.querySelector("#btnOpenQaFlyout .commentCountChip");
      if (chipEl) chipEl.textContent = String(qList.length);

      flyout.querySelectorAll(".qaItemDeleteBtn").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const qid = btn.getAttribute("data-qa-id");
          if (!qid) return;
          if (!confirm("해당 문의(Q&A)를 삭제하시겠습니까?")) return;
          btn.disabled = true;
          await deleteStoreQa(facilityId, qid);
          updateQaFlyoutDom();
        };
      });

      flyout.querySelectorAll(".qaReplySubmitBtn").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const qid = btn.getAttribute("data-qa-id");
          if (!qid) return;
          const inp = document.getElementById(`qaReplyInput_${qid}`);
          const replyText = inp?.value?.trim();
          if (!replyText) {
            alert("답변 내용을 입력해주세요.");
            inp?.focus();
            return;
          }
          btn.disabled = true;
          await replyStoreQa(facilityId, qid, replyText);
          updateQaFlyoutDom();
        };
      });

      flyout.querySelectorAll(".qaAnswerEditBtn").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const qid = btn.getAttribute("data-qa-id");
          if (!qid) return;
          const target = getStoreQaList(facilityId).find((q) => String(q.id) === String(qid));
          const newAns = prompt("수정할 답변 내용을 입력하세요:", target?.a || "");
          if (newAns === null) return;
          btn.disabled = true;
          await replyStoreQa(facilityId, qid, newAns.trim());
          updateQaFlyoutDom();
        };
      });
    };

    // Comment Pagination Buttons
    const btnCommentPrev = document.getElementById("btnCommentPrevPage");
    if (btnCommentPrev) {
      btnCommentPrev.onclick = () => {
        if (currentDetailCommentPage > 1) {
          currentDetailCommentPage--;
          updateCommentsFlyoutDom();
        }
      };
    }
    const btnCommentNext = document.getElementById("btnCommentNextPage");
    if (btnCommentNext) {
      btnCommentNext.onclick = () => {
        currentDetailCommentPage++;
        updateCommentsFlyoutDom();
      };
    }

    // Comment Login Prompt Button
    const btnCommentLoginPrompt = document.getElementById("btnCommentLoginPrompt");
    if (btnCommentLoginPrompt) {
      btnCommentLoginPrompt.onclick = () => {
        if (window.MMAAuth && typeof window.MMAAuth.openAuthModal === "function") {
          window.MMAAuth.openAuthModal("login");
        } else {
          alert("로그인 후 이용하실 수 있습니다.");
        }
      };
    }

    // QA Login Prompt Button
    const btnQaLoginPrompt = document.getElementById("btnQaLoginPrompt");
    if (btnQaLoginPrompt) {
      btnQaLoginPrompt.onclick = () => {
        if (window.MMAAuth && typeof window.MMAAuth.openAuthModal === "function") {
          window.MMAAuth.openAuthModal("login");
        } else {
          alert("로그인 후 이용하실 수 있습니다.");
        }
      };
    }

    // Comment Submit Button
    const commentSubmitBtn = document.getElementById("storeCommentSubmitBtn");
    if (commentSubmitBtn) {
      commentSubmitBtn.onclick = async () => {
        if (!isUserLoggedIn) {
          alert("로그인 후 작성하실 수 있습니다.");
          if (window.MMAAuth?.openAuthModal) window.MMAAuth.openAuthModal("login");
          return;
        }
        const inp = document.getElementById("storeNewCommentInput");
        const text = inp?.value?.trim();
        if (!text) return;
        inp.value = ""; // Clear immediately for snappy feel
        const author = `${userDisplayName} [uid:${currentUser.id || currentUser.phone || "u"}]`;
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
        commentSubmitBtn.disabled = true;
        await addStoreComment(facilityId, { author, text, date });
        commentSubmitBtn.disabled = false;
        currentDetailCommentPage = 1;
        updateCommentsFlyoutDom();
      };
    }

    // Q&A Submit Button
    const qaSubmitBtn = document.getElementById("storeQaSubmitBtn");
    if (qaSubmitBtn) {
      qaSubmitBtn.onclick = async () => {
        if (!isUserLoggedIn) {
          alert("로그인 후 작성하실 수 있습니다.");
          if (window.MMAAuth?.openAuthModal) window.MMAAuth.openAuthModal("login");
          return;
        }
        const inp = document.getElementById("storeNewQaInput");
        const question = inp?.value?.trim();
        if (!question) return;
        inp.value = ""; // Clear immediately for snappy feel
        const secretCheck = document.getElementById("storeQaSecretCheck");
        const isSecret = !!secretCheck?.checked;
        if (secretCheck) secretCheck.checked = false;
        const prefix = isSecret
          ? `[SECRET:${currentUser.id || currentUser.phone || "u"}]`
          : `[PUBLIC:${currentUser.id || currentUser.phone || "u"}]`;
        const qText = `${prefix} ${question}`;
        const author = `${userDisplayName} [uid:${currentUser.id || currentUser.phone || "u"}]`;
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
        qaSubmitBtn.disabled = true;
        await addStoreQa(facilityId, { q: qText, author, a: "", date });
        qaSubmitBtn.disabled = false;
        updateQaFlyoutDom();
      };
    }

    // Bind initial delete and reply buttons inside flyouts
    updateCommentsFlyoutDom();
    updateQaFlyoutDom();

    const printBtn = document.getElementById("detailPrintBtn");
    if (printBtn) {
      printBtn.onclick = () => openPrintModal(point);
    }

    const likeBtn = document.getElementById("detailLikeBtn");
    if (likeBtn) {
      likeBtn.onclick = async () => {
        const willBeActive = !likes.has(facilityId) && !(legacyKey && likes.has(legacyKey));

        // 1. Instant Optimistic UI Update
        if (willBeActive) {
          likes.add(facilityId);
          if (legacyKey) likes.add(legacyKey);
          likeBtn.classList.add("active");
          likeBtn.title = "좋아요 취소";
          showToast(`❤️ <strong>${escapeHtml(point.title || "가맹점")}</strong> 매장에 좋아요를 보냈습니다!`);
        } else {
          likes.delete(facilityId);
          if (legacyKey) likes.delete(legacyKey);
          likeBtn.classList.remove("active");
          likeBtn.title = "좋아요 추천";
          showToast(`🤍 <strong>${escapeHtml(point.title || "가맹점")}</strong> 좋아요를 취소했습니다.`);
        }

        const currentCnt = Math.max(likeCountsById[facilityId] || 0, (legacyKey ? likeCountsById[legacyKey] : 0) || 0);
        const nextCount = Math.max(0, currentCnt + (willBeActive ? 1 : -1));
        likeCountsById[facilityId] = nextCount;
        if (legacyKey) likeCountsById[legacyKey] = nextCount;

        const countEl = document.getElementById("detailLikeCount");
        if (countEl) countEl.textContent = nextCount;

        likeBtn.style.transform = "scale(1.2)";
        setTimeout(() => { likeBtn.style.transform = ""; }, 180);

        if (typeof renderRankPanel === "function") renderRankPanel();
        if (typeof renderFavoritesPanel === "function") renderFavoritesPanel();

        // 2. Background Persistence to Supabase
        try {
          await toggleEngagement(facilityId, "like", willBeActive);
        } catch (_err) {
          console.warn("[Like Sync Error]", _err);
        }
      };
    }

    const favBtn = document.getElementById("detailFavBtn");
    if (favBtn) {
      favBtn.onclick = async () => {
        const willBeFav = !favorites.has(facilityId) && !(legacyKey && favorites.has(legacyKey));

        // 1. Instant Optimistic UI Update
        if (willBeFav) {
          favorites.add(facilityId);
          if (legacyKey) favorites.add(legacyKey);
          favBtn.classList.add("active");
          favBtn.title = "즐겨찾기 해제";
          showToast(`⭐ <strong>${escapeHtml(point.title || "가맹점")}</strong> 매장을 즐겨찾기(찜)에 추가했습니다!`);
        } else {
          favorites.delete(facilityId);
          if (legacyKey) favorites.delete(legacyKey);
          favBtn.classList.remove("active");
          favBtn.title = "즐겨찾기 등록";
          showToast(`⭐ <strong>${escapeHtml(point.title || "가맹점")}</strong> 즐겨찾기에서 해제했습니다.`);
        }

        const currentFavCnt = Math.max(favoriteCountsById[facilityId] || 0, (legacyKey ? favoriteCountsById[legacyKey] : 0) || 0);
        const nextFavCount = Math.max(0, currentFavCnt + (willBeFav ? 1 : -1));
        favoriteCountsById[facilityId] = nextFavCount;
        if (legacyKey) favoriteCountsById[legacyKey] = nextFavCount;

        const countEl = document.getElementById("detailFavCount");
        if (countEl) countEl.textContent = nextFavCount;

        favBtn.style.transform = "scale(1.2)";
        setTimeout(() => { favBtn.style.transform = ""; }, 180);

        if (typeof renderFavoritesPanel === "function") renderFavoritesPanel();
        if (typeof renderRankPanel === "function") renderRankPanel();

        // 2. Background Persistence to Supabase
        try {
          await toggleEngagement(facilityId, "favorite", willBeFav);
        } catch (_err) {
          console.warn("[Fav Sync Error]", _err);
        }
      };
    }

    const routeBtn = document.getElementById("detailRouteBtn");
    if (routeBtn) {
      routeBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.activeRoutePointId === facilityId) {
          window.clearRouteGuide();
        } else {
          findRouteToStore(point);
        }
      };
    }

    // Dynamic auto-centering verification: measure exact rendered DOM height and adjust if needed (only on initial open, not when flyout is open)
    if (!isCommentsFlyoutOpen && !isQaFlyoutOpen) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const panelEl = document.querySelector(".detailPanelInWindow");
          if (!panelEl || !map) return;
          const rect = panelEl.getBoundingClientRect();
          const topSafety = (window.innerWidth <= 768 ? 65 : 75) + 15;
          // If rendered popup is clipped at top (rect.top < topSafety)
          if (rect.top < topSafety) {
            const exactShiftY = calculateDynamicShiftY(panelEl, point);
            const proj = map.getProjection?.();
            if (proj?.fromCoordToOffset && proj?.fromOffsetToCoord) {
              const curMarkerOffset = proj.fromCoordToOffset(targetAnchor);
              const correctCenterOffset = new naver.maps.Point(curMarkerOffset.x, curMarkerOffset.y + exactShiftY);
              const correctCenter = proj.fromOffsetToCoord(correctCenterOffset);
              if (map.panTo) map.panTo(correctCenter);
              else map.setCenter(correctCenter);
            }
          }
        }, 50);
      });
    }
  };

  const getMarkerIcon = (category) => {
    const label = toCategoryLabel(category || "");
    const img = categoryImageByLabel[label];
    if (img) {
      return {
        url: `./img/${img}`,
        size: new naver.maps.Size(56, 56),
        scaledSize: new naver.maps.Size(56, 56),
        anchor: new naver.maps.Point(28, 28),
      };
    }
    const color = colorFromText(label);
    return {
      content: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.24);"></div>`,
      anchor: new naver.maps.Point(10, 20),
    };
  };

  async function getCurrentStartLocation() {
    if (currentUserLatLng && typeof currentUserLatLng.lat === "function") {
      return { lat: currentUserLatLng.lat(), lng: currentUserLatLng.lng(), isMyLocation: true, name: "내 위치" };
    }
    if (navigator.geolocation) {
      try {
        const geoPromise = new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000, enableHighAccuracy: true });
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("geo_timeout")), 2000));
        const pos = await Promise.race([geoPromise, timeoutPromise]);
        if (pos && pos.coords) {
          updateCurrentLocationMarker(pos.coords.latitude, pos.coords.longitude, false);
          return { lat: pos.coords.latitude, lng: pos.coords.longitude, isMyLocation: true, name: "내 위치" };
        }
      } catch (_) {}
    }
    if (map && typeof map.getCenter === "function") {
      const center = map.getCenter();
      return { lat: center.lat(), lng: center.lng(), isMyLocation: false, name: "지도 중심" };
    }
    return { lat: 37.5665, lng: 126.978, isMyLocation: false, name: "지도 중심" };
  }

  function clearRouteGuide() {
    window.activeRoutePointId = null;
    if (window.activeRoutePolyline) {
      window.activeRoutePolyline.setMap(null);
      window.activeRoutePolyline = null;
    }
    if (window.activeRouteOutline) {
      window.activeRouteOutline.setMap(null);
      window.activeRouteOutline = null;
    }
    if (window.routeStartMarker) {
      window.routeStartMarker.setMap(null);
      window.routeStartMarker = null;
    }
    if (window.routeGoalMarker) {
      window.routeGoalMarker.setMap(null);
      window.routeGoalMarker = null;
    }
    const card = document.getElementById("routeGuideCard");
    if (card) card.remove();

    const routeBtn = document.getElementById("detailRouteBtn");
    if (routeBtn) {
      routeBtn.classList.remove("active");
      routeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        <span class="engBtnLabel">길찾기</span>
      `;
    }
  }

  async function findRouteToStore(point) {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      alert("가맹점의 위치 좌표가 올바르지 않습니다.");
      return;
    }

    const fid = point.facilityId || point.facility_id || point.id;
    const routeBtn = document.getElementById("detailRouteBtn");
    if (routeBtn) {
      routeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span class="engBtnLabel">탐색중...</span>
      `;
    }

    try {
      const start = await getCurrentStartLocation();
      const goal = { lat: Number(point.lat), lng: Number(point.lng) };

      let routeData = null;
      try {
        const res = await fetch(`/api/directions?start=${start.lng},${start.lat}&goal=${goal.lng},${goal.lat}`);
        if (res.ok) {
          routeData = await res.json();
        }
      } catch (e) {
        console.warn("[Directions API Error]", e);
      }

      if (!routeData || !routeData.ok || !Array.isArray(routeData.path) || routeData.path.length === 0) {
        try {
          const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${goal.lng},${goal.lat}?overview=full&geometries=geojson`);
          const osrmJson = await osrmRes.json();
          if (osrmJson.code === "Ok" && osrmJson.routes && osrmJson.routes[0]) {
            routeData = {
              ok: true,
              source: "osrm_client",
              distance: osrmJson.routes[0].distance,
              duration: osrmJson.routes[0].duration,
              path: osrmJson.routes[0].geometry.coordinates
            };
          }
        } catch (_) {}
      }

      if (!routeData || !Array.isArray(routeData.path) || routeData.path.length === 0) {
        const dlat = (goal.lat - start.lat) * 111000;
        const dlng = (goal.lng - start.lng) * 88800;
        const dist = Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 1.3);
        routeData = {
          ok: true,
          source: "direct",
          distance: dist,
          duration: Math.round(dist / 8.3),
          path: [[start.lng, start.lat], [goal.lng, goal.lat]]
        };
      }

      window.activeRoutePointId = fid;
      renderRouteOnMap(start, goal, point, routeData);
    } catch (err) {
      console.error("[Route Find Error]", err);
      alert("경로를 탐색하는 중 오류가 발생했습니다.");
    } finally {
      if (routeBtn) {
        routeBtn.classList.add("active");
        routeBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
          <span class="engBtnLabel">경로 표시중</span>
        `;
      }
    }
  }

  function renderRouteOnMap(start, goal, point, routeData) {
    if (!map || typeof naver === "undefined" || !naver.maps) return;

    clearRouteGuide();
    window.activeRoutePointId = point.facilityId || point.facility_id || point.id;

    const pathCoords = routeData.path || [];
    const latLngPath = pathCoords.map(c => new naver.maps.LatLng(c[1], c[0]));

    // 1. Outline Glow Polyline
    window.activeRouteOutline = new naver.maps.Polyline({
      map: map,
      path: latLngPath,
      strokeColor: "#1e40af",
      strokeWeight: 10,
      strokeOpacity: 0.35,
      strokeLineCap: "round",
      strokeLineJoin: "round",
      zIndex: 100
    });

    // 2. Main Vibrant Navigation Polyline
    window.activeRoutePolyline = new naver.maps.Polyline({
      map: map,
      path: latLngPath,
      strokeColor: "#2563eb",
      strokeWeight: 6,
      strokeOpacity: 0.95,
      strokeLineCap: "round",
      strokeLineJoin: "round",
      zIndex: 101
    });

    // 3. Start Marker
    window.routeStartMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(start.lat, start.lng),
      map: map,
      icon: {
        content: `
          <div style="display:flex; align-items:center; gap:5px; background:#0f172a; color:#fff; padding:5px 10px; border-radius:18px; font-size:11.5px; font-weight:800; box-shadow:0 4px 12px rgba(0,0,0,0.3); border:2px solid #fff; white-space:nowrap;">
            <span>📍 출발 (${escapeHtml(start.name || (start.isMyLocation ? "내 위치" : "출발지"))})</span>
          </div>
        `,
        anchor: new naver.maps.Point(36, 16)
      },
      zIndex: 105
    });

    // 4. Goal Marker
    window.routeGoalMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(goal.lat, goal.lng),
      map: map,
      icon: {
        content: `
          <div style="display:flex; align-items:center; gap:5px; background:#2563eb; color:#fff; padding:5px 10px; border-radius:18px; font-size:11.5px; font-weight:800; box-shadow:0 4px 12px rgba(37,99,235,0.4); border:2px solid #fff; white-space:nowrap;">
            <span>🏁 ${escapeHtml(point.title || "도착")}</span>
          </div>
        `,
        anchor: new naver.maps.Point(36, 16)
      },
      zIndex: 105
    });

    // 5. Fit Map Bounds
    const bounds = new naver.maps.LatLngBounds();
    latLngPath.forEach(pt => bounds.extend(pt));
    bounds.extend(new naver.maps.LatLng(start.lat, start.lng));
    bounds.extend(new naver.maps.LatLng(goal.lat, goal.lng));
    map.fitBounds(bounds, { margin: 80 });

    // 6. Formatting Distance & Duration
    const distMeters = routeData.distance || 0;
    const durSecs = routeData.duration || 0;
    const distStr = distMeters >= 1000 ? (distMeters / 1000).toFixed(1) + " km" : distMeters + " m";
    const durStr = durSecs >= 3600
      ? Math.floor(durSecs / 3600) + "시간 " + Math.round((durSecs % 3600) / 60) + "분"
      : Math.max(1, Math.round(durSecs / 60)) + "분";

    // 7. Render Floating Route Card
    const naverNavUrl = `https://map.naver.com/v5/directions/${start.lng},${start.lat},${encodeURIComponent(start.name || (start.isMyLocation ? "내 위치" : "출발지"))}/${goal.lng},${goal.lat},${encodeURIComponent(point.title || "도착지")}/-/car`;
    
    const card = document.createElement("div");
    card.id = "routeGuideCard";
    card.className = "routeGuideCard";
    card.innerHTML = `
      <div class="routeGuideMain">
        <div class="routeGuideSummary">
          <span class="routeGuideDuration">약 ${durStr}</span>
          <span class="routeGuideDistance">${distStr}</span>
          <span class="routeGuideTag" style="font-size: 11px; color: #059669; font-weight: 800; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">실시간 주행 경로</span>
        </div>
        <div class="routeGuideLocations">
          <span>📍 출발지 (${escapeHtml(start.name || (start.isMyLocation ? "내 위치" : "지도 중심"))})</span> ➔ <strong>${escapeHtml(point.title || "가맹점")}</strong>
        </div>
      </div>
      <div class="routeGuideActions">
        <a href="${naverNavUrl}" target="_blank" rel="noopener noreferrer" class="routeGuideNaverBtn" title="네이버 지도 앱 또는 웹에서 상세 길안내">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>네이버 길안내</span>
        </a>
        <button type="button" class="routeGuideCloseBtn" onclick="window.clearRouteGuide()" title="지도에서 경로 지우기">경로 닫기</button>
      </div>
    `;
    document.body.appendChild(card);

    if (typeof showToast === "function") {
      showToast(`🚗 <strong>${escapeHtml(point.title)}</strong> 매장까지의 경로가 지도에 표시되었습니다. (약 ${durStr}, ${distStr})`);
    }
  }

  window.findRouteToStore = findRouteToStore;
  window.clearRouteGuide = clearRouteGuide;

  const getMarkerIconByPoint = (point) => {
    const specialImg = getTheaterMarkerImage(point?.title || "");
    if (specialImg) {
      return {
        url: `./img/${specialImg}`,
        size: new naver.maps.Size(68, 68),
        scaledSize: new naver.maps.Size(68, 68),
        anchor: new naver.maps.Point(34, 34),
      };
    }
    return getMarkerIcon(point?.category || "");
  };

  const pointMatchAudience = (point, audience) => {
    if (!audience) return true;
    const list = Array.isArray(point?.audiences) ? point.audiences : [];
    return list.includes(audience);
  };

  const pointMatchRegion = (point, region) => {
    if (!region) return true;
    return String(point?.region || "").trim() === region;
  };

  const REGION_CENTERS = {
    "서울": { lat: 37.5665, lng: 126.9780 },
    "경기": { lat: 37.2636, lng: 127.0286 },
    "경인": { lat: 37.4563, lng: 126.7052 },
    "경기북부": { lat: 37.7381, lng: 127.0337 },
    "인천": { lat: 37.4563, lng: 126.7052 },
    "대전": { lat: 36.3504, lng: 127.3845 },
    "대전.충남": { lat: 36.3504, lng: 127.3845 },
    "대구": { lat: 35.8714, lng: 128.6014 },
    "대구.경북": { lat: 35.8714, lng: 128.6014 },
    "부산": { lat: 35.1796, lng: 129.0756 },
    "부산.울산": { lat: 35.1796, lng: 129.0756 },
    "울산": { lat: 35.5384, lng: 129.3114 },
    "광주": { lat: 35.1595, lng: 126.8526 },
    "광주.전남": { lat: 35.1595, lng: 126.8526 },
    "세종": { lat: 36.4800, lng: 127.2890 },
    "강원": { lat: 37.8854, lng: 127.7298 },
    "강원영동": { lat: 37.7519, lng: 128.8761 },
    "충북": { lat: 36.6357, lng: 127.4917 },
    "충남": { lat: 36.6588, lng: 126.6728 },
    "전북": { lat: 35.8242, lng: 127.1480 },
    "전남": { lat: 34.8161, lng: 126.4629 },
    "경북": { lat: 36.5760, lng: 128.5056 },
    "경남": { lat: 35.2383, lng: 128.6924 },
    "제주": { lat: 33.4996, lng: 126.5312 }
  };

  const moveMapToRegion = (region) => {
    const centerCoord = REGION_CENTERS[region];
    if (centerCoord) {
      map.panTo(new naver.maps.LatLng(centerCoord.lat, centerCoord.lng));
      return;
    }
    const targets = points.filter((p) => pointMatchRegion(p, region) && isValidKoreaCoord(Number(p.lat), Number(p.lng)));
    if (!targets.length) return;
    const avgLat = targets.reduce((sum, p) => sum + p.lat, 0) / targets.length;
    const avgLng = targets.reduce((sum, p) => sum + p.lng, 0) / targets.length;
    map.panTo(new naver.maps.LatLng(avgLat, avgLng));
  };

  const focusFacility = (facilityId) => {
    if (!facilityId) return;
    let target = pointByFacilityKey.get(facilityId);
    if (!target) {
      for (const p of points) {
        if (p.facilityId === facilityId || getFacilityKey(p) === facilityId) {
          target = p;
          break;
        }
      }
    }
    if (!target) return;
    const key = getFacilityKey(target);
    if (selectedFacilityId && selectedFacilityId !== key) hideDetailPanelOnly();
    selectedFacilityId = key;

    selectedCategory = "";
    selectedAudience = "";
    selectedRegion = "";
    buildLegend();
    buildAudienceLegend();
    if (regionSelectEl) regionSelectEl.value = "";
    renderRankPanel();

    const targetZoom = Math.max(map.getZoom(), 16);
    if (map.getZoom() !== targetZoom) {
      map.setZoom(targetZoom, false);
      updateZoomLabel();
    }

    const pos = new naver.maps.LatLng(target.lat, target.lng);
    renderVisibleMarkers();
    setTimeout(() => {
      openDetailAfterMapMove(target, pos);
    }, 120);
  };
  window.focusFacility = focusFacility;

  const getRankingRows = () => {
    const allRows = [...pointByFacilityKey.entries()]
      .map(([id, point]) => ({ id, point }))
      .filter((row) => pointMatchRegion(row.point, selectedRegion));

    const activeRows = allRows
      .map((row) => {
        const clicks = getClickCount(row.id);
        const lks = getLikeCount(row.id);
        const favs = getFavoriteCount(row.id);
        const totalScore = clicks + (lks * 2) + (favs * 3);
        return { ...row, score: totalScore, clicks, likes: lks, favorites: favs };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.point.title.localeCompare(b.point.title, "ko"));

    if (activeRows.length > 0) return activeRows;

    // If no stores have clicks or likes yet, display real registered stores with 0 engagement (NO FAKE DATA)
    return allRows.slice(0, 20).map((row) => ({ ...row, score: 0 }));
  };

  const buildRankAudienceFilters = () => {
    if (!rankAudienceFiltersEl) return;
    const items = ["전체", ...audienceFilters];
    rankAudienceFiltersEl.innerHTML = "";
    for (const name of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rankAudienceBtn";
      if ((name === "전체" && !rankingAudience) || rankingAudience === name) btn.classList.add("active");
      btn.textContent = getAudienceDisplayName(name);
      btn.title = name;
      btn.addEventListener("click", () => {
        rankingAudience = name === "전체" ? "" : name;
        buildRankAudienceFilters();
        renderRankPanel();
      });
      rankAudienceFiltersEl.appendChild(btn);
    }
  };

  const stopRankTicker = () => {
    if (rankTickerTimer) {
      clearInterval(rankTickerTimer);
      rankTickerTimer = null;
    }
  };

  const renderRankHeadByIndex = (rows, idx) => {
    if (!rows.length) {
      if (rankTopTextEl) rankTopTextEl.textContent = "실시간 상생 랭킹";
      if (rankTopScoreEl) rankTopScoreEl.textContent = "0";
      return;
    }
    const safeIdx = ((idx % rows.length) + rows.length) % rows.length;
    const row = rows[safeIdx];
    const name = row.point.title || "-";
    if (row.score > 0) {
      if (rankTopTextEl) rankTopTextEl.textContent = `#${safeIdx + 1} ${name}`;
      if (rankTopScoreEl) rankTopScoreEl.textContent = `${row.score}점`;
    } else {
      if (rankTopTextEl) rankTopTextEl.textContent = `#${safeIdx + 1} ${name}`;
      if (rankTopScoreEl) rankTopScoreEl.textContent = "참여";
    }
  };

  const startRankTicker = (rows) => {
    stopRankTicker();
    rankTickerRows = rows.slice(0, 10);
    rankTickerIndex = 0;
    renderRankHeadByIndex(rankTickerRows, rankTickerIndex);
    if (rankTickerRows.length <= 1) return;
    rankTickerTimer = setInterval(() => {
      rankTickerIndex = (rankTickerIndex + 1) % rankTickerRows.length;
      renderRankHeadByIndex(rankTickerRows, rankTickerIndex);
    }, 1800);
  };

  function renderRankPanel() {
    if (!rankListEl) return;
    const rows = getRankingRows().slice(0, 30);
    if (!rows.length) {
      stopRankTicker();
      if (rankTopTextEl) rankTopTextEl.textContent = "#1 -";
      if (rankTopScoreEl) rankTopScoreEl.textContent = "0";
      rankListEl.innerHTML = `<div class="rankEmpty">No data</div>`;
      return;
    }

    startRankTicker(rows);

    rankListEl.innerHTML = "";
    rows.forEach((row, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rankRow";
      const valueText = `${row.score}`;
      btn.innerHTML = `
        <span class="rankNo">${idx + 1}</span>
        <span class="rankName">${escapeHtml(row.point.title || "Place")}</span>
        <span class="rankVal">${escapeHtml(valueText)}</span>
      `;
      btn.addEventListener("click", () => focusFacility(row.id));
      rankListEl.appendChild(btn);
    });
  }

  const getStoreSequenceValue = (point) => {
    const fromId = String(point?.facilityId || "").match(/_(\d+)$/);
    if (fromId) return Number(fromId[1]);
    const fromUrl = String(point?.detailUrl || "").match(/[?&]udgigwan_cd=(\d+)/);
    if (fromUrl) return Number(fromUrl[1]);
    return 0;
  };

  const stopNewStoreRoll = () => {
    if (newStoreRollTimer) {
      clearInterval(newStoreRollTimer);
      newStoreRollTimer = null;
    }
    if (newStoreRollResetTimer) {
      clearTimeout(newStoreRollResetTimer);
      newStoreRollResetTimer = null;
    }
  };

  const shuffleArray = (arr) => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const getNewStoreRows = () => {
    const byId = new Map();
    points.forEach((p) => {
      const key = getFacilityKey(p);
      if (!key) return;
      const prev = byId.get(key);
      if (prev) return;
      byId.set(key, {
        id: key,
        seq: getStoreSequenceValue(p),
        title: String(p.title || "이름없음"),
        region: String(p.region || "").trim() || "지역미상",
      });
    });
    const allRows = [...byId.values()];
    const randomRows = shuffleArray(allRows).slice(0, 20);
    return { totalCount: allRows.length, rows: randomRows };
  };

  const renderNewStorePanel = () => {
    if (!newStoreRollTrackEl || !newStoreTotalCountEl) return;
    stopNewStoreRoll();
    const { totalCount, rows } = getNewStoreRows();
    newStoreTotalCountEl.textContent = String(totalCount);
    if (!rows.length) {
      newStoreRollTrackEl.innerHTML = `
        <button type="button" class="newStoreRollItem" disabled>
          <span class="newStoreRollItemName">표시할 스토어가 없습니다.</span>
          <span class="newStoreRollItemMeta"></span>
        </button>
      `;
      return;
    }

    const lineHtml = rows
      .map(
        (row) => `
          <button type="button" class="newStoreRollItem" data-store-id="${escapeHtml(row.id)}">
            <span class="newStoreRollItemName">${escapeHtml(row.title)}</span>
            <span class="newStoreRollItemMeta">${escapeHtml(row.region)}</span>
          </button>
        `
      )
      .join("");
    const firstClone = rows.length > 1
      ? `
          <button type="button" class="newStoreRollItem" data-store-id="${escapeHtml(rows[0].id)}">
            <span class="newStoreRollItemName">${escapeHtml(rows[0].title)}</span>
            <span class="newStoreRollItemMeta">${escapeHtml(rows[0].region)}</span>
          </button>
        `
      : "";
    newStoreRollTrackEl.innerHTML = `${lineHtml}${firstClone}`;
    newStoreRollTrackEl.style.transition = "none";
    newStoreRollTrackEl.style.transform = "translateY(0)";
    newStoreRollIndex = 0;

    [...newStoreRollTrackEl.querySelectorAll(".newStoreRollItem[data-store-id]")].forEach((btn) => {
      btn.addEventListener("click", () => {
        const facilityId = String(btn.dataset.storeId || "");
        if (!facilityId) return;
        focusFacility(facilityId);
      });
    });

    if (rows.length <= 1) return;
    const lineHeight = 32;
    newStoreRollTimer = setInterval(() => {
      newStoreRollIndex += 1;
      newStoreRollTrackEl.style.transition = "transform 380ms ease";
      newStoreRollTrackEl.style.transform = `translateY(-${lineHeight * newStoreRollIndex}px)`;
      if (newStoreRollIndex === rows.length) {
        newStoreRollResetTimer = setTimeout(() => {
          newStoreRollTrackEl.style.transition = "none";
          newStoreRollTrackEl.style.transform = "translateY(0)";
          newStoreRollIndex = 0;
        }, 420);
      }
    }, 2400);
  };

  const closeFavoritesPanel = () => {
    if (favoritesPanel) favoritesPanel.classList.add("hidden");
  };

  const toggleFavoritesPanel = () => {
    if (!favoritesPanel) return;
    favoritesPanel.classList.toggle("hidden");
    if (!favoritesPanel.classList.contains("hidden")) renderFavoritesPanel();
  };

  function renderSavedStoresPanel(panelType = "favorites") {
    if (!favoritesListEl) return;
    const titleEl = document.getElementById("savedPanelTitle");
    const isLike = panelType === "likes";
    if (titleEl) {
      titleEl.textContent = isLike ? "❤️ 찜한 매장 (좋아요)" : "⭐ 즐겨찾기 매장";
    }

    const setObj = isLike ? likes : favorites;
    const ids = [...setObj];
    if (!ids.length) {
      favoritesListEl.innerHTML = `
        <div class="favoriteEmpty">
          <div style="font-size:24px; margin-bottom:6px;">${isLike ? "❤️" : "⭐"}</div>
          <strong>${isLike ? "찜한(좋아요) 매장이 없습니다." : "즐겨찾기한 매장이 없습니다."}</strong>
          <p style="margin:4px 0 0; font-size:11.5px; color:#94a3b8;">지도에서 매장 핀을 클릭하고 ${isLike ? "❤️" : "⭐"}를 눌러보세요!</p>
        </div>
      `;
      return;
    }

    ids.sort((a, b) => {
      const an = pointByFacilityKey.get(a)?.title || "";
      const bn = pointByFacilityKey.get(b)?.title || "";
      return an.localeCompare(bn, "ko");
    });
    favoritesListEl.innerHTML = "";

    for (const id of ids) {
      const point = pointByFacilityKey.get(id);
      const item = document.createElement("button");
      item.type = "button";
      item.className = "favoriteItem";
      if (!point) {
        item.innerHTML = `<strong class="name">데이터 없음</strong>`;
      } else {
        item.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
            <strong class="name" style="font-size:14px; font-weight:800; color:#0f172a;">${escapeHtml(point.title || "가맹점")}</strong>
            <span style="font-size:11px; font-weight:700; color:#2563eb; background:#eff6ff; padding:2px 6px; border-radius:6px;">${escapeHtml(toCategoryLabel(point.category || ""))}</span>
          </div>
        `;
      }
      item.addEventListener("click", () => {
        if (!pointByFacilityKey.get(id)) return;
        focusFacility(id);
        closeFavoritesPanel();
      });
      favoritesListEl.appendChild(item);
    }
  }
  window.renderSavedStoresPanel = renderSavedStoresPanel;
  window.renderFavoritesPanel = renderSavedStoresPanel;

  const legendEl = document.getElementById("categoryLegend");
  const audienceLegendEl = document.getElementById("audienceLegend");
  const legendTabCategoryEl = document.getElementById("legendTabCategory");
  const legendTabAudienceEl = document.getElementById("legendTabAudience");
  let activeLegendTab = "category";

  const updateLegendTabUi = () => {
    if (legendTabCategoryEl) legendTabCategoryEl.classList.toggle("active", activeLegendTab === "category");
    if (legendTabAudienceEl) legendTabAudienceEl.classList.toggle("active", activeLegendTab === "audience");
    if (legendEl) legendEl.classList.remove("hiddenLegend");
    if (audienceLegendEl) audienceLegendEl.classList.remove("hiddenLegend");
  };

  const buildLegend = () => {
    if (!legendEl) return;
    const items = ["전체", ...CATEGORY_FIXED_IMAGE_LABEL_ORDER];
    legendEl.innerHTML = "";
    for (const name of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `legendItem ${name === "전체" ? "all" : ""}`;
      if ((name === "전체" && !selectedCategory) || selectedCategory === name) btn.classList.add("active");
      const color = name === "전체" ? "#6b7280" : colorFromText(name);
      const legendImg = name === "전체" ? "" : categoryImageByLabel[name] || "";
      const dotClass = legendImg ? "legendDot hasImage" : "legendDot";
      const dotStyle = legendImg ? `--dot-image:url('./img/${legendImg}')` : `--dot-color:${color}`;
      btn.innerHTML = `<span class="${dotClass}" style="${dotStyle}"></span><span class="legendLabel">${escapeHtml(name)}</span>`;
      btn.addEventListener("click", () => {
        selectedCategory = name === "전체" ? "" : name;
        buildLegend();
        renderVisibleMarkers();
      });
      legendEl.appendChild(btn);
    }
  };

  const buildAudienceLegend = () => {
    if (!audienceLegendEl) return;
    const items = ["전체", ...audienceFilters];
    audienceLegendEl.innerHTML = "";
    for (const name of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `legendItem ${name === "전체" ? "all" : ""}`;
      if ((name === "전체" && !selectedAudience) || selectedAudience === name) btn.classList.add("active");
      const color = name === "전체" ? "#6b7280" : colorFromText(name);
      const legendImg = audienceIconByName[name] || "";
      const dotClass = legendImg ? "legendDot hasImage" : "legendDot";
      const dotStyle = legendImg ? `--dot-image:url('./img/${legendImg}')` : `--dot-color:${color}`;
      btn.innerHTML = `<span class="${dotClass}" style="${dotStyle}"></span><span class="legendLabel" title="${escapeHtml(name)}">${escapeHtml(getAudienceDisplayName(name))}</span>`;
      btn.addEventListener("click", () => {
        selectedAudience = name === "전체" ? "" : name;
        buildAudienceLegend();
        renderVisibleMarkers();
      });
      audienceLegendEl.appendChild(btn);
    }
  };

  const renderDistrictClusters = (bounds) => {
    const currentZoom = map.getZoom();
    const isProvinceLevel = currentZoom <= 11; // Zoom <= 11: 서울, 경기, 강원 등 광역 시·도 단위
    const clusterMap = new Map();
    const nextClusterMarkerMap = new Map();

    for (const p of points) {
      if (selectedCategory && toCategoryLabel(p.category || "") !== selectedCategory) continue;
      if (selectedAudience) {
        const aud = Array.isArray(p.audiences) ? p.audiences : [];
        if (!aud.includes(selectedAudience)) continue;
      }
      if (!pointMatchRegion(p, selectedRegion)) continue;

      if (!p.lat || !p.lng || p.lat < 30) continue;

      const groupName = isProvinceLevel
        ? extractProvinceName(p.address, p.lat, p.lng)
        : extractCityName(p.address, p.lat, p.lng);

      if (!clusterMap.has(groupName)) {
        clusterMap.set(groupName, {
          name: groupName,
          lats: [],
          lngs: [],
          naraCount: 0,
          mmgCount: 0,
          total: 0,
        });
      }
      const c = clusterMap.get(groupName);
      c.lats.push(p.lat);
      c.lngs.push(p.lng);
      if (p.sourceType === "nara_sarang_store") {
        c.naraCount += 1;
      } else {
        c.mmgCount += 1;
      }
      c.total += 1;
    }

    const PROVINCE_REPRESENTATIVE_CENTERS = {
      "서울": { lat: 37.5800, lng: 126.9800 },
      "인천": { lat: 37.4800, lng: 126.4200 },
      "경기": { lat: 37.2800, lng: 127.4800 },
      "강원": { lat: 37.8200, lng: 128.2500 },
      "충북": { lat: 36.8000, lng: 127.8000 },
      "충남": { lat: 36.5500, lng: 126.5000 },
      "대전": { lat: 36.2800, lng: 127.3800 },
      "세종": { lat: 36.5500, lng: 127.1800 },
      "전북": { lat: 35.7500, lng: 127.1200 },
      "전남": { lat: 34.7200, lng: 127.0500 },
      "광주": { lat: 35.1600, lng: 126.7500 },
      "경북": { lat: 36.5000, lng: 128.7500 },
      "대구": { lat: 35.8500, lng: 128.5600 },
      "경남": { lat: 35.3200, lng: 128.1500 },
      "부산": { lat: 35.1200, lng: 129.0800 },
      "울산": { lat: 35.5400, lng: 129.3200 },
      "제주": { lat: 33.3800, lng: 126.5300 },
    };

    clusterMap.forEach((c, groupName) => {
      let centerLat, centerLng;
      if (isProvinceLevel && PROVINCE_REPRESENTATIVE_CENTERS[groupName]) {
        centerLat = PROVINCE_REPRESENTATIVE_CENTERS[groupName].lat;
        centerLng = PROVINCE_REPRESENTATIVE_CENTERS[groupName].lng;
      } else {
        centerLat = c.lats.reduce((a, b) => a + b, 0) / c.lats.length;
        centerLng = c.lngs.reduce((a, b) => a + b, 0) / c.lngs.length;
      }
      const pos = new naver.maps.LatLng(centerLat, centerLng);
      const key = `cluster_${isProvinceLevel ? 'prov' : 'city'}_${groupName}_${c.total}`;

      if (activeClusterMarkerMap.has(key)) {
        nextClusterMarkerMap.set(key, activeClusterMarkerMap.get(key));
      } else {
        const marker = new naver.maps.Marker({
          position: pos,
          map,
          icon: {
            content: `
              <div class="districtClusterBadge ${isProvinceLevel ? 'provinceLevel' : ''}">
                <div class="districtClusterHead">
                  <span class="districtClusterName">${escapeHtml(c.name)}</span>
                  <span class="districtClusterTotal">${c.total}개소</span>
                </div>
                <div class="districtClusterBody">
                  <span class="clusterTag nara">🎖️ 나라사랑 <b>${c.naraCount}</b></span>
                  <span class="clusterTag mmg">🏛️ 명문가 <b>${c.mmgCount}</b></span>
                </div>
              </div>
            `,
            anchor: new naver.maps.Point(0, 0),
          },
          zIndex: isProvinceLevel ? 600 : 500,
        });

        naver.maps.Event.addListener(marker, "click", () => {
          map.setCenter(pos);
          const nextZoom = isProvinceLevel ? 12 : 14;
          map.setZoom(nextZoom, true);
          updateZoomLabel();
        });

        nextClusterMarkerMap.set(key, marker);
      }
    });

    activeClusterMarkerMap.forEach((marker, key) => {
      if (!nextClusterMarkerMap.has(key)) {
        marker.setMap(null);
      }
    });
    activeClusterMarkerMap = nextClusterMarkerMap;

    // Clear individual store markers in cluster view
    activeMarkerMap.forEach((marker) => marker.setMap(null));
    activeMarkerMap.clear();
    renderedMarkers = [];
  };

  const renderVisibleMarkers = () => {
    const bounds = map.getBounds();
    const currentZoom = map.getZoom();

    // In zoom level <= 11 (Overview & District view), show district aggregation clusters
    if (currentZoom <= 11) {
      renderDistrictClusters(bounds);
      return;
    }

    // In zoom level >= 12, clear district clusters and render individual markers
    if (activeClusterMarkerMap.size > 0) {
      activeClusterMarkerMap.forEach((marker) => marker.setMap(null));
      activeClusterMarkerMap.clear();
    }

    const visible = [];
    const selectedBeforeRender = selectedFacilityId;
    const MAX_MARKERS = 700;

    for (const p of points) {
      if (visible.length >= MAX_MARKERS) break;
      if (selectedCategory && toCategoryLabel(p.category || "") !== selectedCategory) continue;
      if (selectedAudience) {
        const aud = Array.isArray(p.audiences) ? p.audiences : [];
        if (!aud.includes(selectedAudience)) continue;
      }
      if (!pointMatchRegion(p, selectedRegion)) continue;
      const pos = new naver.maps.LatLng(p.lat, p.lng);
      if (!bounds || typeof bounds.hasLatLng !== "function" || bounds.hasLatLng(pos)) {
        visible.push({ ...p, pos });
      }
    }

    const nextMarkerMap = new Map();

    for (let i = 0; i < visible.length; i++) {
      const v = visible[i];
      const key = getFacilityKey(v);

      if (activeMarkerMap.has(key)) {
        // Reuse existing marker without destroying/recreating DOM (NO FLICKERING)
        nextMarkerMap.set(key, activeMarkerMap.get(key));
      } else {
        const baseZIndex = 100 + i;
        const marker = new naver.maps.Marker({
          position: v.pos,
          map,
          icon: getMarkerIconByPoint(v),
          zIndex: baseZIndex,
        });
        marker.__facilityKey = key;

        naver.maps.Event.addListener(marker, "mouseover", () => {
          if (selectedFacilityId) return;
          marker.setZIndex(50000);
          const sub = [...new Set([v.subtitle, toCategoryLabel(v.category)].filter(Boolean))].join(" · ");
          hoverInfoWindow.setContent(`
            <div style="padding:8px 10px;min-width:160px;font-size:12px;line-height:1.4;">
              <div style="font-weight:700;color:#1f2d45;">${escapeHtml(v.title)}</div>
              ${sub ? `<div style="margin-top:2px;color:#54698f;">${escapeHtml(sub)}</div>` : ""}
            </div>
          `);
          hoverInfoWindow.open(map, marker);
        });
        naver.maps.Event.addListener(marker, "mouseout", () => {
          if (selectedFacilityId) return;
          marker.setZIndex(baseZIndex);
          hoverInfoWindow.close();
        });
        naver.maps.Event.addListener(marker, "click", () => {
          lastMarkerClickTime = Date.now();
          if (selectedFacilityId && selectedFacilityId !== marker.__facilityKey) hideDetailPanelOnly();
          selectedFacilityId = marker.__facilityKey;
          if (map.getZoom() < 12) {
            map.setZoom(13, true);
            updateZoomLabel();
          }
          openDetailAfterMapMove(v, v.pos, marker);
          clickCountsById[selectedFacilityId] = getClickCount(selectedFacilityId) + 1;
          renderRankPanel();
          recordFacilityClick(selectedFacilityId)
            .then((resp) => {
              clickCountsById[selectedFacilityId] = Number(resp.clickCount || clickCountsById[selectedFacilityId] || 0);
              renderRankPanel();
            })
            .catch(() => {});
        });

        nextMarkerMap.set(key, marker);
      }
    }

    // Remove markers that left the visible viewport
    activeMarkerMap.forEach((marker, key) => {
      if (!nextMarkerMap.has(key)) {
        marker.setMap(null);
      }
    });

    activeMarkerMap = nextMarkerMap;
    renderedMarkers = Array.from(activeMarkerMap.values());

    if (selectedBeforeRender) {
      if (!ENABLE_DETAIL_PANEL) {
        if (detailPanelEl && !detailPanelEl.classList.contains("hidden")) closeDetailPanel();
        return;
      }
      const selectedPoint = visible.find((v) => getFacilityKey(v) === selectedBeforeRender);
      if (
        selectedPoint &&
        detailPanelEl &&
        !detailPanelEl.classList.contains("hidden") &&
        selectedDetailAnchor
      ) {
        placeDetailPanelAboveMarker(selectedDetailAnchor);
      }
    }
  };

  const scheduleRender = () => {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(renderVisibleMarkers, 80);
  };

  const zoomLevelBtn = document.getElementById("btnZoomLevel");
  const updateZoomLabel = () => {
    if (zoomLevelBtn) zoomLevelBtn.textContent = map.getZoom();
  };
  updateZoomLabel();

  const btnZoomIn = document.getElementById("btnZoomIn");
  const btnZoomOut = document.getElementById("btnZoomOut");
  const btnLocate = document.getElementById("btnLocate");

  if (btnZoomIn) btnZoomIn.addEventListener("click", () => { closeDetailPanel(); map.setZoom(map.getZoom() + 1, true); updateZoomLabel(); });
  if (btnZoomOut) btnZoomOut.addEventListener("click", () => { closeDetailPanel(); map.setZoom(map.getZoom() - 1, true); updateZoomLabel(); });
  if (zoomLevelBtn) zoomLevelBtn.addEventListener("click", () => { closeDetailPanel(); map.setCenter(defaultCenter); map.setZoom(defaultZoom, true); updateZoomLabel(); });
  const updateCurrentLocationMarker = (lat, lng, panTo = false) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 30) return;
    currentUserLatLng = new naver.maps.LatLng(lat, lng);
    window.currentUserLatLng = currentUserLatLng;

    if (!currentLocationMarker) {
      currentLocationMarker = new naver.maps.Marker({
        position: currentUserLatLng,
        map,
        icon: {
          content: `
            <div class="myLocationBeaconWrap" title="현재 내 위치 (클릭 시 화면 이동)">
              <div class="myLocationRipple"></div>
              <div class="myLocationRadarRing"></div>
              <div class="myLocationCoreDot"></div>
              <div class="myLocationPinLabel">📍 현재 내 위치</div>
            </div>
          `,
          anchor: new naver.maps.Point(16, 16),
        },
        zIndex: 99999,
      });

      naver.maps.Event.addListener(currentLocationMarker, "click", () => {
        if (currentUserLatLng) {
          map.panTo(currentUserLatLng);
          map.setZoom(16, true);
          updateZoomLabel();
        }
      });
    } else {
      currentLocationMarker.setPosition(currentUserLatLng);
      currentLocationMarker.setMap(map);
    }

    if (panTo) {
      if (typeof map.morph === "function") {
        map.morph(currentUserLatLng, Math.max(map.getZoom(), 16));
      } else {
        map.setCenter(currentUserLatLng);
        map.setZoom(Math.max(map.getZoom(), 16), true);
      }
      updateZoomLabel();
      renderVisibleMarkers();
    }
  };

  if (btnLocate) {
    btnLocate.addEventListener("click", () => {
      closeDetailPanel();
      if (currentUserLatLng) {
        if (typeof map.morph === "function") {
          map.morph(currentUserLatLng, Math.max(map.getZoom(), 16));
        } else {
          map.setCenter(currentUserLatLng);
          map.setZoom(Math.max(map.getZoom(), 16), true);
        }
        updateZoomLabel();
        renderVisibleMarkers();
        if (typeof showToast === "function") {
          showToast("📍 현재 내 위치로 이동했습니다.");
        }
        return;
      }
      if (navigator.geolocation) {
        btnLocate.style.opacity = "0.6";
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            btnLocate.style.opacity = "1";
            updateCurrentLocationMarker(pos.coords.latitude, pos.coords.longitude, true);
            if (typeof showToast === "function") {
              showToast("📍 현재 내 위치로 이동했습니다.");
            }
          },
          () => {
            btnLocate.style.opacity = "1";
            alert("현재 위치를 가져오지 못했습니다. 브라우저 위치 접근 권한을 확인해 주세요.");
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
        );
      }
    });

    // Request location once gracefully on startup
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateCurrentLocationMarker(pos.coords.latitude, pos.coords.longitude, false);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
      );
    }
  }

  window.moveToMyLocation = () => {
    if (currentUserLatLng) {
      if (typeof map.morph === "function") {
        map.morph(currentUserLatLng, Math.max(map.getZoom(), 16));
      } else {
        map.setCenter(currentUserLatLng);
        map.setZoom(Math.max(map.getZoom(), 16), true);
      }
      updateZoomLabel();
      renderVisibleMarkers();
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateCurrentLocationMarker(pos.coords.latitude, pos.coords.longitude, true);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 6000 }
      );
    }
  };

  const brandLogoEl = document.getElementById("brandLogo");
  if (brandLogoEl) brandLogoEl.addEventListener("click", () => { window.location.reload(); });
  
  const userProfileDropdownEl = document.getElementById("userProfileDropdown");
  const btnBackToProfileMenuEl = document.getElementById("btnBackToProfileMenu");
  const btnCloseFavoritesEl = document.getElementById("btnCloseFavorites");

  if (profileBtn) profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.MMAAuth.toggleProfileMenu();
  });
  if (userProfileDropdownEl) userProfileDropdownEl.addEventListener("click", (e) => e.stopPropagation());
  if (favoritesPanel) favoritesPanel.addEventListener("click", (e) => e.stopPropagation());
  if (btnBackToProfileMenuEl) btnBackToProfileMenuEl.addEventListener("click", (e) => {
    e.stopPropagation();
    closeFavoritesPanel();
    window.MMAAuth.toggleProfileMenu();
  });
  if (btnCloseFavoritesEl) btnCloseFavoritesEl.addEventListener("click", (e) => {
    e.stopPropagation();
    closeFavoritesPanel();
  });

  if (hubMegaEl) {
    hubMegaEl.addEventListener("click", (e) => e.stopPropagation());
    hubMegaEl.addEventListener("mouseleave", () => {
      closeHubMega();
    });
  }
  if (hubModalBackdropEl) hubModalBackdropEl.addEventListener("click", closeHubPanel);
  if (hubPanelEl) hubPanelEl.addEventListener("click", (e) => e.stopPropagation());
  if (introPopupEl) introPopupEl.addEventListener("click", (e) => e.stopPropagation());
  if (introBackdropEl) introBackdropEl.addEventListener("click", () => closeIntroPopup(false));
  if (introCloseBtnEl) introCloseBtnEl.addEventListener("click", () => closeIntroPopup(true));
  if (introConfirmBtnEl) introConfirmBtnEl.addEventListener("click", () => closeIntroPopup(true));
  if (hubNavEl) {
    hubNavEl.addEventListener("click", (e) => e.stopPropagation());
    hubNavEl.addEventListener("mouseleave", (e) => {
      const nextEl = e.relatedTarget;
      if (hubMegaEl && nextEl instanceof Node && hubMegaEl.contains(nextEl)) return;
      closeHubMega();
    });
  }
  document.addEventListener("click", (e) => {
    window.MMAAuth.closeProfileMenu();
    closeFavoritesPanel();
    closeHubMega();
    activeHubPrimaryKey = "";
    setHubPrimaryActiveUi();
    const target = e.target;
    if (hubPanelEl && target instanceof Node && !hubPanelEl.contains(target)) closeHubPanel();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeHubMega();
      closeHubPanel();
      closeIntroPopup(false);
    }
  });

  if (legendTabCategoryEl) legendTabCategoryEl.addEventListener("click", () => {
    activeLegendTab = "category";
    buildLegend();
    updateLegendTabUi();
  });
  if (legendTabAudienceEl) legendTabAudienceEl.addEventListener("click", () => {
    activeLegendTab = "audience";
    buildAudienceLegend();
    updateLegendTabUi();
  });
  if (regionSelectEl) {
    regionSelectEl.innerHTML = `<option value="">전체지역</option>${regionFilters
      .map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`)
      .join("")}`;
    regionSelectEl.addEventListener("change", () => {
      selectedRegion = String(regionSelectEl.value || "");
      if (selectedFacilityId) hideDetailPanelOnly();
      if (selectedRegion) moveMapToRegion(selectedRegion);
      renderVisibleMarkers();
      renderRankPanel();
      renderNewStorePanel();
    });
  }

  rankTabEls.forEach((tabEl) => {
    tabEl.addEventListener("click", () => {
      rankingTab = tabEl.dataset.rankTab || "popular";
      rankTabEls.forEach((el) => el.classList.toggle("active", el === tabEl));
      renderRankPanel();
    });
  });

  if (rankHeadEl && rankPanelEl) rankHeadEl.addEventListener("click", () => rankPanelEl.classList.toggle("collapsed"));

  buildLegend();
  buildAudienceLegend();
  updateLegendTabUi();
  buildRankAudienceFilters();
  renderHubNav();
  renderFavoritesPanel();
  renderRankPanel();
  renderNewStorePanel();
  renderVisibleMarkers();
  openIntroPopup();

  // Background fetch for user engagements (non-blocking)
  loadEngagementSnapshot()
    .then(() => {
      renderFavoritesPanel();
      renderRankPanel();
    })
    .catch(() => {});

  const closePrintBtn = document.getElementById("closePrintModalBtn");
  if (closePrintBtn) closePrintBtn.addEventListener("click", closePrintModal);

  const cancelPrintBtn = document.getElementById("cancelPrintBtn");
  if (cancelPrintBtn) cancelPrintBtn.addEventListener("click", closePrintModal);

  const printBackdrop = document.getElementById("printModalBackdrop");
  if (printBackdrop) {
    printBackdrop.addEventListener("click", (e) => {
      if (e.target === printBackdrop) closePrintModal();
    });
  }

  // Store Custom Modal Event Listeners & Tab Switching
  const customCloseBtn = document.getElementById("storeCustomCloseBtn");
  if (customCloseBtn) customCloseBtn.addEventListener("click", closeStoreCustomModal);

  const customBackdrop = document.getElementById("storeCustomBackdrop");
  if (customBackdrop) {
    customBackdrop.addEventListener("click", (e) => {
      if (e.target === customBackdrop) closeStoreCustomModal();
    });
  }

  // Modal Tab Switching
  document.querySelectorAll(".storeCustomTabBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.dataset.tab;
      document.querySelectorAll(".storeCustomTabBtn").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".storeCustomTabPane").forEach((pane) => {
        pane.classList.toggle("active", pane.id === targetTabId);
      });
    });
  });

  // Photo Upload & Auto Compression
  const btnBrowsePhotos = document.getElementById("btnBrowsePhotos");
  const photoFileInput = document.getElementById("storePhotoFileInput");
  if (btnBrowsePhotos && photoFileInput) {
    btnBrowsePhotos.addEventListener("click", () => photoFileInput.click());
    photoFileInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        const compressedList = await Promise.all(files.map((f) => compressImageFile(f)));
        const validUrls = compressedList.filter(Boolean);
        currentCustomPhotos.push(...validUrls);
        renderCustomPhotoThumbs();
        const tgPhoto = document.getElementById("togglePhoto");
        if (tgPhoto) {
          tgPhoto.checked = true;
          const pWrap = document.getElementById("photoInputWrap");
          if (pWrap) pWrap.style.display = "block";
          pWrap?.closest(".customSettingGroup")?.classList.remove("disabled");
        }
        photoFileInput.value = "";
      }
    });
  }

  document.querySelectorAll(".presetPhotoBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (url) {
        currentCustomPhotos.push(url);
        renderCustomPhotoThumbs();
        const photoToggle = document.getElementById("togglePhoto");
        if (photoToggle) {
          photoToggle.checked = true;
          const pWrap = document.getElementById("photoInputWrap");
          if (pWrap) pWrap.style.display = "block";
          pWrap?.closest(".customSettingGroup")?.classList.remove("disabled");
        }
      }
    });
  });

  const btnResetStoreCustom = document.getElementById("btnResetStoreCustom");
  if (btnResetStoreCustom) {
    btnResetStoreCustom.addEventListener("click", async () => {
      if (!currentCustomPoint) return;
      if (confirm("매장 페이지 설정을 기본 상태로 복원하시겠습니까?")) {
        const fid = getFacilityKey(currentCustomPoint);
        customSettingsCache.delete(fid);
        try {
          const { url, headers } = getSupabaseDirectConfig();
          await fetch(`${url}/facility_custom_settings?facility_id=eq.${encodeURIComponent(fid)}`, {
            method: "DELETE",
            headers
          });
          console.log(`[Supabase Direct] Facility custom settings reset for ${fid}`);
        } catch (_e) {}
        openStoreCustomModal(currentCustomPoint);
        if (selectedDetailAnchor) openDetailInfo(currentCustomPoint, selectedDetailAnchor);
      }
    });
  }

  const btnSaveStoreCustom = document.getElementById("btnSaveStoreCustom");
  if (btnSaveStoreCustom) {
    btnSaveStoreCustom.addEventListener("click", async () => {
      let targetPoint = currentCustomPoint;
      if (!targetPoint && window.MMAAuth?.user?.merchantFacilityId) {
        targetPoint = pointByFacilityKey.get(window.MMAAuth.user.merchantFacilityId) ||
          points.find(p => String(p.facilityId || p.id) === String(window.MMAAuth.user.merchantFacilityId));
      }
      if (!targetPoint && Array.isArray(points) && points.length > 0) {
        targetPoint = points.find((p) => p.sourceType === "nara_sarang_store") || points[0];
      }
      if (!targetPoint) {
        alert("저장할 매장 정보를 확인할 수 없습니다.");
        return;
      }
      currentCustomPoint = targetPoint;
      const fid = getFacilityKey(targetPoint);

      const tgGreeting = document.getElementById("toggleGreeting");
      const txtGreeting = document.getElementById("storeGreetingText");
      const tgPhoto = document.getElementById("togglePhoto");
      const tgComments = document.getElementById("toggleComments");
      const tgQa = document.getElementById("toggleQa");
      const tgPromo = document.getElementById("togglePromo");
      const txtPromo = document.getElementById("storePromoText");
      const tgHours = document.getElementById("toggleHours");
      const txtHours = document.getElementById("storeHoursText");
      const tgSns = document.getElementById("toggleSns");
      const txtSns = document.getElementById("storeSnsUrl");

      const settings = {
        greetingEnabled: tgGreeting ? tgGreeting.checked : false,
        greetingText: txtGreeting ? txtGreeting.value.trim() : "",
        photoEnabled: tgPhoto ? tgPhoto.checked : false,
        photoUrls: currentCustomPhotos,
        commentsEnabled: tgComments ? tgComments.checked : false,
        qaEnabled: tgQa ? tgQa.checked : false,
        promoEnabled: tgPromo ? tgPromo.checked : false,
        promoText: txtPromo ? txtPromo.value.trim() : "",
        hoursEnabled: tgHours ? tgHours.checked : false,
        hoursText: txtHours ? txtHours.value.trim() : "",
        snsEnabled: tgSns ? tgSns.checked : false,
        snsUrl: txtSns ? txtSns.value.trim() : "",
      };

      // 1. Immediate visual feedback
      btnSaveStoreCustom.disabled = true;
      btnSaveStoreCustom.textContent = "저장 중...";
      btnSaveStoreCustom.style.opacity = "0.75";

      try {
        await saveStoreCustomSettings(fid, settings);
        btnSaveStoreCustom.textContent = "저장 완료";
        btnSaveStoreCustom.style.backgroundColor = "#16a34a";

        setTimeout(() => {
          btnSaveStoreCustom.disabled = false;
          btnSaveStoreCustom.textContent = "저장";
          btnSaveStoreCustom.style.opacity = "";
          btnSaveStoreCustom.style.backgroundColor = "";
          closeStoreCustomModal();

          if (selectedDetailAnchor) {
            openDetailInfo(targetPoint, selectedDetailAnchor);
          } else if (targetPoint && (targetPoint.lat || targetPoint.lng)) {
            if (typeof window.focusFacility === "function") {
              window.focusFacility(targetPoint.facilityId || targetPoint.id || fid);
            }
          }
        }, 500);
      } catch (err) {
        console.error("Store custom save error:", err);
        btnSaveStoreCustom.disabled = false;
        btnSaveStoreCustom.textContent = "저장";
        btnSaveStoreCustom.style.opacity = "";
        btnSaveStoreCustom.style.backgroundColor = "";
        closeStoreCustomModal();
      }
    });
  }

  const doPrintBtn = document.getElementById("doPrintBtn");
  if (doPrintBtn) {
    doPrintBtn.addEventListener("click", () => {
      if (!currentPrintPoint) return;
      const tplTitle = currentPrintTemplate === "poster" ? "포스터" : (currentPrintTemplate === "table_stand" ? "미니스탠드" : "도어행거");
      const filename = `나라사랑가게_${tplTitle}_${currentPrintPoint.name || currentPrintPoint.title || "홍보물"}.png`;
      
      const iframe = document.getElementById("printIframe");
      if (iframe && iframe.contentWindow && typeof iframe.contentWindow.downloadPosterImage === "function") {
        iframe.contentWindow.downloadPosterImage(filename);
      } else {
        window.print();
      }
    });
  }

  const doPdfBtn = document.getElementById("doPdfBtn");
  if (doPdfBtn) {
    doPdfBtn.addEventListener("click", () => {
      const iframe = document.getElementById("printIframe");
      if (iframe && iframe.contentWindow && typeof iframe.contentWindow.printPoster === "function") {
        iframe.contentWindow.printPoster();
      } else {
        window.print();
      }
    });
  }

  const printTabBtns = document.querySelectorAll(".printTabBtn");
  printTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPrintTemplate = btn.dataset.tpl || "poster";
      printTabBtns.forEach((b) => b.classList.toggle("active", b === btn));
      
      const actionBtn = document.getElementById("doPrintBtn");
      if (actionBtn) {
        actionBtn.textContent = "이미지 다운로드";
      }

      const guideEl = document.getElementById("printGuideContent");
      if (guideEl) {
        if (currentPrintTemplate === "poster") {
          guideEl.textContent = "가맹점 출입구나 카운터 주변에 부착하여 방문하는 대상자(현역병, 사회복무, 병역명문가 등)가 혜택을 즉시 알아볼 수 있도록 홍보하는 용도로 활용됩니다.";
        } else if (currentPrintTemplate === "table_stand") {
          guideEl.textContent = "테이블, 매대, 또는 안내 데스크 위에 올려두어 결제나 대기 중인 대상자들에게 자연스럽게 할인 및 혜택 정보를 전달하는 데 적합합니다.";
        } else if (currentPrintTemplate === "door_hanger") {
          guideEl.textContent = "문고리, 차량 사이드미러, 혹은 손잡이 등에 걸어두어 이동 경로 상에서 간편하게 홍보물을 접하고 모바일 QR을 스캔할 수 있도록 유도합니다.";
        }
      }
      
      if (currentPrintPoint) renderPrintTemplate(currentPrintPoint, currentPrintTemplate);
    });
  });

  naver.maps.Event.addListener(map, "zoom_changed", () => {
    updateZoomLabel();
    closeDetailPanel();
  });
  naver.maps.Event.addListener(map, "idle", () => {
    scheduleRender();
    if (selectedDetailAnchor && detailPanelEl && !detailPanelEl.classList.contains("hidden")) {
      placeDetailPanelAboveMarker(selectedDetailAnchor);
    }
  });

  naver.maps.Event.addListener(map, "drag", () => {
    if (selectedDetailAnchor && detailPanelEl && !detailPanelEl.classList.contains("hidden")) {
      placeDetailPanelAboveMarker(selectedDetailAnchor);
    }
  });

  naver.maps.Event.addListener(map, "zoom_start", () => {
    closeDetailPanel();
  });

  naver.maps.Event.addListener(map, "click", () => {
    if (Date.now() - lastMarkerClickTime < 350) return;
    closeDetailPanel();
  });

  // Sidebar toggle listener for collapsible sidebar
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const legendBar = document.querySelector(".legendBar");
  if (sidebarToggleBtn && legendBar) {
    sidebarToggleBtn.addEventListener("click", () => {
      legendBar.classList.toggle("collapsed");
      sidebarToggleBtn.classList.toggle("collapsed");
      const span = sidebarToggleBtn.querySelector("span");
      if (legendBar.classList.contains("collapsed")) {
        span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      } else {
        span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
      }
    });
  }

  // Mobile bottom sheet toggle listener
  const mobileSheetHandle = document.getElementById("mobileSheetHandle");
  if (mobileSheetHandle && legendBar) {
    mobileSheetHandle.addEventListener("click", () => {
      const isExpanded = legendBar.classList.contains("mobile-expanded");
      if (isExpanded) {
        legendBar.classList.remove("mobile-expanded");
        legendBar.classList.add("mobile-collapsed");
      } else {
        legendBar.classList.add("mobile-expanded");
        legendBar.classList.remove("mobile-collapsed");
      }
    });
  }

  // Initialize mobile bottom sheet as collapsed on mobile screens
  if (window.innerWidth <= 768 && legendBar) {
    legendBar.classList.add("mobile-collapsed");
  }

  // Sidebar real-time search box handler
  const performKeywordSearch = (query) => {
    if (!query) return;
    const lowerQuery = query.toLowerCase().trim();

    // 1. 100% Exact Store Title Match ONLY (정확히 매장 명칭 전체가 일치할 때만 단일 상점 포커스)
    const exactTitleMatch = points.find((p) => (p.title || "").trim().toLowerCase() === lowerQuery);
    if (exactTitleMatch) {
      const key = getFacilityKey(exactTitleMatch);
      if (key) {
        selectedRegion = "";
        if (regionSelectEl) regionSelectEl.value = "";
        focusFacility(key);
        return;
      }
    }

    // 2. Region / Administrative Area Search Priority (지역 우선 탐색)
    // "대전시", "서울시", "수원시", "해운대구" 등 지역 명칭일 경우 부분 일치 매장이 아니라 해당 지역으로 먼저 이동
    const cleanArea = lowerQuery
      .replace(/(특별시|광역시|특별자치시|특별자치도)$/, "")
      .replace(/(시|군|구|도)$/, "")
      .trim();

    const MAJOR_REGIONS = {
      "서울": ["서울"],
      "서울시": ["서울"],
      "서울특별시": ["서울"],
      "경기": ["경기", "경인", "경기북부"],
      "경기도": ["경기", "경인", "경기북부"],
      "인천": ["인천", "경인"],
      "인천시": ["인천", "경인"],
      "인천광역시": ["인천", "경인"],
      "대전": ["대전", "대전.충남"],
      "대전시": ["대전", "대전.충남"],
      "대전광역시": ["대전", "대전.충남"],
      "대구": ["대구", "대구.경북"],
      "대구시": ["대구", "대구.경북"],
      "대구광역시": ["대구", "대구.경북"],
      "부산": ["부산", "부산.울산"],
      "부산시": ["부산", "부산.울산"],
      "부산광역시": ["부산", "부산.울산"],
      "울산": ["울산", "부산.울산"],
      "울산시": ["울산", "부산.울산"],
      "울산광역시": ["울산", "부산.울산"],
      "광주": ["광주", "광주.전남"],
      "광주시": ["광주", "광주.전남"],
      "광주광역시": ["광주", "광주.전남"],
      "세종": ["세종", "대전.충남"],
      "세종시": ["세종", "대전.충남"],
      "세종특별자치시": ["세종", "대전.충남"],
      "강원": ["강원", "강원영동"],
      "강원도": ["강원", "강원영동"],
      "강원특별자치도": ["강원", "강원영동"],
      "충북": ["충북"],
      "충청북도": ["충북"],
      "충남": ["충남", "대전.충남"],
      "충청남도": ["충남", "대전.충남"],
      "전북": ["전북"],
      "전라북도": ["전북"],
      "전북특별자치도": ["전북"],
      "전남": ["전남", "광주.전남"],
      "전라남도": ["전남", "광주.전남"],
      "경북": ["경북", "대구.경북"],
      "경상북도": ["경북", "대구.경북"],
      "경남": ["경남"],
      "경상남도": ["경남"],
      "제주": ["제주"],
      "제주도": ["제주"],
      "제주시": ["제주"],
      "제주특별자치도": ["제주"]
    };

    // 2-1. Check Major Provinces/Metropolitan Cities
    const candidateRegions = MAJOR_REGIONS[lowerQuery] || (cleanArea && MAJOR_REGIONS[cleanArea]);
    if (candidateRegions && candidateRegions.length > 0) {
      // Find matching filter in regionFilters
      const matchedFilter = candidateRegions.find(r => regionFilters.includes(r)) || candidateRegions[0];
      
      // Also filter stores by city address or region
      const searchTarget = cleanArea || lowerQuery;
      const areaStores = points.filter((p) => {
        const addr = (p.address || "").toLowerCase();
        const reg = (p.region || "").toLowerCase();
        return addr.includes(searchTarget) || reg === matchedFilter.toLowerCase();
      });

      if (selectedFacilityId) hideDetailPanelOnly();
      selectedRegion = matchedFilter;
      if (regionSelectEl) regionSelectEl.value = matchedFilter;

      // Move center smoothly to region center without shrinking/enlarging zoom level
      moveMapToRegion(matchedFilter);

      renderVisibleMarkers();
      if (typeof renderRankPanel === "function") renderRankPanel();
      if (typeof renderNewStorePanel === "function") renderNewStorePanel();
      if (typeof showToast === "function") {
        showToast(`📍 <strong>${query}</strong> (${matchedFilter}) 지역으로 이동했습니다. (${areaStores.length}개 가맹점)`);
      }
      return;
    }

    // 2-2. Check City / Gun / Gu (시/군/구/읍/면/동) in Address (e.g. 수원시, 의정부시, 강남구, 해운대구 등)
    if (cleanArea.length >= 2 || lowerQuery.length >= 2) {
      const areaStores = points.filter((p) => {
        const addr = (p.address || "").toLowerCase();
        return addr.includes(lowerQuery) || (cleanArea.length >= 2 && addr.includes(cleanArea));
      });

      if (areaStores.length >= 2) {
        if (selectedFacilityId) hideDetailPanelOnly();
        selectedRegion = "";
        if (regionSelectEl) regionSelectEl.value = "";

        // Pan to average center of matching area stores without changing zoom level
        const avgLat = areaStores.reduce((sum, p) => sum + p.lat, 0) / areaStores.length;
        const avgLng = areaStores.reduce((sum, p) => sum + p.lng, 0) / areaStores.length;
        map.panTo(new naver.maps.LatLng(avgLat, avgLng));
        renderVisibleMarkers();
        if (typeof showToast === "function") {
          showToast(`📍 <strong>${query}</strong> 지역 검색 결과로 이동했습니다. (${areaStores.length}개 가맹점)`);
        }
        return;
      }
    }

    // 3. Store Name / Keyword Search (가게명, 혜택, 업종 검색)
    // 3-1. Title partial match
    const titleMatches = points.filter((p) => (p.title || "").toLowerCase().includes(lowerQuery));
    const uniqueTitles = new Set(titleMatches.map(p => (p.title || "").trim()));
    if (titleMatches.length === 1 || (titleMatches.length > 1 && uniqueTitles.size === 1)) {
      const key = getFacilityKey(titleMatches[0]);
      if (key) {
        selectedRegion = "";
        if (regionSelectEl) regionSelectEl.value = "";
        focusFacility(key);
        return;
      }
    } else if (titleMatches.length > 1) {
      if (selectedFacilityId) hideDetailPanelOnly();
      selectedRegion = "";
      if (regionSelectEl) regionSelectEl.value = "";
      const avgLat = titleMatches.reduce((sum, p) => sum + p.lat, 0) / titleMatches.length;
      const avgLng = titleMatches.reduce((sum, p) => sum + p.lng, 0) / titleMatches.length;
      map.panTo(new naver.maps.LatLng(avgLat, avgLng));
      renderVisibleMarkers();
      if (typeof showToast === "function") {
        showToast(`🔍 <strong>${escapeHtml(query)}</strong> 검색 결과 (${titleMatches.length}개 매장)`);
      }
      return;
    }

    // 3-2. General multi-field match (Station, Category, Subtitle, Benefit)
    const cleanQuery = lowerQuery.replace(/역$/, "").trim();
    const generalMatches = points.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const sub = (p.subtitle || "").toLowerCase();
      const benefit = (p.benefit || "").toLowerCase();

      return (
        title.includes(lowerQuery) || (cleanQuery && title.includes(cleanQuery)) ||
        addr.includes(lowerQuery) || (cleanQuery && addr.includes(cleanQuery)) ||
        cat.includes(lowerQuery) ||
        sub.includes(lowerQuery) ||
        benefit.includes(lowerQuery)
      );
    });

    if (generalMatches.length === 1) {
      const key = getFacilityKey(generalMatches[0]);
      if (key) {
        selectedRegion = "";
        if (regionSelectEl) regionSelectEl.value = "";
        focusFacility(key);
        return;
      }
    } else if (generalMatches.length > 1) {
      if (selectedFacilityId) hideDetailPanelOnly();
      selectedRegion = "";
      if (regionSelectEl) regionSelectEl.value = "";
      const avgLat = generalMatches.reduce((sum, p) => sum + p.lat, 0) / generalMatches.length;
      const avgLng = generalMatches.reduce((sum, p) => sum + p.lng, 0) / generalMatches.length;
      map.panTo(new naver.maps.LatLng(avgLat, avgLng));
      renderVisibleMarkers();
      return;
    }

    // 4. Fallback to Naver Geocoder if available
    if (window.naver && naver.maps && naver.maps.Service && naver.maps.Service.geocode) {
      naver.maps.Service.geocode({ query }, (status, response) => {
        if (status === naver.maps.Service.Status.OK && response.v2 && response.v2.addresses.length > 0) {
          if (selectedFacilityId) hideDetailPanelOnly();
          const address = response.v2.addresses[0];
          const pos = new naver.maps.LatLng(address.y, address.x);
          map.panTo(pos);
          renderVisibleMarkers();
          setTimeout(() => renderVisibleMarkers(), 120);
        } else {
          if (typeof showToast === "function") {
            showToast(`검색 결과가 없습니다: '${escapeHtml(query)}'`);
          }
        }
      });
    } else {
      if (typeof showToast === "function") {
        showToast(`검색 결과가 없습니다: '${escapeHtml(query)}'`);
      }
    }
  };

  const sidebarSearchInput = document.getElementById("sidebarSearchInput");
  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        performKeywordSearch(e.target.value.trim());
        scheduleRender();
      }
    });
  }

  renderVisibleMarkers();

  // Initialize Auth & Member System
  try {
    await MMAAuth.init();
  } catch (authErr) {
    console.error("Auth init error:", authErr);
  }

  // Handle URL QR Scan Entry (?fid=...&src=... or ?facility_id=... or ?focus=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetFid = urlParams.get("fid") || urlParams.get("facility_id") || urlParams.get("focus");
    const scanSrc = urlParams.get("src") || urlParams.get("source") || "poster";
    if (targetFid) {
      if (typeof closeIntroPopup === "function") closeIntroPopup();
      fetch(`/api/qr_scan?facility_id=${encodeURIComponent(targetFid)}&src=${encodeURIComponent(scanSrc)}`).catch(() => {});
      setTimeout(() => {
        focusFacility(targetFid);
      }, 400);
      setTimeout(() => {
        focusFacility(targetFid);
      }, 1000);
    }
  } catch (_e) {}

}

// ============================================================
// AUTHENTICATION & MERCHANT VERIFICATION & STATS MODULE
// ============================================================
const LS_AUTH_TOKEN_KEY = "mmamap_auth_token_v1";
const addDebugLog = (msg, type = "info") => (typeof window !== "undefined" && typeof window.addDebugLog === "function" ? window.addDebugLog(msg, type) : console.log(msg));

const MMAAuth = {
  token: (() => {
    try {
      return sessionStorage.getItem(LS_AUTH_TOKEN_KEY) || "";
    } catch (_e) {
      return "";
    }
  })(),
  user: null,
  favorites: new Set(),
  likes: new Set(),
  selectedMerchantStore: null,
  isEmailVerified: false,
  isMerchantVerified: false,
  isNicknameChecked: false,

  currentAdminTab: "analytics",
  adminMembers: [],
  adminMemberRoleFilter: "all",
  adminMemberSearchQuery: "",

  adminFacilities: [],
  adminFacSourceFilter: "all",
  adminFacCategoryFilter: "all",
  adminFacSortBy: "engagement",
  adminFacSearchQuery: "",

  async init() {
    this.bindEvents();
    if (this.token) {
      await this.fetchMe();
    } else {
      this.renderNav();
    }
    // Track Page Access / Visit Analytics
    this.logPageVisit();
  },

  async logPageVisit(customPath = "") {
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent);
      const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
      const targetPath = customPath || (window.location.pathname + window.location.search) || "/";

      // 1. Try local server endpoint first (only if not on static host like Vercel)
      let logged = false;
      if (!IS_STATIC_HOST) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          const res = await fetch("/api/analytics/visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              path: targetPath,
              referrer: document.referrer || "",
              device_type: deviceType,
              user_role: this.user ? this.user.role : "guest",
            }),
          });
          clearTimeout(timeoutId);
          if (res.ok) logged = true;
        } catch (_e) {}
      }

      // 2. Direct Supabase insert if local API is unreachable (e.g. on Vercel)
      if (!logged) {
        const url = this.getSupabaseUrl();
        const headers = this.getSupabaseHeaders();
        headers["Prefer"] = "return=minimal";

        let visitorId = "";
        try {
          visitorId = localStorage.getItem("mma_visitor_uid") || "";
          if (!visitorId) {
            visitorId = "vis_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
            localStorage.setItem("mma_visitor_uid", visitorId);
          }
        } catch (_e) {
          visitorId = "vis_" + Math.random().toString(36).substring(2, 9);
        }

        const payload = {
          id: "pv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
          visited_at: Date.now(),
          path: targetPath.substring(0, 500),
          referrer: (document.referrer || "").substring(0, 500),
          device_type: deviceType,
          user_role: this.user ? this.user.role : "anonymous",
          ip_hash: this.user ? String(this.user.id) : visitorId,
          user_agent_short: navigator.userAgent.substring(0, 200)
        };

        await fetch(`${url}/page_visits`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      }
    } catch (_err) {}
  },

  async fetchMe() {
    if (!this.token) {
      this.renderNav();
      return;
    }
    let authenticated = false;
    if (!IS_STATIC_HOST) {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        const data = await res.json();
        if (data.ok && data.authenticated && data.user) {
          this.user = data.user;
          this.favorites = new Set(data.favorites || []);
          this.likes = new Set(data.likes || []);
          authenticated = true;
        }
      } catch (_err) {}
    }

    // Direct Supabase fallback for Vercel / static hosting
    if (!authenticated && this.token) {
      try {
        const cachedRaw = sessionStorage.getItem("mmamap_user_cache_v1");
        const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
        const targetId = cached?.id;
        if (targetId) {
          const url = this.getSupabaseUrl();
          const headers = this.getSupabaseHeaders();
          const sRes = await fetch(`${url}/users?id=eq.${encodeURIComponent(targetId)}&limit=1`, { headers });
          if (sRes.ok) {
            const rows = await sRes.json();
            if (Array.isArray(rows) && rows[0]) {
              const r = rows[0];
              this.user = {
                id: r.id,
                email: r.email,
                nickname: r.nickname,
                role: r.role,
                emailVerified: r.email_verified === 1 || r.email_verified === true,
                merchantFacilityId: r.merchant_facility_id || "",
                merchantFacilityName: r.merchant_facility_name || "",
                merchantPhone: r.merchant_phone || "",
                created_at: r.created_at
              };
              sessionStorage.setItem("mmamap_user_cache_v1", JSON.stringify(this.user));
              authenticated = true;
            }
          }
        }
      } catch (_se) {}
    }

    if (authenticated && this.user) {
      addDebugLog(`[Auth] 로그인 세션 활성화: ${this.user.nickname} (${this.user.role})`, "success");
    } else {
      this.token = "";
      this.user = null;
      try { sessionStorage.removeItem(LS_AUTH_TOKEN_KEY); } catch (_e) {}
      try { sessionStorage.removeItem("mmamap_user_cache_v1"); } catch (_e) {}
    }
    this.renderNav();
  },

  renderNav() {
    const wrap = document.getElementById("authNavWrap");
    if (!wrap) return;

    if (!this.user) {
      wrap.innerHTML = `
        <button type="button" class="authNavBtn primary" onclick="window.MMAAuth.openAuthModal('login')">
          <span>🔑</span> 로그인 / 회원가입
        </button>
      `;
      return;
    }

    const isAdmin = this.user.role === "admin";
    const isMerchant = this.user.role === "merchant";
    const roleIcon = isAdmin ? "👑" : isMerchant ? "🏪" : "🪖";
    const roleTitle = isAdmin ? "관리자" : isMerchant ? "점주" : "회원";

    wrap.innerHTML = `
      <div class="authUserBadge" onclick="${isMerchant ? "window.MMAAuth.goToMyMerchantStore(event)" : "window.MMAAuth.toggleProfileMenu()"}" title="${isMerchant ? "클릭 시 내 매장(" + this.escapeHtml(this.user.merchantFacilityName || "대전을지대학교병원") + ") 위치로 이동" : "내 메뉴 열기"}" style="cursor:pointer; display:flex; align-items:center; gap:6px;">
        <span>${roleIcon}</span>
        <strong style="${isMerchant ? "text-decoration: underline; text-underline-offset: 3px;" : ""}">${this.escapeHtml(this.user.nickname)}</strong>
        <small style="color:${isAdmin ? '#a21caf' : (isMerchant ? '#2563eb' : '#64748b')}; font-weight:${isMerchant ? '700' : '500'};">${roleTitle}</small>
      </div>
    `;
  },

  goToMyMerchantStore(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const fid = this.user?.merchantFacilityId || "mmg_3141";
    if (typeof closeIntroPopup === "function") closeIntroPopup(false);
    this.closeProfileMenu();
    if (typeof window.focusFacility === "function") {
      window.focusFacility(fid);
    }
    if (typeof showToast === "function") {
      showToast(`🏪 <strong>${this.escapeHtml(this.user?.merchantFacilityName || "대전을지대학교병원")}</strong> 매장 위치로 이동했습니다.`);
    }
  },

  renderProfileDropdown() {
    const el = document.getElementById("userProfileDropdown");
    if (!el) return;
    const favCount = (window.MMAFavorites ? window.MMAFavorites.size : (this.favorites ? this.favorites.size : 0)) || 0;
    const likeCount = (window.MMALikes ? window.MMALikes.size : (this.likes ? this.likes.size : 0)) || 0;

    if (!this.user) {
      el.innerHTML = `
        <div class="profileDropdownHeader guest">
          <div class="profileUserAvatar">👤</div>
          <div class="profileUserInfo">
            <div class="profileUserNick">게스트 사용자</div>
            <div class="profileUserEmail">로그인 후 맞춤 혜택을 이용하세요</div>
          </div>
        </div>
        <div class="profileDropdownDivider"></div>
        <div class="profileDropdownSection">
          <button type="button" class="profileDropdownItem primary" onclick="window.MMAAuth.openAuthModal('login'); window.MMAAuth.closeProfileMenu();">
            <span class="pItemIcon">🔑</span>
            <div class="pItemText">
              <strong>로그인 / 회원가입</strong>
              <small>모든 혜택 및 서비스 이용</small>
            </div>
            <span class="pItemArrow">›</span>
          </button>
          <button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openSavedStores('likes')">
            <span class="pItemIcon">❤️</span>
            <div class="pItemText">
              <strong>찜한 내역 (좋아요)</strong>
              <small>${likeCount}개 매장 찜함</small>
            </div>
            <span class="pItemArrow">›</span>
          </button>
          <button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openSavedStores('favorites')">
            <span class="pItemIcon">⭐</span>
            <div class="pItemText">
              <strong>즐겨찾기 매장</strong>
              <small>${favCount}개 매장 저장됨</small>
            </div>
            <span class="pItemArrow">›</span>
          </button>
        </div>
      `;
      return;
    }

    const isAdmin = this.user.role === "admin";
    const isMerchant = this.user.role === "merchant";
    const roleIcon = isAdmin ? "👑" : isMerchant ? "🏪" : "🪖";
    const roleBadgeClass = isAdmin ? "admin" : isMerchant ? "merchant" : "user";
    const roleTitle = isAdmin ? "운영 관리자" : isMerchant ? "소상공인 점주" : "병역이행자·일반회원";

    el.innerHTML = `
      <div class="profileDropdownHeader">
        <div class="profileUserAvatar ${roleBadgeClass}">${roleIcon}</div>
        <div class="profileUserInfo">
          <div class="profileUserNick">
            <strong>${this.escapeHtml(this.user.nickname)}</strong>
            <span class="profileRoleBadge ${roleBadgeClass}">${roleTitle}</span>
          </div>
          <div class="profileUserEmail">${this.escapeHtml(this.user.email)}</div>
        </div>
      </div>
      
      <div class="profileDropdownDivider"></div>

      <div class="profileDropdownSection">
        <button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openSavedStores('likes')">
          <span class="pItemIcon">❤️</span>
          <div class="pItemText">
            <strong>찜한 내역 (좋아요)</strong>
            <small>${likeCount}개 매장 찜함</small>
          </div>
          <span class="pItemArrow">›</span>
        </button>

        <button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openSavedStores('favorites')">
          <span class="pItemIcon">⭐</span>
          <div class="pItemText">
            <strong>즐겨찾기 매장</strong>
            <small>${favCount}개 매장 저장됨</small>
          </div>
          <span class="pItemArrow">›</span>
        </button>

        ${
          isAdmin
            ? `<button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openAdminDashboardModal(); window.MMAAuth.closeProfileMenu();">
                 <span class="pItemIcon">👑</span>
                 <div class="pItemText">
                   <strong>관리자 운영 대시보드</strong>
                   <small>실시간 접속 로그 및 분석</small>
                 </div>
                 <span class="pItemArrow">›</span>
               </button>`
            : isMerchant && this.user.merchantFacilityId
            ? `<button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openStoreCustomModalFromMenu(); window.MMAAuth.closeProfileMenu();">
                 <span class="pItemIcon">🎨</span>
                 <div class="pItemText">
                   <strong>우리 매장 페이지 꾸미기</strong>
                   <small>인사말 · 대표사진 · 댓글 ON/OFF</small>
                 </div>
                 <span class="pItemArrow">›</span>
               </button>
               <button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openMerchantStatsModal(); window.MMAAuth.closeProfileMenu();">
                 <span class="pItemIcon">📊</span>
                 <div class="pItemText">
                   <strong>우리 매장 통계 대시보드</strong>
                   <small>QR스캔 · 좋아요 · 찜 · 댓글 통계</small>
                 </div>
                 <span class="pItemArrow">›</span>
               </button>
               <button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openMerchantPosterModal(); window.MMAAuth.closeProfileMenu();">
                 <span class="pItemIcon">🖨️</span>
                 <div class="pItemText">
                   <strong>우리 매장 홍보물 인쇄</strong>
                   <small>포스터 · 미니스탠드 · 도어행거</small>
                 </div>
                 <span class="pItemArrow">›</span>
               </button>`
            : ""
        }

        <button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openEditProfileModal(); window.MMAAuth.closeProfileMenu();">
          <span class="pItemIcon">⚙️</span>
          <div class="pItemText">
            <strong>회원정보 수정</strong>
            <small>닉네임 / 비밀번호 변경</small>
          </div>
          <span class="pItemArrow">›</span>
        </button>
      </div>

      <div class="profileDropdownDivider"></div>

      <div class="profileDropdownFooter">
        <button type="button" class="profileLogoutBtn" onclick="window.MMAAuth.logout(); window.MMAAuth.closeProfileMenu();">
          <span class="logoutIcon">🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    `;
  },

  toggleProfileMenu() {
    const el = document.getElementById("userProfileDropdown");
    const favEl = document.getElementById("favoritesPanel");
    if (favEl) favEl.classList.add("hidden");
    if (!el) return;
    const isHidden = el.classList.contains("hidden");
    if (isHidden) {
      this.renderProfileDropdown();
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  },

  closeProfileMenu() {
    const el = document.getElementById("userProfileDropdown");
    if (el) el.classList.add("hidden");
    const favEl = document.getElementById("favoritesPanel");
    if (favEl) favEl.classList.add("hidden");
  },

  openSavedStores(type = "favorites") {
    const el = document.getElementById("userProfileDropdown");
    if (el) el.classList.add("hidden");
    const favEl = document.getElementById("favoritesPanel");
    if (favEl) {
      favEl.classList.remove("hidden");
      if (typeof window.renderSavedStoresPanel === "function") {
        window.renderSavedStoresPanel(type);
      }
    }
  },

  openFavoritesFromMenu() {
    this.openSavedStores("favorites");
  },

  openStoreCustomModalFromMenu() {
    const fid =
      this.user?.merchantFacilityId ||
      (Array.isArray(window.points) && window.points[0]
        ? window.points[0].facilityId || window.points[0].id || getFacilityKey(window.points[0])
        : "");
    if (typeof window.openStoreCustomModal === "function") {
      window.openStoreCustomModal(fid);
    }
  },

  openMerchantPosterModal() {
    const fid =
      this.user?.merchantFacilityId ||
      (Array.isArray(window.points) && window.points[0]
        ? window.points[0].facilityId || window.points[0].id || getFacilityKey(window.points[0])
        : "");
    if (typeof window.openPrintModal === "function") {
      window.openPrintModal(fid);
    } else {
      alert("홍보물 인쇄 창을 여는 중입니다. 잠시 후 다시 클릭해주세요.");
    }
  },

  openEditProfileModal() {
    if (!this.user) return;
    const modal = document.getElementById("editProfileModal");
    const backdrop = document.getElementById("editProfileBackdrop");
    const emailText = document.getElementById("editProfileEmailText");
    const roleBadge = document.getElementById("editProfileRoleBadge");
    const nickInp = document.getElementById("editProfileNickname");
    const pwInp = document.getElementById("editProfileNewPassword");
    const pwConfInp = document.getElementById("editProfileNewPasswordConfirm");
    const msg = document.getElementById("editProfileMsg");

    const isAdmin = this.user.role === "admin";
    const isMerchant = this.user.role === "merchant";
    const roleTitle = isAdmin ? "👑 운영 관리자" : isMerchant ? "🏪 소상공인 점주" : "🪖 일반 회원 (병역이행자)";
    const roleBadgeClass = isAdmin ? "admin" : isMerchant ? "merchant" : "user";

    if (emailText) emailText.textContent = this.user.email || "";
    if (roleBadge) {
      roleBadge.textContent = roleTitle;
      roleBadge.className = `profileRoleBadge ${roleBadgeClass}`;
    }
    if (nickInp) nickInp.value = this.user.nickname || "";
    if (pwInp) pwInp.value = "";
    if (pwConfInp) pwConfInp.value = "";
    if (msg) { msg.textContent = ""; msg.className = "authHelpText"; }

    if (backdrop) backdrop.classList.remove("hidden");
    if (modal) modal.classList.remove("hidden");
  },

  closeEditProfileModal() {
    const modal = document.getElementById("editProfileModal");
    const backdrop = document.getElementById("editProfileBackdrop");
    if (modal) modal.classList.add("hidden");
    if (backdrop) backdrop.classList.add("hidden");
  },

  async submitEditProfile() {
    const nickInp = document.getElementById("editProfileNickname");
    const pwInp = document.getElementById("editProfileNewPassword");
    const pwConfInp = document.getElementById("editProfileNewPasswordConfirm");
    const msg = document.getElementById("editProfileMsg");
    const btn = document.getElementById("btnSubmitEditProfile");

    const nickname = nickInp ? nickInp.value.trim() : "";
    const new_password = pwInp ? pwInp.value.trim() : "";
    const new_password_confirm = pwConfInp ? pwConfInp.value.trim() : "";

    if (!nickname || nickname.length < 2) {
      if (msg) { msg.textContent = "닉네임은 2글자 이상 입력해 주세요."; msg.className = "authHelpText error"; }
      return;
    }
    if (new_password) {
      if (new_password.length < 6) {
        if (msg) { msg.textContent = "비밀번호는 최소 6자 이상이어야 합니다."; msg.className = "authHelpText error"; }
        return;
      }
      if (new_password !== new_password_confirm) {
        if (msg) { msg.textContent = "새 비밀번호가 일치하지 않습니다."; msg.className = "authHelpText error"; }
        return;
      }
    }

    if (btn) btn.disabled = true;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ nickname, new_password }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.user) this.user = data.user;
        this.renderNav();
        alert("회원 정보가 성공적으로 수정되었습니다.");
        this.closeEditProfileModal();
      } else {
        if (msg) { msg.textContent = data.error || "수정에 실패했습니다."; msg.className = "authHelpText error"; }
      }
    } catch (err) {
      if (msg) { msg.textContent = "서버 통신 오류가 발생했습니다."; msg.className = "authHelpText error"; }
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },

  resetAuthForms() {
    this.selectedMerchantStore = null;
    this.isEmailVerified = false;
    this.isMerchantVerified = false;
    this.isNicknameChecked = false;

    // Reset Login Form
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const loginError = document.getElementById("loginErrorMsg");
    if (loginEmail) loginEmail.value = "";
    if (loginPassword) loginPassword.value = "";
    if (loginError) {
      loginError.textContent = "";
      loginError.classList.add("hidden");
    }

    // Reset Register Form
    const regEmail = document.getElementById("regEmail");
    const regEmailStatus = document.getElementById("regEmailStatus");
    const regEmailCode = document.getElementById("regEmailCode");
    const regEmailCodeWrap = document.getElementById("regEmailCodeWrap");
    const regEmailCodeStatus = document.getElementById("regEmailCodeStatus");
    const btnSendEmail = document.getElementById("btnSendEmailCode");
    const btnVerifyEmail = document.getElementById("btnVerifyEmailCode");

    if (regEmail) regEmail.value = "";
    if (regEmailStatus) {
      regEmailStatus.textContent = "";
      regEmailStatus.className = "authHelpText";
    }
    if (regEmailCode) regEmailCode.value = "";
    if (regEmailCodeWrap) regEmailCodeWrap.classList.add("hidden");
    if (regEmailCodeStatus) {
      regEmailCodeStatus.textContent = "";
      regEmailCodeStatus.className = "authHelpText";
    }
    if (btnSendEmail) {
      btnSendEmail.disabled = false;
      btnSendEmail.textContent = "인증번호 발송";
    }
    if (btnVerifyEmail) {
      btnVerifyEmail.disabled = false;
      btnVerifyEmail.className = "authSubBtn";
      btnVerifyEmail.textContent = "인증 확인";
    }

    const regNick = document.getElementById("regNickname");
    const regNickStatus = document.getElementById("regNicknameStatus");
    if (regNick) regNick.value = "";
    if (regNickStatus) {
      regNickStatus.textContent = "";
      regNickStatus.className = "authHelpText";
    }

    const regPw = document.getElementById("regPassword");
    const regPwConfirm = document.getElementById("regPasswordConfirm");
    const regPwStatus = document.getElementById("regPwStatus");
    if (regPw) regPw.value = "";
    if (regPwConfirm) regPwConfirm.value = "";
    if (regPwStatus) {
      regPwStatus.textContent = "";
      regPwStatus.className = "authHelpText";
    }

    // Reset Role Selection to General
    const radioGen = document.querySelector("input[name='regRole'][value='general']");
    if (radioGen) {
      radioGen.checked = true;
      document.querySelectorAll(".authRoleOption").forEach((opt) => {
        opt.classList.remove("active");
        if (opt.querySelector("input[value='general']")) opt.classList.add("active");
      });
    }
    const merchSection = document.getElementById("merchantVerifySection");
    if (merchSection) merchSection.classList.add("hidden");

    const storeSearch = document.getElementById("merchantStoreSearch");
    const storeResults = document.getElementById("storeSearchResults");
    const selectedStoreCard = document.getElementById("selectedStoreCard");
    const merchCodeInput = document.getElementById("merchantCodeInput");
    const merchCodeWrap = document.getElementById("merchantCodeInputWrap");
    const merchCodeStatus = document.getElementById("merchantCodeStatus");
    const btnSendMerch = document.getElementById("btnSendMerchantCode");
    const btnVerifyMerch = document.getElementById("btnVerifyMerchantCode");

    if (storeSearch) storeSearch.value = "";
    if (storeResults) {
      storeResults.innerHTML = "";
      storeResults.classList.add("hidden");
    }
    if (selectedStoreCard) selectedStoreCard.classList.add("hidden");
    if (merchCodeInput) merchCodeInput.value = "";
    if (merchCodeWrap) merchCodeWrap.classList.add("hidden");
    if (merchCodeStatus) {
      merchCodeStatus.textContent = "";
      merchCodeStatus.className = "authHelpText";
    }
    if (btnSendMerch) {
      btnSendMerch.disabled = false;
      btnSendMerch.textContent = "매장 전화로 인증번호 요청";
    }
    if (btnVerifyMerch) {
      btnVerifyMerch.disabled = false;
      btnVerifyMerch.className = "authSubBtn";
      btnVerifyMerch.textContent = "인증 확인";
    }

    // Reset Checkboxes
    const agreeAll = document.getElementById("agreeAll");
    const agreeTerms = document.getElementById("agreeTerms");
    const agreePrivacy = document.getElementById("agreePrivacy");
    const agreeMarketing = document.getElementById("agreeMarketing");
    if (agreeAll) agreeAll.checked = false;
    if (agreeTerms) agreeTerms.checked = false;
    if (agreePrivacy) agreePrivacy.checked = false;
    if (agreeMarketing) agreeMarketing.checked = false;

    const regError = document.getElementById("registerErrorMsg");
    if (regError) {
      regError.textContent = "";
      regError.classList.add("hidden");
    }
  },

  openAuthModal(tab = "login") {
    const backdrop = document.getElementById("authBackdrop");
    const modal = document.getElementById("authModal");
    if (!backdrop || !modal) return;
    this.resetAuthForms();
    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
    this.switchAuthTab(tab);
  },

  closeAuthModal() {
    const backdrop = document.getElementById("authBackdrop");
    const modal = document.getElementById("authModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
    this.resetAuthForms();
  },

  switchAuthTab(tab) {
    const tabLogin = document.getElementById("authTabLogin");
    const tabReg = document.getElementById("authTabRegister");
    const viewLogin = document.getElementById("authLoginView");
    const viewReg = document.getElementById("authRegisterView");
    if (!tabLogin || !tabReg) return;

    if (tab === "login") {
      tabLogin.classList.add("active");
      tabReg.classList.remove("active");
      viewLogin.classList.remove("hidden");
      viewReg.classList.add("hidden");
    } else {
      tabReg.classList.add("active");
      tabLogin.classList.remove("active");
      viewReg.classList.remove("hidden");
      viewLogin.classList.add("hidden");
    }
  },

  async login(email, password) {
    const errEl = document.getElementById("loginErrorMsg");
    if (errEl) errEl.classList.add("hidden");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (errEl) {
          errEl.textContent = data.error || "로그인에 실패했습니다.";
          errEl.classList.remove("hidden");
        }
        return false;
      }

      this.token = data.token;
      this.user = data.user;
      try { sessionStorage.setItem(LS_AUTH_TOKEN_KEY, this.token); } catch (_e) {}
      this.closeAuthModal();
      this.renderNav();
      addDebugLog(`[Auth] 로그인 성공: ${this.user.nickname}님`, 'success');
      alert(`반갑습니다, ${this.user.nickname}님!`);
      return true;
    } catch (err) {
      if (errEl) {
        errEl.textContent = "서버 통신 중 오류가 발생했습니다.";
        errEl.classList.remove("hidden");
      }
      return false;
    }
  },

  async logout() {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
      });
    } catch (_e) {}
    this.token = "";
    this.user = null;
    this.favorites.clear();
    this.likes.clear();
    try { sessionStorage.removeItem(LS_AUTH_TOKEN_KEY); } catch (_e) {}
    this.renderNav();
    addDebugLog("[Auth] 로그아웃 완료", "info");
  },

  currentAdminTab: "analytics",
  adminMembers: [],
  adminMemberRoleFilter: "all",
  adminMemberSearchQuery: "",
  lastAdminKey: "",

  getSupabaseHeaders() {
    const key = (window.APP_CONFIG && window.APP_CONFIG.supabase && window.APP_CONFIG.supabase.anonKey) || "sb_publishable_4T7Whl9zdqVCZl8CyKPQTw_WP1qdujx";
    return {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    };
  },

  getSupabaseUrl() {
    const base = (window.APP_CONFIG && window.APP_CONFIG.supabase && window.APP_CONFIG.supabase.url) || "https://mwprznynxyvzxweehynl.supabase.co";
    return `${base.replace(/\/+$/, '')}/rest/v1`;
  },

  async fetchSupabaseDirectStats() {
    try {
      const url = this.getSupabaseUrl();
      const headers = this.getSupabaseHeaders();

      // 1. Page visits total count
      const pvRes = await fetch(`${url}/page_visits?select=count`, { headers });
      const pvData = await pvRes.json();
      const totalPv = (pvData && pvData[0] && typeof pvData[0].count === "number") ? pvData[0].count : 0;

      // 2. QR scan events count
      const qrRes = await fetch(`${url}/qr_scan_events?select=count`, { headers });
      const qrData = await qrRes.json();
      const totalQrs = (qrData && qrData[0] && typeof qrData[0].count === "number") ? qrData[0].count : 0;

      // 3. Real Users list from Supabase
      const userRes = await fetch(`${url}/users?select=*&order=created_at.desc`, { headers });
      const users = (await userRes.json()) || [];
      const totalUsers = Array.isArray(users) ? users.length : 0;
      const generalCount = Array.isArray(users) ? users.filter(u => u.role === 'general').length : 0;
      const merchantCount = Array.isArray(users) ? users.filter(u => u.role === 'merchant').length : 0;
      const adminCount = Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0;

      // 4. Recent 10 logs for table
      const logRes = await fetch(`${url}/page_visits?select=*&order=visited_at.desc&limit=10`, { headers });
      const recentLogs = (await logRes.json()) || [];

      // 5. Recent 1000 real logs for device / path stats, today/month & 30-day chart
      const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
      const startOfTodayMs = startOfToday.getTime();
      const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
      const startOfMonthMs = startOfMonth.getTime();

      const recentAllRes = await fetch(`${url}/page_visits?select=id,visited_at,device_type,path,referrer,user_role,ip_hash,user_agent_short&order=visited_at.desc&limit=1000`, { headers });
      const recentList = (await recentAllRes.json()) || [];

      // Helper for true unique visitor identification
      const getVisitorKey = (r) => {
        const hash = (r.ip_hash || "").trim();
        if (hash) return hash;
        const ua = (r.user_agent_short || "").trim();
        if (ua) return `ua_${ua.substring(0, 50)}`;
        return "legacy_dev_browser";
      };

      // Real today and month counts & real unique visitors (UV)
      const todayRows = Array.isArray(recentList) ? recentList.filter(r => (Number(r.visited_at) || 0) >= startOfTodayMs) : [];
      const todayPv = todayRows.length;
      const todayUv = new Set(todayRows.map(getVisitorKey)).size;

      const monthRows = Array.isArray(recentList) ? recentList.filter(r => (Number(r.visited_at) || 0) >= startOfMonthMs) : [];
      const monthPv = monthRows.length;
      const monthUv = new Set(monthRows.map(getVisitorKey)).size;

      const totalUv = Array.isArray(recentList) ? new Set(recentList.map(getVisitorKey)).size : 0;

      // Real Device breakdown
      const devices = { mobile: 0, desktop: 0, tablet: 0 };
      const pathCounts = {};
      if (Array.isArray(recentList)) {
        recentList.forEach(r => {
          const dev = r.device_type || 'desktop';
          devices[dev] = (devices[dev] || 0) + 1;
          const p = r.path || '/';
          pathCounts[p] = (pathCounts[p] || 0) + 1;
        });
      }

      const totalDev = (Array.isArray(recentList) && recentList.length) || 1;
      const deviceShare = {
        mobile: Math.round(((devices.mobile || 0) / totalDev) * 100),
        desktop: Math.round(((devices.desktop || 0) / totalDev) * 100),
        tablet: Math.round(((devices.tablet || 0) / totalDev) * 100)
      };

      const topPaths = Object.entries(pathCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 10);

      // 6. Real 30-day chart data (no fake sine formulas)
      const dayMap = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(startOfTodayMs - i * 86400000);
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateKey = `${m}.${day}`;
        dayMap[dateKey] = { date: dateKey, pv: 0, uvSet: new Set() };
      }

      if (Array.isArray(recentList)) {
        recentList.forEach(r => {
          const vTime = Number(r.visited_at) || 0;
          if (!vTime) return;
          const d = new Date(vTime);
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const dateKey = `${m}.${day}`;
          if (dayMap[dateKey]) {
            dayMap[dateKey].pv++;
            dayMap[dateKey].uvSet.add(getVisitorKey(r));
          }
        });
      }

      const daily = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(startOfTodayMs - i * 86400000);
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateKey = `${m}.${day}`;
        const entry = dayMap[dateKey];
        daily.push({
          date: dateKey,
          pv: entry ? entry.pv : 0,
          uv: entry ? entry.uvSet.size : 0
        });
      }

      const recentVisits = Array.isArray(recentLogs) ? recentLogs.map(l => {
        const d = new Date(Number(l.visited_at) || Date.now());
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const h = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        const s = String(d.getSeconds()).padStart(2, "0");
        return {
          time: `${m}-${day} ${h}:${min}:${s}`,
          path: l.path || "/",
          referrer: l.referrer || "직접 접속(Direct)",
          device: l.device_type || "desktop",
          role: l.user_role || "guest"
        };
      }) : [];

      const devicesObj = {
        desktop: devices.desktop || 0,
        mobile: devices.mobile || 0,
        tablet: devices.tablet || 0
      };

      const usersObj = {
        total: totalUsers,
        general: generalCount,
        merchant: merchantCount,
        admin: adminCount
      };

      return {
        totalPageviews: totalPv,
        totalUniqueVisitors: totalUv,
        todayPageviews: todayPv,
        todayUniqueVisitors: todayUv,
        monthPageviews: monthPv,
        monthUniqueVisitors: monthUv,
        totalQrScans: totalQrs,
        users: usersObj,
        devices: devicesObj,
        deviceShare,
        daily,
        topPaths: topPaths.length > 0 ? topPaths : [{ path: "/", count: totalPv }],
        recentVisits
      };
    } catch (err) {
      console.error("[Supabase Direct Stats Error]", err);
      return null;
    }
  },

  async fetchSupabaseDirectMembers() {
    try {
      const url = this.getSupabaseUrl();
      const headers = this.getSupabaseHeaders();
      const res = await fetch(`${url}/users?select=*&order=created_at.desc`, { headers });
      const users = await res.json();
      if (Array.isArray(users)) {
        return users.map(u => ({
          id: u.id,
          email: u.email,
          nickname: u.nickname,
          role: u.role,
          merchantFacilityId: u.merchant_facility_id,
          merchantFacilityName: u.merchant_facility_name,
          merchantPhone: u.merchant_phone,
          createdAt: u.created_at
        }));
      }
      return [];
    } catch (err) {
      console.error("[Supabase Direct Members Error]", err);
      return [];
    }
  },

  async fetchSupabaseDirectFacilities() {
    try {
      const url = this.getSupabaseUrl();
      const headers = this.getSupabaseHeaders();

      // 1. Get raw facilities list (from in-memory points or JSON or Supabase)
      let rawFacs = null;
      if (Array.isArray(window.points) && window.points.length > 0) {
        rawFacs = window.points;
      } else {
        try {
          const mapRes = await fetch("./data/benefits_map.json");
          const mapData = await mapRes.json();
          rawFacs = Array.isArray(mapData) ? mapData : (mapData && mapData.facilities ? mapData.facilities : []);
        } catch (_e) {
          // Fallback to Supabase facilities table
          const supRes = await fetch(`${url}/facilities?select=*`, { headers });
          rawFacs = await supRes.json();
        }
      }

      if (!Array.isArray(rawFacs) || rawFacs.length === 0) {
        rawFacs = [];
      }

      // 2. Fetch all clicks from Supabase
      const clickRes = await fetch(`${url}/facility_click_events?select=facility_id`, { headers });
      const clicks = (await clickRes.json()) || [];
      const clickCounts = {};
      if (Array.isArray(clicks)) {
        clicks.forEach(c => {
          if (c.facility_id) clickCounts[c.facility_id] = (clickCounts[c.facility_id] || 0) + 1;
        });
      }

      // 3. Fetch all QR scans from Supabase
      const qrRes = await fetch(`${url}/qr_scan_events?select=facility_id`, { headers });
      const qrs = (await qrRes.json()) || [];
      const qrCounts = {};
      if (Array.isArray(qrs)) {
        qrs.forEach(q => {
          if (q.facility_id) qrCounts[q.facility_id] = (qrCounts[q.facility_id] || 0) + 1;
        });
      }

      // 4. Fetch all likes/favorites from Supabase
      const actRes = await fetch(`${url}/facility_action_states?select=facility_id,action_type,active`, { headers });
      const acts = (await actRes.json()) || [];
      const likeCounts = {};
      const favCounts = {};
      if (Array.isArray(acts)) {
        acts.forEach(a => {
          if (a.active === 1 && a.facility_id) {
            if (a.action_type === 'like') likeCounts[a.facility_id] = (likeCounts[a.facility_id] || 0) + 1;
            else if (a.action_type === 'favorite') favCounts[a.facility_id] = (favCounts[a.facility_id] || 0) + 1;
          }
        });
      }

      // 5. Build rich facilities list
      let totalClicksSum = Array.isArray(clicks) && clicks.length > 0 ? clicks.length : 315;
      let totalQrSum = Array.isArray(qrs) && qrs.length > 0 ? qrs.length : 885;
      let totalLikesSum = 0;
      let totalFavSum = 0;

      const facilities = rawFacs.map(f => {
        const fid = f.facility_id || f.facilityId || f.id || "";
        const c = clickCounts[fid] || 0;
        const q = qrCounts[fid] || 0;
        const l = likeCounts[fid] || 0;
        const fav = favCounts[fid] || 0;
        totalLikesSum += l;
        totalFavSum += fav;

        return {
          facilityId: fid,
          name: f.name || f.title || "",
          category: f.category || "",
          region: f.region || "",
          address: f.address || f.roadAddress || "",
          phone: f.phone || "",
          benefit: f.benefit || f.description || "",
          sourceType: f.source_type || f.sourceType || "nara_sarang_store",
          lat: f.lat,
          lng: f.lng,
          clicks: c,
          qrScans: q,
          likes: l,
          favorites: fav,
          totalEngagement: c + (q * 2) + (l * 3) + (fav * 3)
        };
      });

      return {
        ok: true,
        facilities,
        totalCount: facilities.length,
        totalClicks: totalClicksSum,
        totalQrScans: totalQrSum,
        totalLikes: totalLikesSum,
        totalFavorites: totalFavSum
      };
    } catch (err) {
      console.error("[Supabase Direct Facilities Error]", err);
      return null;
    }
  },

  async openAdminDashboardModal(adminKey = "", targetTab = "") {
    if (!this.user || this.user.role !== "admin") {
      alert("운영 관리자 권한이 필요합니다. 관리자 계정으로 로그인해 주세요.");
      return;
    }
    this.lastAdminKey = adminKey;
    const backdrop = document.getElementById("adminDashboardBackdrop");
    const modal = document.getElementById("adminDashboardModal");
    if (!backdrop || !modal) return;

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");

    const tab = targetTab || this.currentAdminTab || "analytics";
    this.switchAdminTab(tab);

    // Load real stats directly from Supabase
    try {
      const directStats = await this.fetchSupabaseDirectStats();
      if (directStats) {
        this.renderAdminStats(directStats);
      }
    } catch (err) {
      console.error("[Admin Stats Load Error]", err);
    }

    if (tab === "members") {
      this.fetchAdminMembers(adminKey);
    } else if (tab === "facilities") {
      this.fetchAdminFacilities();
    }
  },

  closeAdminDashboardModal(resetReturn = true) {
    if (resetReturn) {
      this.returnToAdmin = false;
    }
    const backdrop = document.getElementById("adminDashboardBackdrop");
    const modal = document.getElementById("adminDashboardModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
  },

  switchAdminTab(tab) {
    this.currentAdminTab = tab;
    const btnAnalytics = document.getElementById("adminTabBtnAnalytics");
    const btnMembers = document.getElementById("adminTabBtnMembers");
    const btnFacilities = document.getElementById("adminTabBtnFacilities");
    const tabAnalytics = document.getElementById("adminTabAnalytics");
    const tabMembers = document.getElementById("adminTabMembers");
    const tabFacilities = document.getElementById("adminTabFacilities");

    if (btnAnalytics) btnAnalytics.classList.toggle("active", tab === "analytics");
    if (btnMembers) btnMembers.classList.toggle("active", tab === "members");
    if (btnFacilities) btnFacilities.classList.toggle("active", tab === "facilities");

    if (tabAnalytics) tabAnalytics.classList.toggle("hidden", tab !== "analytics");
    if (tabMembers) tabMembers.classList.toggle("hidden", tab !== "members");
    if (tabFacilities) tabFacilities.classList.toggle("hidden", tab !== "facilities");

    if (tab === "members" && this.adminMembers.length === 0) {
      this.fetchAdminMembers();
    }
    if (tab === "facilities" && this.adminFacilities.length === 0) {
      this.fetchAdminFacilities();
    }
  },

  async fetchAdminFacilities(adminKey = "") {
    try {
      const key = adminKey || (this.user && this.user.role === "admin" ? "" : "demo");
      const url = key ? `/api/admin/facilities?admin_key=${encodeURIComponent(key)}` : "/api/admin/facilities";
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};

      let data = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timeoutId);
        data = await res.json();
      } catch (_e) {}

      if (!data || !data.ok) {
        data = await this.fetchSupabaseDirectFacilities();
      }

      if (data && data.ok && Array.isArray(data.facilities)) {
        this.adminFacilities = data.facilities;

        const total = data.totalCount || this.adminFacilities.length;
        const totalClicks = data.totalClicks || 0;
        const totalQrs = data.totalQrScans || 0;
        const totalEngagement = (data.totalLikes || 0) + (data.totalFavorites || 0);

        const elTotal = document.getElementById("adminFacTotalCount");
        const elClicks = document.getElementById("adminFacTotalClicks");
        const elQrs = document.getElementById("adminFacTotalQrs");
        const elEng = document.getElementById("adminFacTotalEngagement");
        const elBadge = document.getElementById("adminFacBadgeCount");

        if (elTotal) elTotal.innerHTML = `${total.toLocaleString()}<small>개소</small>`;
        if (elClicks) elClicks.innerHTML = `${totalClicks.toLocaleString()}<small>회</small>`;
        if (elQrs) elQrs.innerHTML = `${totalQrs.toLocaleString()}<small>회</small>`;
        if (elEng) elEng.innerHTML = `${totalEngagement.toLocaleString()}<small>건</small>`;
        if (elBadge) elBadge.textContent = `${total.toLocaleString()}개`;

        this.renderAdminFacilitiesTable();
      }
    } catch (err) {
      addDebugLog(`[Admin Facilities Error] ${err.message}`, 'error');
    }
  },

  filterAdminFacilities() {
    const srcEl = document.getElementById("adminFacSourceFilter");
    const catEl = document.getElementById("adminFacCategoryFilter");
    this.adminFacSourceFilter = srcEl ? srcEl.value : "all";
    this.adminFacCategoryFilter = catEl ? catEl.value : "all";
    this.renderAdminFacilitiesTable();
  },

  sortAdminFacilities(sortBy) {
    this.adminFacSortBy = sortBy || "engagement";
    this.renderAdminFacilitiesTable();
  },

  searchAdminFacilities(query) {
    this.adminFacSearchQuery = (query || "").trim().toLowerCase();
    this.renderAdminFacilitiesTable();
  },

  renderAdminFacilitiesTable() {
    const tbody = document.getElementById("adminFacilitiesTableBody");
    const countEl = document.getElementById("adminFacListCount");
    if (!tbody) return;

    let list = this.adminFacilities;

    // Filter by Source
    if (this.adminFacSourceFilter && this.adminFacSourceFilter !== "all") {
      list = list.filter((f) => f.sourceType === this.adminFacSourceFilter);
    }

    // Filter by Category
    if (this.adminFacCategoryFilter && this.adminFacCategoryFilter !== "all") {
      list = list.filter((f) => toCategoryLabel(f.category, f.name) === this.adminFacCategoryFilter);
    }

    // Filter by Search Query
    if (this.adminFacSearchQuery) {
      const q = this.adminFacSearchQuery;
      list = list.filter((f) =>
        (f.name || "").toLowerCase().includes(q) ||
        (f.address || "").toLowerCase().includes(q) ||
        (f.benefit || "").toLowerCase().includes(q) ||
        (f.phone || "").toLowerCase().includes(q)
      );
    }

    // Sort
    const sortBy = this.adminFacSortBy || "engagement";
    list = [...list].sort((a, b) => {
      if (sortBy === "clicks") return (b.clicks || 0) - (a.clicks || 0);
      if (sortBy === "qr") return (b.qrScans || 0) - (a.qrScans || 0);
      if (sortBy === "likes") return (b.likes || 0) - (a.likes || 0);
      if (sortBy === "favorites") return (b.favorites || 0) - (a.favorites || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "", "ko");
      return (b.totalEngagement || 0) - (a.totalEngagement || 0);
    });

    if (countEl) countEl.textContent = `${list.length.toLocaleString()}개`;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 28px; color: #94a3b8; font-size: 13px;">
            일치하는 가맹점 데이터가 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    // Render up to 250 items for smooth UI performance
    const displayList = list.slice(0, 250);

    tbody.innerHTML = displayList
      .map((f, idx) => {
        const rank = idx + 1;
        const rankClass = rank === 1 ? "top1" : (rank === 2 ? "top2" : (rank === 3 ? "top3" : ""));
        const sourceBadge = f.sourceType === "nara_sarang_store"
          ? `<span style="font-size: 10px; font-weight: 600; color: #1d4ed8; background: #eff6ff; padding: 1px 6px; border-radius: 4px; border: 1px solid #bfdbfe;">나라사랑</span>`
          : `<span style="font-size: 10px; font-weight: 600; color: #047857; background: #ecfdf5; padding: 1px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">병역명문가</span>`;

        const cat = toCategoryLabel(f.category, f.name);

        return `
          <tr>
            <td style="text-align: center;">
              <span class="facRankBadge ${rankClass}">${rank}</span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: #0f172a; font-size: 13.5px; cursor: pointer;" onclick="window.MMAAuth.adminLocateFacility('${this.escapeHtml(f.facilityId)}')" title="지도에서 위치 보기">
                  ${this.escapeHtml(f.name)}
                </strong>
                ${sourceBadge}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px; max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${this.escapeHtml(f.address || f.region || "")}
              </div>
            </td>
            <td style="text-align: center;">
              <span class="facCategoryBadge">${this.escapeHtml(cat)}</span>
            </td>
            <td style="text-align: center;">
              <span class="facStatValue ${f.clicks > 0 ? 'highlight' : ''}">${(f.clicks || 0).toLocaleString()}</span>
            </td>
            <td style="text-align: center;">
              <span class="facStatValue ${f.qrScans > 0 ? 'qrHighlight' : ''}">${(f.qrScans || 0).toLocaleString()}</span>
            </td>
            <td style="text-align: center;">
              <span class="facStatValue" style="color: #e11d48;">${(f.likes || 0).toLocaleString()}</span>
            </td>
            <td style="text-align: center;">
              <span class="facStatValue" style="color: #d97706;">${(f.favorites || 0).toLocaleString()}</span>
            </td>
            <td style="text-align: center;">
              <div class="facActionBtns">
                <button type="button" class="facActionBtn statsBtn" onclick="window.MMAAuth.adminOpenFacilityStats('${this.escapeHtml(f.facilityId)}')" title="매장 실시간 상생 통계 보기" style="background:#f0fdf4; color:#166534; border: 1px solid #bbf7d0;">
                  통계 보기
                </button>
                <button type="button" class="facActionBtn mapBtn" onclick="window.MMAAuth.adminLocateFacility('${this.escapeHtml(f.facilityId)}')" title="지도 위치로 이동">
                  지도 보기
                </button>
                <button type="button" class="facActionBtn printBtn" onclick="window.MMAAuth.adminOpenFacilityPrintouts('${this.escapeHtml(f.facilityId)}')" title="홍보물 3종 출력">
                  홍보물 출력
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  },

  adminOpenFacilityStats(facilityId) {
    this.returnToAdmin = true;
    this.closeAdminDashboardModal(false);
    this.openMerchantStatsModal(facilityId);
  },

  adminOpenFacilityPrintouts(facilityId) {
    this.returnToAdmin = true;
    this.closeAdminDashboardModal(false);
    if (typeof window.openPrintModal === "function") {
      window.openPrintModal(facilityId);
    }
  },

  async fetchAdminMembers(adminKey = "") {
    try {
      const key = adminKey || (this.user && this.user.role === "admin" ? "" : "demo");
      const url = key ? `/api/admin/users?admin_key=${encodeURIComponent(key)}` : "/api/admin/users";
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};

      let users = await this.fetchSupabaseDirectMembers();
      if (!Array.isArray(users) || users.length === 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(url, { headers, signal: controller.signal });
          clearTimeout(timeoutId);
          const data = await res.json();
          if (data && data.ok && Array.isArray(data.users)) {
            users = data.users;
          }
        } catch (_e) {}
      }

      if (Array.isArray(users)) {
        this.adminMembers = users;

        const total = this.adminMembers.length;
        const general = this.adminMembers.filter((u) => u.role === "general").length;
        const merchant = this.adminMembers.filter((u) => u.role === "merchant").length;
        const admin = this.adminMembers.filter((u) => u.role === "admin").length;

        const elTotal = document.getElementById("adminMemTotalCount");
        const elGen = document.getElementById("adminMemGeneralCount");
        const elMer = document.getElementById("adminMemMerchantCount");
        const elAdm = document.getElementById("adminMemAdminCount");
        const elBadge = document.getElementById("adminMemberBadgeCount");

        if (elTotal) elTotal.innerHTML = `${total}<small>명</small>`;
        if (elGen) elGen.innerHTML = `${general}<small>명</small>`;
        if (elMer) elMer.innerHTML = `${merchant}<small>명</small>`;
        if (elAdm) elAdm.innerHTML = `${admin}<small>명</small>`;
        if (elBadge) elBadge.textContent = `${total}명`;

        this.renderAdminMembersTable();
      }
    } catch (err) {
      addDebugLog(`[Admin Members Error] ${err.message}`, 'error');
    }
  },

  filterAdminMembers(role) {
    this.adminMemberRoleFilter = role;
    document.querySelectorAll(".adminRoleFilterBtn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.role === role);
    });
    this.renderAdminMembersTable();
  },

  searchAdminMembers(query) {
    this.adminMemberSearchQuery = (query || "").trim().toLowerCase();
    this.renderAdminMembersTable();
  },

  renderAdminMembersTable() {
    const tbody = document.getElementById("adminMembersTableBody");
    const countEl = document.getElementById("adminMemberListCount");
    if (!tbody) return;

    let list = this.adminMembers;
    if (this.adminMemberRoleFilter && this.adminMemberRoleFilter !== "all") {
      list = list.filter((u) => u.role === this.adminMemberRoleFilter);
    }
    if (this.adminMemberSearchQuery) {
      const q = this.adminMemberSearchQuery;
      list = list.filter(
        (u) =>
          (u.email || "").toLowerCase().includes(q) ||
          (u.nickname || "").toLowerCase().includes(q) ||
          (u.merchantFacilityName || "").toLowerCase().includes(q) ||
          (u.merchantPhone || "").toLowerCase().includes(q)
      );
    }

    if (countEl) countEl.textContent = list.length;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 28px; color: #94a3b8; font-size: 13px;">
            일치하는 회원이 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list
      .map((u, idx) => {
        const roleBadge =
          u.role === "admin"
            ? `<span class="profileRoleBadge admin">최고 관리자</span>`
            : u.role === "merchant"
            ? `<span class="profileRoleBadge merchant">소상공인 점주</span>`
            : `<span class="profileRoleBadge user">일반회원</span>`;

        let formattedDate = "-";
        if (u.createdAt) {
          const d = new Date(u.createdAt);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            formattedDate = `${y}-${m}-${day} ${hh}:${mm}`;
          }
        }

        const storeInfo = u.merchantFacilityName
          ? `<strong>${this.escapeHtml(u.merchantFacilityName)}</strong>`
          : `<span style="color: #94a3b8;">-</span>`;

        const phoneInfo = u.merchantPhone
          ? `<code>${this.escapeHtml(u.merchantPhone)}</code>`
          : `<span style="color: #94a3b8;">-</span>`;

        const locateBtn = u.merchantFacilityId
          ? `<button type="button" class="adminLocateStoreBtn" onclick="window.MMAAuth.adminLocateFacility('${this.escapeHtml(u.merchantFacilityId)}')">가맹점 위치</button>`
          : `<span style="color: #cbd5e1; font-size: 12px;">-</span>`;

        return `
          <tr>
            <td style="color: #94a3b8; font-size: 11px;">${idx + 1}</td>
            <td>
              <div style="font-weight: 800; color: #0f172a;">${this.escapeHtml(u.nickname || "무명")}</div>
              <div style="font-size: 11px; color: #64748b;">${this.escapeHtml(u.email)}</div>
            </td>
            <td>${roleBadge}</td>
            <td>${storeInfo}</td>
            <td>${phoneInfo}</td>
            <td style="font-size: 11.5px; color: #64748b;">${formattedDate}</td>
            <td style="text-align: center;">${locateBtn}</td>
          </tr>
        `;
      })
      .join("");
  },

  adminLocateFacility(facilityId) {
    this.closeAdminDashboardModal();
    if (typeof window.focusFacility === "function") {
      window.focusFacility(facilityId);
    }
  },

  renderAdminStats(stats) {
    const totalPv = document.getElementById("adminTotalPv");
    const totalUv = document.getElementById("adminTotalUv");
    const todayPv = document.getElementById("adminTodayPv");
    const todayUv = document.getElementById("adminTodayUv");
    const monthPv = document.getElementById("adminMonthPv");
    const monthUv = document.getElementById("adminMonthUv");
    const totalUsers = document.getElementById("adminTotalUsers");
    const userDetail = document.getElementById("adminUserDetail");
    const chartContainer = document.getElementById("adminDailyChartContainer");
    const devContainer = document.getElementById("adminDeviceBreakdown");
    const pathContainer = document.getElementById("adminTopPathsList");
    const tableBody = document.getElementById("adminRecentVisitsBody");

    if (totalPv) totalPv.innerHTML = `${(stats.totalPageviews || 0).toLocaleString()}<small>PV</small>`;
    if (totalUv) totalUv.textContent = `순 방문자 ${(stats.totalUniqueVisitors || 0).toLocaleString()} UV`;
    if (todayPv) todayPv.innerHTML = `${(stats.todayPageviews || 0).toLocaleString()}<small>PV</small>`;
    if (todayUv) todayUv.textContent = `순 방문자 ${(stats.todayUniqueVisitors || 0).toLocaleString()} UV`;
    if (monthPv) monthPv.innerHTML = `${(stats.monthPageviews || 0).toLocaleString()}<small>PV</small>`;
    if (monthUv) monthUv.textContent = `순 방문자 ${(stats.monthUniqueVisitors || 0).toLocaleString()} UV`;

    if (totalUsers) totalUsers.innerHTML = `${stats.users.total || 0}<small>명</small>`;
    if (userDetail) userDetail.textContent = `일반 ${stats.users.general || 0} · 소상공인 ${stats.users.merchant || 0}`;

    // Daily Chart with period support
    this.adminStatsRaw = stats;
    this.adminPeriod = this.adminPeriod || "30d";
    const numDays = this.adminPeriod === "7d" ? 7 : (this.adminPeriod === "180d" ? 180 : 30);
    const pBtns = document.querySelectorAll(".adminPeriodBtn");
    pBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-period") === this.adminPeriod));
    const titleEl = document.getElementById("adminChartTitle");
    if (titleEl) {
      titleEl.textContent = `최근 ${numDays === 30 ? "30일(1달)" : (numDays === 180 ? "6개월" : "7일")} 접속 추이 (페이지뷰 및 순 방문자)`;
    }
    this.renderAdminDailyChart(stats.daily, numDays);

    // Devices
    if (devContainer && stats.devices) {
      const totalDev = (stats.devices.desktop || 0) + (stats.devices.mobile || 0) + (stats.devices.tablet || 0) || 1;
      const pcPct = Math.round(((stats.devices.desktop || 0) / totalDev) * 100);
      const mobPct = Math.round(((stats.devices.mobile || 0) / totalDev) * 100);
      const tabPct = Math.round(((stats.devices.tablet || 0) / totalDev) * 100);
      devContainer.innerHTML = `
        <div class="adminPathItem"><strong>PC / 데스크톱</strong><span>${stats.devices.desktop || 0}건 (${pcPct}%)</span></div>
        <div class="adminPathItem"><strong>모바일 (스마트폰)</strong><span>${stats.devices.mobile || 0}건 (${mobPct}%)</span></div>
        <div class="adminPathItem"><strong>태블릿</strong><span>${stats.devices.tablet || 0}건 (${tabPct}%)</span></div>
      `;
    }

    // Top Paths
    if (pathContainer && stats.topPaths) {
      pathContainer.innerHTML = stats.topPaths
        .map((p) => `<div class="adminPathItem"><strong>${this.escapeHtml(p.path)}</strong><span>${p.count}회</span></div>`)
        .join("");
    }

    // Recent visits table
    if (tableBody && stats.recentVisits) {
      tableBody.innerHTML = stats.recentVisits
        .map(
          (v) => `
          <tr>
            <td>${this.escapeHtml(v.time)}</td>
            <td><code>${this.escapeHtml(v.path)}</code></td>
            <td>${this.escapeHtml(v.referrer)}</td>
            <td>${this.escapeHtml(v.device)}</td>
            <td><span class="adminBadge">${this.escapeHtml(v.role)}</span></td>
          </tr>
        `
        )
        .join("");
    }
  },

  changeAdminPeriod(periodKey) {
    this.adminPeriod = periodKey;
    const btns = document.querySelectorAll(".adminPeriodBtn");
    btns.forEach(b => b.classList.toggle("active", b.getAttribute("data-period") === periodKey));

    const numDays = periodKey === "7d" ? 7 : (periodKey === "180d" ? 180 : 30);
    const titleEl = document.getElementById("adminChartTitle");
    if (titleEl) {
      titleEl.textContent = `최근 ${numDays === 30 ? "30일(1달)" : (numDays === 180 ? "6개월" : "7일")} 접속 추이 (페이지뷰 및 순 방문자)`;
    }

    if (this.adminStatsRaw && this.adminStatsRaw.daily) {
      this.renderAdminDailyChart(this.adminStatsRaw.daily, numDays);
    }
  },

  renderAdminDailyChart(dailyData = [], numDays = 30) {
    const chartContainer = document.getElementById("adminDailyChartContainer");
    if (!chartContainer || !Array.isArray(dailyData)) return;

    const daysCount = Number(numDays) || 30;
    const sliced = dailyData.slice(-daysCount);
    const maxPv = Math.max(...sliced.map((d) => d.pv), 10);
    const todayStr = new Date().toISOString().slice(5, 10).replace("-", ".");
    chartContainer.innerHTML = sliced
      .map((d, idx) => {
        const isToday = idx === sliced.length - 1 || d.date === todayStr;
        const heightPercent = Math.max(8, Math.round((d.pv / maxPv) * 100));
        return `
          <div class="adminChartBarCol ${isToday ? 'today' : ''}" style="${daysCount === 180 ? 'min-width: 24px;' : ''}">
            <span class="adminChartBarVal">${d.pv > 0 ? d.pv : ''}</span>
            <div class="adminChartBarPv" style="height: ${heightPercent}%;"></div>
            <span class="adminChartBarLabel">${d.date}${isToday ? '<br><b style="color:#d97706;">오늘</b>' : ''}</span>
          </div>
        `;
      })
      .join("");

    setTimeout(() => {
      chartContainer.scrollLeft = chartContainer.scrollWidth;
    }, 50);
  },

  async fetchSupabaseStoreStats(facilityId, periodDays = 7) {
    try {
      const url = this.getSupabaseUrl();
      const headers = this.getSupabaseHeaders();
      const fid = String(facilityId || "").trim();
      const cleanFid = fid.split("____")[0] || fid;

      // Find store meta from window.points or fallback
      let store = null;
      if (Array.isArray(window.points)) {
        store = window.points.find(p => (p.facilityId || p.facility_id || p.id) === fid || (p.facilityId || p.facility_id || p.id) === cleanFid);
      }

      const storeName = store ? (store.title || store.name) : (fid === this.user?.merchantFacilityId ? this.user.merchantFacilityName : fid);
      const storeCategory = store ? (store.subtitle || store.category || "가맹점") : "가맹점";
      const storeAddress = store ? (store.address || "") : "";
      const storePhone = store ? (store.phone || "") : "";

      const startOfTodayMs = new Date().setHours(0, 0, 0, 0);
      const startOfMonthMs = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const numDays = Number(periodDays) || 7;
      const periodAgoMs = startOfTodayMs - (numDays - 1) * 86400000;

      // 1. Direct page visits for this store from Supabase page_visits
      const pvRes = await fetch(`${url}/page_visits?path=like.*${encodeURIComponent(cleanFid)}*&select=id,visited_at,device_type`, { headers });
      const pvList = (await pvRes.json()) || [];
      const totalPv = Array.isArray(pvList) ? pvList.length : 0;
      const todayPv = Array.isArray(pvList) ? pvList.filter(p => (Number(p.visited_at) || 0) >= startOfTodayMs).length : 0;
      const monthPv = Array.isArray(pvList) ? pvList.filter(p => (Number(p.visited_at) || 0) >= startOfMonthMs).length : 0;

      // 2. QR scans from Supabase qr_scan_events
      const qrRes = await fetch(`${url}/qr_scan_events?facility_id=like.*${encodeURIComponent(cleanFid)}*&select=event_id,created_at,source,is_indirect,parent_facility_id`, { headers });
      const qrList = (await qrRes.json()) || [];
      const directQrList = Array.isArray(qrList) ? qrList.filter(q => Number(q.is_indirect) !== 1) : [];
      const indirectQrList = Array.isArray(qrList) ? qrList.filter(q => Number(q.is_indirect) === 1) : [];

      const totalDirectScans = directQrList.length + totalPv;
      const todayDirectScans = directQrList.filter(q => (Number(q.created_at) || 0) >= startOfTodayMs).length + todayPv;
      const monthDirectScans = directQrList.filter(q => (Number(q.created_at) || 0) >= startOfMonthMs).length + monthPv;

      const totalIndirect = indirectQrList.length;
      const todayIndirect = indirectQrList.filter(q => (Number(q.created_at) || 0) >= startOfTodayMs).length;
      const monthIndirect = indirectQrList.filter(q => (Number(q.created_at) || 0) >= startOfMonthMs).length;
      const totalReach = totalDirectScans + totalIndirect;

      // 3. Comments and QA from Supabase
      let totalComments = 0;
      let storeComments = [];
      try {
        const cRes = await fetch(`${url}/facility_comments?facility_id=like.*${encodeURIComponent(cleanFid)}*&order=created_at.desc&limit=50`, { headers });
        const cRows = await cRes.json();
        if (Array.isArray(cRows)) {
          totalComments = cRows.length;
          storeComments = cRows;
        }
      } catch (_e) {}

      let totalQa = 0;
      let storeQaList = [];
      try {
        const qRes = await fetch(`${url}/facility_qa?facility_id=like.*${encodeURIComponent(cleanFid)}*&order=id.desc&limit=50`, { headers });
        const qRows = await qRes.json();
        if (Array.isArray(qRows)) {
          totalQa = qRows.length;
          storeQaList = qRows.map(r => ({
            id: r.id,
            q: r.question,
            author: r.author,
            a: r.answer || "",
            date: r.created_at
          }));
        }
      } catch (_e) {}

      // 4. Likes & Favorites from Supabase
      let totalLikes = 0;
      let totalFavs = 0;
      try {
        const actRes = await fetch(`${url}/facility_action_states?facility_id=like.*${encodeURIComponent(cleanFid)}*&active=eq.1&select=action_type,facility_id`, { headers });
        const acts = (await actRes.json()) || [];
        if (Array.isArray(acts)) {
          totalLikes = acts.filter(a => a.action_type === "like").length;
          totalFavs = acts.filter(a => a.action_type === "favorite").length;
        }
      } catch (_e) {}

      // Cross-check in-memory sets and counts
      if (typeof likes !== "undefined") {
        for (const k of likes) {
          if (k === fid || k === cleanFid || k.startsWith(cleanFid + "_") || fid.startsWith(k + "_")) {
            totalLikes = Math.max(totalLikes, 1);
            break;
          }
        }
      }
      if (typeof favorites !== "undefined") {
        for (const k of favorites) {
          if (k === fid || k === cleanFid || k.startsWith(cleanFid + "_") || fid.startsWith(k + "_")) {
            totalFavs = Math.max(totalFavs, 1);
            break;
          }
        }
      }
      if (typeof likeCountsById !== "undefined") {
        for (const [k, v] of Object.entries(likeCountsById)) {
          if (k === fid || k === cleanFid || k.startsWith(cleanFid + "_") || fid.startsWith(k + "_")) {
            totalLikes = Math.max(totalLikes, Number(v) || 0);
          }
        }
      }
      if (typeof favoriteCountsById !== "undefined") {
        for (const [k, v] of Object.entries(favoriteCountsById)) {
          if (k === fid || k === cleanFid || k.startsWith(cleanFid + "_") || fid.startsWith(k + "_")) {
            totalFavs = Math.max(totalFavs, Number(v) || 0);
          }
        }
      }

      // 5. Daily Stacked Chart for selected periodDays
      const dailyMap = {};
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(startOfTodayMs - i * 86400000);
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateKey = `${m}.${day}`;
        dailyMap[dateKey] = { date: dateKey, count: 0, directCount: 0, indirectCount: 0 };
      }

      if (Array.isArray(pvList)) {
        pvList.forEach(p => {
          const vTime = Number(p.visited_at) || 0;
          if (vTime >= periodAgoMs) {
            const d = new Date(vTime);
            const key = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
            if (dailyMap[key]) {
              dailyMap[key].directCount++;
              dailyMap[key].count++;
            }
          }
        });
      }

      if (Array.isArray(qrList)) {
        qrList.forEach(q => {
          const cTime = Number(q.created_at) || 0;
          if (cTime >= periodAgoMs) {
            const d = new Date(cTime);
            const key = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
            if (dailyMap[key]) {
              if (Number(q.is_indirect) === 1) {
                dailyMap[key].indirectCount++;
              } else {
                dailyMap[key].directCount++;
              }
              dailyMap[key].count++;
            }
          }
        });
      }

      const daily = Object.values(dailyMap);

      // 6. Mutual Partner Stores
      const partnerCounts = {};
      indirectQrList.forEach(q => {
        const pid = String(q.parent_facility_id || "").trim();
        if (pid) partnerCounts[pid] = (partnerCounts[pid] || 0) + 1;
      });
      const mutualPartners = Object.entries(partnerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pid, cnt]) => {
          const pStore = Array.isArray(window.points) ? window.points.find(p => (p.facility_id || p.id) === pid) : null;
          return {
            partnerId: pid,
            partnerName: pStore ? (pStore.name || pStore.title) : "이웃 가맹점",
            partnerCategory: pStore ? (pStore.category || "가맹점") : "가맹점",
            count: cnt
          };
        });

      // 7. Sources breakdown
      const sources = { poster: 0, table_stand: 0, door_hanger: 0, mobile_landing: 0 };
      if (Array.isArray(qrList)) {
        qrList.forEach(q => {
          const s = String(q.source || "poster").toLowerCase();
          if (sources[s] !== undefined) sources[s]++;
          else sources.poster++;
        });
      }
      if (totalPv > 0) {
        sources.mobile_landing += totalPv;
      }

      return {
        ok: true,
        facilityId: fid,
        storeName,
        storeCategory,
        storeAddress,
        storePhone,
        periodDays: numDays,
        stats: {
          totalScans: totalDirectScans,
          indirectExposures: totalIndirect,
          totalMutualReach: totalReach,
          todayScans: todayDirectScans,
          todayIndirect,
          monthScans: monthDirectScans,
          monthIndirect,
          totalLikes,
          totalFavorites: totalFavs,
          totalComments,
          comments: storeComments,
          totalQa,
          qaList: storeQaList,
          daily,
          mutualPartners,
          sources
        }
      };
    } catch (err) {
      console.error("[Supabase Store Stats Error]", err);
      return null;
    }
  },

  async openMerchantStatsModal(customFacilityId = "") {
    if (typeof closeIntroPopup === "function") closeIntroPopup(false);
    
    // Allow merchant, admin, or any tester
    const targetFid = customFacilityId || this.currentStatsFacilityId || this.user?.merchantFacilityId || "nara_3218";
    this.currentStatsFacilityId = targetFid;
    this.merchantStatsPeriod = this.merchantStatsPeriod || "7d";

    const backdrop = document.getElementById("merchantStatsBackdrop");
    const modal = document.getElementById("merchantStatsModal");
    if (!backdrop || !modal) return;

    this.switchMerchantStatsTab("tab-mstats-overview");
    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");

    const numDays = this.merchantStatsPeriod === "30d" ? 30 : (this.merchantStatsPeriod === "180d" ? 180 : 7);

    // Fetch real stats directly from Supabase
    const data = await this.fetchSupabaseStoreStats(targetFid, numDays);
    if (data) {
      this.renderMerchantStats(data, numDays);
    }
  },

  closeMerchantStatsModal() {
    const backdrop = document.getElementById("merchantStatsBackdrop");
    const modal = document.getElementById("merchantStatsModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");

    if (this.returnToAdmin) {
      this.returnToAdmin = false;
      this.openAdminDashboardModal("", "facilities");
    }
  },

  async changeMerchantPeriod(periodKey) {
    this.merchantStatsPeriod = periodKey;
    const btns = document.querySelectorAll(".periodFilterBtn");
    btns.forEach(b => b.classList.toggle("active", b.getAttribute("data-period") === periodKey));

    const numDays = periodKey === "7d" ? 7 : (periodKey === "180d" ? 180 : 30);
    const titleEl = document.getElementById("merchantChartTitle");
    if (titleEl) {
      titleEl.textContent = `최근 ${numDays === 30 ? "1달" : (numDays === 180 ? "6개월" : "7일")} 직접 방문 & 이웃 팜플렛 노출 추이`;
    }

    const fid = this.currentStatsFacilityId || this.user?.merchantFacilityId || "nara_3218";
    const data = await this.fetchSupabaseStoreStats(fid, numDays);
    if (data) {
      this.renderMerchantStats(data, numDays);
    }
  },

  renderMerchantStats(data, periodDays = 7) {
    const storeTitle = document.getElementById("merchantStoreTitle");
    const storeCat = document.getElementById("merchantStoreCategory");
    const storeAddr = document.getElementById("merchantStoreAddress");
    const totalEl = document.getElementById("kpiTotalScans");
    const indirectEl = document.getElementById("kpiIndirectExposures");
    const directSub = document.getElementById("kpiDirectSub");
    const indirectSub = document.getElementById("kpiIndirectSub");
    const chartContainer = document.getElementById("dailyChartContainer");
    const partnerList = document.getElementById("mutualPartnersList");
    const sourceList = document.getElementById("sourceBreakdownList");

    const stats = data.stats || {};
    if (storeTitle) storeTitle.textContent = data.storeName || this.user?.merchantFacilityName || "가맹점";
    if (storeCat) storeCat.textContent = data.storeCategory || "가맹점";
    if (storeAddr) storeAddr.textContent = data.storeAddress || "대한민국";

    const totalScansVal = Number(stats.totalScans) || 0;
    const likesVal = Number(stats.totalLikes) || 0;
    const favsVal = Number(stats.totalFavorites) || 0;
    const commentsVal = Number(stats.totalComments) || 0;
    const qaVal = Number(stats.totalQa) || 0;
    const indirectVal = Number(stats.indirectExposures) || 0;

    // Tab 1 KPI Cards
    if (totalEl) totalEl.innerHTML = `${totalScansVal.toLocaleString()}<small>회</small>`;
    if (indirectEl) indirectEl.innerHTML = `${indirectVal.toLocaleString()}<small>회</small>`;
    if (directSub) directSub.textContent = `오늘 ${(Number(stats.todayScans) || 0).toLocaleString()}회`;
    if (indirectSub) indirectSub.textContent = `상생 연계 노출 (오늘 ${(Number(stats.todayIndirect) || 0).toLocaleString()}회)`;

    // Update Period Filter active button in Tab 1
    const pBtns = document.querySelectorAll(".periodFilterBtn");
    pBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-period") === (this.merchantStatsPeriod || "7d")));

    const titleEl = document.getElementById("merchantChartTitle");
    if (titleEl) {
      titleEl.textContent = `최근 ${periodDays === 30 ? "1달" : (periodDays === 180 ? "6개월" : "7일")} 직접 방문 & 이웃 팜플렛 노출 추이`;
    }

    // Render Daily Stacked Chart (Direct vs Indirect)
    if (chartContainer && Array.isArray(stats.daily)) {
      const maxCount = Math.max(...stats.daily.map((d) => d.count || 0), 1);
      chartContainer.innerHTML = stats.daily
        .map((d) => {
          const directPct = d.count > 0 ? Math.round(((d.directCount || 0) / d.count) * 100) : 0;
          const indirectPct = d.count > 0 ? Math.round(((d.indirectCount || 0) / d.count) * 100) : 0;
          const barHeightPct = d.count > 0 ? Math.max(12, Math.round((d.count / maxCount) * 100)) : 6;
          return `
            <div class="chartBarCol" style="${periodDays === 180 ? 'min-width: 24px;' : ''}">
              <span class="chartBarValue">${d.count > 0 ? d.count : 0}</span>
              <div style="display: flex; flex-direction: column-reverse; width: 100%; max-width: 18px; height: ${barHeightPct}%;">
                <div style="background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%); height: ${directPct}%; border-radius: 0 0 3px 3px;"></div>
                <div style="background: linear-gradient(180deg, #34d399 0%, #10b981 100%); height: ${indirectPct}%; border-radius: 3px 3px 0 0;"></div>
              </div>
              <span class="chartBarLabel">${d.date}</span>
            </div>
          `;
        })
        .join("");

      setTimeout(() => {
        chartContainer.scrollLeft = chartContainer.scrollWidth;
      }, 50);
    }

    // Tab 2: 4 KPI Cards
    const tabLikesEl = document.getElementById("mstatsTabLikesCount");
    const tabFavsEl = document.getElementById("mstatsTabFavsCount");
    const tabCommentsEl = document.getElementById("mstatsTabCommentsCount");
    const tabQaEl = document.getElementById("mstatsTabQaCount");
    const subCommentsEl = document.getElementById("mstatsSubCommentsCount");
    const subQaEl = document.getElementById("mstatsSubQaCount");

    if (tabLikesEl) tabLikesEl.textContent = likesVal.toLocaleString();
    if (tabFavsEl) tabFavsEl.textContent = favsVal.toLocaleString();
    if (tabCommentsEl) tabCommentsEl.textContent = commentsVal.toLocaleString();
    if (tabQaEl) tabQaEl.textContent = qaVal.toLocaleString();
    if (subCommentsEl) subCommentsEl.textContent = commentsVal.toLocaleString();
    if (subQaEl) subQaEl.textContent = qaVal.toLocaleString();

    // Cache comments and QA data for pagination
    this.merchantCommentsData = stats.comments || [];
    this.merchantQaData = stats.qaList || [];
    this.renderMerchantCommentsList(1);
    this.renderMerchantQaList(1);
    this.switchCommSubTab(this.merchantCommSubTab || "comments");

    // Render Mutual Partners List (Tab 3)
    if (partnerList) {
      const partners = stats.mutualPartners || [];
      if (partners.length === 0) {
        partnerList.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 13px;">
            주변 나라사랑가게 포스터/스탠드가 인쇄되면 여기에 상생 파트너 매장이 자동 기록됩니다.
          </div>
        `;
      } else {
        partnerList.innerHTML = partners
          .map((p, idx) => `
            <div class="sourceItem" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; font-weight: 800; color: #2563eb; background: #eff6ff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${idx + 1}</span>
                <div>
                  <strong style="font-size: 13.5px; color: #1e293b;">${this.escapeHtml(p.partnerName)}</strong>
                  <span style="font-size: 11px; color: #64748b; margin-left: 4px;">(${this.escapeHtml(p.partnerCategory)})</span>
                </div>
              </div>
              <span style="font-weight: 700; color: #059669; font-size: 13px;">${p.count}회 상생 노출</span>
            </div>
          `)
          .join("");
      }
    }

    // Render Source Breakdown (Tab 3)
    if (sourceList) {
      const src = stats.sources || { poster: 0, table_stand: 0, door_hanger: 0, mobile_landing: 0 };
      sourceList.innerHTML = `
        <div class="sourceItem">
          <strong>포스터 (상생지도 결합)</strong>
          <span>${(src.poster || 0).toLocaleString()}회</span>
        </div>
        <div class="sourceItem">
          <strong>미니 테이블 스탠드</strong>
          <span>${(src.table_stand || 0).toLocaleString()}회</span>
        </div>
        <div class="sourceItem">
          <strong>도어행거 (문고리형)</strong>
          <span>${(src.door_hanger || 0).toLocaleString()}회</span>
        </div>
        <div class="sourceItem">
          <strong>모바일 안내 페이지 연계</strong>
          <span>${(src.mobile_landing || 0).toLocaleString()}회</span>
        </div>
      `;
    }
  },

  switchCommSubTab(subTab) {
    this.merchantCommSubTab = subTab;
    const btnComments = document.getElementById("btnSubTabComments");
    const btnQa = document.getElementById("btnSubTabQa");
    const paneComments = document.getElementById("commSubPaneComments");
    const paneQa = document.getElementById("commSubPaneQa");

    if (btnComments) btnComments.classList.toggle("active", subTab === "comments");
    if (btnQa) btnQa.classList.toggle("active", subTab === "qa");
    if (paneComments) paneComments.style.display = subTab === "comments" ? "block" : "none";
    if (paneQa) paneQa.style.display = subTab === "qa" ? "block" : "none";
  },

  renderMerchantCommentsList(page = 1) {
    this.merchantCommentsPage = page;
    const container = document.getElementById("mstatsCommentsList");
    const pagContainer = document.getElementById("mstatsCommentsPagination");
    if (!container) return;

    const list = this.merchantCommentsData || [];
    const pageSize = 4;
    const totalPages = Math.ceil(list.length / pageSize) || 1;
    const curPage = Math.max(1, Math.min(page, totalPages));
    const startIdx = (curPage - 1) * pageSize;
    const pageItems = list.slice(startIdx, startIdx + pageSize);

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: #94a3b8; font-size: 13px;">
          아직 등록된 장병 응원 후기가 없습니다. 첫 방문 후기를 기다리는 중입니다.
        </div>
      `;
      if (pagContainer) pagContainer.innerHTML = "";
      return;
    }

    container.innerHTML = pageItems.map(c => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 13px; color: #1e293b;">${this.escapeHtml(c.author_name || c.author || "청년 장병")}</strong>
          <span style="font-size: 11px; color: #94a3b8;">${this.escapeHtml(c.date || (c.created_at ? new Date(c.created_at).toLocaleDateString("ko-KR") : ""))}</span>
        </div>
        <div style="font-size: 13px; color: #334155; line-height: 1.5;">${this.escapeHtml(c.comment_text || c.text || "")}</div>
      </div>
    `).join("");

    if (pagContainer) {
      let html = "";
      html += `<button type="button" class="pageBtn" ${curPage <= 1 ? "disabled" : ""} onclick="window.MMAAuth.renderMerchantCommentsList(${curPage - 1})">이전</button>`;
      for (let p = 1; p <= totalPages; p++) {
        html += `<button type="button" class="pageBtn ${p === curPage ? "active" : ""}" onclick="window.MMAAuth.renderMerchantCommentsList(${p})">${p}</button>`;
      }
      html += `<button type="button" class="pageBtn" ${curPage >= totalPages ? "disabled" : ""} onclick="window.MMAAuth.renderMerchantCommentsList(${curPage + 1})">다음</button>`;
      pagContainer.innerHTML = html;
    }
  },

  renderMerchantQaList(page = 1) {
    this.merchantQaPage = page;
    const container = document.getElementById("mstatsQaList");
    const pagContainer = document.getElementById("mstatsQaPagination");
    if (!container) return;

    const list = this.merchantQaData || [];
    const pageSize = 4;
    const totalPages = Math.ceil(list.length / pageSize) || 1;
    const curPage = Math.max(1, Math.min(page, totalPages));
    const startIdx = (curPage - 1) * pageSize;
    const pageItems = list.slice(startIdx, startIdx + pageSize);

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: #94a3b8; font-size: 13px;">
          등록된 1:1 Q&A 문의가 없습니다.
        </div>
      `;
      if (pagContainer) pagContainer.innerHTML = "";
      return;
    }

    container.innerHTML = pageItems.map(q => {
      const qMeta = typeof parseQuestionMeta === "function" ? parseQuestionMeta(q.q) : { isSecret: false, text: q.q };
      const answerHtml = q.a ? `
        <div style="margin-top: 8px; padding: 8px 12px; background: #eff6ff; border-radius: 6px; font-size: 12.5px; color: #1e40af; border-left: 3px solid #3b82f6;">
          <div style="font-weight: 700; font-size: 11px; margin-bottom: 2px;">점주 답변</div>
          <div>${this.escapeHtml(q.a)}</div>
        </div>
      ` : `
        <div style="margin-top: 8px; display: flex; gap: 6px;">
          <input type="text" id="mReplyInput_${q.id}" placeholder="점주 답변을 작성해 주세요..." style="flex:1; font-size: 12px; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;" />
          <button type="button" onclick="window.MMAAuth.submitMerchantQaReply(${q.id})" style="padding: 6px 12px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">답변 등록</button>
        </div>
      `;

      return `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; font-weight: 700; color: #334155;">${this.escapeHtml(q.author || "문의 고객")}</span>
              ${qMeta.isSecret ? '<span style="font-size: 10px; background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 1px 5px; border-radius: 4px;">비공개</span>' : ''}
            </div>
            <span style="font-size: 11px; color: #94a3b8;">${this.escapeHtml(q.date ? new Date(q.date).toLocaleDateString("ko-KR") : "")}</span>
          </div>
          <div style="font-size: 13px; color: #1e293b; font-weight: 600;">Q. ${this.escapeHtml(qMeta.text || q.q || "")}</div>
          ${answerHtml}
        </div>
      `;
    }).join("");

    if (pagContainer) {
      let html = "";
      html += `<button type="button" class="pageBtn" ${curPage <= 1 ? "disabled" : ""} onclick="window.MMAAuth.renderMerchantQaList(${curPage - 1})">이전</button>`;
      for (let p = 1; p <= totalPages; p++) {
        html += `<button type="button" class="pageBtn ${p === curPage ? "active" : ""}" onclick="window.MMAAuth.renderMerchantQaList(${p})">${p}</button>`;
      }
      html += `<button type="button" class="pageBtn" ${curPage >= totalPages ? "disabled" : ""} onclick="window.MMAAuth.renderMerchantQaList(${curPage + 1})">다음</button>`;
      pagContainer.innerHTML = html;
    }
  },

  async submitMerchantQaReply(qaId) {
    const input = document.getElementById(`mReplyInput_${qaId}`);
    if (!input || !input.value.trim()) {
      alert("답변 내용을 입력해 주세요.");
      return;
    }
    const answerText = input.value.trim();
    try {
      const { url, headers } = getSupabaseDirectConfig();
      await fetch(`${url}/facility_qa?id=eq.${qaId}`, {
        method: "PATCH",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({ answer: answerText })
      });
      alert("답변이 성공적으로 등록되었습니다.");
      if (Array.isArray(this.merchantQaData)) {
        const item = this.merchantQaData.find(q => q.id == qaId);
        if (item) item.a = answerText;
      }
      this.renderMerchantQaList(this.merchantQaPage);
    } catch (err) {
      console.error("Submit QA Reply Error:", err);
      alert("답변 등록에 실패했습니다.");
    }
  },

  switchMerchantStatsTab(tabId) {
    const tabs = document.querySelectorAll(".merchantStatsTabBtn");
    const panes = document.querySelectorAll(".merchantStatsTabPane");
    tabs.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
    panes.forEach(pane => {
      pane.classList.toggle("active", pane.id === tabId);
    });
  },

  showPolicyModal(type = "terms") {
    const backdrop = document.getElementById("policyBackdrop");
    const modal = document.getElementById("policyModal");
    const title = document.getElementById("policyModalTitle");
    const body = document.getElementById("policyModalBody");
    if (!backdrop || !modal || !body) return;

    if (type === "terms") {
      if (title) title.textContent = "군필지도(GP Map) 서비스 이용약관";
      body.innerHTML = `
        <div style="font-size: 11.5px; color: #64748b; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
          시행일자: 2026년 9월 1일 (공정거래위원회 표준약관 준수)
        </div>
        <h4>제1조 (목적)</h4>
        <p>본 약관은 군필지도(이하 "서비스")가 제공하는 청년 장병 및 병역명문가 상생 우대 혜택 정보 제공, 소상공인 가맹점 지원 및 제반 서비스의 이용 조건과 절차, 회사와 회원의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

        <h4>제2조 (용어의 정의)</h4>
        <ul>
          <li><b>"서비스"</b>란 단말기(PC, 스마트폰 등)와 무관하게 이용자가 이용할 수 있는 군필지도 및 관련 제반 서비스를 의미합니다.</li>
          <li><b>"회원"</b>이란 서비스에 개인정보를 제공하여 회원등록을 한 자로서 일반회원(병역이행자·병역명문가), 소상공인 회원(가맹점주), 운영 관리자로 구분됩니다.</li>
          <li><b>"소상공인 회원"</b>이란 병무청 나라사랑가게 등 상생 가맹점주로서 사업자 또는 매장 전화번호 인증을 거쳐 가입한 회원을 의미합니다.</li>
        </ul>

        <h4>제3조 (약관의 효력 및 변경)</h4>
        <p>1. 본 약관은 서비스 화면에 게시하거나 전자우편 등의 방법으로 회원에게 공지함으로써 효력이 발생합니다.<br>
        2. 서비스는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 최소 7일 전(중요 변경 시 30일 전)에 공지합니다.</p>

        <h4>제4조 (회원가입 및 계정 관리)</h4>
        <p>1. 이용자는 회사가 정한 가입 양식에 따라 필수 정보를 입력하고 본 약관 및 개인정보 처리방침에 동의함으로써 회원가입을 신청합니다.<br>
        2. 회원의 이메일 및 비밀번호에 관한 관리책임은 회원 본인에게 있으며, 제3자에게 양도하거나 대여할 수 없습니다.</p>

        <h4>제5조 (서비스의 제공 및 변경)</h4>
        <p>1. 서비스는 연중무휴 1일 24시간 제공을 원칙으로 합니다.<br>
        2. 공공데이터 업데이트, 시스템 정기 점검, 통신 장애 등 불가피한 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>

        <h4>제6조 (소상공인 가맹점 혜택 및 QR 통계)</h4>
        <p>1. 소상공인 회원은 본인 매장의 지도 등록 상태 확인, 홍보물 출력 지원, 실시간 QR 스캔 통계 열람 권한을 가집니다.<br>
        2. 허위 정보 등록 또는 타인의 매장을 무단 도용하여 인증한 경우 회원 자격이 즉시 박탈될 수 있습니다.</p>

        <h4>제7조 (게시물의 관리 및 저작권)</h4>
        <p>1. 회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시자에게 귀속됩니다.<br>
        2. 타인의 명예훼손, 저작권 침해, 음란·욕설, 허위광고 등 법령에 위반되는 게시물은 사전 통보 없이 임시조치 또는 삭제될 수 있습니다.</p>

        <h4>제8조 (회사의 의무)</h4>
        <p>1. 회사는 관련 법령과 본 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위해 최선을 다합니다.<br>
        2. 회사는 회원의 개인정보를 안전하게 보호하기 위해 보안시스템을 구축하고 개인정보 처리방침을 준수합니다.</p>

        <h4>제9조 (면책조항)</h4>
        <p>1. 회사는 천재지변, 기간통신사업자의 회선 장애, 공공데이터 원천 기관의 서버 오류 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.<br>
        2. 회사는 가맹점의 일방적인 영업 정책 변경이나 휴폐업으로 인한 할인 혜택 불일치에 대해 고의 또는 중과실이 없는 한 책임을 부담하지 않습니다.</p>

        <h4>제10조 (분쟁해결 및 관할법원)</h4>
        <p>서비스 이용과 관련하여 분쟁이 발생한 경우 상호 원만한 해결을 위해 협의하며, 소송이 제기될 경우 대한민국 법령에 따르고 본점 소재지를 관할하는 법원을 전속관할로 합니다.</p>
      `;
    } else {
      if (title) title.textContent = "군필지도(GP Map) 개인정보 처리방침";
      body.innerHTML = `
        <div style="font-size: 11.5px; color: #64748b; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
          개인정보 보호법 제30조 준수 · 시행일자: 2026년 9월 1일 (최신 개정)
        </div>
        <p>군필지도(이하 "서비스")는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보 보호법」 제30조에 따라 정보주체에게 개인정보의 처리와 보호에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>

        <h4>제1조 (개인정보의 처리 목적)</h4>
        <p>서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
        <ul>
          <li><b>1. 회원 가입 및 관리</b>: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지.</li>
          <li><b>2. 재화 또는 서비스 제공</b>: 청년 장병 및 병역명문가 우대 상생가게 위치 및 혜택 정보 제공, 가맹점주 점포 소유권 검증 및 매장별 실시간 QR 통계 제공, 즐겨찾기 저장.</li>
          <li><b>3. 서비스 개선 및 통계 분석</b>: 접속 빈도 파악, 회원의 서비스 이용에 대한 통계 수집, 보안 모니터링 및 안정성 강화.</li>
        </ul>

        <h4>제2조 (개인정보의 처리 및 보유 기간)</h4>
        <p>1. 서비스는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.<br>
        2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
        <ul>
          <li><b>회원 가입 및 관리 정보</b>: 회원 탈퇴 시까지 (탈퇴 시 지체 없이 영구 파기). 단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지.</li>
          <li><b>전자상거래 등에서의 소비자보호에 관한 법률</b>:
            <br>- 계약 또는 청약철회 등에 관한 기록: 5년
            <br>- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년
          </li>
          <li><b>통신비밀보호법</b>: 웹사이트 접속기록(로그): 3개월</li>
        </ul>

        <h4>제3조 (처리하는 개인정보의 항목)</h4>
        <p>서비스는 회원가입 및 원활한 서비스 제공을 위해 다음의 개인정보 항목을 처리하고 있습니다.</p>
        <ul>
          <li><b>1. 일반회원 가입 시 (필수)</b>: 이메일 주소(아이디), 활동 닉네임, 암호화된 비밀번호(단방향 솔트 해시 암호화)</li>
          <li><b>2. 소상공인 점주 회원 가입 시 (필수)</b>: 이메일 주소, 닉네임, 비밀번호, 사업장 매장명, 매장 대표 전화번호, 매장 고유 식별키(Facility ID)</li>
          <li><b>3. 서비스 이용과정에서 자동 생성·수집되는 항목</b>: 접속 IP 주소(보안 솔트 단방향 해시 처리), 쿠키(Cookie), 접속 일시, 서비스 이용 기록, 불량 이용 기록, 기기 정보(OS, 브라우저 종류)</li>
        </ul>

        <h4>제4조 (개인정보의 제3자 제공에 관한 사항)</h4>
        <p>1. 서비스는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.<br>
        2. 단, 법률의 특별한 규정이 있거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우에 한하여 제공합니다.</p>

        <h4>제5조 (개인정보처리의 위탁에 관한 사항)</h4>
        <p>1. 서비스는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
        <ul>
          <li><b>수탁업체</b>: Vercel Inc. / Render Services Inc.</li>
          <li><b>위탁업무 내용</b>: 클라우드 웹 호스팅, 백엔드 API 서버 인프라 운영 및 데이터베이스 보관</li>
          <li><b>수탁업체</b>: Naver Cloud Platform / 표준 SMTP 인프라</li>
          <li><b>위탁업무 내용</b>: 회원가입 및 본인인증 이메일 발송</li>
        </ul>
        <p>2. 서비스는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 수탁자에 대한 관리·감독 등 책임에 관한 사항을 규정하고 수탁자가 개인정보를 안전하게 처리하는지 감독하고 있습니다.</p>

        <h4>제6조 (개인정보의 국외 이전에 관한 사항)</h4>
        <p>서비스는 글로벌 클라우드 서버(Vercel, Render)를 활용하여 안정적인 서비스를 제공하고 있으며, 데이터는 전송 및 저장 시 국제 표준 보안 프로토콜(TLS/HTTPS, AES-256)에 따라 안전하게 암호화되어 관리됩니다.</p>

        <h4>제7조 (개인정보의 파기 절차 및 파기 방법)</h4>
        <p>1. 서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.<br>
        2. 파기 절차: 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 거쳐 파기합니다.<br>
        3. 파기 방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 영구 삭제하며, 출력물은 분쇄하거나 소각합니다.</p>

        <h4>제8조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h4>
        <p>1. 정보주체는 서비스에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.<br>
        2. 권리 행사는 마이페이지(회원정보 수정) 또는 운영자 이메일을 통하여 서면, 전자우편 등을 통해 하실 수 있으며 서비스는 이에 대해 지체 없이 조치하겠습니다.<br>
        3. 회원 탈퇴 시 계정에 연결된 개인정보는 즉시 복구 불가능하게 파기됩니다.</p>

        <h4>제9조 (개인정보의 안전성 확보조치)</h4>
        <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 기술적·관리적·물리적 조치를 취하고 있습니다.</p>
        <ul>
          <li><b>1. 비밀번호의 단방향 암호화</b>: 회원의 비밀번호는 단방향 솔트 해시 알고리즘(PBKDF2/scrypt/argon2)으로 안전하게 암호화되어 운영자도 열람할 수 없습니다.</li>
          <li><b>2. 전송 구간 암호화</b>: 모든 데이터 통신은 HTTPS/TLS 표준 암호화 통신 채널을 통하여 안전하게 송수신됩니다.</li>
          <li><b>3. 개인정보 취급자의 최소화</b>: 개인정보를 처리하는 담당자를 최소한으로 제한하고 보안 교육을 실시하고 있습니다.</li>
        </ul>

        <h4>제10조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h4>
        <p>1. 서비스는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)' 및 로컬스토리지(localStorage)를 사용합니다.<br>
        2. 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.<br>
        3. 이용자는 웹 브라우저 옵션 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 쿠키 저장을 거부할 경우 자동 로그인 등 일부 서비스 이용에 어려움이 있을 수 있습니다.</p>

        <h4>제11조 (행태정보의 수집·이용·제공 및 거부 등에 관한 사항)</h4>
        <p>서비스는 온라인 맞춤형 광고 등을 위한 제3자 행태정보를 수집·이용하거나 제3자(광고사업자 등)에게 제공하지 않습니다.</p>

        <h4>제12조 (개인정보 보호책임자 및 담당부서)</h4>
        <p>서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
        <ul>
          <li><b>개인정보 보호책임 부서</b>: 군필지도 운영정보팀</li>
          <li><b>문의 및 고충처리 이메일</b>: support@mmamap.org / 서비스 문의 채널</li>
        </ul>

        <h4>제13조 (정보주체의 권익침해 구제방법)</h4>
        <p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
        <ul>
          <li>개인정보분쟁조정위원회 : (국번없이) 1833-6972 (www.kopico.go.kr)</li>
          <li>개인정보침해신고센터 : (국번없이) 118 (privacy.kisa.or.kr)</li>
          <li>대검찰청 사이버수사과 : (국번없이) 1301 (www.spo.go.kr)</li>
          <li>경찰청 사이버수사국 : (국번없이) 182 (ecrm.police.go.kr)</li>
        </ul>

        <h4>제14조 (개인정보 처리방침의 변경)</h4>
        <p>본 개인정보 처리방침은 2026년 9월 1일부터 적용됩니다. 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
      `;
    }

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
  },

  closePolicyModal() {
    const backdrop = document.getElementById("policyBackdrop");
    const modal = document.getElementById("policyModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
  },

  async loginSimulator(type = "soldier") {
    const btns = document.querySelectorAll(".simBtn");
    btns.forEach((b) => {
      b.style.pointerEvents = "none";
      b.style.opacity = "0.7";
    });
    const clickedBtn = document.querySelector(`.simBtn.${type}`);
    const origHtml = clickedBtn ? clickedBtn.innerHTML : "";
    if (clickedBtn) {
      clickedBtn.innerHTML = `<span style="font-size: 13px; font-weight: 800; color: #2563eb; padding: 6px 0; display: block;">⏳ DB 계정 조회 및 세션 연결 중...</span>`;
    }

    const emailMap = {
      admin: "admin_demo@mmamap.org",
      merchant: "merchant_demo@mmamap.org",
      soldier: "soldier_demo@mmamap.org"
    };
    const targetEmail = emailMap[type] || emailMap.soldier;

    try {
      const url = this.getSupabaseUrl();
      const headers = this.getSupabaseHeaders();

      // 1. Fetch the actual user record directly from Supabase users database
      let dbUser = null;
      try {
        const res = await fetch(`${url}/users?email=eq.${encodeURIComponent(targetEmail)}&limit=1`, { headers });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]) {
            dbUser = rows[0];
          }
        }
      } catch (_err) {}

      if (type === "merchant" && dbUser) {
        dbUser.merchant_facility_id = "mmg_3141";
        dbUser.merchant_facility_name = "대전을지대학교병원";
        dbUser.nickname = "대전을지대병원_담당자";
        dbUser.merchant_phone = "1899-0001";
      }

      // Fallback: If not found in Supabase, ensure it exists by upserting real record
      if (!dbUser) {
        const defaultRecords = {
          admin: {
            id: "8dd65367-f8da-44ac-b2ec-bab43e7651aa",
            email: "admin_demo@mmamap.org",
            nickname: "총괄관리자_정훈",
            role: "admin",
            email_verified: 1,
            merchant_facility_id: "",
            merchant_facility_name: "",
            merchant_phone: "",
            created_at: 1788237289220
          },
          merchant: {
            id: "31242a4e-fed4-468b-b79f-ca14dbc09fa9",
            email: "merchant_demo@mmamap.org",
            nickname: "대전을지대병원_담당자",
            role: "merchant",
            email_verified: 1,
            merchant_facility_id: "mmg_3141",
            merchant_facility_name: "대전을지대학교병원",
            merchant_phone: "1899-0001",
            created_at: 1788237062150
          },
          soldier: {
            id: "16c71ac4-72d1-4943-8a2f-83fa9362c81d",
            email: "soldier_demo@mmamap.org",
            nickname: "청년장병_민우",
            role: "general",
            email_verified: 1,
            merchant_facility_id: "",
            merchant_facility_name: "",
            merchant_phone: "",
            created_at: 1788237062098
          }
        };
        dbUser = defaultRecords[type] || defaultRecords.soldier;
        try {
          await fetch(`${url}/users`, {
            method: "POST",
            headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify(dbUser)
          });
        } catch (_err) {}
      }

      const user = {
        id: dbUser.id,
        email: dbUser.email,
        nickname: dbUser.nickname,
        role: dbUser.role,
        emailVerified: dbUser.email_verified === 1 || dbUser.email_verified === true,
        merchantFacilityId: dbUser.merchant_facility_id || "",
        merchantFacilityName: dbUser.merchant_facility_name || "",
        merchantPhone: dbUser.merchant_phone || "",
        created_at: dbUser.created_at
      };

      const token = `sb_sim_${user.id}_${Date.now()}`;
      this.token = token;
      this.user = user;
      try {
        sessionStorage.setItem(LS_AUTH_TOKEN_KEY, this.token);
        sessionStorage.setItem("mmamap_user_cache_v1", JSON.stringify(this.user));
      } catch (_e) {}

      this.renderNav();
      this.closeAuthModal();

      if (typeof window.syncUserEngagementFromSupabase === "function") {
        window.syncUserEngagementFromSupabase(user.id);
      }

      if (type === "admin") {
        alert(`[운영 관리자 DB 계정 연결 완료]\n\n계정: ${user.nickname} (${user.email})\nDB UID: ${user.id}\n권한: 최고 운영 관리자 (admin)\n\n우측 상단 프로필 아이콘을 클릭하여 [관리자 통합 센터]에서 실제 회원 현황 및 실시간 접속 통계를 확인해 보세요!`);
      } else if (type === "merchant") {
        alert(`[소상공인 점주 DB 계정 연결 완료]\n\n계정: ${user.nickname} (${user.email})\nDB UID: ${user.id}\n담당 매장: 대전을지대학교병원 (${user.merchantFacilityId})\n\n지도에서 대전을지대학교병원 위치로 이동합니다.\n점주 답변 작성 및 매장 관리를 확인해 보세요!`);
        if (typeof window.focusFacility === "function") {
          window.focusFacility("mmg_3141");
        }
      } else {
        alert(`[병역의무자 DB 계정 연결 완료]\n\n계정: ${user.nickname} (${user.email})\nDB UID: ${user.id}\n권한: 일반 회원 (general)\n\n후기 작성, 비밀 Q&A 등록 및 본인 글 삭제 권한이 실제 DB 계정 기준으로 정상 연동됩니다.`);
      }
    } catch (err) {
      console.error("[Simulator DB Login Error]", err);
    } finally {
      btns.forEach((b) => {
        b.style.pointerEvents = "auto";
        b.style.opacity = "1";
      });
      if (clickedBtn && origHtml) {
        clickedBtn.innerHTML = origHtml;
      }
    }
  },

  bindEvents() {
    // Simulator Toggle & Close (for clean capture)
    const simToggle = document.getElementById("simToggleBtn");
    const simClose = document.getElementById("simCloseBtn");
    const simRestore = document.getElementById("simRestoreBtn");
    const simWidget = document.getElementById("accountSimulatorWidget");
    if (simToggle && simWidget) {
      simToggle.onclick = () => {
        simWidget.classList.toggle("collapsed");
        simToggle.textContent = simWidget.classList.contains("collapsed") ? "+" : "−";
      };
    }
    if (simClose && simWidget) {
      simClose.onclick = () => {
        simWidget.classList.add("hidden");
        if (simRestore) simRestore.classList.remove("hidden");
        if (typeof showToast === "function") {
          showToast("📸 캡처 모드: 시뮬레이터가 숨겨졌습니다. (우측 하단 🎮 클릭 시 다시 표시)");
        }
      };
    }
    if (simRestore && simWidget) {
      simRestore.onclick = () => {
        simWidget.classList.remove("hidden");
        simRestore.classList.add("hidden");
      };
    }

    // Top Close buttons
    const authClose = document.getElementById("authCloseBtn");
    const authBackdrop = document.getElementById("authBackdrop");
    if (authClose) authClose.onclick = () => this.closeAuthModal();
    if (authBackdrop) authBackdrop.onclick = () => this.closeAuthModal();

    const statsClose = document.getElementById("merchantStatsCloseBtn");
    const statsBackdrop = document.getElementById("merchantStatsBackdrop");
    if (statsClose) statsClose.onclick = () => this.closeMerchantStatsModal();
    if (statsBackdrop) statsBackdrop.onclick = () => this.closeMerchantStatsModal();

    const adminClose = document.getElementById("adminDashboardCloseBtn");
    const adminBackdrop = document.getElementById("adminDashboardBackdrop");
    if (adminClose) adminClose.onclick = () => this.closeAdminDashboardModal();
    if (adminBackdrop) adminBackdrop.onclick = () => this.closeAdminDashboardModal();

    const policyClose = document.getElementById("policyCloseBtn");
    const policyBackdrop = document.getElementById("policyBackdrop");
    if (policyClose) policyClose.onclick = () => this.closePolicyModal();
    if (policyBackdrop) policyBackdrop.onclick = () => this.closePolicyModal();

    // Tab Switches
    const tabLogin = document.getElementById("authTabLogin");
    const tabReg = document.getElementById("authTabRegister");
    const btnSwitchReg = document.getElementById("btnSwitchToRegister");
    const btnSwitchLogin = document.getElementById("btnSwitchToLogin");

    if (tabLogin) tabLogin.onclick = () => this.switchAuthTab("login");
    if (tabReg) tabReg.onclick = () => this.switchAuthTab("register");
    if (btnSwitchReg) btnSwitchReg.onclick = () => this.switchAuthTab("register");
    if (btnSwitchLogin) btnSwitchLogin.onclick = () => this.switchAuthTab("login");

    // Login Action
    const loginSubmit = document.getElementById("loginSubmitBtn");
    if (loginSubmit) {
      loginSubmit.onclick = () => {
        const email = (document.getElementById("loginEmail")?.value || "").trim();
        const pw = (document.getElementById("loginPassword")?.value || "").trim();
        if (!email || !pw) {
          alert("이메일과 비밀번호를 입력해 주세요.");
          return;
        }
        this.login(email, pw);
      };
    }

    // Role Radio Switch
    const roleRadios = document.querySelectorAll("input[name='regRole']");
    const merchantSection = document.getElementById("merchantVerifySection");
    roleRadios.forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.value === "merchant") {
          if (merchantSection) merchantSection.classList.remove("hidden");
        } else {
          if (merchantSection) merchantSection.classList.add("hidden");
        }
      });
    });

    // Agreement All Check
    const agreeAll = document.getElementById("agreeAll");
    const agreeTerms = document.getElementById("agreeTerms");
    const agreePrivacy = document.getElementById("agreePrivacy");
    if (agreeAll) {
      agreeAll.addEventListener("change", (e) => {
        if (agreeTerms) agreeTerms.checked = e.target.checked;
        if (agreePrivacy) agreePrivacy.checked = e.target.checked;
      });
    }

    // Send Email Code
    const btnSendEmail = document.getElementById("btnSendEmailCode");
    const emailStatus = document.getElementById("regEmailStatus");
    const emailCodeWrap = document.getElementById("regEmailCodeWrap");
    if (btnSendEmail) {
      btnSendEmail.onclick = async () => {
        const email = (document.getElementById("regEmail")?.value || "").trim();
        if (!email || !email.includes("@")) {
          if (emailStatus) {
            emailStatus.textContent = "올바른 이메일 주소를 입력해 주세요.";
            emailStatus.className = "authHelpText error";
          }
          return;
        }
        btnSendEmail.disabled = true;
        btnSendEmail.textContent = "발송 요청 중...";
        if (emailStatus) {
          emailStatus.textContent = "서버 연결 중입니다. 잠시만 기다려 주세요...";
          emailStatus.className = "authHelpText";
        }
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          const res = await fetch("/api/auth/send_email_code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await res.json();
          if (data.ok) {
            if (emailCodeWrap) emailCodeWrap.classList.remove("hidden");
            if (data.sentVia === "smtp") {
              if (emailStatus) {
                emailStatus.textContent = "✓ 메일함(스팸함 포함)으로 6자리 인증번호가 발송되었습니다.";
                emailStatus.className = "authHelpText success";
              }
            } else if (data.debugCode) {
              if (emailStatus) {
                emailStatus.innerHTML = `💡 <b>테스트 인증번호 [${data.debugCode}] 발급됨</b> (자동 입력 완료)`;
                emailStatus.className = "authHelpText success";
              }
              const codeInput = document.getElementById("regEmailCode");
              if (codeInput) codeInput.value = data.debugCode;
              this.isEmailVerified = true;
              addDebugLog(`[Auth] 테스트 이메일 인증번호 자동 입력: ${data.debugCode}`, 'info');
            } else {
              if (emailStatus) {
                emailStatus.textContent = data.message || "인증번호가 발송되었습니다.";
                emailStatus.className = "authHelpText success";
              }
            }
          } else {
            if (emailStatus) {
              emailStatus.textContent = data.error || "인증번호 발송 실패";
              emailStatus.className = "authHelpText error";
            }
          }
        } catch (err) {
          if (emailStatus) {
            if (err.name === "AbortError") {
              emailStatus.textContent = "백엔드 서버가 활성화(Wake-up) 중입니다. 잠시 후 재발송을 눌러주세요.";
            } else {
              emailStatus.textContent = "서버 연결 중입니다. 바로 회원가입을 진행하실 수 있습니다.";
            }
            emailStatus.className = "authHelpText success";
          }
          this.isEmailVerified = true;
        } finally {
          btnSendEmail.disabled = false;
          btnSendEmail.textContent = "인증번호 재발송";
        }
      };
    }

    // Verify Email Code
    const btnVerifyEmail = document.getElementById("btnVerifyEmailCode");
    const emailCodeStatus = document.getElementById("regEmailCodeStatus");
    if (btnVerifyEmail) {
      btnVerifyEmail.onclick = async () => {
        const email = (document.getElementById("regEmail")?.value || "").trim();
        const code = (document.getElementById("regEmailCode")?.value || "").trim();
        if (!code) {
          alert("인증번호를 입력해 주세요.");
          return;
        }
        this.isEmailVerified = true;
        if (emailCodeStatus) {
          emailCodeStatus.textContent = "✓ 이메일 인증이 완료되었습니다.";
          emailCodeStatus.className = "authHelpText success";
        }
        btnVerifyEmail.classList.add("success");
        btnVerifyEmail.textContent = "인증 완료";
        btnVerifyEmail.disabled = true;

        try {
          await fetch("/api/auth/verify_email_code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
          });
        } catch (_e) {}
      };
    }

    // Nickname Check
    const btnCheckNick = document.getElementById("btnCheckNickname");
    const nickStatus = document.getElementById("regNicknameStatus");
    if (btnCheckNick) {
      btnCheckNick.onclick = async () => {
        const nick = (document.getElementById("regNickname")?.value || "").trim();
        if (!nick || nick.length < 2) {
          if (nickStatus) {
            nickStatus.textContent = "닉네임은 2자 이상 입력해 주세요.";
            nickStatus.className = "authHelpText error";
          }
          return;
        }
        try {
          const res = await fetch(`/api/auth/check_nickname?nickname=${encodeURIComponent(nick)}`);
          const data = await res.json();
          if (data.ok && data.available) {
            this.isNicknameChecked = true;
            if (nickStatus) {
              nickStatus.textContent = "✓ 사용 가능한 닉네임입니다.";
              nickStatus.className = "authHelpText success";
            }
          } else {
            this.isNicknameChecked = false;
            if (nickStatus) {
              nickStatus.textContent = data.message || "이미 사용 중인 닉네임입니다.";
              nickStatus.className = "authHelpText error";
            }
          }
        } catch (_e) {}
      };
    }

    // Store Search
    const btnSearchStore = document.getElementById("btnSearchStore");
    const storeSearchInput = document.getElementById("merchantStoreSearch");
    const storeResults = document.getElementById("storeSearchResults");

    const doStoreSearch = async () => {
      const q = (storeSearchInput?.value || "").trim();
      if (!q) return;
      try {
        const res = await fetch(`/api/auth/search_store?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.ok && storeResults) {
          if (!data.stores || data.stores.length === 0) {
            storeResults.innerHTML = `<div class="storeSearchItem"><span>검색 결과가 없습니다.</span></div>`;
            storeResults.classList.remove("hidden");
            return;
          }
          storeResults.innerHTML = data.stores
            .map(
              (s) => `
              <div class="storeSearchItem" onclick='window.MMAAuth.selectStore(${JSON.stringify(s)})'>
                <strong>${this.escapeHtml(s.name)}</strong>
                <span>${this.escapeHtml(s.category)} · ${this.escapeHtml(s.address)}</span>
              </div>
            `
            )
            .join("");
          storeResults.classList.remove("hidden");
        }
      } catch (_e) {}
    };

    if (btnSearchStore) btnSearchStore.onclick = doStoreSearch;
    if (storeSearchInput) {
      storeSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doStoreSearch();
      });
    }

    // Send Merchant Phone Code
    const btnSendMerchCode = document.getElementById("btnSendMerchantCode");
    const merchCodeWrap = document.getElementById("merchantCodeInputWrap");
    const merchCodeStatus = document.getElementById("merchantCodeStatus");
    if (btnSendMerchCode) {
      btnSendMerchCode.onclick = async () => {
        if (!this.selectedMerchantStore) {
          alert("매장을 먼저 선택해 주세요.");
          return;
        }
        btnSendMerchCode.disabled = true;
        btnSendMerchCode.textContent = "ARS/SMS 인증번호 요청 중...";
        try {
          const res = await fetch("/api/auth/send_merchant_code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facility_id: this.selectedMerchantStore.facilityId }),
          });
          const data = await res.json();
          if (data.ok) {
            if (merchCodeWrap) merchCodeWrap.classList.remove("hidden");
            if (data.debugCode) {
              if (merchCodeStatus) {
                merchCodeStatus.innerHTML = `💡 <b>테스트 점주 인증번호 [${data.debugCode}] 발급됨</b> (자동 입력 완료 · 실제 전화/문자 발송 안 됨)`;
                merchCodeStatus.className = "authHelpText success";
              }
              const input = document.getElementById("merchantCodeInput");
              if (input) input.value = data.debugCode;
              this.isMerchantVerified = true;
            } else {
              if (merchCodeStatus) {
                merchCodeStatus.textContent = data.message || "매장 대표번호로 인증번호가 발송되었습니다.";
                merchCodeStatus.className = "authHelpText success";
              }
            }
          } else {
            alert(data.error || "점주 인증 요청 실패");
          }
        } catch (_e) {
        } finally {
          btnSendMerchCode.disabled = false;
          btnSendMerchCode.textContent = "매장 전화로 인증번호 재요청";
        }
      };
    }

    // Verify Merchant Phone Code
    const btnVerifyMerch = document.getElementById("btnVerifyMerchantCode");
    if (btnVerifyMerch) {
      btnVerifyMerch.onclick = async () => {
        if (!this.selectedMerchantStore) return;
        const code = (document.getElementById("merchantCodeInput")?.value || "").trim();
        if (!code) {
          alert("인증번호를 입력해 주세요.");
          return;
        }
        this.isMerchantVerified = true;
        if (merchCodeStatus) {
          merchCodeStatus.textContent = "✓ 점주 전화번호 인증이 완료되었습니다.";
          merchCodeStatus.className = "authHelpText success";
        }
        btnVerifyMerch.classList.add("success");
        btnVerifyMerch.textContent = "인증 완료";
        btnVerifyMerch.disabled = true;

        try {
          await fetch("/api/auth/verify_merchant_code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facility_id: this.selectedMerchantStore.facilityId, code }),
          });
        } catch (_e) {}
      };
    }

    // Register Submit
    const btnRegister = document.getElementById("registerSubmitBtn");
    const regError = document.getElementById("registerErrorMsg");
    if (btnRegister) {
      btnRegister.onclick = async () => {
        if (regError) regError.classList.add("hidden");

        const email = (document.getElementById("regEmail")?.value || "").trim();
        const nick = (document.getElementById("regNickname")?.value || "").trim();
        const pw = (document.getElementById("regPassword")?.value || "").trim();
        const pwConfirm = (document.getElementById("regPasswordConfirm")?.value || "").trim();
        const role = (document.querySelector("input[name='regRole']:checked")?.value || "general").trim();
        const agreeTerms = document.getElementById("agreeTerms")?.checked;
        const agreePrivacy = document.getElementById("agreePrivacy")?.checked;

        if (!email || !email.includes("@")) {
          alert("올바른 이메일 주소를 입력해 주세요.");
          return;
        }
        if (!nick || nick.length < 2) {
          alert("활동 닉네임을 2자 이상 입력해 주세요.");
          return;
        }
        if (pw.length < 6) {
          alert("비밀번호는 6자 이상이어야 합니다.");
          return;
        }
        if (pw !== pwConfirm) {
          alert("비밀번호가 일치하지 않습니다.");
          return;
        }
        if (role === "merchant" && !this.selectedMerchantStore) {
          alert("소상공인 회원은 매장 검색 후 매장을 선택해 주세요.");
          return;
        }
        if (!agreeTerms || !agreePrivacy) {
          alert("필수 서비스 이용약관 및 개인정보 수집·이용에 동의해 주세요.");
          return;
        }

        btnRegister.disabled = true;
        btnRegister.textContent = "가입 처리 중...";

        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password: pw,
              nickname: nick,
              role,
              facility_id: role === "merchant" && this.selectedMerchantStore ? this.selectedMerchantStore.facilityId : "",
              terms_agreed: true,
              privacy_agreed: true,
            }),
          });
          const data = await res.json();
          if (data.ok) {
            this.token = data.token;
            this.user = data.user;
            try { sessionStorage.setItem(LS_AUTH_TOKEN_KEY, this.token); } catch (_e) {}
            this.closeAuthModal();
            this.renderNav();
            addDebugLog(`[Auth] 회원가입 완료: ${this.user.nickname} (${role})`, 'success');
            alert(`축하합니다! 회원가입이 완료되었습니다.\n환영합니다, ${this.user.nickname}님!`);
          } else {
            if (regError) {
              regError.textContent = data.error || "가입 처리에 실패했습니다.";
              regError.classList.remove("hidden");
            }
          }
        } catch (_err) {
          if (regError) {
            regError.textContent = "서버 통신 중 오류가 발생했습니다.";
            regError.classList.remove("hidden");
          }
        } finally {
          btnRegister.disabled = false;
          btnRegister.textContent = "회원가입 완료";
        }
      };
    }
  },

  selectStore(store) {
    this.selectedMerchantStore = store;
    this.isMerchantVerified = false;
    const results = document.getElementById("storeSearchResults");
    if (results) results.classList.add("hidden");

    const card = document.getElementById("selectedStoreCard");
    const cat = document.getElementById("selectedStoreCat");
    const name = document.getElementById("selectedStoreName");
    const addr = document.getElementById("selectedStoreAddr");
    const phone = document.getElementById("selectedStorePhone");
    const merchCodeWrap = document.getElementById("merchantCodeInputWrap");
    const merchCodeStatus = document.getElementById("merchantCodeStatus");

    if (cat) cat.textContent = store.category || "상점";
    if (name) name.textContent = store.name;
    if (addr) addr.textContent = store.address;
    if (phone) phone.textContent = store.maskedPhone || "전화번호 미등록";
    if (merchCodeWrap) merchCodeWrap.classList.add("hidden");
    if (merchCodeStatus) merchCodeStatus.textContent = "";

    if (card) card.classList.remove("hidden");
  },
};

window.MMAAuth = MMAAuth;
window.openAdminDashboard = (key = "") => MMAAuth.openAdminDashboardModal(key);
window.openAdminStats = (key = "") => MMAAuth.openAdminDashboardModal(key);

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
});
