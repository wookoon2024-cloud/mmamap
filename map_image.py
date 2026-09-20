"""Standalone OSM map image renderer (keyless) used by the A2 design template.

The client cannot draw OSM tiles into a canvas directly (no CORS header), so the
map is rendered here on the server and served from our own origin.
"""
import math
import queue
import threading
from pathlib import Path
from io import BytesIO

import requests
import urllib3
from PIL import Image, ImageDraw

urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parent
TILE_SIZE = 256
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MMAMap/1.0"}


def _deg2num(lat, lng, zoom):
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    xtile = (lng + 180.0) / 360.0 * n
    ytile = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    return xtile, ytile


def render_map(lat, lng, width=1600, height=908, zoom=16):
    width = max(200, min(4000, int(width)))
    height = max(200, min(4000, int(height)))

    cx, cy = _deg2num(lat, lng, zoom)
    half_w_tiles = (width / 2.0) / TILE_SIZE
    half_h_tiles = (height / 2.0) / TILE_SIZE
    min_tx = int(math.floor(cx - half_w_tiles))
    max_tx = int(math.floor(cx + half_w_tiles))
    min_ty = int(math.floor(cy - half_h_tiles))
    max_ty = int(math.floor(cy + half_h_tiles))

    stitched_w = (max_tx - min_tx + 1) * TILE_SIZE
    stitched_h = (max_ty - min_ty + 1) * TILE_SIZE
    canvas = Image.new("RGB", (stitched_w, stitched_h), "#F2F2EC")

    for tx in range(min_tx, max_tx + 1):
        for ty in range(min_ty, max_ty + 1):
            url = f"https://tile.openstreetmap.org/{zoom}/{tx}/{ty}.png"
            try:
                r = requests.get(url, headers=HEADERS, verify=False, timeout=4)
                if r.status_code == 200:
                    tile = Image.open(BytesIO(r.content)).convert("RGB")
                    canvas.paste(tile, ((tx - min_tx) * TILE_SIZE, (ty - min_ty) * TILE_SIZE))
            except Exception:
                pass

    store_px = (cx - min_tx) * TILE_SIZE
    store_py = (cy - min_ty) * TILE_SIZE
    crop_x1 = int(round(store_px - width / 2.0))
    crop_y1 = int(round(store_py - height / 2.0))
    crop_x1 = max(0, min(crop_x1, max(0, stitched_w - width)))
    crop_y1 = max(0, min(crop_y1, max(0, stitched_h - height)))
    img = canvas.crop((crop_x1, crop_y1, crop_x1 + width, crop_y1 + height))

    wash = Image.new("RGB", (width, height), (242, 242, 236))
    img = Image.blend(img, wash, 0.18)

    # center marker (blue pin, same asset as the poster)
    draw = ImageDraw.Draw(img)
    pin_path = BASE_DIR / "web" / "img" / "blue_pin.png"
    cx_px, cy_px = width // 2, height // 2
    pin_h = max(48, int(height * 0.14))
    if pin_path.exists():
        try:
            pin = Image.open(pin_path).convert("RGBA")
            ratio = pin.height / pin.width
            pin_w = int(pin_h / ratio)
            pin = pin.resize((pin_w, pin_h), Image.Resampling.LANCZOS)
            img.paste(pin, (cx_px - pin_w // 2, cy_px - pin_h), pin)
        except Exception:
            draw.ellipse([cx_px - 16, cy_px - 16, cx_px + 16, cy_px + 16], fill="#1E3A8A", outline="#FFFFFF", width=4)
    else:
        draw.ellipse([cx_px - 16, cy_px - 16, cx_px + 16, cy_px + 16], fill="#1E3A8A", outline="#FFFFFF", width=4)

    return img


def render_map_png(facility, width=1600, height=908):
    lat = float(facility.get("lat") or 37.5665)
    lng = float(facility.get("lng") or 126.9780)
    img = render_map(lat, lng, width=width, height=height)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _launch_args():
    return [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--js-flags=--max-old-space-size=128",
        "--no-zygote",
    ]


# ---------------------------------------------------------------------------
# Shared headless browser
#
# Launching Chromium for every capture costs seconds (and a cold HTTP cache
# makes the poster page reload the map SDK each time). One long-lived browser
# on a dedicated worker thread is reused instead.
# ---------------------------------------------------------------------------
_SHARED = {"queue": None, "worker": None, "lock": threading.Lock()}


def _worker_loop(job_queue):
    pw = browser = context = None
    while True:
        job = job_queue.get()
        if job is None:
            break
        fn, args, box, done = job
        try:
            if context is None:
                from playwright.sync_api import sync_playwright
                pw = sync_playwright().start()
                browser = pw.chromium.launch(headless=True, args=_launch_args())
                context = browser.new_context(viewport={"width": 1200, "height": 1600}, device_scale_factor=1)
            box["data"] = fn(context, *args)
        except Exception as e:
            box["error"] = e
            for closer in (browser.close if browser else None, pw.stop if pw else None):
                try:
                    closer()
                except Exception:
                    pass
            pw = browser = context = None
        finally:
            done.set()


def _run_shared(fn, *args, timeout=120):
    with _SHARED["lock"]:
        if _SHARED["queue"] is None:
            _SHARED["queue"] = queue.Queue()
        job_queue = _SHARED["queue"]
        if _SHARED["worker"] is None or not _SHARED["worker"].is_alive():
            _SHARED["worker"] = threading.Thread(target=_worker_loop, args=(job_queue,), name="map-capture", daemon=True)
            _SHARED["worker"].start()
    box = {}
    done = threading.Event()
    job_queue.put((fn, args, box, done))
    if not done.wait(timeout):
        raise TimeoutError("map capture timed out")
    if box.get("error"):
        raise box["error"]
    return box.get("data")


def _poster_map_job(context, port, facility_id, settle_ms):
    page = context.new_page()
    try:
        page.goto(
            f"http://127.0.0.1:{port}/print_template.html?facility_id={facility_id}&tpl=poster&v=map",
            wait_until="domcontentloaded",
            timeout=10000,
        )
        try:
            page.wait_for_function("window.__MAP_READY === true", timeout=8000)
        except Exception:
            page.wait_for_timeout(3000)
        # wait for the map tiles instead of sleeping a fixed amount
        try:
            page.wait_for_load_state("networkidle", timeout=max(1500, settle_ms))
        except Exception:
            pass
        # pin the map box to a fixed size so the capture is stable
        try:
            page.evaluate(
                """() => {
                    const c = document.querySelector('#posterTpl .map-container');
                    if (c) { c.style.height = '540px'; c.style.minHeight = '540px'; c.style.flex = '0 0 540px'; }
                    window.dispatchEvent(new Event('resize'));
                }"""
            )
            try:
                page.wait_for_load_state("networkidle", timeout=1200)
            except Exception:
                pass
        except Exception:
            pass
        return page.locator("#mapPoster").screenshot(timeout=8000)
    finally:
        page.close()


def capture_poster_map(port, facility_id, settle_ms=900):
    """Capture the very same map that the '상생지도 결합' poster shows."""
    return _run_shared(_poster_map_job, port, facility_id, settle_ms)


def _naver_map_job(context, port, facility_id, width, height, rings):
    import time

    page = context.new_page()
    try:
        page.set_viewport_size({"width": int(width), "height": int(height)})
        url = f"http://127.0.0.1:{port}/map_only_light.html?facility_id={facility_id}&rings={rings}"
        page.goto(url, wait_until="domcontentloaded", timeout=8000)
        try:
            page.wait_for_function("window.__MAP_READY === true", timeout=5000)
        except Exception:
            time.sleep(1.5)
        return page.locator("#map").screenshot(timeout=8000)
    finally:
        page.close()


def capture_naver_map(port, facility_id, width=896, height=522, rings=0):
    """Screenshot the very same naver map page the existing poster uses."""
    return _run_shared(_naver_map_job, port, facility_id, width, height, rings)

