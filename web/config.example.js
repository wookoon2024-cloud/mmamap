// web/config.js 형식 예시. 실제 값은 web/config.js(로컬, git 제외) 또는 Vercel 환경변수에 넣는다.
window.APP_CONFIG = {
  naverMap: {
    keyId: "NAVER_MAP_KEY_ID",
    clientId: "NAVER_MAP_KEY_ID",
  },
  supabase: {
    url: "https://your-supabase-url",
    anonKey: "sb_publishable_xxx",
  },
};
