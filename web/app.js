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
const CATEGORY_LEGEND_IMAGE_ORDER = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png"];
const CATEGORY_FIXED_IMAGE_LABEL_ORDER = ["안경점", "병원", "문화", "음식점", "교육", "기타", "체육", "미용실", "카페", "주차"];
const AUDIENCE_LEGEND_IMAGE_ORDER = ["a.png", "b.png", "c.png", "d.png", "e.png", "f.png"];
const APP_DATA_LAST_UPDATED = "2026-04-08";
const HUB_MENU_TREE = [
  {
    key: "benefit_map",
    label: "서비스안내",
    children: [
      {
        key: "map_use_guide",
        label: "지도 이용안내",
        title: "군필지도 이용안내",
        summary: ["병역이행자와 병역명문가를 위한 혜택 가게 정보를 한 화면에서 확인할 수 있도록 제공하는 통합 지도입니다."],
        target: "현역/예비군/사회복무요원 및 가족",
        conditions: "위치 권한 허용 시 내 주변 검색 정확도 향상",
        steps: ["상단 분류 또는 대상자 필터를 선택합니다.", "지도에서 원하는 가게 마커를 선택합니다.", "상세 패널에서 혜택 내용을 확인합니다."],
      },
      {
        key: "map_terms",
        label: "이용약관",
        title: "군필지도 이용약관",
      },
      {
        key: "map_privacy",
        label: "개인정보처리방침",
        title: "군필지도 개인정보처리방침",
      },
      {
        key: "map_location_notice",
        label: "위치정보 안내",
        title: "군필지도 위치정보 안내",
      },
      {
        key: "map_board_policy",
        label: "게시판 운영정책",
        title: "군필지도 게시판 운영정책",
      },
    ],
  },
  {
    key: "nara_store",
    label: "나라사랑가게",
    children: [
      {
        key: "nara_how_to_use",
        label: "이용방법",
        title: "나라사랑가게 이용방법",
        summary: ["가게별 대상과 혜택 조건을 먼저 확인합니다.", "현장 방문 시 신분 확인 후 혜택을 적용받습니다.", "혜택 내역은 가게 사정에 따라 달라질 수 있습니다."],
        target: "병역의무 이행자, 국가유공자 등 안내 대상",
        conditions: "신분 확인 가능 서류 또는 카드 지참",
        steps: ["지도에서 나라사랑가게를 선택합니다.", "상세정보의 대상/혜택 조건을 확인합니다.", "매장 방문 후 안내에 따라 혜택을 적용받습니다."],
      },
      {
        key: "nara_join_store",
        label: "참여가게 등록",
        title: "나라사랑가게 참여가게 등록",
        summary: ["지역사회와 함께하는 자발적 참여 프로그램입니다.", "참여 가게는 지도와 안내 채널에 노출됩니다.", "실제 이용이 늘수록 참여 효과가 더 커집니다."],
        target: "가게 운영자/프랜차이즈 점주",
        conditions: "업종 및 지역 운영 기준 충족 필요",
        steps: ["참여 신청 버튼으로 등록 안내 페이지를 확인합니다.", "기본 가게 정보와 제공 혜택을 제출합니다.", "승인 후 지도 서비스에 순차 반영됩니다."],
      },
    ],
  },
  {
    key: "myeongmunga_store",
    label: "병역명문가가게",
    children: [
      {
        key: "mmg_how_to_use",
        label: "이용방법",
        title: "병역명문가가게 이용방법",
        summary: ["병역명문가 대상 혜택 가게를 지도에서 찾을 수 있습니다.", "가게별 제공 혜택과 적용 범위를 사전 확인하세요.", "현장 확인 절차에 따라 혜택이 적용됩니다."],
        target: "병역명문가 대상자",
        conditions: "병역명문가 증빙 필요",
        steps: ["병역명문가가게 메뉴에서 상세 정보를 선택합니다.", "대상 요건과 혜택을 확인합니다.", "방문 시 증빙 후 혜택을 이용합니다."],
      },
      {
        key: "mmg_join_store",
        label: "참여가게 등록",
        title: "병역명문가가게 참여 안내",
        summary: ["병역명문가 예우 문화에 동참하는 참여 모델입니다.", "참여 가게는 공공 안내 채널에 함께 소개됩니다.", "자발적 참여가 지역 예우 문화를 만듭니다."],
        target: "참여 희망 가게",
        conditions: "운영기관 참여 기준 준수",
        steps: ["신청 안내 페이지에서 절차를 확인합니다.", "가게 정보와 혜택 항목을 제출합니다.", "승인 후 지도와 연계 채널에 반영됩니다."],
      },
    ],
  },
  {
    key: "nara_card",
    label: "나라사랑카드",
    children: [
      {
        key: "card_benefits",
        label: "혜택안내",
        title: "나라사랑카드 혜택안내",
        summary: ["카드 혜택은 카드사/시기별로 달라질 수 있습니다.", "사용처와 실적 조건을 함께 확인해야 합니다.", "공식 안내 기준으로 최신 혜택을 확인하세요."],
        target: "나라사랑카드 이용 대상자",
        conditions: "카드사별 실적/기간 조건 적용",
        steps: ["공식 혜택 페이지를 확인합니다.", "혜택 항목별 조건을 점검합니다.", "필요 시 카드사 고객센터로 상세 문의합니다."],
      },
    ],
  },
  {
    key: "finance",
    label: "혜택모음",
    children: [
      {
        key: "finance_overview",
        label: "군적금/금융혜택",
        title: "군적금/금융혜택 안내",
      },
      {
        key: "benefit_transport",
        label: "교통",
        title: "교통 혜택 안내",
      },
      {
        key: "benefit_comm_sub",
        label: "통신/구독",
        title: "통신/구독 혜택 안내",
      },
      {
        key: "benefit_job_cert",
        label: "취업·자격증 지원",
        title: "취업·자격증 지원 안내",
      },
      {
        key: "benefit_housing_welfare",
        label: "주거·복지",
        title: "주거·복지 혜택 안내",
      },
      {
        key: "benefit_medical_legal",
        label: "의료·심리·법률",
        title: "의료·심리·법률 지원 안내",
      },
      {
        key: "benefit_local",
        label: "지자체 혜택",
        title: "지자체 혜택 안내",
      },
      {
        key: "benefit_discharge",
        label: "전역예정자 가이드",
        title: "전역예정자 가이드",
      },
      {
        key: "benefit_career_center",
        label: "병역진로센터",
        title: "병역진로센터 안내",
      },
    ],
  },
  {
    key: "review_board",
    label: "공유게시판",
    children: [
      {
        key: "review_board_entry",
        label: "공유등록 게시판",
        title: "공유등록 게시판",
        summary: ["서비스 이용 후기와 의견을 자유롭게 남겨주세요."],
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
  const t = String(title || "");
  if (/CGV/i.test(t) || /롯데시네마/.test(t)) return "문화";
  return toCategoryLabel(rawCategory || "");
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

function normalizeRegion(rawRegion, address, lat, lng) {
  const region = String(rawRegion || "").trim();
  if (region) return region;
  return inferRegionFromAddress(address, lat, lng) || "지역미상";
}

function getFacilityKey(point) {
  return toSafeId(point?.facilityId || `${point?.title || ""}_${point?.address || ""}`);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function toCategoryLabel(category) {
  const raw = String(category || "").trim();
  if (!raw) return "기타";
  if (CATEGORY_LABEL_MAP[raw]) return CATEGORY_LABEL_MAP[raw];
  if (/^[a-z0-9_]+$/i.test(raw)) return "기타";
  return raw;
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
        address: f.address || "",
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
            address: b.address || "",
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

  const categoryLabels = [...new Set(points.map((p) => toCategoryLabel(p.category)).filter(Boolean))];
  const categoryImageByLabel = {};
  let nextImageIndex = 0;

  CATEGORY_FIXED_IMAGE_LABEL_ORDER.forEach((label, fixedIdx) => {
    if (!categoryLabels.includes(label)) return;
    categoryImageByLabel[label] = CATEGORY_LEGEND_IMAGE_ORDER[fixedIdx % CATEGORY_LEGEND_IMAGE_ORDER.length];
    nextImageIndex = Math.max(nextImageIndex, fixedIdx + 1);
  });

  categoryLabels.forEach((label) => {
    if (categoryImageByLabel[label]) return;
    categoryImageByLabel[label] = CATEGORY_LEGEND_IMAGE_ORDER[nextImageIndex % CATEGORY_LEGEND_IMAGE_ORDER.length];
    nextImageIndex += 1;
  });

  const audienceSet = new Set(points.flatMap((p) => (Array.isArray(p.audiences) ? p.audiences : [])));
  const audienceFilters = [...audienceSet];
  const audienceIconByName = Object.fromEntries(audienceFilters.map((name, idx) => [name, AUDIENCE_LEGEND_IMAGE_ORDER[idx % AUDIENCE_LEGEND_IMAGE_ORDER.length]]));
  const regionFilters = [...new Set(points.map((p) => String(p.region || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));

  const favorites = new Set();
  const likes = new Set();
  const ratingsById = JSON.parse(localStorage.getItem(LS_RATINGS_KEY) || "{}");
  const clickCountsById = {};
  const likeCountsById = {};
  const favoriteCountsById = {};
  let reviewBoardPosts = [];
  const saveRatings = () => localStorage.setItem(LS_RATINGS_KEY, JSON.stringify(ratingsById));
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
    const existing = String(localStorage.getItem(LS_CLIENT_TOKEN_KEY) || "").trim();
    if (existing) return existing;
    const created = `ct_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(LS_CLIENT_TOKEN_KEY, created);
    return created;
  };
  const clientToken = getOrCreateClientToken();

  const loadEngagementSnapshot = async () => {
    const res = await fetch(`${ENGAGEMENT_API_BASE}/snapshot?clientToken=${encodeURIComponent(clientToken)}`, { method: "GET" });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "상호작용 데이터 조회 실패"));
    const myLikes = Array.isArray(data?.myLikes) ? data.myLikes : [];
    const myFavorites = Array.isArray(data?.myFavorites) ? data.myFavorites : [];
    const clicks = data?.clickCounts && typeof data.clickCounts === "object" ? data.clickCounts : {};
    const likesCount = data?.likeCounts && typeof data.likeCounts === "object" ? data.likeCounts : {};
    const favoritesCount = data?.favoriteCounts && typeof data.favoriteCounts === "object" ? data.favoriteCounts : {};

    favorites.clear();
    likes.clear();
    myFavorites.forEach((id) => favorites.add(String(id)));
    myLikes.forEach((id) => likes.add(String(id)));

    Object.keys(clickCountsById).forEach((k) => delete clickCountsById[k]);
    Object.keys(likeCountsById).forEach((k) => delete likeCountsById[k]);
    Object.keys(favoriteCountsById).forEach((k) => delete favoriteCountsById[k]);
    Object.entries(clicks).forEach(([k, v]) => { clickCountsById[String(k)] = Number(v) || 0; });
    Object.entries(likesCount).forEach(([k, v]) => { likeCountsById[String(k)] = Number(v) || 0; });
    Object.entries(favoritesCount).forEach(([k, v]) => { favoriteCountsById[String(k)] = Number(v) || 0; });
  };

  const toggleEngagement = async (facilityId, actionType) => {
    const res = await fetch(`${ENGAGEMENT_API_BASE}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientToken,
        facilityId,
        actionType,
      }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "상호작용 저장 실패"));
    return data;
  };

  const recordFacilityClick = async (facilityId) => {
    const res = await fetch(`${ENGAGEMENT_API_BASE}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientToken,
        facilityId,
      }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "클릭 저장 실패"));
    return data;
  };

  const fetchReviewPosts = async () => {
    const res = await fetch(`${REVIEW_API_BASE}?page=1&page_size=200`, { method: "GET" });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "후기 목록 조회 실패"));
    const rows = Array.isArray(data?.items) ? data.items : [];
    reviewBoardPosts = rows.map(normalizeReviewPost);
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

  const createReviewPost = async ({ author, content, password }) => {
    const res = await fetch(REVIEW_API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, content, password }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "후기 등록 실패"));
    return data;
  };

  const updateReviewPost = async ({ postId, author, content, currentPassword, newPassword }) => {
    const res = await fetch(`${REVIEW_API_BASE}/${encodeURIComponent(postId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, content, currentPassword, newPassword }),
    });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(String(data?.error || "후기 수정 실패"));
    return data;
  };

  const deleteReviewPost = async ({ postId, password }) => {
    const res = await fetch(`${REVIEW_API_BASE}/${encodeURIComponent(postId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
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

  let renderedMarkers = [];
  let initialBoundsListener = null;
  let renderTimer = null;
  let selectedCategory = "";
  let selectedAudience = "";
  let selectedRegion = "";
  let selectedFacilityId = "";
  let selectedDetailAnchor = null;
  let selectedDetailScreenPoint = null;
  let isMarkerRepositioning = false;
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

  const closeIntroPopup = (saveDismiss = false) => {
    if (saveDismiss && introNeverCheckEl?.checked) localStorage.setItem(LS_INTRO_DISMISS_KEY, "1");
    if (introPopupEl) introPopupEl.classList.add("hidden");
    if (introBackdropEl) introBackdropEl.classList.add("hidden");
  };

  const openIntroPopup = () => {
    const dismissed = localStorage.getItem(LS_INTRO_DISMISS_KEY) === "1";
    if (dismissed) return;
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

  const buildSecondaryGuideHtml = (secondary) => {
    if (secondary?.key === "map_terms") {
      return `
        <section class="hubInfoSection">
          <h4>이용약관 요약</h4>
          <p>본 서비스는 공공 안내 목적의 정보 제공 서비스입니다. 사용자는 관련 법령 및 공서양속을 준수해야 하며, 권리침해·허위정보 게시를 금지합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>게시물 책임과 제한</h4>
          <p>게시글 책임은 작성자에게 있으며, 운영자는 법령 위반, 권리침해, 서비스 운영 방해 게시물에 대해 사전 통지 없이 제한·삭제할 수 있습니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>면책</h4>
          <p>외부기관 원천 데이터 반영 시점 차이로 일부 정보가 실제와 다를 수 있으며, 최종 이용 전 공식 기관/매장 안내를 확인해 주세요.</p>
        </section>
      `;
    }

    if (secondary?.key === "map_privacy") {
      return `
        <section class="hubInfoSection">
          <h4>수집 항목</h4>
          <p>공유게시판: 닉네임(선택), 게시내용, 비밀번호(암호화 저장), 작성/수정 시각</p>
          <p>기능 이용: 클라이언트 토큰, 좋아요/즐겨찾기/클릭 이용기록</p>
        </section>
        <section class="hubInfoSection">
          <h4>이용 목적</h4>
          <p>게시판 운영, 서비스 품질 개선, 인기/좋아요/즐겨찾기 통계 제공</p>
        </section>
        <section class="hubInfoSection">
          <h4>보유 및 파기</h4>
          <p>게시글 및 기능 로그는 운영 목적 범위 내 보관 후 지체 없이 파기합니다. 이용자는 게시글 삭제 요청을 할 수 있습니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>권리행사 및 문의</h4>
          <p>개인정보 열람·정정·삭제 요청: 운영자 문의 채널(이메일/게시판 공지 채널)로 접수</p>
        </section>
      `;
    }

    if (secondary?.key === "map_location_notice") {
      return `
        <section class="hubInfoSection">
          <h4>위치정보 이용 안내</h4>
          <p>내 위치 버튼 사용 시 브라우저 위치권한을 통해 현재 위치를 지도 중심으로 이동합니다.</p>
          <p>위치 권한은 단말/브라우저 설정에서 언제든지 철회할 수 있습니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>유의사항</h4>
          <p>위치 정확도는 단말 및 네트워크 환경에 따라 달라질 수 있으며, 실내·지하에서는 오차가 발생할 수 있습니다.</p>
        </section>
      `;
    }

    if (secondary?.key === "map_board_policy") {
      return `
        <section class="hubInfoSection">
          <h4>게시판 운영정책</h4>
          <p>공유게시판은 서비스 이용경험 공유를 위한 공간입니다. 욕설·비방·홍보성 도배·개인정보 노출 게시물은 제한될 수 있습니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>권리침해 신고</h4>
          <p>명예훼손, 저작권 침해, 개인정보 침해 신고가 접수되면 검토 후 임시조치 또는 삭제가 진행될 수 있습니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>수정/삭제 기준</h4>
          <p>작성 시 입력한 비밀번호로 본인 게시글 수정/삭제가 가능합니다. 법령 위반 게시물은 운영정책에 따라 별도 조치됩니다.</p>
        </section>
      `;
    }

    if (secondary?.key === "nara_how_to_use") {
      return `
        <section class="hubInfoSection">
          <h4>목적</h4>
          <p>일상생활에서 실질적 혜택을 통해 병역이행자에게 응원과 감동을 전하는 나라사랑가게를 선정·운영합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>대상업체</h4>
          <p>음식점, 숙박업소, 카페, 헬스장, 이미용실, 개인병원 등</p>
        </section>
        <section class="hubInfoSection">
          <h4>혜택</h4>
          <p>가게 자율 선택(예: 5%, 10% 할인 등)</p>
        </section>
        <section class="hubInfoSection">
          <h4>병역이행자 범위</h4>
          <p>동원훈련 이수자, 현역병, 사회복무요원 등 복무자, 병역명문가</p>
        </section>
        <section class="hubInfoSection">
          <h4>선정 절차</h4>
          <p>희망업체(기관) 신청서 접수 → 지방병무청 심사·선정 → 협약 및 인증 스티커 배부</p>
        </section>
        <section class="hubInfoSection">
          <h4>등록·관리</h4>
          <p>누리집 나라사랑가게 메뉴를 통해 등록·관리합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>대상 확인</h4>
          <p>아래 서류 및 신분증 확인</p>
          <ul class="hubTextList">
            <li>예비군: 당해연도 동원훈련 이수자 교육훈련 소집필증, 병력동원훈련소집 입영확인서, 모범예비군증</li>
            <li>복무중인자(현역·사회복무요원 등): 복무확인서, 사회복무요원증</li>
            <li>병역명문가: 병역명문가증</li>
          </ul>
        </section>
      `;
    }

    if (secondary?.key === "nara_join_store" || secondary?.key === "mmg_join_store") {
      return `
        <section class="hubInfoSection">
          <h4>참여가게 등록 안내</h4>
          <p>나라사랑가게 참여가게 등록은 아래 병무청 페이지에서 진행해 주세요.</p>
          <p><a class="hubInlineLink" href="https://www.mma.go.kr/contents.do?mc=mma0003358" target="_blank" rel="noopener noreferrer">https://www.mma.go.kr/contents.do?mc=mma0003358</a></p>
        </section>
      `;
    }

    if (secondary?.key === "mmg_how_to_use") {
      return `
        <section class="hubInfoSection">
          <h4>제도 개요(요약)</h4>
          <p>병역명문가 선양사업은 병역의무를 성실히 이행한 가문의 자긍심을 높이고, 희생과 헌신에 대한 존경과 감사를 확산하기 위해 병무청이 2004년부터 추진해 온 제도입니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>병역명문가의 의미</h4>
          <p>3대(1대~3대) 직계비속 남성이 모두 현역복무 등을 성실히 마친 가문을 말합니다.</p>
          <p class="hubBrief">가족 모두 징집 또는 지원에 따라 장교·준사관·부사관·병으로 복무를 마쳤거나, 의무복무 후 계속 복무 중인 경우 등을 포함합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>예우 및 선양</h4>
          <p>선정된 병역명문가는 포상·시상과 함께 국·공립, 지자체, 민간 예우시설 협약을 통해 시설 이용료 감면·면제 등 예우를 받을 수 있습니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>법적 근거</h4>
          <p>병역법 제82조의3(병역명문가 선정 등), 제82조의4(병역명문가 포상 및 예우)</p>
        </section>
      `;
    }

    if (secondary?.key === "card_benefits") {
      return `
        <section class="hubInfoSection">
          <h4>나라사랑카드 이용안내</h4>
          <p>나라사랑카드는 병역의무 이행자 대상 통합 카드 서비스로, 발급/이용/재발급 등 카드 관련 주요 안내를 확인할 수 있습니다.</p>
          <p class="hubBrief">최신 세부 내용과 신청·이용 절차는 아래 공식 페이지에서 확인 후 진행해 주세요.</p>
          <p><a class="hubInlineLink" href="https://www.narasarang.or.kr/#/nasaca/WNL01010000T" target="_blank" rel="noopener noreferrer">https://www.narasarang.or.kr/#/nasaca/WNL01010000T</a></p>
        </section>
      `;
    }

    if (secondary?.key === "finance_overview") {
      return `
        <section class="hubInfoSection">
          <h4>군적금(장병내일준비적금) 안내</h4>
          <p>복무 중 자산형성을 지원하는 군적금 제도 안내로, 가입 대상·가입 방법·만기 수령 관련 내용을 확인할 수 있습니다.</p>
          <p class="hubBrief">세부 조건(대상, 납입, 지원 항목, 신청 절차)은 아래 국방부 안내 페이지에서 최신 기준으로 확인 후 진행해 주세요.</p>
          <p><a class="hubInlineLink" href="https://www.narasarang.or.kr/#/soltomw/WST03000000T" target="_blank" rel="noopener noreferrer">https://www.narasarang.or.kr/#/soltomw/WST03000000T</a></p>
          <p><a class="hubInlineLink" href="https://www.narasarang.or.kr/" target="_blank" rel="noopener noreferrer">https://www.narasarang.or.kr/</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_transport") {
      return `
        <section class="hubInfoSection">
          <h4>교통 혜택</h4>
          <p>KTX/SRT, 고속·시외버스, 항공 등 이동 관련 우대/할인 정보를 모아 제공합니다.</p>
          <p class="hubBrief">노선·기간·대상 조건은 기관별로 다르므로 예매 전 공식 안내를 반드시 확인해 주세요.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.korail.com/ticket/discountSystem/cheerUp" target="_blank" rel="noopener noreferrer">https://www.korail.com/ticket/discountSystem/cheerUp</a></p>
          <p><a class="hubInlineLink" href="https://etk.srail.kr/main.do" target="_blank" rel="noopener noreferrer">https://etk.srail.kr/main.do</a></p>
          <p><a class="hubInlineLink" href="https://www.kobus.co.kr/" target="_blank" rel="noopener noreferrer">https://www.kobus.co.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.bustago.or.kr/newweb/kr/index.do" target="_blank" rel="noopener noreferrer">https://www.bustago.or.kr/newweb/kr/index.do</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_comm_sub") {
      return `
        <section class="hubInfoSection">
          <h4>통신/구독 혜택</h4>
          <p>통신요금제, 멤버십, OTT/교육 구독 등 생활형 혜택 정보를 제공합니다.</p>
          <p class="hubBrief">프로모션 기간, 실적 조건, 중복 할인 여부를 함께 확인해 주세요.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.narasarang.or.kr/" target="_blank" rel="noopener noreferrer">https://www.narasarang.or.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.sktelecom.com/" target="_blank" rel="noopener noreferrer">https://www.sktelecom.com/</a></p>
          <p><a class="hubInlineLink" href="https://www.kt.com/" target="_blank" rel="noopener noreferrer">https://www.kt.com/</a></p>
          <p><a class="hubInlineLink" href="https://www.lguplus.com/" target="_blank" rel="noopener noreferrer">https://www.lguplus.com/</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_job_cert") {
      return `
        <section class="hubInfoSection">
          <h4>취업·자격증 지원</h4>
          <p>취업 지원 프로그램, 자격증 준비, 교육·훈련 연계 정보를 한 번에 확인할 수 있도록 구성합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.mma.go.kr/" target="_blank" rel="noopener noreferrer">https://www.mma.go.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.work.go.kr/" target="_blank" rel="noopener noreferrer">https://www.work.go.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.q-net.or.kr/" target="_blank" rel="noopener noreferrer">https://www.q-net.or.kr/</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_housing_welfare") {
      return `
        <section class="hubInfoSection">
          <h4>주거·복지 혜택</h4>
          <p>주거 관련 지원, 생활복지, 정책금융 연계 항목 등 정착형 혜택 정보를 제공합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.bokjiro.go.kr/" target="_blank" rel="noopener noreferrer">https://www.bokjiro.go.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.gov.kr/" target="_blank" rel="noopener noreferrer">https://www.gov.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.youthcenter.go.kr/" target="_blank" rel="noopener noreferrer">https://www.youthcenter.go.kr/</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_medical_legal") {
      return `
        <section class="hubInfoSection">
          <h4>의료·심리·법률 지원</h4>
          <p>건강검진, 심리상담, 법률상담 등 생활안정 지원 정보를 모아 제공합니다.</p>
          <p class="hubBrief">위기 상황에서는 즉시 전문기관 공식 채널을 이용해 주세요.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.mnd.go.kr/" target="_blank" rel="noopener noreferrer">https://www.mnd.go.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.klac.or.kr/" target="_blank" rel="noopener noreferrer">https://www.klac.or.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.bokjiro.go.kr/" target="_blank" rel="noopener noreferrer">https://www.bokjiro.go.kr/</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_local") {
      return `
        <section class="hubInfoSection">
          <h4>지자체 혜택</h4>
          <p>시·도별 추가 지원, 지역 우대 정책, 생활밀착형 혜택을 지역 기준으로 제공합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.gov.kr/" target="_blank" rel="noopener noreferrer">https://www.gov.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.epeople.go.kr/" target="_blank" rel="noopener noreferrer">https://www.epeople.go.kr/</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_discharge") {
      return `
        <section class="hubInfoSection">
          <h4>전역예정자 가이드</h4>
          <p>전역 전후에 챙겨야 할 금융·취업·복지·행정 절차를 단계별로 안내합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.narasarang.or.kr/" target="_blank" rel="noopener noreferrer">https://www.narasarang.or.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.mma.go.kr/" target="_blank" rel="noopener noreferrer">https://www.mma.go.kr/</a></p>
        </section>
      `;
    }

    if (secondary?.key === "benefit_career_center") {
      return `
        <section class="hubInfoSection">
          <h4>병역진로센터</h4>
          <p>병역이행자와 전역(예정)자를 위한 진로·취업 상담, 이력설계, 연계 지원 정보를 제공합니다.</p>
        </section>
        <section class="hubInfoSection">
          <h4>공식 사이트</h4>
          <p><a class="hubInlineLink" href="https://www.mma.go.kr/" target="_blank" rel="noopener noreferrer">https://www.mma.go.kr/</a></p>
          <p><a class="hubInlineLink" href="https://www.work.go.kr/" target="_blank" rel="noopener noreferrer">https://www.work.go.kr/</a></p>
        </section>
      `;
    }

    const summaryText = (secondary.summary || []).find((line) => String(line || "").trim()) || "";
    const showSummaryBrief = secondary?.key !== "map_use_guide";
    return `
      <section class="hubInfoSection">
        <h4>이 지도의 목적</h4>
        <p>병역이행자와 병역명문가 등이 혜택 가게를 빠르게 찾고, 참여 가게 확산을 돕기 위해 제작한 통합 안내 지도입니다.</p>
        ${showSummaryBrief && summaryText ? `<p class="hubBrief">${escapeHtml(summaryText)}</p>` : ""}
      </section>
      <section class="hubInfoSection">
        <h4>병무청 정보 활용 범위</h4>
        <p>병무청 안내 페이지의 가게명, 주소, 혜택 내용, 대상자 구분, 상세 링크 정보를 기준으로 지도에 표시합니다.</p>
      </section>
    `;
  };

  const openHubPanel = (primaryKey, secondaryKey) => {
    if (!hubPanelEl) return;
    const found = findHubSecondary(primaryKey, secondaryKey);
    if (!found) return;
    const { secondary } = found;

    if (secondary?.key === "review_board_entry") {
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
          <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="패널 닫기">×</button>
          <div class="hubPanelTop">
            <div class="hubPanelTitle">${escapeHtml(secondary.title)}</div>
          </div>
          <div class="hubPanelBody">
            <section class="hubInfoSection reviewBoardSection">
              <div class="reviewBoardEmpty">후기 목록을 불러오는 중입니다...</div>
            </section>
          </div>
        `;
        const closeBtn = document.getElementById("hubPanelCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
      };

      const renderReviewLoadError = (message) => {
        hubPanelEl.innerHTML = `
          <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="패널 닫기">×</button>
          <div class="hubPanelTop">
            <div class="hubPanelTitle">${escapeHtml(secondary.title)}</div>
          </div>
          <div class="hubPanelBody">
            <section class="hubInfoSection reviewBoardSection">
              <div class="reviewBoardTop">
                <h4>등록된 후기</h4>
              </div>
              <div class="reviewBoardEmpty">${escapeHtml(message || "후기 서버 연결에 실패했습니다.")}</div>
              <p class="hubPanelNotice">서버를 python server.py --host 0.0.0.0 --port 8080 으로 실행한 뒤 다시 시도해 주세요.</p>
            </section>
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
        hubPanelEl.innerHTML = `
          <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="패널 닫기">×</button>
          <div class="hubPanelTop">
            <div class="hubPanelTitle">${escapeHtml(secondary.title)}</div>
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
                <div class="reviewCardActions">
                  <button id="detailReviewEditBtn" type="button" class="reviewActionBtn">수정</button>
                  <button id="detailReviewDeleteBtn" type="button" class="reviewActionBtn danger">삭제</button>
                </div>
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
            const confirmedPassword = await openReviewPasswordDialog((inputPw) => verifyReviewPassword(postId, inputPw));
            if (!confirmedPassword) return;
            renderBoardFormPage("edit", postId, confirmedPassword);
          });
        }
        const deleteBtn = document.getElementById("detailReviewDeleteBtn");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", async () => {
            const confirmedPassword = await openReviewPasswordDialog((inputPw) => verifyReviewPassword(postId, inputPw));
            if (!confirmedPassword) return;
            try {
              await deleteReviewPost({ postId, password: confirmedPassword });
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
          <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="패널 닫기">×</button>
          <div class="hubPanelTop">
            <div class="hubPanelTitle">${escapeHtml(secondary.title)}</div>
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
        if (openWriteBtn) openWriteBtn.addEventListener("click", () => renderBoardFormPage("create"));
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
        const titleText = isEdit ? "후기 수정" : "후기 등록";
        hubPanelEl.innerHTML = `
          <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="패널 닫기">×</button>
          <div class="hubPanelTop">
            <div class="hubPanelTitle">${escapeHtml(secondary.title)}</div>
          </div>
          <div class="hubPanelBody">
            <section class="hubInfoSection reviewBoardSection">
              <div class="reviewBoardTop">
                <h4>${titleText}</h4>
                <button id="backReviewListBtn" type="button" class="reviewListBtn">목록으로</button>
              </div>
              <p>등록 시 입력한 비밀번호는 수정/삭제할 때 필요합니다.</p>
              <div class="reviewForm">
                <input id="reviewAuthorInput" class="reviewInput" type="text" maxlength="20" placeholder="닉네임 (선택)" value="${escapeHtml(target?.author || "")}" />
                <textarea id="reviewContentInput" class="reviewTextarea" maxlength="500" placeholder="후기나 의견을 입력해 주세요.">${escapeHtml(target?.content || "")}</textarea>
                <input id="reviewPasswordInput" class="reviewInput" type="password" maxlength="20" placeholder="${isEdit ? "새 비밀번호 입력 시 변경(선택)" : "비밀번호 (필수)"}" />
                ${isEdit ? "" : `
                  <label class="reviewConsentRow">
                    <input id="reviewConsentCheck" type="checkbox" />
                    <span>개인정보 수집·이용(게시판 운영 목적)에 동의합니다.</span>
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
            const passwordEl = document.getElementById("reviewPasswordInput");
            const consentEl = document.getElementById("reviewConsentCheck");
            const author = String(authorEl?.value || "").trim().slice(0, 20);
            const content = String(contentEl?.value || "").trim().slice(0, 500);
            const password = String(passwordEl?.value || "").trim().slice(0, 20);
            if (!content) {
              alert("후기 또는 의견 내용을 입력해 주세요.");
              if (contentEl) contentEl.focus();
              return;
            }
            if (!isEdit && !password) {
              alert("수정/삭제용 비밀번호를 입력해 주세요.");
              if (passwordEl) passwordEl.focus();
              return;
            }
            if (!isEdit && consentEl && !consentEl.checked) {
              alert("개인정보 수집·이용 동의 후 등록할 수 있습니다.");
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
                  newPassword: password,
                });
              } else {
                await createReviewPost({ author, content, password });
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
      <button id="hubPanelCloseBtn" class="hubPanelClose" type="button" aria-label="패널 닫기">×</button>
      <div class="hubPanelTop">
        <div class="hubPanelTitle">${escapeHtml(secondary.title)}</div>
      </div>
      <div class="hubPanelBody">
        ${mainGuideHtml}
      </div>
    `;
    hubPanelEl.classList.remove("hidden");
    if (hubModalBackdropEl) hubModalBackdropEl.classList.remove("hidden");
    const closeBtn = document.getElementById("hubPanelCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeHubPanel);
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
    if (!detailPanelEl) return;
    detailPanelEl.classList.add("hidden");
    detailPanelEl.innerHTML = "";
  };

  const hideDetailPanelOnly = () => {
    if (!detailPanelEl) return;
    detailPanelEl.classList.add("hidden");
    detailPanelEl.innerHTML = "";
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

  const placeDetailPanelAboveMarker = (latLng, screenPoint = null) => {
    if (!detailPanelEl) return;
    const projection = map.getProjection?.();
    const markerPx = screenPoint
      ? new naver.maps.Point(screenPoint.x, screenPoint.y)
      : projection?.fromCoordToOffset?.(latLng);
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

  const openDetailAfterMapMove = (point, latLng) => {
    isMarkerRepositioning = true;
    selectedDetailAnchor = new naver.maps.LatLng(point.lat, point.lng);
    const targetId = getFacilityKey(point);
    moveMarkerToLowerArea(latLng, () => {
      isMarkerRepositioning = false;
      if (selectedFacilityId !== targetId) return;
      if (!ENABLE_DETAIL_PANEL) return;
      openDetailInfo(point, selectedDetailAnchor, selectedDetailScreenPoint);
    });
  };

  let currentPrintPoint = null;
  let currentPrintTemplate = "poster";
  let currentPrintBlobUrl = null;

  const renderPrintTemplate = async (point, tplName = "poster") => {
    const container = document.getElementById("printTemplateContainer") || document.getElementById("printCanvasContainer");
    if (!container || !point) return;

    if (currentPrintBlobUrl) {
      URL.revokeObjectURL(currentPrintBlobUrl);
      currentPrintBlobUrl = null;
    }

    const tplTitle = tplName === "poster" ? "A4 포스터" : (tplName === "table_stand" ? "미니 스탠드" : "도어행거");
    const endpoint = tplName === "poster" ? "print_poster" : (tplName === "table_stand" ? "print_stand" : "print_hanger");
    const facilityId = point.facilityId || point.id || "";
    const widthPx = tplName === "poster" ? 480 : (tplName === "table_stand" ? 340 : 280);
    const heightPx = tplName === "poster" ? 678 : (tplName === "table_stand" ? 490 : 490);

    container.innerHTML = `
      <div class="print-sheet tpl-img-wrap" style="position: relative; width: ${widthPx}px; height: ${heightPx}px; background: #F3F3ED; box-shadow: 0 8px 30px rgba(0,0,0,0.18); border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 auto; overflow: hidden;">
        <div id="printLoadingWrap" style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; z-index: 10; padding: 24px; text-align: center; width: 90%;">
          <div class="print-loading-spinner" style="width: 38px; height: 38px; border: 4px solid #cbd5e1; border-top: 4px solid #1e3a8a; border-radius: 50%; animation: printSpinnerSpin 1s linear infinite; box-sizing: border-box;"></div>
          <div id="printStepLog" style="font-size: 15px; font-weight: 700; color: #1e293b; font-family: 'Pretendard', sans-serif;">${tplTitle} 원본 시안 생성 중...</div>
          <div id="printSubLog" style="font-size: 12px; color: #475569; font-family: monospace; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; width: 100%; word-break: break-all;">[1/2] 렌더링 서버 요청 시작...</div>
        </div>
        <img id="printResultImg" 
             alt="${tplTitle} 인쇄 시안" 
             style="position: relative; width: 100%; height: 100%; border-radius: 4px; z-index: 5; display: none; object-fit: contain;" />
      </div>
    `;

    const subLog = document.getElementById("printSubLog");
    const loadingWrap = document.getElementById("printLoadingWrap");
    const resultImg = document.getElementById("printResultImg");

    const updateLog = (msg, type = "info") => {
      if (subLog) subLog.textContent = msg;
      addDebugLog(msg, type);
    };

    const startTime = performance.now();
    let timerInterval = setInterval(() => {
      const curElapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      if (subLog && loadingWrap && loadingWrap.style.display !== "none") {
        let stageText = "서버 연결 중...";
        const sec = parseFloat(curElapsed);
        if (sec < 4) {
          stageText = "가맹점 정보 및 지도 데이터 구성 중";
        } else if (sec < 25) {
          stageText = "고화질 지도 및 Pretendard 그래픽 렌더링 중";
        } else {
          stageText = "Render 서버 최초 기동 및 이미지 합성 마무리 중";
        }
        subLog.textContent = `[1/2] ${stageText} (${curElapsed}초 경과)`;
      }
    }, 400);

    try {
      updateLog(`[1/2] ${tplTitle} 렌더링 요청 전송 (ID: ${facilityId})`, "info");
      
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const targetUrl = isLocal 
        ? `/api/${endpoint}?facility_id=${encodeURIComponent(facilityId)}&t=${Date.now()}`
        : `https://mmamap-backend-docker.onrender.com/api/${endpoint}?facility_id=${encodeURIComponent(facilityId)}&t=${Date.now()}`;
      
      updateLog(`[호출] ${isLocal ? "로컬 서버" : "Render 백엔드 직접 연결"}: ${targetUrl}`, "info");
      
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 90000);
      
      let res;
      try {
        res = await fetch(targetUrl, { signal: controller.signal });
      } finally {
        clearTimeout(fetchTimeout);
      }

      clearInterval(timerInterval);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      
      if (!res || !res.ok) {
        const errText = await (res ? res.text().catch(() => "") : "");
        throw new Error(`HTTP ${res ? res.status : "Error"} (${errText || res.statusText || "서버 응답 오류"}) [${elapsed}초]`);
      }
      
      const blob = await res.blob();
      currentPrintBlobUrl = URL.createObjectURL(blob);
      
      resultImg.onload = () => {
        updateLog(`[2/2] ${tplTitle} 완성 (${elapsed}초, ${(blob.size / 1024).toFixed(1)} KB)`, "success");
        if (loadingWrap) loadingWrap.style.display = "none";
        if (resultImg) resultImg.style.display = "block";
      };
      resultImg.src = currentPrintBlobUrl;
    } catch (err) {
      clearInterval(timerInterval);
      console.error("[PrintModal Error]", err);
      const totalElapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      updateLog(`[오류] 홍보물 생성 실패 (${totalElapsed}초): ${err.message}`, "error");
      if (loadingWrap) {
        loadingWrap.innerHTML = `
          <div style="color: #ef4444; font-weight: 700; font-size: 14px; margin-bottom: 6px;">홍보물 생성 오류 (${totalElapsed}초)</div>
          <div style="font-size: 11px; background: #fee2e2; color: #991b1b; padding: 8px 10px; border-radius: 4px; word-break: break-all; margin-bottom: 10px; text-align: left;">
            <div><b>상세 내용:</b> ${escapeHtml(err.message || String(err))}</div>
            <div style="margin-top: 4px; color: #7f1d1d; font-size: 10px;">※ Render 서버가 절전 모드인 경우 첫 요청 시 약 30~50초가 소요될 수 있습니다.</div>
          </div>
          <button onclick="renderPrintTemplate(currentPrintPoint, '${tplName}')" style="padding: 6px 16px; background: #1e3a8a; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">다시 시도</button>
        `;
      }
    }
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

  const openPrintModal = (point) => {
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
      actionBtn.textContent = "이미지 다운로드";
    }

    const guideEl = document.getElementById("printGuideContent");
    if (guideEl) {
      guideEl.textContent = "가맹점 출입구나 카운터 주변에 부착하여 방문하는 대상자(현역병, 사회복무, 병역명문가 등)가 혜택을 즉시 알아볼 수 있도록 홍보하는 용도로 활용됩니다.";
    }

    renderPrintTemplate(point, currentPrintTemplate);

    if (backdrop) backdrop.classList.remove("hidden");
  };

  const closePrintModal = () => {
    const backdrop = document.getElementById("printModalBackdrop");
    if (backdrop) backdrop.classList.add("hidden");
  };

  const openDetailInfo = (point, anchorLatLng = null, screenPoint = null) => {
    if (!ENABLE_DETAIL_PANEL) return;
    if (!detailPanelEl || !point) return;
    const address = normalizeTextBlock(point.address || "주소 정보 없음");
    const phone = normalizeTextBlock(point.phone || "전화번호 정보 없음");
    const benefit = formatBenefitText(point.benefit || "혜택 정보 없음");
    const rawCategory = toCategoryLabel(point.category);
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

    const facilityId = getFacilityKey(point);
    const isLiked = likes.has(facilityId);
    const isFavorite = favorites.has(facilityId);
    const safePhone = escapeHtml(phone);
    const telHref = normalizePhone(point.phone || "");
    const bookingUrl = getTheaterBookingUrl(point.title || "");
    const bookingBtnHtml = bookingUrl
      ? `
        <div class="detailFavSpacer"></div>
        <a class="detailBookBtn" href="${escapeHtml(bookingUrl)}" target="_blank" rel="noopener noreferrer">예매하기</a>
      `
      : "";

    detailPanelEl.innerHTML = `
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
        <button id="detailLikeBtn" class="detailIconBtn like ${isLiked ? "active" : ""}" type="button" aria-label="좋아요" title="좋아요"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg></button>
        <button id="detailFavBtn" class="detailIconBtn fav ${isFavorite ? "active" : ""}" type="button" aria-label="즐겨찾기" title="즐겨찾기"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></button>
        <button id="detailPrintBtn" class="detailPrintBtn" type="button" title="맞춤 홍보물/상생지도 인쇄">홍보물 인쇄</button>
        ${bookingBtnHtml}
      </div>
      <div class="detailDivider"></div>
      <table class="detailInfoTable">
        <tbody>
          <tr>
            <td class="detailLabelCell">대상 :</td>
            <td class="detailValueCell detailAudienceList">${audienceText}</td>
          </tr>
          <tr>
            <td class="detailLabelCell">혜택 :</td>
            <td class="detailValueCell benefitText">${benefit}</td>
          </tr>
        </tbody>
      </table>
    `;

    detailPanelEl.classList.remove("hidden");
    const finalAnchor = anchorLatLng || selectedDetailAnchor || new naver.maps.LatLng(point.lat, point.lng);
    selectedDetailAnchor = finalAnchor;
    const finalScreenPoint = screenPoint || selectedDetailScreenPoint || null;
    placeDetailPanelAboveMarker(finalAnchor, finalScreenPoint);
    requestAnimationFrame(() => placeDetailPanelAboveMarker(finalAnchor, finalScreenPoint));

    const closeBtn = document.getElementById("closeDetailPanelBtn");
    if (closeBtn) closeBtn.onclick = closeDetailPanel;

    const printBtn = document.getElementById("detailPrintBtn");
    if (printBtn) {
      printBtn.onclick = () => openPrintModal(point);
    }

    const likeBtn = document.getElementById("detailLikeBtn");
    if (likeBtn) {
      likeBtn.onclick = async () => {
        likeBtn.disabled = true;
        try {
          const resp = await toggleEngagement(facilityId, "like");
          if (resp.active) likes.add(facilityId);
          else likes.delete(facilityId);
          likeCountsById[facilityId] = Number(resp.count || 0);
          renderRankPanel();
          renderFavoritesPanel();
          openDetailInfo(point);
        } catch (_err) {
          // keep UI quiet on transient network error
        } finally {
          likeBtn.disabled = false;
        }
      };
    }

    const favBtn = document.getElementById("detailFavBtn");
    if (favBtn) {
      favBtn.onclick = async () => {
        favBtn.disabled = true;
        try {
          const resp = await toggleEngagement(facilityId, "favorite");
          if (resp.active) favorites.add(facilityId);
          else favorites.delete(facilityId);
          favoriteCountsById[facilityId] = Number(resp.count || 0);
          renderFavoritesPanel();
          renderRankPanel();
          openDetailInfo(point);
        } catch (_err) {
          // keep UI quiet on transient network error
        } finally {
          favBtn.disabled = false;
        }
      };
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

  const moveMapToRegion = (region) => {
    const targets = points.filter((p) => pointMatchRegion(p, region) && isValidKoreaCoord(Number(p.lat), Number(p.lng)));
    if (!targets.length) return;
    if (targets.length === 1) {
      map.panTo(new naver.maps.LatLng(targets[0].lat, targets[0].lng));
      map.setZoom(Math.max(map.getZoom(), 16), true);
      return;
    }
    let minLat = targets[0].lat;
    let maxLat = targets[0].lat;
    let minLng = targets[0].lng;
    let maxLng = targets[0].lng;
    targets.forEach((p) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });
    const sw = new naver.maps.LatLng(minLat, minLng);
    const ne = new naver.maps.LatLng(maxLat, maxLng);
    map.fitBounds(new naver.maps.LatLngBounds(sw, ne));
  };

  const focusFacility = (facilityId) => {
    const target = pointByFacilityKey.get(facilityId);
    if (!target) return;
    if (selectedFacilityId && selectedFacilityId !== facilityId) hideDetailPanelOnly();
    selectedFacilityId = facilityId;

    selectedCategory = "";
    selectedAudience = "";
    selectedRegion = "";
    buildLegend();
    buildAudienceLegend();
    if (regionSelectEl) regionSelectEl.value = "";
    renderRankPanel();

    const pos = new naver.maps.LatLng(target.lat, target.lng);
    openDetailAfterMapMove(target, pos);
    map.setZoom(Math.max(map.getZoom(), 16), true);
    updateZoomLabel();
    scheduleRender();
  };

  const getRankingRows = () => {
    const allRows = [...pointByFacilityKey.entries()]
      .map(([id, point]) => ({ id, point }))
      .filter((row) => pointMatchRegion(row.point, selectedRegion));

    const clickedRows = allRows
      .map((row) => ({ ...row, score: getClickCount(row.id) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.point.title.localeCompare(b.point.title, "ko"));

    if (clickedRows.length > 0) return clickedRows;

    return allRows
      .slice(0, 30)
      .map((row, idx) => ({ ...row, score: Math.max(1, 35 - idx) }));
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
      if (rankTopTextEl) rankTopTextEl.textContent = "#1 -";
      if (rankTopScoreEl) rankTopScoreEl.textContent = "0";
      return;
    }
    const safeIdx = ((idx % rows.length) + rows.length) % rows.length;
    const row = rows[safeIdx];
    if (rankTopTextEl) rankTopTextEl.textContent = `#${safeIdx + 1} ${row.point.title || "-"}`;
    if (rankTopScoreEl) rankTopScoreEl.textContent = `${row.score}`;
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

  function renderFavoritesPanel() {
    if (!favoritesListEl) return;
    const ids = [...favorites];
    if (!ids.length) {
      favoritesListEl.innerHTML = `<div class="favoriteEmpty">No favorites</div>`;
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
        item.innerHTML = `<div class="name">Unavailable place</div><div class="meta">Data not found</div>`;
      } else {
        const likedText = likes.has(id) ? "좋아요 등록됨" : "";
        item.innerHTML = `
          <div class="name">${escapeHtml(point.title || "Place")}</div>
          <div class="meta">${escapeHtml(toCategoryLabel(point.category || ""))} · ${escapeHtml(point.address || "No address")}</div>
          ${likedText ? `<div class="meta">${escapeHtml(likedText)}</div>` : ""}
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
    const categoryCounts = new Map();
    for (const p of points) {
      const key = toCategoryLabel(p.category || "기타");
      categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
    }
    const top = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name);
    const items = ["전체", ...top];
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

  const renderVisibleMarkers = () => {
    const bounds = map.getBounds();
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

    const updateDebugStatus = (msg) => {
      let el = document.getElementById("debugStatusBadge");
      if (!el) {
        el = document.createElement("div");
        el.id = "debugStatusBadge";
        el.style.position = "fixed";
        el.style.bottom = "6px";
        el.style.right = "135px";
        el.style.background = "#0f172a";
        el.style.color = "#38bdf8";
        el.style.zIndex = "10000";
        el.style.padding = "2px 8px";
        el.style.fontSize = "11px";
        el.style.fontFamily = "monospace";
        el.style.borderRadius = "3px";
        el.style.border = "1px solid #334155";
        el.style.pointerEvents = "none";
        el.style.fontWeight = "bold";
        document.body.appendChild(el);
      }
      el.textContent = msg;
    };
    updateDebugStatus(`데이터: ${points.length}개 | 화면마커: ${visible.length}개 | 줌: ${map.getZoom()}`);
    // eslint-disable-next-line no-console
    console.log(`[MMAMap Debug] Total points: ${points.length}, Visible: ${visible.length}, Zoom: ${map.getZoom()}`);

    renderedMarkers.forEach((m) => m.setMap(null));
    renderedMarkers = [];
    hoverInfoWindow.close();

    for (const v of visible) {
      const baseZIndex = 100 + renderedMarkers.length;
      const marker = new naver.maps.Marker({ position: v.pos, map, icon: getMarkerIconByPoint(v), zIndex: baseZIndex });
      marker.__facilityKey = getFacilityKey(v);

      naver.maps.Event.addListener(marker, "mouseover", () => {
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
        marker.setZIndex(baseZIndex);
        hoverInfoWindow.close();
      });
      naver.maps.Event.addListener(marker, "click", () => {
        if (selectedFacilityId && selectedFacilityId !== marker.__facilityKey) hideDetailPanelOnly();
        selectedFacilityId = marker.__facilityKey;
        if (map.getZoom() < 12) {
          map.setZoom(13, true);
          updateZoomLabel();
        }
        openDetailAfterMapMove(v, v.pos);
        clickCountsById[selectedFacilityId] = getClickCount(selectedFacilityId) + 1;
        renderRankPanel();
        recordFacilityClick(selectedFacilityId)
          .then((resp) => {
            clickCountsById[selectedFacilityId] = Number(resp.clickCount || clickCountsById[selectedFacilityId] || 0);
            renderRankPanel();
          })
          .catch(() => {});
      });

      renderedMarkers.push(marker);
    }

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
        placeDetailPanelAboveMarker(selectedDetailAnchor, selectedDetailScreenPoint);
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

  if (btnZoomIn) btnZoomIn.addEventListener("click", () => { map.setZoom(map.getZoom() + 1, true); updateZoomLabel(); });
  if (btnZoomOut) btnZoomOut.addEventListener("click", () => { map.setZoom(map.getZoom() - 1, true); updateZoomLabel(); });
  if (zoomLevelBtn) zoomLevelBtn.addEventListener("click", () => { map.setCenter(defaultCenter); map.setZoom(defaultZoom, true); updateZoomLabel(); });
  if (btnLocate && navigator.geolocation) {
    btnLocate.addEventListener("click", () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const here = new naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
          map.setCenter(here);
          map.setZoom(Math.max(map.getZoom(), 16), true);
          updateZoomLabel();
        },
        () => alert("현재 위치를 가져오지 못했습니다."),
        { enableHighAccuracy: true, timeout: 7000 }
      );
    });
  }

  const brandLogoEl = document.getElementById("brandLogo");
  if (brandLogoEl) brandLogoEl.addEventListener("click", () => { window.location.reload(); });
  if (profileBtn) profileBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleFavoritesPanel(); });
  if (favoritesPanel) favoritesPanel.addEventListener("click", (e) => e.stopPropagation());
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
  if (introCloseBtnEl) introCloseBtnEl.addEventListener("click", () => closeIntroPopup(false));
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

  const doPrintBtn = document.getElementById("doPrintBtn");
  if (doPrintBtn) {
    doPrintBtn.addEventListener("click", () => {
      if (!currentPrintPoint) return;
      const tplTitle = currentPrintTemplate === "poster" ? "포스터" : (currentPrintTemplate === "table_stand" ? "스탠드" : "도어행거");
      const filename = `상생지도_${tplTitle}_${currentPrintPoint.title || "가맹점"}.png`;
      
      if (currentPrintBlobUrl) {
        const link = document.createElement("a");
        link.href = currentPrintBlobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addDebugLog(`[다운로드 완료] ${filename} 저장 완료!`, "success");
      } else {
        const facilityId = currentPrintPoint.facilityId || currentPrintPoint.id || "";
        const endpoint = currentPrintTemplate === "poster" ? "print_poster" : (currentPrintTemplate === "table_stand" ? "print_stand" : "print_hanger");
        const link = document.createElement("a");
        link.href = `/api/${endpoint}?facility_id=${encodeURIComponent(facilityId)}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

  naver.maps.Event.addListener(map, "zoom_changed", updateZoomLabel);
  naver.maps.Event.addListener(map, "idle", scheduleRender);

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

  // Sidebar real-time search box handler
  const performKeywordSearch = (query) => {
    if (!query) return;
    const lowerQuery = query.toLowerCase();

    // 1. Exact Store Title Match ONLY (100% 일치할 때만 단일 상점 포커스)
    const exactTitleMatch = points.find((p) => (p.title || "").toLowerCase() === lowerQuery);
    if (exactTitleMatch) {
      const key = getFacilityKey(exactTitleMatch);
      if (key) {
        focusFacility(key);
        return;
      }
    }

    // 2. Region / Address Match (지역명/주소 검색 시 해당 지역 전체 지도 이동)
    const addrMatches = points.filter((p) => 
      (p.address || "").toLowerCase().includes(lowerQuery) || 
      (p.region || "").toLowerCase().includes(lowerQuery)
    );

    if (addrMatches.length > 0) {
      if (selectedFacilityId) hideDetailPanelOnly();
      const avgLat = addrMatches.reduce((sum, p) => sum + p.lat, 0) / addrMatches.length;
      const avgLng = addrMatches.reduce((sum, p) => sum + p.lng, 0) / addrMatches.length;
      map.setCenter(new naver.maps.LatLng(avgLat, avgLng));
      map.setZoom(14, true);
      updateZoomLabel();
      scheduleRender();
      return;
    }

    // 3. Partial Store Title / Category / Benefit Match
    const partialMatches = points.filter((p) => 
      (p.title || "").toLowerCase().includes(lowerQuery) ||
      (p.category || "").toLowerCase().includes(lowerQuery) ||
      (p.subtitle || "").toLowerCase().includes(lowerQuery) ||
      (p.benefit || "").toLowerCase().includes(lowerQuery)
    );

    if (partialMatches.length === 1) {
      const key = getFacilityKey(partialMatches[0]);
      if (key) {
        focusFacility(key);
        return;
      }
    } else if (partialMatches.length > 1) {
      if (selectedFacilityId) hideDetailPanelOnly();
      const avgLat = partialMatches.reduce((sum, p) => sum + p.lat, 0) / partialMatches.length;
      const avgLng = partialMatches.reduce((sum, p) => sum + p.lng, 0) / partialMatches.length;
      map.setCenter(new naver.maps.LatLng(avgLat, avgLng));
      map.setZoom(14, true);
      updateZoomLabel();
      scheduleRender();
      return;
    }

    // 4. Fallback to Naver Geocoder if available
    if (window.naver && naver.maps && naver.maps.Service && naver.maps.Service.geocode) {
      naver.maps.Service.geocode({ query }, (status, response) => {
        if (status === naver.maps.Service.Status.OK && response.v2 && response.v2.addresses.length > 0) {
          if (selectedFacilityId) hideDetailPanelOnly();
          const address = response.v2.addresses[0];
          const pos = new naver.maps.LatLng(address.y, address.x);
          map.setCenter(pos);
          map.setZoom(14, true);
          updateZoomLabel();
          scheduleRender();
        }
      });
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

  // Background Render Server Wake-up Ping
  try {
    fetch("https://mmamap-backend-docker.onrender.com/api/health", { mode: "no-cors" }).then(() => {
      addDebugLog("[System] Render 클라우드 백엔드 활성화(Wake-up) 완료", "info");
    }).catch(() => {});
  } catch (_e) {}
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
});
