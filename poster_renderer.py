import asyncio
import json
import math
import requests
import urllib3
import time
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parent

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_font_paths():
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

def fit_benefit_text(benefit_text, bold_font_path, max_width=800):
    clean_text = benefit_text.replace("<br/>", " ").replace("<br>", " ").replace("<br >", " ").replace("\n", " ").strip()
    sizes = [28, 24, 20, 16, 14]
    for size in sizes:
        font = get_font(bold_font_path, size, is_bold=True)
        lines = wrap_text_chars(clean_text, font, max_width)
        if size == 28 and len(lines) == 1:
            return lines, font, size
        elif size == 24 and len(lines) <= 2:
            return lines, font, size
        elif size == 20 and len(lines) <= 3:
            return lines, font, size
        elif size == 16 and len(lines) <= 3:
            return lines, font, size
        elif size == 14:
            return lines, font, size
    font = get_font(bold_font_path, 14, is_bold=True)
    return wrap_text_chars(clean_text, font, max_width), font, 14

def fit_audience_text(audience_text, font_path, max_width=800):
    clean_text = f"우대 대상 : {audience_text.replace('<br>', ' ').replace('<br/>', ' ').replace('\n', ' ').strip()}"
    for size in [20, 18, 16, 14]:
        font = get_font(font_path, size, is_bold=False)
        try:
            w = font.getlength(clean_text)
        except Exception:
            w = len(clean_text) * 10
        if w <= max_width:
            return [clean_text], font, size
    for size in [18, 16, 14, 12]:
        font = get_font(font_path, size, is_bold=False)
        lines = wrap_text_chars(clean_text, font, max_width)
        if len(lines) <= 2:
            return lines, font, size
    font = get_font(font_path, 12, is_bold=False)
    return wrap_text_chars(clean_text, font, max_width), font, 12

def get_store_and_neighbors(facility_id):
    json_path = BASE_DIR / "web" / "data" / "benefits_map.json"
    if not json_path.exists():
        json_path = BASE_DIR / "data" / "benefits_map.json"
        
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print("[PosterRenderer] Failed to load JSON:", e)
        data = {}
        
    facilities = data.get("facilities", [])
    all_stores = []
    for f in facilities:
        fid = f.get("facility_id") or f.get("id") or ""
        lat = f.get("lat")
        lng = f.get("lng")
        aud = f.get("audiences") or []
        aud_text = ", ".join(aud) if isinstance(aud, list) else str(aud)
        all_stores.append({
            "facility_id": str(fid),
            "name": f.get("name") or "나라사랑가게",
            "benefit": f.get("benefit") or "병역이행자 및 병역명문가 할인 우대",
            "audience_text": aud_text or "나라사랑카드 소지 장병 및 예비군",
            "lat": float(lat) if lat is not None else 37.5665,
            "lng": float(lng) if lng is not None else 126.9780,
            "address": f.get("address") or ""
        })
        
    target = next((s for s in all_stores if s['facility_id'] == str(facility_id)), None)
    if not target:
        target = next((s for s in all_stores if str(facility_id) in s['facility_id']), None)
    if not target:
        target = next((s for s in all_stores if s['name'] == str(facility_id)), None)
    if not target and all_stores:
        target = all_stores[0]
    if not target:
        target = {
            "facility_id": str(facility_id),
            "name": "나라사랑가게",
            "benefit": "병역이행자 및 병역명문가 할인 우대",
            "audience_text": "나라사랑카드 소지 장병 및 예비군",
            "lat": 37.5665,
            "lng": 126.9780,
            "address": "전국 매장"
        }
        
    neighbors = []
    for other in all_stores:
        if other['facility_id'] == target['facility_id']:
            continue
        try:
            d = haversine(target['lat'], target['lng'], other['lat'], other['lng'])
            neighbors.append((other, d))
        except Exception:
            pass
        
    neighbors.sort(key=lambda x: x[1])
    return target, neighbors[:5]

async def capture_map(page, facility_id, port=8080):
    timestamp = int(time.time())
    url = f"http://127.0.0.1:{port}/map_only_light.html?facility_id={facility_id}&rings=0&nocache={timestamp}"
    print(f"[PosterRenderer] Loading map URL: {url}")
    try:
        await page.goto(url, wait_until="networkidle", timeout=10000)
    except Exception as e:
        print(f"[PosterRenderer] Warning on page.goto: {e}")
    await asyncio.sleep(2)
    
    map_locator = page.locator("#map")
    map_path = BASE_DIR / f"temp_map_poster_{facility_id}.png"
    try:
        await map_locator.screenshot(path=str(map_path), timeout=5000)
    except Exception as e:
        print(f"[PosterRenderer] Locator screenshot failed, taking full page: {e}")
        await page.screenshot(path=str(map_path))
    return map_path

def draw_poster(store, neighbors, map_path):
    p_width, p_height = 1000, 1414
    pamphlet = Image.new("RGBA", (p_width, p_height), "#F3F3ED")
    draw = ImageDraw.Draw(pamphlet)
    
    font_bold_path, font_path = get_font_paths()
    
    font_title = get_font(font_bold_path, 42, is_bold=True)
    font_store_title = get_font(font_bold_path, 36, is_bold=True)
    font_section = get_font(font_bold_path, 30, is_bold=True)
    font_table_header = get_font(font_bold_path, 20, is_bold=True)
    font_body_bold = get_font(font_bold_path, 18, is_bold=True)
    font_body = get_font(font_path, 18, is_bold=False)
    font_mini = get_font(font_bold_path, 14, is_bold=True)

    # Logo
    logo_path = BASE_DIR / "web" / "img" / "mma_logo.png"
    if not logo_path.exists():
        logo_path = BASE_DIR / "img" / "mma_logo.png"
    if logo_path.exists():
        try:
            logo_img = Image.open(logo_path).convert("RGBA")
            logo_resized = logo_img.resize((150, 52), Image.Resampling.LANCZOS)
            pamphlet.paste(logo_resized, (70, 52), logo_resized)
        except Exception as e:
            print("Logo paste error:", e)

    # Title centered
    draw.text((p_width // 2, 78), "나라사랑가게 상생 지도", fill="#1E1E1E", font=font_title, anchor="mm")
    
    # White Card (with shadow)
    card_x1, card_y1, card_x2, card_y2 = 60, 120, 940, 320
    
    shadow_layer = Image.new("RGBA", (p_width, p_height), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_draw.rounded_rectangle([58, 122, 942, 322], radius=22, fill=(0, 0, 0, 15))
    pamphlet.paste(shadow_layer, (0, 0), shadow_layer)
    
    card_layer = Image.new("RGBA", (p_width, p_height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    card_draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=20, fill=(255, 255, 255, 255))
    card_draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=20, outline=(222, 215, 203, 255), width=2)
    pamphlet.paste(card_layer, (0, 0), card_layer)
    
    # Store Name
    draw.text((p_width // 2, 165), store['name'], fill="#1E1E1E", font=font_store_title, anchor="mm")
    
    # Benefit Text Auto-scaling
    benefit_text = store['benefit'] or ""
    lines, font_benefit, font_size = fit_benefit_text(benefit_text, font_bold_path, max_width=800)
    
    line_h = font_size * 1.3
    total_h = len(lines) * line_h
    start_y = 220 - total_h / 2
    
    for idx, line in enumerate(lines):
        y_pos = start_y + idx * line_h + line_h / 2
        draw.text((p_width // 2, y_pos), line, fill="#9C8262", font=font_benefit, anchor="mm")
        
    # Target Audience
    audience_text = store['audience_text'] or "나라사랑카드 소지 장병 및 예비군"
    aud_lines, font_aud, aud_size = fit_audience_text(audience_text, font_path, max_width=800)
    aud_line_h = aud_size * 1.35
    
    if len(aud_lines) == 1:
        draw.text((p_width // 2, 270), aud_lines[0], fill="#64748B", font=font_aud, anchor="mm")
    else:
        y1 = 270 - aud_line_h / 2
        y2 = 270 + aud_line_h / 2
        draw.text((p_width // 2, y1), aud_lines[0], fill="#64748B", font=font_aud, anchor="mm")
        draw.text((p_width // 2, y2), aud_lines[1], fill="#64748B", font=font_aud, anchor="mm")
    
    # Map
    if map_path and Path(map_path).exists():
        try:
            map_img = Image.open(map_path)
            target_w, target_h = 880, 550
            resized_map = map_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            map_x1, map_y1 = 60, 350
            map_x2, map_y2 = map_x1 + target_w, map_y1 + target_h
            pamphlet.paste(resized_map, (map_x1, map_y1))
            draw.rounded_rectangle([map_x1, map_y1, map_x2, map_y2], radius=14, outline="#D2C9BD", width=2)
        except Exception as e:
            print("Map paste error:", e)
    else:
        # Fallback map box
        draw.rounded_rectangle([60, 350, 940, 900], radius=14, fill="#E2E8F0", outline="#CBD5E1", width=2)
        draw.text((500, 625), f"위치: {store.get('address', '가맹점 위치')}", fill="#475569", font=font_body_bold, anchor="mm")
        
    # Neighbors Table
    draw.text((60, 930), "주변 나라사랑가게", fill="#1E1E1E", font=font_section)
    
    table_y = 970
    num_rows = len(neighbors)
    row_h = 46 if num_rows > 4 else 60
    header_h = 40 if num_rows > 4 else 44
    
    draw.rectangle([60, table_y, 940, table_y + header_h], fill="#DFD7CB")
    draw.text((190, table_y + header_h // 2), "이름", fill="#1E1E1E", font=font_table_header, anchor="mm")
    draw.text((475, table_y + header_h // 2), "할인 혜택", fill="#1E1E1E", font=font_table_header, anchor="mm")
    draw.text((785, table_y + header_h // 2), "우대 대상", fill="#1E1E1E", font=font_table_header, anchor="mm")
    
    def draw_table_row(draw_obj, num, name, benefit, audience, y):
        bg_color = (249, 248, 246, 255) if num % 2 == 0 else (255, 255, 255, 255)
        row_layer = Image.new("RGBA", (p_width, p_height), (0, 0, 0, 0))
        row_draw = ImageDraw.Draw(row_layer)
        row_draw.rectangle([60, y, 940, y + row_h], fill=bg_color)
        row_draw.line([(60, y), (940, y)], fill=(226, 222, 214, 255), width=1)
        pamphlet.paste(row_layer, (0, 0), row_layer)
        
        badge_offset = (row_h - 28) // 2
        badge_x, badge_y = 80, y + badge_offset
        draw_obj.ellipse([badge_x, badge_y, badge_x + 28, badge_y + 28], fill="#7E8F9A")
        draw_obj.text((badge_x + 14, badge_y + 14), str(num), fill="#FFFFFF", font=font_mini, anchor="mm")
        
        n_name = name if len(name) <= 18 else name[:16] + "..."
        n_benefit = benefit if len(benefit) <= 22 else benefit[:20] + "..."
        n_audience = audience if len(audience) <= 20 else audience[:18] + "..."
        
        draw_obj.text((125, y + row_h // 2), n_name, fill="#1E1E1E", font=font_body_bold, anchor="lm")
        draw_obj.text((475, y + row_h // 2), n_benefit, fill="#1E1E1E", font=font_body, anchor="mm")
        draw_obj.text((785, y + row_h // 2), n_audience, fill="#475569", font=font_body, anchor="mm")

    curr_y = table_y + header_h
    for idx, (n_item, dist) in enumerate(neighbors, 1):
        n_name = n_item['name']
        n_benefit = (n_item['benefit'] or "").replace("<br>", " ").replace("<br/>", " ").split("\n")[0]
        n_audience = (n_item['audience_text'] or "장병 및 예비군").replace("<br>", " ").split("\n")[0]
        draw_table_row(draw, idx, n_name, n_benefit, n_audience, curr_y)
        curr_y += row_h
        
    draw.line([(60, curr_y), (940, curr_y)], fill="#DFD7CB", width=3)
    
    # Footer QR Code
    facility_id = store['facility_id']
    landing_url = f"https://mmamap-seven.vercel.app/mobile_landing.html?id={facility_id}"
    qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=100x100&data={requests.utils.quote(landing_url)}"
    
    try:
        qr_res = requests.get(qr_api_url, verify=False, timeout=5)
        if qr_res.status_code == 200:
            qr_img = Image.open(BytesIO(qr_res.content)).convert("RGBA")
            qr_x, qr_y = 840, 1290
            pamphlet.paste(qr_img, (qr_x, qr_y), qr_img)
            draw.rectangle([qr_x - 2, qr_y - 2, qr_x + 102, qr_y + 102], outline="#cbd5e1", width=1)
    except Exception as e:
        print("QR download failed:", e)
        
    # Footer texts
    draw.text((60, 1305), "스마트폰으로 QR 코드를 스캔해 보세요!", fill="#1E1E1E", font=font_body_bold)
    draw.text((60, 1340), "나라사랑가게의 정의와 병무청 공식 우대 혜택을 모바일로 바로 확인할 수 있습니다.", fill="#64748B", font=font_body)
    
    # NAVER Corp copyright
    draw.text((p_width // 2, 912), "NAVER Corp", fill="#94A3B8", font=font_mini, anchor="mm")
    
    # Save to buffer and return bytes
    output_buf = BytesIO()
    pamphlet.convert("RGB").save(output_buf, format="PNG")
    return output_buf.getvalue()

def generate_poster(facility_id, port=8080):
    store, neighbors = get_store_and_neighbors(facility_id)
    map_path = None
    
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
            )
            context = browser.new_context(
                viewport={"width": 1200, "height": 750},
                device_scale_factor=2
            )
            page = context.new_page()
            url = f"http://127.0.0.1:{port}/map_only_light.html?facility_id={facility_id}&rings=0"
            try:
                page.goto(url, wait_until="networkidle", timeout=12000)
            except Exception as e:
                print(f"[PosterRenderer] Warning on page.goto: {e}")
            time.sleep(2.5)
            
            map_locator = page.locator("#map")
            map_path = BASE_DIR / f"temp_map_poster_{facility_id}.png"
            try:
                map_locator.screenshot(path=str(map_path), timeout=5000)
            except Exception as e:
                print(f"[PosterRenderer] Locator screenshot failed: {e}")
                page.screenshot(path=str(map_path))
            browser.close()
    except Exception as e:
        print(f"[PosterRenderer] Playwright capture error: {e}")

    img_bytes = draw_poster(store, neighbors, map_path)
    
    if map_path and Path(map_path).exists():
        try:
            Path(map_path).unlink()
        except Exception:
            pass
            
    return img_bytes
