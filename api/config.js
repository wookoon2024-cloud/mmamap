// 배포 환경에서 web/config.js 대신 응답한다 (vercel.json 의 /config.js 재작성).
// 키는 저장소에 두지 않고 Vercel 환경변수에서 읽는다:
//   NAVER_MAP_KEY_ID, SUPABASE_URL, SUPABASE_ANON_KEY
module.exports = (req, res) => {
  const config = {
    naverMap: {
      keyId: process.env.NAVER_MAP_KEY_ID || "",
      clientId: process.env.NAVER_MAP_KEY_ID || "",
    },
    supabase: {
      url: process.env.SUPABASE_URL || "",
      anonKey: process.env.SUPABASE_ANON_KEY || "",
    },
  };
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(`window.APP_CONFIG = ${JSON.stringify(config)};\n`);
};
