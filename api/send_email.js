module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "resend_mailer", status: "online" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
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
      } catch (_e) {}
    }

    const to = String(body.to || body.email || "").trim();
    const code = String(body.code || "").trim();

    if (!to || !code) {
      return res.status(400).json({ ok: false, error: "이메일(to)과 인증번호(code)가 필요합니다." });
    }

    const apiKey = process.env.RESEND_API_KEY || Buffer.from("cmVfMjZlckFGU0NfSGVydkpIUFg4YmNKVEV1M2lXZEhGckVH", "base64").toString();

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: to,
        subject: "[군필지도] 회원가입 이메일 인증번호 안내",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 20px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px;">
              <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">🎖️ 군필지도 (MMAMAP) 이메일 인증</h2>
            </div>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              안녕하세요! 군필지도 회원가입을 위한 인증번호 안내드립니다.<br>
              아래의 <strong>6자리 인증번호</strong>를 화면에 입력해 주세요.
            </p>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 8px;">
              • 본 인증번호는 발송 후 10분간 유효합니다.<br>
              • 본인이 인증을 요청하지 않으셨다면 본 메일을 무시하셔도 됩니다.
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              국군장병 복지·우대 혜택 플랫폼 - 군필지도 (MMAMAP)
            </p>
          </div>
        `,
      }),
    });

    const data = await emailResponse.json().catch(() => ({}));

    if (!emailResponse.ok) {
      return res.status(emailResponse.status).json({
        ok: false,
        error: data.message || "Resend 발송 실패",
        details: data,
      });
    }

    return res.status(200).json({
      ok: true,
      id: data.id,
      to: to,
      message: "Resend 인증메일 발송 완료",
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};