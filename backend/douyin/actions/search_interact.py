"""Douyin Search and Keyword/Hashtag Interaction Action."""

from __future__ import annotations

import asyncio
import logging
import random
import urllib.parse
from typing import Any, Callable
from ..client import DouyinClient
from ..ai_generator import AIGenerator

logger = logging.getLogger("cloakbrowser.douyin.search")


async def run_search_interact(
    client: DouyinClient,
    config: dict[str, Any],
    log_callback: Callable[[str, str], Any] | None = None,
) -> dict[str, Any]:
    """
    Search Douyin by keyword or hashtag and interact with top matching videos.

    Config options:
      - keyword: str
      - video_count: int (default 5)
      - min_watch_sec: int (default 6)
      - max_watch_sec: int (default 15)
      - min_interact_delay_sec: int (default 2)
      - max_interact_delay_sec: int (default 6)
      - like_probability: float (default 0.5)
      - enable_comment: bool (default True)
      - comment_text: str | None (if custom, otherwise AI generated)
    """
    keyword = config.get("keyword", "穿搭")
    video_count = int(config.get("video_count", 5))
    min_watch = int(config.get("min_watch_sec", 6))
    max_watch = int(config.get("max_watch_sec", 15))
    min_delay = int(config.get("min_interact_delay_sec", 2))
    max_delay = int(config.get("max_interact_delay_sec", 6))
    like_prob = float(config.get("like_probability", 0.5))
    enable_cmt = bool(config.get("enable_comment", True))
    custom_cmt = config.get("comment_text")

    ai_gen = AIGenerator()

    async def log(msg: str, level: str = "info"):
        logger.info("[%s] %s", client.profile_name, msg)
        if log_callback:
            await log_callback(msg, level)

    await log(f"🔍 Tìm kiếm từ khóa: '{keyword}' trên Douyin (xem {min_watch}s-{max_watch}s, nghỉ {min_delay}s-{max_delay}s)...")

    await client.connect()
    page = client.page
    if not page:
        raise RuntimeError("Browser not connected")

    # Navigate to search query URL
    encoded_kw = urllib.parse.quote(keyword)
    search_url = f"https://www.douyin.com/search/{encoded_kw}?type=video"
    await page.goto(search_url, wait_until="domcontentloaded", timeout=45000)
    await asyncio.sleep(4)
    await client.dismiss_modals()

    # Find video cards on search page
    video_cards = await page.query_selector_all("ul li a[href*='/video/'], .search-result-card, a[href*='/video/']")
    await log(f"📦 Tìm thấy {len(video_cards)} video liên quan đến từ khóa '{keyword}'")

    interacted = 0
    likes = 0
    comments = 0

    for i in range(min(video_count, len(video_cards))):
        try:
            card = video_cards[i]
            if await card.is_visible():
                await log(f"▶️ Mở xem video kết quả tìm kiếm #{i+1}...")
                await card.click()
                await asyncio.sleep(3)
                await client.dismiss_modals()

                # Watch video
                watch_time = random.uniform(min_watch, max_watch)
                await asyncio.sleep(watch_time)
                interacted += 1

                # Interaction delay
                await asyncio.sleep(random.uniform(min_delay, max_delay))

                if random.random() < like_prob:
                    if await client.like_current_video():
                        likes += 1
                        await log(f"❤️ Đã thả tim video #{i+1}")
                        await asyncio.sleep(random.uniform(1.0, 2.0))

                if enable_cmt:
                    cmt_text = custom_cmt or await ai_gen.generate_comment(video_title=keyword, language="zh")
                    if await client.post_comment(cmt_text):
                        comments += 1
                        await log(f"💬 Đã bình luận: '{cmt_text}'")
                        await asyncio.sleep(random.uniform(1.5, 2.5))

                # Close video modal or go back
                await page.keyboard.press("Escape")
                await asyncio.sleep(random.uniform(min_delay, max_delay))
        except Exception as e:
            logger.warning("Error interacting with video %d: %s", i+1, e)

    await log(f"🎉 Hoàn thành tìm kiếm tương tác! Đã xử lý {interacted} video, Thả tim: {likes}, Bình luận: {comments}")
    return {
        "success": True,
        "interacted_count": interacted,
        "likes": likes,
        "comments": comments,
    }
