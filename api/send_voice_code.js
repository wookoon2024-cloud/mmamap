// 가맹점주 ARS 인증 전화 발신 (솔라피 음성 메시지)
// 솔라피 키는 Vercel 환경변수에만 둔다: SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_FROM
const crypto = require("crypto");

const readBody = async (req) => {
  let body = req.body;
  if (!body || (typeof body === "object" && Object.keys(body).length === 0)) {
    body = await new Promise((resolve) => {
      let buf = "";
      req.on("data", (chunk) => { buf += chunk; });
      req.on("end", () => {
        try {
          resolve(JSON.parse(buf));
        } catch (_e) {
          resolve({});
        }
      });
      req.on("error", () => resolve({}));
    });
  } else if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_e) {
      body = {};
    }
  }
  return body || {};
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_FROM;
  if (!apiKey || !apiSecret || !from) {
    return res.status(500).json({ ok: false, error: "솔라피 발신 설정이 서버에 등록되지 않았습니다." });
  }

  try {
    const body = await readBody(req);
    const to = String(body.to || "").replace(/[^0-9]/g, "");
    const code = String(body.code || "");
    // 임의 문구 발송에 악용되지 않도록 4자리 인증번호 안내 문구만 서버에서 만든다.
    if (to.length < 8 || to.length > 12) {
      return res.status(400).json({ ok: false, error: "유효한 수신 전화번호가 없습니다." });
    }
    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ ok: false, error: "인증번호 형식이 올바르지 않습니다." });
    }

    const voiceDigits = code.split("").join(", ");
    const text = `안녕하세요. 군필지도 가맹점주 인증 안내입니다. 인증번호 4자리는, ${voiceDigits} 번입니다. 다시 말씀드리겠습니다. ${voiceDigits} 번입니다. 감사합니다.`;

    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString("hex");
    const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");

    const solapiRes = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: { to, from, type: "VOICE", text, voiceOptions: { voiceType: "FEMALE" } },
      }),
    });
    const data = await solapiRes.json().catch(() => ({}));
    if (!solapiRes.ok) {
      return res.status(502).json({ ok: false, error: data.errorMessage || data.message || `발송 실패 (코드: ${solapiRes.status})` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
};
