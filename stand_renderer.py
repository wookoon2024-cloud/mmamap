import asyncio
import sqlite3
import math
import requests
import urllib3
import time
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

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

def fit_stand_audience_text(audience_text, font_path, max_width=480):
    # Try single line first
    for size in [18, 16, 14, 12]:
        font = ImageFont.truetype(font_path, size)
        w = font.getlength(audience_text)
        if w <= max_width:
            return [audience_text], font, size
    # Try wrapping to 2 lines
    for size in [16, 14, 12]:
        font = ImageFont.truetype(font_path, size)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 2:
            return lines, font, size
    # Try wrapping to 3 lines
    for size in [14, 12, 11]:
        font = ImageFont.truetype(font_path, size)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 3:
            return lines, font, size
    # Absolute fallback
    font = ImageFont.truetype(font_path, 11)
    return wrap_text_chars(audience_text, font, max_width), font, 11

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

async def capture_map(page, facility_id, port=8080):
    timestamp = int(time.time())
    url = f"http://127.0.0.1:{port}/map_only_light.html?facility_id={facility_id}&rings=0&nocache={timestamp}"
    print(f"[StandRenderer] Loading map URL: {url}")
    await page.goto(url)
    await asyncio.sleep(4) # Let tiles load fully
    
    map_locator = page.locator("#map")
    map_path = BASE_DIR / f"temp_map_stand_{facility_id}.png"
    await map_locator.screenshot(path=str(map_path))
    return map_path

def draw_table_stand(store, map_path):
    # Stand Canvas aspect ratio 10cm x 15cm (800x1200 px)
    p_width, p_height = 800, 1200
    stand = Image.new("RGBA", (p_width, p_height), "#F3F3ED")
    draw = ImageDraw.Draw(stand)
    
    font_bold_path = "C:/Users/ADMIN/.gemini/antigravity/brain/933ebf77-3826-4ebb-b31f-6a621c26fdc9/fonts/Pretendard-Bold.ttf"
    font_path = "C:/Users/ADMIN/.gemini/antigravity/brain/933ebf77-3826-4ebb-b31f-6a621c26fdc9/fonts/Pretendard-Regular.ttf"
    
    try:
        font_header_sub = ImageFont.truetype(font_bold_path, 18)
        font_header_text = ImageFont.truetype(font_bold_path, 20)
        font_title = ImageFont.truetype(font_bold_path, 44)
        font_badge_text = ImageFont.truetype(font_bold_path, 24)
        font_label = ImageFont.truetype(font_bold_path, 18)
        font_scan_title = ImageFont.truetype(font_bold_path, 14)
        font_footer = ImageFont.truetype(font_bold_path, 14)
    except IOError:
        font_path_alt = "C:/Windows/Fonts/malgun.ttf"
        font_bold_path_alt = "C:/Windows/Fonts/malgunbd.ttf"
        font_header_sub = ImageFont.truetype(font_bold_path_alt, 18)
        font_header_text = ImageFont.truetype(font_bold_path_alt, 20)
        font_title = ImageFont.truetype(font_bold_path_alt, 44)
        font_badge_text = ImageFont.truetype(font_bold_path_alt, 24)
        font_label = ImageFont.truetype(font_bold_path_alt, 18)
        font_scan_title = ImageFont.truetype(font_bold_path_alt, 14)
        font_footer = ImageFont.truetype(font_bold_path_alt, 14)

    # 1. Fold Line Guide (Top dashed line)
    for x in range(0, p_width, 15):
        draw.line([(x, 32), (x + 8, 32)], fill="#94A3B8", width=2)
    draw.text((p_width // 2, 16), "아크릴 스탠드 규격 가이드선 (10cm × 15cm)", fill="#94A3B8", font=font_footer, anchor="mm")

    # 2. Logo + Header at top
    logo_path = brain_dir / "mma_logo.png"
    if logo_path.exists():
        logo_img = Image.open(logo_path).convert("RGBA")
        logo_resized = logo_img.resize((120, 42), Image.Resampling.LANCZOS)
        logo_x = (p_width - 120) // 2
        stand.paste(logo_resized, (logo_x, 65), logo_resized)
        draw.text((p_width // 2, 125), "나라사랑가게 상생 네트워크", fill="#64748B", font=font_header_sub, anchor="mm")
    else:
        draw.text((p_width // 2, 96), "대한민국 병무청 | ★ 나라사랑가게 ★", fill="#1E3A8A", font=font_header_text, anchor="mm")

    # 3. Store Name (Centered)
    draw.text((p_width // 2, 185), store['name'], fill="#0F172A", font=font_title, anchor="mm")

    # 4. Parse Benefit and Target
    benefit_content, benefit_target, _ = parse_benefit_field(store['benefit'])

    # 5. Benefit Capsule Badge (Top blue background)
    badge_w = int(font_badge_text.getlength(benefit_content)) + 60
    badge_w = min(badge_w, 700)
    badge_h = 60
    badge_x1 = (p_width - badge_w) // 2
    badge_y1 = 225
    badge_x2 = badge_x1 + badge_w
    badge_y2 = badge_y1 + badge_h
    
    draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=30, fill="#1E3A8A")
    draw.text((p_width // 2, badge_y1 + badge_h // 2), benefit_content, fill="#FFFFFF", font=font_badge_text, anchor="mm")

    # 6. Map Section (y = 315 to 755 - Taller map!)
    if map_path.exists():
        map_img = Image.open(map_path)
        target_w, target_h = 680, 440
        resized_map = map_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        map_x1, map_y1 = 60, 315
        map_x2, map_y2 = map_x1 + target_w, map_y1 + target_h
        stand.paste(resized_map, (map_x1, map_y1))
        draw.rounded_rectangle([map_x1, map_y1, map_x2, map_y2], radius=14, outline="#D2C9BD", width=2)

    # 7. Separated Bottom Section (No card box, y = 785 to 1060)
    
    # 7-1. Left Column: Audience List
    draw.text((60, 810), "[ 우대 대상 ]", fill="#1E3A8A", font=font_label, anchor="lm")
    
    aud_lines, font_aud, aud_size = fit_stand_audience_text(benefit_target, font_path, max_width=480)
    aud_line_h = aud_size * 1.35
    total_aud_h = len(aud_lines) * aud_line_h
    start_aud_y = 845
    
    for idx, line in enumerate(aud_lines):
        y_pos = start_aud_y + idx * aud_line_h + aud_line_h / 2
        draw.text((60, y_pos), line, fill="#475569", font=font_aud, anchor="lm")

    # 7-2. Right Column: QR Code (Placed at the bottom right)
    facility_id = store['facility_id']
    landing_url = f"https://mmamap-narasarang.vercel.app/mobile_landing.html?facility_id={facility_id}"
    qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={requests.utils.quote(landing_url)}"
    
    qr_w, qr_h = 160, 160
    qr_x = 570
    qr_y = 795
    
    try:
        qr_res = requests.get(qr_api_url, verify=False, timeout=10)
        if qr_res.status_code == 200:
            qr_img = Image.open(BytesIO(qr_res.content)).convert("RGBA")
            stand.paste(qr_img, (qr_x, qr_y), qr_img)
            draw.rectangle([qr_x - 2, qr_y - 2, qr_x + qr_w + 2, qr_y + qr_h + 2], outline="#cbd5e1", width=1)
    except Exception as e:
        print("QR download failed:", e)

    # QR Scan Info Subtext
    draw.text((650, 990), "스마트폰 스캔 (상세 혜택)", fill="#1E3A8A", font=font_scan_title, anchor="mm")

    # 8. Footer Section
    addr_raw = store['address'] or "전국 매장"
    addr_clean = addr_raw.replace("시민로1255층", "시민로 125 5층")
    footer_text = f"병역이행자 여러분의 헌신에 감사드립니다  |  {addr_clean}"
    
    draw.line([(60, 1080), (740, 1080)], fill="#DFD7CB", width=2)
    draw.text((p_width // 2, 1130), footer_text, fill="#64748B", font=font_footer, anchor="mm")

    # Return bytes
    output_buf = BytesIO()
    stand.convert("RGB").save(output_buf, format="PNG")
    return output_buf.getvalue()

async def generate_stand(facility_id, port=8080):
    store = get_store_info(facility_id)
    if not store:
        raise ValueError(f"Facility {facility_id} not found in database.")
        
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Set viewport to match map screenshot aspect ratio
        await page.set_viewport_size({"width": 880, "height": 570})
        
        map_path = await capture_map(page, facility_id, port=port)
        await browser.close()
        
    try:
        img_bytes = draw_table_stand(store, map_path)
    finally:
        if map_path.exists():
            map_path.unlink()
            
    return img_bytes
