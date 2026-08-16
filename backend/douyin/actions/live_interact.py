"""Douyin Livestream Interaction Action (Viewing, Sending Hearts, Chat Seeding)."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, Callable
from ..client import DouyinClient

logger = logging.getLogger("cloakbrowser.douyin.live")


async def run_live_interact(
    client: DouyinClient,
    config: dict[str, Any],
    log_callback: Callable[[str, str], Any] | None = None,
) -> dict[str, Any]:
    """
    Interact with a Douyin livestream room.

    Config options:
      - live_url: str (e.g., https://live.douyin.com/123456)
      - duration_min: int (default 2)
      - heart_clicks: int (default 20)
      - messages: list[str] (chat seeding messages)
    """
    live_url = config.get("live_url", "https://live.douyin.com")
    duration_min = int(config.get("duration_min", 2))
    heart_clicks = int(config.get("heart_clicks", 20))
    messages = config.get("messages", ["主播好棒！👏", "支持一下 ❤️", "点赞点赞 👍"])

    async def log(msg: str, level: str = "info"):
        logger.info("[%s] %s", client.profile_name, msg)
        if log_callback:
            await log_callback(msg, level)

    await log(f"🔴 Đang vào phòng Livestream: {live_url}...")

    await client.connect()
    page = client.page
    if not page:
        raise RuntimeError("Browser not connected")

    await page.goto(live_url, wait_until="domcontentloaded", timeout=45000)
    await asyncio.sleep(4)
    await client.dismiss_modals()

    total_seconds = duration_min * 60
    end_time = asyncio.get_running_loop().time() + total_seconds

    await log(f"📺 Đang xem Livestream trong {duration_min} phút và tương tác tự động...")

    # Rapid click simulation for live hearts
    viewport = page.viewport_size or {"width": 1280, "height": 800}
    click_x = viewport["width"] // 2
    click_y = viewport["height"] // 2

    hearts_sent = 0
    chats_sent = 0

    while asyncio.get_running_loop().time() < end_time:
        # Send some hearts
        if hearts_sent < heart_clicks:
            for _ in range(min(5, heart_clicks - hearts_sent)):
                try:
                    await page.mouse.click(
                        click_x + random.randint(-50, 50),
                        click_y + random.randint(-50, 50)
                    )
                    hearts_sent += 1
                    await asyncio.sleep(0.2)
                except Exception:
                    pass

        # Send chat message periodically
        if messages and random.random() < 0.2:
            try:
                chat_input = await page.query_selector("textarea, input[placeholder*='说点什么']")
                if chat_input:
                    msg = random.choice(messages)
                    await chat_input.click()
                    await page.keyboard.type(msg, delay=100)
                    await page.keyboard.press("Enter")
                    chats_sent += 1
                    await log(f"💬 Gửi tin nhắn Live: '{msg}'")
            except Exception:
                pass

        await asyncio.sleep(random.uniform(5, 10))

    await log(f"✅ Đã hoàn thành xem Livestream. Đã thả tim: {hearts_sent}, Tin nhắn chat: {chats_sent}")
    return {
        "live_url": live_url,
        "duration_min": duration_min,
        "hearts_sent": hearts_sent,
        "chats_sent": chats_sent,
        "status": "success",
    }
