import asyncio
import json
import math
import os
import requests
import urllib3
import time
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parent

def get_font_paths():
    pretendard_bold = BASE_DIR / "fonts" / "Pretendard-Bold.otf"
    pretendard_regular = BASE_DIR / "fonts" / "Pretendard-Regular.otf"
    if pretendard_bold.exists() and pretendard_regular.exists():
        return str(pretendard_bold), str(pretendard_regular)
        
    bundled_bold = BASE_DIR / "fonts" / "font_bold.ttf"
    bundled_regular = BASE_DIR / "fonts" / "font_regular.ttf"
    if bundled_bold.exists() and bundled_regular.exists():
        return str(bundled_bold), str(bundled_regular)
        
    for b_path, r_path in [
        ("/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf", "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"),
        ("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        ("C:/Windows/Fonts/malgunbd.ttf", "C:/Windows/Fonts/malgun.ttf")
    ]:
        if Path(b_path).exists():
            return b_path, r_path
            
    return None, None

def get_font(font_path, size, is_bold=False):
    if font_path:
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            pass
    b_path, r_path = get_font_paths()
    p = b_path if is_bold else r_path
    if p:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

def wrap_text_chars(text, font, max_width):
    lines = []
    current_line = ""
    for char in text:
        test_line = current_line + char
        try:
            w = font.getlength(test_line)
        except Exception:
            w = len(test_line) * 10
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
    for size in [18, 16, 14, 12]:
        font = get_font(font_path, size, is_bold=False)
        try:
            w = font.getlength(audience_text)
        except Exception:
            w = len(audience_text) * 10
        if w <= max_width:
            return [audience_text], font, size
    for size in [16, 14, 12]:
        font = get_font(font_path, size, is_bold=False)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 2:
            return lines, font, size
    for size in [14, 12, 11]:
        font = get_font(font_path, size, is_bold=False)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 3:
            return lines, font, size
    font = get_font(font_path, 11, is_bold=False)
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
    json_path = BASE_DIR / "web" / "data" / "benefits_map.json"
    if not json_path.exists():
        json_path = BASE_DIR / "data" / "benefits_map.json"
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    facilities = data.get("facilities", [])
    for f in facilities:
        fid = f.get("facility_id") or f.get("id") or ""
        if str(fid) == str(facility_id) or str(facility_id) in str(fid):
            aud = f.get("audiences") or []
            aud_text = ", ".join(aud) if isinstance(aud, list) else str(aud)
            return {
                "facility_id": str(fid),
                "name": f.get("name") or "나라사랑가게",
                "benefit": f.get("benefit") or "병역이행자 및 병역명문가 할인 우대",
                "audience_text": aud_text or "나라사랑카드 소지 장병 및 예비군",
                "address": f.get("address") or ""
            }
    if facilities:
        f = facilities[0]
        return {
            "facility_id": str(f.get("facility_id") or "store"),
            "name": f.get("name") or "나라사랑가게",
            "benefit": f.get("benefit") or "병역이행자 및 병역명문가 할인 우대",
            "audience_text": "나라사랑카드 소지 장병 및 예비군",
            "address": f.get("address") or ""
        }
    return {
        "facility_id": str(facility_id),
        "name": "나라사랑가게",
        "benefit": "병역이행자 및 병역명문가 할인 우대",
        "audience_text": "나라사랑카드 소지 장병 및 예비군",
        "address": "전국 매장"
    }

async def capture_map(page, facility_id, port=8080):
    timestamp = int(time.time())
    url = f"http://127.0.0.1:{port}/map_only_light.html?facility_id={facility_id}&rings=0&nocache={timestamp}"
    print(f"[StandRenderer] Loading map URL: {url}")
    try:
        await page.goto(url, wait_until="networkidle", timeout=10000)
    except Exception as e:
        print(f"[StandRenderer] Warning on page.goto: {e}")
    await asyncio.sleep(2)
    
    map_locator = page.locator("#map")
    map_path = BASE_DIR / f"temp_map_stand_{facility_id}.png"
    try:
        await map_locator.screenshot(path=str(map_path), timeout=5000)
    except Exception as e:
        print(f"[StandRenderer] Locator screenshot failed: {e}")
        await page.screenshot(path=str(map_path))
    return map_path

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = (lon_deg + 180.0) / 360.0 * n
    ytile = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    return xtile, ytile

def create_stylized_pillow_map(store, width=680, height=440):
    lat = store.get("lat") or 37.5665
    lng = store.get("lng") or 126.9780
    zoom = 16

    font_bold_path, font_reg_path = get_font_paths()

    # 1. Fetch real map tile stitch
    center_x, center_y = deg2num(lat, lng, zoom)
    tile_size = 256
    min_tx = int(center_x) - 2
    max_tx = int(center_x) + 2
    min_ty = int(center_y) - 1
    max_ty = int(center_y) + 1
    
    stitched_w = (max_tx - min_tx + 1) * tile_size
    stitched_h = (max_ty - min_ty + 1) * tile_size
    canvas = Image.new("RGBA", (stitched_w, stitched_h), "#F1F5F9")
    
    headers = {"User-Agent": "MMAMapApp/1.0 (https://mmamap-seven.vercel.app; contact@mmamap.org)"}
    
    for tx in range(min_tx, max_tx + 1):
        for ty in range(min_ty, max_ty + 1):
            url = f"https://tile.openstreetmap.org/{zoom}/{tx}/{ty}.png"
            try:
                r = requests.get(url, headers=headers, verify=False, timeout=1.5)
                if r.status_code == 200:
                    tile_img = Image.open(BytesIO(r.content)).convert("RGBA")
                    px = (tx - min_tx) * tile_size
                    py = (ty - min_ty) * tile_size
                    canvas.paste(tile_img, (px, py))
            except Exception:
                pass
                
    cx_px = int((center_x - min_tx) * tile_size)
    cy_px = int((center_y - min_ty) * tile_size)
    
    crop_x1 = max(0, cx_px - width // 2)
    crop_y1 = max(0, cy_px - height // 2)
    img = canvas.crop((crop_x1, crop_y1, crop_x1 + width, crop_y1 + height))
    
    overlay = Image.new("RGBA", (width, height), (255, 255, 255, 25))
    img.paste(overlay, (0, 0), overlay)
    
    draw = ImageDraw.Draw(img)
    cx, cy = width // 2, height // 2

    # Radius rings
    draw.ellipse([cx - 160, cy - 110, cx + 160, cy + 110], outline="#3B82F6", width=2)
    draw.ellipse([cx - 80, cy - 55, cx + 80, cy + 55], outline="#2563EB", width=2)
    draw.text((cx + 85, cy - 55), "500m", fill="#1D4ED8", font=get_font(font_bold_path, 11, True))

    # Center Pin
    draw.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=(239, 68, 68, 70))
    draw.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill="#DC2626", outline="#FFFFFF", width=3)
    draw.text((cx, cy), "★", fill="#FFFFFF", font=get_font(font_bold_path, 14, True), anchor="mm")

    # Center Title Pill
    title = store.get("name") or "본 매장"
    pill_w = max(160, len(title) * 15 + 36)
    pill_h = 32
    px1 = cx - pill_w // 2
    py1 = cy - 52
    draw.rounded_rectangle([px1, py1, px1 + pill_w, py1 + pill_h], radius=8, fill="#1E3A8A", outline="#FFFFFF", width=2)
    draw.text((cx, py1 + pill_h // 2), title, fill="#FFFFFF", font=get_font(font_bold_path, 13, True), anchor="mm")

    # Bottom notice bar
    draw.rounded_rectangle([15, height - 36, width - 15, height - 10], radius=6, fill=(255, 255, 255, 240), outline="#CBD5E1", width=1)
    draw.text((width // 2, height - 23), "QR 스캔 시 스마트폰에서 실시간 상생지도가 열립니다.", fill="#334155", font=get_font(font_bold_path, 12, True), anchor="mm")

    return img

def draw_table_stand(store, map_path=None):
    p_width, p_height = 800, 1200
    stand = Image.new("RGBA", (p_width, p_height), "#F3F3ED")
    draw = ImageDraw.Draw(stand)
    
    font_bold_path, font_path = get_font_paths()
    
    font_header_sub = get_font(font_bold_path, 18, is_bold=True)
    font_header_text = get_font(font_bold_path, 20, is_bold=True)
    font_title = get_font(font_bold_path, 44, is_bold=True)
    font_badge_text = get_font(font_bold_path, 24, is_bold=True)
    font_label = get_font(font_bold_path, 18, is_bold=True)
    font_scan_title = get_font(font_bold_path, 14, is_bold=True)
    font_footer = get_font(font_bold_path, 14, is_bold=True)

    # 1. Fold Line Guide (Top dashed line)
    for x in range(0, p_width, 15):
        draw.line([(x, 32), (x + 8, 32)], fill="#94A3B8", width=2)
    draw.text((p_width // 2, 16), "아크릴 스탠드 규격 가이드선 (10cm × 15cm)", fill="#94A3B8", font=font_footer, anchor="mm")

    # 2. Header Logo & text
    logo_path = BASE_DIR / "web" / "img" / "mma_logo.png"
    if not logo_path.exists():
        logo_path = BASE_DIR / "img" / "mma_logo.png"
    if logo_path.exists():
        try:
            logo_img = Image.open(logo_path).convert("RGBA")
            logo_resized = logo_img.resize((120, 42), Image.Resampling.LANCZOS)
            stand.paste(logo_resized, ((p_width - 120) // 2, 48), logo_resized)
        except Exception as e:
            print("Logo paste error:", e)
            draw.text((p_width // 2, 68), "대한민국 병무청", fill="#1E3A8A", font=font_header_text, anchor="mm")
    else:
        draw.text((p_width // 2, 68), "대한민국 병무청", fill="#1E3A8A", font=font_header_text, anchor="mm")

    draw.text((p_width // 2, 106), "나라사랑가게 상생 네트워크", fill="#1E3A8A", font=font_header_text, anchor="mm")

    # 3. Store Name (Centered)
    draw.text((p_width // 2, 185), store['name'], fill="#0F172A", font=font_title, anchor="mm")

    # 4. Parse Benefit and Target
    benefit_content, benefit_target, _ = parse_benefit_field(store['benefit'])

    # 5. Benefit Capsule Badge (Top blue background)
    try:
        w_text = font_badge_text.getlength(benefit_content)
    except Exception:
        w_text = len(benefit_content) * 15
    badge_w = int(w_text) + 60
    badge_w = min(badge_w, 700)
    badge_h = 60
    badge_x1 = (p_width - badge_w) // 2
    badge_y1 = 225
    badge_x2 = badge_x1 + badge_w
    badge_y2 = badge_y1 + badge_h
    
    draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=30, fill="#1E3A8A")
    draw.text((p_width // 2, badge_y1 + badge_h // 2), benefit_content, fill="#FFFFFF", font=font_badge_text, anchor="mm")

    # 6. Map Section (y = 315 to 755)
    if map_path and Path(map_path).exists():
        try:
            map_img = Image.open(map_path)
            target_w, target_h = 680, 440
            resized_map = map_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            map_x1, map_y1 = 60, 315
            map_x2, map_y2 = map_x1 + target_w, map_y1 + target_h
            stand.paste(resized_map, (map_x1, map_y1))
            draw.rounded_rectangle([map_x1, map_y1, map_x2, map_y2], radius=14, outline="#D2C9BD", width=2)
        except Exception as e:
            print("Stand map paste error:", e)
    else:
        styled_map = create_stylized_pillow_map(store, width=680, height=440)
        map_x1, map_y1 = 60, 315
        map_x2, map_y2 = map_x1 + 680, map_y1 + 440
        stand.paste(styled_map, (map_x1, map_y1))
        draw.rounded_rectangle([map_x1, map_y1, map_x2, map_y2], radius=14, outline="#D2C9BD", width=2)

    # 7. Bottom Section
    draw.text((60, 810), "[ 우대 대상 ]", fill="#1E3A8A", font=font_label, anchor="lm")
    
    aud_lines, font_aud, aud_size = fit_stand_audience_text(benefit_target, font_path, max_width=480)
    aud_line_h = aud_size * 1.35
    start_aud_y = 845
    
    for idx, line in enumerate(aud_lines):
        y_pos = start_aud_y + idx * aud_line_h + aud_line_h / 2
        draw.text((60, y_pos), line, fill="#475569", font=font_aud, anchor="lm")

    # QR Code
    facility_id = store['facility_id']
    landing_url = f"https://mmamap-seven.vercel.app/mobile_landing.html?id={facility_id}"
    qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={requests.utils.quote(landing_url)}"
    
    qr_w, qr_h = 160, 160
    qr_x = 570
    qr_y = 795
    
    try:
        qr_res = requests.get(qr_api_url, verify=False, timeout=5)
        if qr_res.status_code == 200:
            qr_img = Image.open(BytesIO(qr_res.content)).convert("RGBA")
            stand.paste(qr_img, (qr_x, qr_y), qr_img)
            draw.rectangle([qr_x - 2, qr_y - 2, qr_x + qr_w + 2, qr_y + qr_h + 2], outline="#cbd5e1", width=1)
    except Exception as e:
        print("QR download failed:", e)

    draw.text((650, 990), "스마트폰 스캔 (상세 혜택)", fill="#1E3A8A", font=font_scan_title, anchor="mm")

    # 8. Footer Section
    addr_raw = store.get('address') or "전국 매장"
    footer_text = f"병역이행자 여러분의 헌신에 감사드립니다  |  {addr_raw}"
    
    draw.line([(60, 1080), (740, 1080)], fill="#DFD7CB", width=2)
    draw.text((p_width // 2, 1130), footer_text, fill="#64748B", font=font_footer, anchor="mm")

    output_buf = BytesIO()
    stand.convert("RGB").save(output_buf, format="PNG")
    return output_buf.getvalue()

def generate_stand(facility_id, port=None):
    store = get_store_info(facility_id)
    if not store:
        raise ValueError(f"Facility {facility_id} not found.")
    return draw_table_stand(store, map_path=None)
