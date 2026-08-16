import asyncio
import httpx
from playwright.async_api import async_playwright

API_BASE = "http://127.0.0.1:8080/api"

async def watch_douyin(profile_id: str, profile_name: str, video_count: int = 10):
    print(f"\n=======================================================")
    print(f"🚀 Bắt đầu kịch bản cho: {profile_name} (ID: {profile_id})")
    print(f"=======================================================")

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Launch profile
        print(f"[{profile_name}] 1. Đang gọi API khởi động profile...")
        res = await client.post(f"{API_BASE}/profiles/{profile_id}/launch")
        if res.status_code not in (200, 201):
            print(f"[{profile_name}] ❌ Không thể khởi động profile: {res.text}")
            return
        launch_data = res.json()
        print(f"[{profile_name}] ✅ Khởi động thành công! Dữ liệu: {launch_data}")

    cdp_url = f"http://127.0.0.1:8080/api/profiles/{profile_id}/cdp"
    print(f"[{profile_name}] 2. Đang kết nối Playwright qua cổng CDP: {cdp_url}")

    async with async_playwright() as pw:
        # Connect to the running CloakBrowser profile via CDP
        browser = await pw.chromium.connect_over_cdp(cdp_url)
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else await context.new_page()

        print(f"[{profile_name}] 3. Điều hướng tới https://www.douyin.com...")
        try:
            await page.goto("https://www.douyin.com", wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print(f"[{profile_name}] ⚠️ Đang tiếp tục sau khi tải trang: {e}")

        await asyncio.sleep(5)

        # Press Escape to dismiss any initial login modal
        try:
            await page.keyboard.press("Escape")
        except Exception:
            pass

        print(f"[{profile_name}] 4. Bắt đầu tự động xem {video_count} video Douyin...")
        for i in range(1, video_count + 1):
            # Try to get video title/desc if available
            try:
                title = await page.title()
            except Exception:
                title = "Douyin Video"
            print(f"[{profile_name}] ▶️ Video {i}/{video_count} - Đang xem trong 6 giây... (Trang: {title})")
            await asyncio.sleep(6)
            
            # Press ArrowDown to transition to next video on Douyin
            await page.keyboard.press("ArrowDown")
            await asyncio.sleep(1.5)

        print(f"[{profile_name}] 🎉 ĐÃ HOÀN THÀNH XEM {video_count} VIDEO!")
        await asyncio.sleep(3)
        await browser.close()

    # Stop profile via API
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(f"{API_BASE}/profiles/{profile_id}/stop")
        print(f"[{profile_name}] 🛑 Đã đóng profile thành công.\n")

async def main():
    profiles = [
        {"id": "d7fba171-077d-4761-9dd5-36714ed4bce5", "name": "Profile 1"},
        {"id": "527b003b-9033-4ca3-b854-d6a61736586c", "name": "Profile 2"},
    ]

    for p in profiles:
        await watch_douyin(p["id"], p["name"], video_count=10)

if __name__ == "__main__":
    asyncio.run(main())
