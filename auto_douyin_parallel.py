import asyncio
import httpx
from playwright.async_api import async_playwright

API_BASE = "http://127.0.0.1:8080/api"

async def watch_douyin_recommend(profile_id: str, profile_name: str, video_count: int = 10):
    print(f"[{profile_name}] 🚀 Khởi chạy và kết nối CDP...", flush=True)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Check if running or launch
        status_res = await client.get(f"{API_BASE}/profiles/{profile_id}/status")
        if status_res.status_code == 200 and status_res.json().get("status") != "running":
            await client.post(f"{API_BASE}/profiles/{profile_id}/launch")
            await asyncio.sleep(2)

    cdp_url = f"http://127.0.0.1:8080/api/profiles/{profile_id}/cdp"
    print(f"[{profile_name}] 🔗 Kết nối Playwright: {cdp_url}", flush=True)

    async with async_playwright() as pw:
        try:
            browser = await pw.chromium.connect_over_cdp(cdp_url)
            context = browser.contexts[0] if browser.contexts else await browser.new_context()
            page = context.pages[0] if context.pages else await context.new_page()

            # Target recommend stream
            target_url = "https://www.douyin.com/?recommend=1"
            print(f"[{profile_name}] 🌐 Đang mở nguồn Video đề xuất: {target_url}...", flush=True)
            await page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
            await asyncio.sleep(5)

            # Click on the center of the page to ensure focus for keyboard events
            try:
                viewport = page.viewport_size or {"width": 1280, "height": 800}
                await page.mouse.click(viewport["width"] // 2, viewport["height"] // 2)
            except Exception:
                pass

            # Close any popup/login modal
            try:
                await page.keyboard.press("Escape")
            except Exception:
                pass

            print(f"[{profile_name}] 🎬 Bắt đầu lướt luồng video Đề Xuất (Recommend) - {video_count} video...", flush=True)
            for i in range(1, video_count + 1):
                try:
                    title = await page.title()
                except Exception:
                    title = "Douyin Recommend"
                
                print(f"[{profile_name}] ▶️ Đang xem Video {i}/{video_count} (6 giây)... [{title}]", flush=True)
                await asyncio.sleep(6)
                
                # In Douyin ?recommend=1 feed, ArrowDown or pressing Down arrow scrolls to next video
                await page.keyboard.press("ArrowDown")
                await asyncio.sleep(1.5)

            print(f"[{profile_name}] 🎉 HOÀN THÀNH XEM {video_count} VIDEO ĐỀ XUẤT!", flush=True)
            await asyncio.sleep(3)
        except Exception as e:
            print(f"[{profile_name}] ⚠️ Lỗi trong quá trình lướt video: {e}", flush=True)

async def main():
    print("================================================================", flush=True)
    print("🔥 LƯỚT DOUYIN ĐỀ XUẤT (https://www.douyin.com/?recommend=1) 🔥", flush=True)
    print("================================================================", flush=True)

    await asyncio.gather(
        watch_douyin_recommend("d7fba171-077d-4761-9dd5-36714ed4bce5", "Profile 1", video_count=10),
        watch_douyin_recommend("527b003b-9033-4ca3-b854-d6a61736586c", "Profile 2", video_count=10),
    )
    print("✅ ĐÃ HOÀN TẤT CHO CẢ 2 PROFILE!", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
