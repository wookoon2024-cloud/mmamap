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
  window.MMAFavorites = favorites;
  window.MMALikes = likes;
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
  let activeMarkerMap = new Map();
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
              <li><b>A4 포스터</b>: 출입문, 카운터, 벽면 부착용 (상생지도 결합형)</li>
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
            <a class="hubBtnLink" href="https://www.narasarang.or.kr/#/nasaca/WNL01010000T" target="_blank" rel="noopener noreferrer">
              나라사랑포털 카드 혜택 상세 보기 ↗
            </a>
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
            <a class="hubBtnLink" href="https://www.narasarang.or.kr/#/soltomw/WST03000000T" target="_blank" rel="noopener noreferrer">
              장병내일준비적금 안내 바로가기 ↗
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
                <li><b>원터치 홍보물 생성</b>: 가맹점주를 위한 A4 상생지도 포스터/스탠드 자동 인쇄</li>
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
              <p>등록 시 입력한 비밀번호는 수정/삭제할 때 필요합니다.</p>
              <div class="reviewForm">
                <input id="reviewAuthorInput" class="reviewInput" type="text" maxlength="20" placeholder="닉네임 (선택)" value="${escapeHtml(target?.author || (window.MMAAuth?.user?.nickname || ""))}" />
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
      renderVisibleMarkers();
      setTimeout(() => renderVisibleMarkers(), 120);
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
    const sheetDims = {
      poster: { width: "424px", height: "600px", aspect: "1000 / 1414" },
      table_stand: { width: "380px", height: "546px", aspect: "800 / 1150" },
      door_hanger: { width: "275px", height: "550px", aspect: "600 / 1200" }
    }[tplName] || { width: "424px", height: "600px", aspect: "1000 / 1414" };

    container.innerHTML = `
      <div class="print-sheet tpl-img-wrap" style="position: relative; width: ${sheetDims.width}; height: ${sheetDims.height}; max-height: calc(88vh - 140px); max-width: 95%; aspect-ratio: ${sheetDims.aspect}; background: #F3F3ED; box-shadow: 0 8px 30px rgba(0,0,0,0.18); border-radius: 8px; display: flex; justify-content: center; align-items: center; margin: 0 auto; overflow: hidden;">
        <div id="printLoadingWrap" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 10; padding: 24px; text-align: center; background: #F3F3ED;">
          <div class="print-loading-spinner" style="width: 44px; height: 44px; border: 4px solid #cbd5e1; border-top: 4px solid #1e3a8a; border-radius: 50%; animation: printSpinnerSpin 1s linear infinite; box-sizing: border-box;"></div>
          <div id="printStepLog" style="font-size: 16px; font-weight: 700; color: #1e293b; font-family: 'Pretendard', sans-serif;">${tplTitle} 원본 시안 생성 중...</div>
          <div id="printSubLog" style="font-size: 12px; color: #475569; font-family: monospace; background: #ffffff; padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; max-width: 85%; word-break: break-all;">[1/2] 렌더링 서버 요청 시작...</div>
        </div>
        <img id="printResultImg" 
             alt="${tplTitle} 인쇄 시안" 
             style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; z-index: 5; display: none;" />
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
        : `https://mmamap-backend.onrender.com/api/${endpoint}?facility_id=${encodeURIComponent(facilityId)}&t=${Date.now()}`;
      
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

  const openPrintModal = (pointOrId) => {
    let point = pointOrId;
    if (typeof pointOrId === "string") {
      point = pointByFacilityKey.get(pointOrId);
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
      actionBtn.textContent = "이미지 다운로드";
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

    const targetZoom = Math.max(map.getZoom(), 16);
    if (map.getZoom() !== targetZoom) {
      map.setZoom(targetZoom, false);
      updateZoomLabel();
    }

    const pos = new naver.maps.LatLng(target.lat, target.lng);
    openDetailAfterMapMove(target, pos);
    renderVisibleMarkers();
  };
  window.focusFacility = focusFacility;

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

  const doPdfBtn = document.getElementById("doPdfBtn");
  if (doPdfBtn) {
    doPdfBtn.addEventListener("click", () => {
      if (!currentPrintBlobUrl) {
        alert("이미지 시안이 생성된 후 인쇄하실 수 있습니다.");
        return;
      }
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>나라사랑가게 홍보물 인쇄</title>
              <style>
                @page { size: A4 portrait; margin: 0; }
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #fff; }
                img { width: 100%; height: 100%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${currentPrintBlobUrl}" onload="window.focus(); window.print(); window.close();" />
            </body>
          </html>
        `);
        printWin.document.close();
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

  naver.maps.Event.addListener(map, "dragstart", () => {
    if (!isMarkerRepositioning) {
      closeDetailPanel();
    }
  });

  naver.maps.Event.addListener(map, "zoom_start", () => {
    if (!isMarkerRepositioning) {
      closeDetailPanel();
    }
  });

  naver.maps.Event.addListener(map, "click", () => {
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
        const chevron = document.getElementById("mobileSheetChevron");
        if (chevron) chevron.textContent = "▲";
      } else {
        legendBar.classList.add("mobile-expanded");
        legendBar.classList.remove("mobile-collapsed");
        const chevron = document.getElementById("mobileSheetChevron");
        if (chevron) chevron.textContent = "▼";
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
      map.setZoom(14, false);
      updateZoomLabel();
      renderVisibleMarkers();
      setTimeout(() => renderVisibleMarkers(), 120);
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
      map.setZoom(14, false);
      updateZoomLabel();
      renderVisibleMarkers();
      setTimeout(() => renderVisibleMarkers(), 120);
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
          map.setZoom(14, false);
          updateZoomLabel();
          renderVisibleMarkers();
          setTimeout(() => renderVisibleMarkers(), 120);
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

  // Initialize Auth & Member System
  try {
    await MMAAuth.init();
  } catch (authErr) {
    console.error("Auth init error:", authErr);
  }

  // Handle URL QR Scan Entry (?fid=...&src=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetFid = urlParams.get("fid") || urlParams.get("facility_id");
    const scanSrc = urlParams.get("src") || urlParams.get("source") || "poster";
    if (targetFid) {
      fetch(`/api/qr_scan?facility_id=${encodeURIComponent(targetFid)}&src=${encodeURIComponent(scanSrc)}`).catch(() => {});
      setTimeout(() => {
        focusFacility(targetFid);
      }, 600);
    }
  } catch (_e) {}

  // Background Render Server Wake-up Ping
  try {
    fetch("https://mmamap-backend.onrender.com/api/health", { mode: "no-cors" }).then(() => {
      addDebugLog("[System] Render 클라우드 백엔드 활성화(Wake-up) 완료", "info");
    }).catch(() => {});
  } catch (_e) {}
}

// ============================================================
// AUTHENTICATION & MERCHANT VERIFICATION & STATS MODULE
// ============================================================
const LS_AUTH_TOKEN_KEY = "mmamap_auth_token_v1";

const MMAAuth = {
  token: localStorage.getItem(LS_AUTH_TOKEN_KEY) || "",
  user: null,
  favorites: new Set(),
  likes: new Set(),
  selectedMerchantStore: null,
  isEmailVerified: false,
  isMerchantVerified: false,
  isNicknameChecked: false,

  async init() {
    this.bindEvents();
    if (this.token) {
      await this.fetchMe();
    } else {
      this.renderNav();
    }
    // Track Page Access / Visit Analytics
    this.logPageVisit();

    // Check URL for admin shortcut (?admin=1 or ?admin_key=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("admin") || urlParams.has("admin_key")) {
        const k = urlParams.get("admin_key") || "demo";
        setTimeout(() => this.openAdminDashboardModal(k), 800);
      }
    } catch (_e) {}
  },

  async logPageVisit() {
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent);
      const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

      await fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname + window.location.search,
          referrer: document.referrer || "",
          device_type: deviceType,
          user_role: this.user ? this.user.role : "guest",
        }),
      });
    } catch (_err) {}
  },

  async fetchMe() {
    if (!this.token) {
      this.renderNav();
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      if (data.ok && data.authenticated && data.user) {
        this.user = data.user;
        this.favorites = new Set(data.favorites || []);
        this.likes = new Set(data.likes || []);
        addDebugLog(`[Auth] 로그인 세션 활성화: ${this.user.nickname} (${this.user.role})`, 'success');
      } else {
        this.token = "";
        this.user = null;
        localStorage.removeItem(LS_AUTH_TOKEN_KEY);
      }
    } catch (_err) {}
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
      <div class="authUserBadge" onclick="window.MMAAuth.toggleProfileMenu()" title="내 메뉴 열기" style="cursor:pointer;">
        <span>${roleIcon}</span>
        <strong>${this.escapeHtml(this.user.nickname)}</strong>
        <small style="color:${isAdmin ? '#a21caf' : '#64748b'};">${roleTitle}</small>
      </div>
    `;
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
            ? `<button type="button" class="profileDropdownItem" onclick="window.MMAAuth.openMerchantStatsModal(); window.MMAAuth.closeProfileMenu();">
                 <span class="pItemIcon">🏪</span>
                 <div class="pItemText">
                   <strong>우리 매장 QR 통계</strong>
                   <small>방문자 스캔 유입 현황</small>
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

  openMerchantPosterModal() {
    if (!this.user || !this.user.merchantFacilityId) {
      alert("점주 인증된 가맹점 정보가 없습니다.");
      return;
    }
    if (typeof window.openPrintModal === "function") {
      window.openPrintModal(this.user.merchantFacilityId);
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
      localStorage.setItem(LS_AUTH_TOKEN_KEY, this.token);
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
    localStorage.removeItem(LS_AUTH_TOKEN_KEY);
    this.renderNav();
    addDebugLog("[Auth] 로그아웃 완료", "info");
  },

  currentAdminTab: "analytics",
  adminMembers: [],
  adminMemberRoleFilter: "all",
  adminMemberSearchQuery: "",

  async openAdminDashboardModal(adminKey = "") {
    const backdrop = document.getElementById("adminDashboardBackdrop");
    const modal = document.getElementById("adminDashboardModal");
    if (!backdrop || !modal) return;

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");

    this.switchAdminTab("analytics");

    try {
      const url = adminKey ? `/api/admin/stats?admin_key=${encodeURIComponent(adminKey)}` : "/api/admin/stats";
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.ok && data.stats) {
        this.renderAdminStats(data.stats);
      } else {
        alert(data.error || "관리자 통계를 불러올 수 없습니다.");
      }
    } catch (err) {
      addDebugLog(`[Admin Error] ${err.message}`, 'error');
    }

    this.fetchAdminMembers();
  },

  closeAdminDashboardModal() {
    const backdrop = document.getElementById("adminDashboardBackdrop");
    const modal = document.getElementById("adminDashboardModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
  },

  switchAdminTab(tab) {
    this.currentAdminTab = tab;
    const btnAnalytics = document.getElementById("adminTabBtnAnalytics");
    const btnMembers = document.getElementById("adminTabBtnMembers");
    const tabAnalytics = document.getElementById("adminTabAnalytics");
    const tabMembers = document.getElementById("adminTabMembers");

    if (btnAnalytics) btnAnalytics.classList.toggle("active", tab === "analytics");
    if (btnMembers) btnMembers.classList.toggle("active", tab === "members");
    if (tabAnalytics) tabAnalytics.classList.toggle("hidden", tab !== "analytics");
    if (tabMembers) tabMembers.classList.toggle("hidden", tab !== "members");

    if (tab === "members" && this.adminMembers.length === 0) {
      this.fetchAdminMembers();
    }
  },

  async fetchAdminMembers(adminKey = "") {
    try {
      const key = adminKey || (this.user && this.user.role === "admin" ? "" : "demo");
      const url = key ? `/api/admin/users?admin_key=${encodeURIComponent(key)}` : "/api/admin/users";
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.ok && Array.isArray(data.users)) {
        this.adminMembers = data.users;

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
            ? `<span class="profileRoleBadge admin">👑 최고 관리자</span>`
            : u.role === "merchant"
            ? `<span class="profileRoleBadge merchant">🏪 소상공인 점주</span>`
            : `<span class="profileRoleBadge user">🪖 일반 (병역의무자)</span>`;

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
          ? `<button type="button" class="adminLocateStoreBtn" onclick="window.MMAAuth.adminLocateFacility('${this.escapeHtml(u.merchantFacilityId)}')">📍 위치보기</button>`
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

    // 30-day Daily Chart
    if (chartContainer && stats.daily) {
      const maxPv = Math.max(...stats.daily.map((d) => d.pv), 10);
      chartContainer.innerHTML = stats.daily
        .map((d) => {
          const heightPercent = Math.max(8, Math.round((d.pv / maxPv) * 100));
          return `
            <div class="adminChartBarCol">
              <span class="adminChartBarVal">${d.pv > 0 ? d.pv : ''}</span>
              <div class="adminChartBarPv" style="height: ${heightPercent}%;"></div>
              <span class="adminChartBarLabel">${d.date}</span>
            </div>
          `;
        })
        .join("");
    }

    // Devices
    if (devContainer && stats.devices) {
      const totalDev = (stats.devices.desktop || 0) + (stats.devices.mobile || 0) + (stats.devices.tablet || 0) || 1;
      const pcPct = Math.round(((stats.devices.desktop || 0) / totalDev) * 100);
      const mobPct = Math.round(((stats.devices.mobile || 0) / totalDev) * 100);
      const tabPct = Math.round(((stats.devices.tablet || 0) / totalDev) * 100);
      devContainer.innerHTML = `
        <div class="adminPathItem"><strong>💻 PC / 데스크톱</strong><span>${stats.devices.desktop || 0}건 (${pcPct}%)</span></div>
        <div class="adminPathItem"><strong>📱 모바일 (스마트폰)</strong><span>${stats.devices.mobile || 0}건 (${mobPct}%)</span></div>
        <div class="adminPathItem"><strong>📟 태블릿</strong><span>${stats.devices.tablet || 0}건 (${tabPct}%)</span></div>
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

  async openMerchantStatsModal() {
    if (!this.user || this.user.role !== "merchant") return;
    const backdrop = document.getElementById("merchantStatsBackdrop");
    const modal = document.getElementById("merchantStatsModal");
    if (!backdrop || !modal) return;

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");

    try {
      const res = await fetch("/api/merchant/stats", {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      if (data.ok) {
        this.renderMerchantStats(data);
      }
    } catch (err) {
      addDebugLog(`[Stats Error] ${err.message}`, 'error');
    }
  },

  closeMerchantStatsModal() {
    const backdrop = document.getElementById("merchantStatsBackdrop");
    const modal = document.getElementById("merchantStatsModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
  },

  renderMerchantStats(data) {
    const storeTitle = document.getElementById("merchantStoreTitle");
    const storeCat = document.getElementById("merchantStoreCategory");
    const storeAddr = document.getElementById("merchantStoreAddress");
    const totalEl = document.getElementById("kpiTotalScans");
    const todayEl = document.getElementById("kpiTodayScans");
    const monthEl = document.getElementById("kpiMonthScans");
    const chartContainer = document.getElementById("dailyChartContainer");
    const sourceList = document.getElementById("sourceBreakdownList");

    if (storeTitle) storeTitle.textContent = data.storeName || this.user.merchantFacilityName;
    if (storeCat) storeCat.textContent = data.storeCategory || "가맹점";
    if (storeAddr) storeAddr.textContent = data.storeAddress || "대한민국";
    if (totalEl) totalEl.innerHTML = `${data.stats.totalScans}<small>회</small>`;
    if (todayEl) todayEl.innerHTML = `${data.stats.todayScans}<small>회</small>`;
    if (monthEl) monthEl.innerHTML = `${data.stats.monthScans}<small>회</small>`;

    // Render Daily Chart
    if (chartContainer && data.stats.daily) {
      const maxCount = Math.max(...data.stats.daily.map((d) => d.count), 5);
      chartContainer.innerHTML = data.stats.daily
        .map((d) => {
          const heightPercent = Math.max(8, Math.round((d.count / maxCount) * 100));
          return `
            <div class="chartBarCol">
              <span class="chartBarValue">${d.count > 0 ? d.count : ''}</span>
              <div class="chartBarFill" style="height: ${heightPercent}%;"></div>
              <span class="chartBarLabel">${d.date}</span>
            </div>
          `;
        })
        .join("");
    }

    // Render Source Breakdown
    if (sourceList && data.stats.sources) {
      const src = data.stats.sources;
      sourceList.innerHTML = `
        <div class="sourceItem">
          <strong>🖼️ A4 상생 포스터</strong>
          <span>${src.poster || 0}회</span>
        </div>
        <div class="sourceItem">
          <strong>📐 미니 테이블 스탠드</strong>
          <span>${src.table_stand || 0}회</span>
        </div>
        <div class="sourceItem">
          <strong>🚪 도어행거 (문고리형)</strong>
          <span>${src.door_hanger || 0}회</span>
        </div>
      `;
    }
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
    try {
      const res = await fetch("/api/auth/simulator_login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.ok && data.token && data.user) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem(LS_AUTH_TOKEN_KEY, this.token);
        await this.fetchMe();
        this.renderNav();
        this.closeAuthModal();

        if (type === "admin") {
          alert(`[👑 운영 관리자 체험]\n\n계정: ${data.user.nickname} (${data.user.email})\n권한: 최고 운영 관리자 (Admin)\n\n우측 상단 사람 아이콘을 클릭하여 [👑 관리자 운영 대시보드]를 열어 전체 회원 현황 및 실시간 접속 통계를 확인해 보세요!`);
        } else if (type === "merchant") {
          alert(`[🏪 소상공인 점주 체험]\n\n계정: ${data.user.nickname} (${data.user.email})\n매장: 의정부간호학원 (인증완료)\n\n지도에서 의정부간호학원 위치로 이동합니다.\n우측 상단 사람 아이콘을 클릭하여 [우리 매장 QR 통계]를 바로 확인해 보세요!`);
          if (typeof window.focusFacility === "function") {
            window.focusFacility("nara_3218");
          }
        } else {
          alert(`[🪖 병역의무자 체험]\n\n계정: ${data.user.nickname} (${data.user.email})\n권한: 일반 회원 (병역이행자)\n\n매장 찜하기(⭐), 좋아요(❤️), 회원정보 수정을 자유롭게 테스트해 보세요!`);
        }
      } else {
        alert(data.error || "시뮬레이터 로그인에 실패했습니다.");
      }
    } catch (err) {
      alert("시뮬레이터 서버 연결 중 오류가 발생했습니다.");
    }
  },

  bindEvents() {
    // Simulator Toggle
    const simToggle = document.getElementById("simToggleBtn");
    const simWidget = document.getElementById("accountSimulatorWidget");
    if (simToggle && simWidget) {
      simToggle.onclick = () => {
        simWidget.classList.toggle("collapsed");
        simToggle.textContent = simWidget.classList.contains("collapsed") ? "+" : "−";
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
            localStorage.setItem(LS_AUTH_TOKEN_KEY, this.token);
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
