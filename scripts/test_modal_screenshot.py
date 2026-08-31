import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.goto('http://127.0.0.1:8080', timeout=15000)
    page.wait_for_timeout(2000)
    
    # Close intro popup
    page.evaluate('() => { const b = document.getElementById("introConfirmBtn"); if(b) b.click(); }')
    page.wait_for_timeout(500)
    
    # Click an item in newStoreRollTrack or rankList
    page.evaluate('''() => {
        const item = document.querySelector(".newStoreRollItem, .rankItem, .hubPrimaryBtn");
        const rollItems = document.querySelectorAll(".newStoreRollItem");
        if (rollItems.length > 0) {
            rollItems[0].click();
        }
    }''')
    page.wait_for_timeout(1000)
    
    # Check detail panel
    is_detail = page.evaluate('() => !document.getElementById("detailPanel").classList.contains("hidden")')
    print('Detail panel open:', is_detail)
    
    # Click detailPrintBtn
    page.evaluate('() => { const p = document.getElementById("detailPrintBtn"); if(p) p.click(); }')
    page.wait_for_timeout(1000)
    
    is_modal = page.evaluate('() => !document.getElementById("printModalBackdrop").classList.contains("hidden")')
    print('Print modal open:', is_modal)
    
    if is_modal:
        page.screenshot(path='img/screenshot_modal_poster.png')
        print('Saved img/screenshot_modal_poster.png')
        
        # Click stand tab
        page.evaluate('() => { const t = document.querySelector("button[data-tpl=\'table_stand\']"); if(t) t.click(); }')
        page.wait_for_timeout(600)
        page.screenshot(path='img/screenshot_modal_stand.png')
        print('Saved img/screenshot_modal_stand.png')
        
        # Click hanger tab
        page.evaluate('() => { const t = document.querySelector("button[data-tpl=\'door_hanger\']"); if(t) t.click(); }')
        page.wait_for_timeout(600)
        page.screenshot(path='img/screenshot_modal_hanger.png')
        print('Saved img/screenshot_modal_hanger.png')

    browser.close()
