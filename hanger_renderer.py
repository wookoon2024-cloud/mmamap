import sqlite3
import math
import requests
import urllib3
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parent
db_path = BASE_DIR / "outputs" / "military_benefits.db"
brain_dir = Path("C:/Users/ADMIN/.gemini/antigravity/brain/933ebf77-3826-4ebb-b31f-6a621c26fdc9")

def wrap_text_chars(text, font, max_width):
    lines = []
    current_line = ""
    for char in text:
        test_line = current_line + char
        w = font.getlength(test_line)
        if w <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = char
    if current_line:
        lines.append(current_line)
    return lines

def fit_hanger_audience_text(audience_text, font_path, max_width=480):
    # Try single line first
    for size in [16, 14, 12]:
        font = ImageFont.truetype(font_path, size)
        w = font.getlength(audience_text)
        if w <= max_width:
            return [audience_text], font, size
    # Try wrapping to 2 lines
    for size in [14, 12, 11]:
        font = ImageFont.truetype(font_path, size)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 2:
            return lines, font, size
    # Try wrapping to 3 lines
    for size in [12, 11, 10]:
        font = ImageFont.truetype(font_path, size)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 3:
            return lines, font, size
    # Absolute fallback
    font = ImageFont.truetype(font_path, 10)
    return wrap_text_chars(audience_text, font, max_width), font, 10

def parse_benefit_field(benefit_raw):
    if not benefit_raw:
        return "혜택 정보 없음", "나라사랑카드 소지 장병 및 예비군", ""
        
    text = benefit_raw.replace("<br/>", "<br>").replace("<br >", "<br>").replace("\n", "<br>")
    parts = [p.strip() for p in text.split("<br>") if p.strip()]
    
    benefit_content = parts[0] if len(parts) > 0 else "혜택 정보 없음"
    
    benefit_target = ""
    proof = ""
    
    for p in parts[1:]:
        if "우대대상" in p or "우대 대상" in p:
            target_part = p
            for prefix in ["세부 우대대상", "세부 우대 대상", "우대대상", "우대 대상"]:
                target_part = target_part.replace(prefix, "")
            target_part = target_part.strip(" :")
            benefit_target = target_part
        elif "증빙자료" in p or "증빙 자료" in p:
            proof_part = p
            for prefix in ["세부 증빙자료", "세부 증빙 자료", "증빙자료", "증빙 자료"]:
                proof_part = proof_part.replace(prefix, "")
            proof_part = proof_part.strip(" :")
            proof = proof_part
            
    if not benefit_target:
        benefit_target = "나라사랑카드 소지 장병 및 예비군"
        
    return benefit_content, benefit_target, proof

def get_store_info(facility_id):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT facility_id, name, benefit, audience_text, address
        FROM facilities
        WHERE facility_id = ?
    """, (facility_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def draw_door_hanger(store):
    # Hanger Canvas aspect ratio (600x1100 px)
    p_width, p_height = 600, 1100
    hanger = Image.new("RGBA", (p_width, p_height), "#F3F3ED")
    draw = ImageDraw.Draw(hanger)
    
    font_bold_path = "C:/Users/ADMIN/.gemini/antigravity/brain/933ebf77-3826-4ebb-b31f-6a621c26fdc9/fonts/Pretendard-Bold.ttf"
    font_path = "C:/Users/ADMIN/.gemini/antigravity/brain/933ebf77-3826-4ebb-b31f-6a621c26fdc9/fonts/Pretendard-Regular.ttf"
    
    try:
        font_header_sub = ImageFont.truetype(font_bold_path, 16)
        font_welcome = ImageFont.truetype(font_bold_path, 22)
        font_title = ImageFont.truetype(font_bold_path, 36)
        font_badge_text = ImageFont.truetype(font_bold_path, 18)
        font_label = ImageFont.truetype(font_bold_path, 14)
        font_scan_title = ImageFont.truetype(font_bold_path, 13)
        font_footer = ImageFont.truetype(font_bold_path, 12)
    except IOError:
        font_path_alt = "C:/Windows/Fonts/malgun.ttf"
        font_bold_path_alt = "C:/Windows/Fonts/malgunbd.ttf"
        font_header_sub = ImageFont.truetype(font_bold_path_alt, 16)
        font_welcome = ImageFont.truetype(font_bold_path_alt, 22)
        font_title = ImageFont.truetype(font_bold_path_alt, 36)
        font_badge_text = ImageFont.truetype(font_bold_path_alt, 18)
        font_label = ImageFont.truetype(font_bold_path_alt, 14)
        font_scan_title = ImageFont.truetype(font_bold_path_alt, 13)
        font_footer = ImageFont.truetype(font_bold_path_alt, 12)

    # 1. Door Hanger Hole
    hole_cx, hole_cy, hole_r = 300, 150, 80
    # Draw dashed circle
    draw.ellipse([hole_cx - hole_r, hole_cy - hole_r, hole_cx + hole_r, hole_cy + hole_r], outline="#64748B", width=2)
    # Draw cut slit
    for y in range(0, hole_cy - hole_r, 10):
         draw.line([(hole_cx, y), (hole_cx, y + 6)], fill="#64748B", width=2)
    draw.text((hole_cx, hole_cy + hole_r + 20), "문고리 거치선 (지름 8cm)", fill="#64748B", font=font_footer, anchor="mm")

    # 2. Logo + Header
    logo_path = brain_dir / "mma_logo.png"
    if logo_path.exists():
        logo_img = Image.open(logo_path).convert("RGBA")
        logo_resized = logo_img.resize((100, 35), Image.Resampling.LANCZOS)
        logo_x = (p_width - 100) // 2
        hanger.paste(logo_resized, (logo_x, 280), logo_resized)
        draw.text((p_width // 2, 330), "나라사랑가게", fill="#1E3A8A", font=font_header_sub, anchor="mm")
    else:
        draw.text((p_width // 2, 330), "대한민국 병무청 | 나라사랑가게", fill="#1E3A8A", font=font_header_sub, anchor="mm")

    # 3. Welcome + Store Name
    draw.text((p_width // 2, 380), "환영합니다", fill="#64748B", font=font_welcome, anchor="mm")
    draw.text((p_width // 2, 430), store['name'], fill="#0F172A", font=font_title, anchor="mm")

    # 4. Parse Benefit
    benefit_content, benefit_target, _ = parse_benefit_field(store['benefit'])

    # 5. Benefit Capsule Badge
    badge_w = int(font_badge_text.getlength(benefit_content)) + 40
    badge_w = min(badge_w, 520)
    badge_h = 50
    badge_x1 = (p_width - badge_w) // 2
    badge_y1 = 485
    badge_x2 = badge_x1 + badge_w
    badge_y2 = badge_y1 + badge_h
    
    draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=25, fill="#1E3A8A")
    draw.text((p_width // 2, badge_y1 + badge_h // 2), benefit_content, fill="#FFFFFF", font=font_badge_text, anchor="mm")

    # 6. Audience Section
    draw.text((p_width // 2, 570), "[ 우대 대상 ]", fill="#1E3A8A", font=font_label, anchor="mm")
    
    aud_lines, font_aud, aud_size = fit_hanger_audience_text(benefit_target, font_path, max_width=480)
    aud_line_h = aud_size * 1.35
    total_aud_h = len(aud_lines) * aud_line_h
    start_aud_y = 605
    
    for idx, line in enumerate(aud_lines):
        y_pos = start_aud_y + idx * aud_line_h + aud_line_h / 2
        draw.text((p_width // 2, y_pos), line, fill="#475569", font=font_aud, anchor="mm")

    # 7. QR Code Card Section
    qr_card_x1, qr_card_y1, qr_card_x2, qr_card_y2 = 160, 715, 440, 985
    draw.rounded_rectangle([qr_card_x1, qr_card_y1, qr_card_x2, qr_card_y2], radius=16, fill="#FFFFFF", outline="#E2E8F0", width=2)
    
    # QR Image
    facility_id = store['facility_id']
    landing_url = f"https://mmamap-narasarang.vercel.app/mobile_landing.html?facility_id={facility_id}"
    qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={requests.utils.quote(landing_url)}"
    
    qr_w, qr_h = 160, 160
    qr_x = 220
    qr_y = 740
    
    try:
        qr_res = requests.get(qr_api_url, verify=False, timeout=10)
        if qr_res.status_code == 200:
            qr_img = Image.open(BytesIO(qr_res.content)).convert("RGBA")
            hanger.paste(qr_img, (qr_x, qr_y), qr_img)
            draw.rectangle([qr_x - 2, qr_y - 2, qr_x + qr_w + 2, qr_y + qr_h + 2], outline="#cbd5e1", width=1)
    except Exception as e:
        print("QR download failed:", e)

    # QR Scan Info Subtext
    draw.text((300, 945), "스마트폰 스캔 (상세 혜택)", fill="#1E3A8A", font=font_scan_title, anchor="mm")

    # 8. Footer Section
    footer_text = "대한민국 병무청 × 나라사랑가게 네트워크"
    draw.line([(50, 1010), (550, 1010)], fill="#DFD7CB", width=2)
    draw.text((p_width // 2, 1050), footer_text, fill="#64748B", font=font_footer, anchor="mm")

    # Return bytes
    output_buf = BytesIO()
    hanger.convert("RGB").save(output_buf, format="PNG")
    return output_buf.getvalue()
