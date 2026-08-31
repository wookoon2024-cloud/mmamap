import json
import math
import requests
import urllib3
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parent

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

def fit_hanger_audience_text(audience_text, font_path, max_width=480):
    for size in [16, 14, 12]:
        font = get_font(font_path, size, is_bold=False)
        try:
            w = font.getlength(audience_text)
        except Exception:
            w = len(audience_text) * 10
        if w <= max_width:
            return [audience_text], font, size
    for size in [14, 12, 11]:
        font = get_font(font_path, size, is_bold=False)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 2:
            return lines, font, size
    for size in [12, 11, 10]:
        font = get_font(font_path, size, is_bold=False)
        lines = wrap_text_chars(audience_text, font, max_width)
        if len(lines) <= 3:
            return lines, font, size
    font = get_font(font_path, 10, is_bold=False)
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

def draw_door_hanger(store):
    p_width, p_height = 600, 1100
    hanger = Image.new("RGBA", (p_width, p_height), "#F3F3ED")
    draw = ImageDraw.Draw(hanger)
    
    font_bold_path, font_path = get_font_paths()
    
    font_header_sub = get_font(font_bold_path, 16, is_bold=True)
    font_welcome = get_font(font_bold_path, 22, is_bold=True)
    font_title = get_font(font_bold_path, 36, is_bold=True)
    font_badge_text = get_font(font_bold_path, 18, is_bold=True)
    font_label = get_font(font_bold_path, 14, is_bold=True)
    font_scan_title = get_font(font_bold_path, 13, is_bold=True)
    font_footer = get_font(font_bold_path, 12, is_bold=True)

    # 1. Door Hanger Hole
    hole_cx, hole_cy, hole_r = 300, 150, 80
    draw.ellipse([hole_cx - hole_r, hole_cy - hole_r, hole_cx + hole_r, hole_cy + hole_r], outline="#64748B", width=2)
    for y in range(0, hole_cy - hole_r, 10):
         draw.line([(hole_cx, y), (hole_cx, y + 6)], fill="#64748B", width=2)
    draw.text((hole_cx, hole_cy + hole_r + 20), "문고리 거치선 (지름 8cm)", fill="#64748B", font=font_footer, anchor="mm")

    # 2. Header
    draw.text((p_width // 2, 330), "대한민국 병무청 | 나라사랑가게", fill="#1E3A8A", font=font_header_sub, anchor="mm")

    # 3. Welcome + Store Name
    draw.text((p_width // 2, 380), "환영합니다", fill="#64748B", font=font_welcome, anchor="mm")
    draw.text((p_width // 2, 430), store['name'], fill="#0F172A", font=font_title, anchor="mm")

    # 4. Parse Benefit
    benefit_content, benefit_target, _ = parse_benefit_field(store['benefit'])

    # 5. Benefit Capsule Badge
    try:
        w_text = font_badge_text.getlength(benefit_content)
    except Exception:
        w_text = len(benefit_content) * 12
    badge_w = int(w_text) + 40
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
    start_aud_y = 605
    
    for idx, line in enumerate(aud_lines):
        y_pos = start_aud_y + idx * aud_line_h + aud_line_h / 2
        draw.text((p_width // 2, y_pos), line, fill="#475569", font=font_aud, anchor="mm")

    # 7. QR Code Card Section
    qr_card_x1, qr_card_y1, qr_card_x2, qr_card_y2 = 160, 715, 440, 985
    draw.rounded_rectangle([qr_card_x1, qr_card_y1, qr_card_x2, qr_card_y2], radius=16, fill="#FFFFFF", outline="#E2E8F0", width=2)
    
    facility_id = store['facility_id']
    landing_url = f"https://mmamap-seven.vercel.app/mobile_landing.html?id={facility_id}"
    qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={requests.utils.quote(landing_url)}"
    
    qr_w, qr_h = 160, 160
    qr_x = 220
    qr_y = 740
    
    try:
        qr_res = requests.get(qr_api_url, verify=False, timeout=5)
        if qr_res.status_code == 200:
            qr_img = Image.open(BytesIO(qr_res.content)).convert("RGBA")
            hanger.paste(qr_img, (qr_x, qr_y), qr_img)
            draw.rectangle([qr_x - 2, qr_y - 2, qr_x + qr_w + 2, qr_y + qr_h + 2], outline="#cbd5e1", width=1)
    except Exception as e:
        print("QR download failed:", e)

    draw.text((300, 945), "스마트폰 스캔 (상세 혜택)", fill="#1E3A8A", font=font_scan_title, anchor="mm")

    # 8. Footer Section
    footer_text = "대한민국 병무청 × 나라사랑가게 네트워크"
    draw.line([(50, 1010), (550, 1010)], fill="#DFD7CB", width=2)
    draw.text((p_width // 2, 1050), footer_text, fill="#64748B", font=font_footer, anchor="mm")

    output_buf = BytesIO()
    hanger.convert("RGB").save(output_buf, format="PNG")
    return output_buf.getvalue()

def generate_hanger(facility_id):
    store = get_store_info(facility_id)
    if not store:
        raise ValueError(f"Facility {facility_id} not found.")
    return draw_door_hanger(store)
