"""Douyin Account Warm-up Action (Feed Recommendation Nurturing)."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, Callable
from ..client import DouyinClient
from ..ai_generator import AIGenerator

logger = logging.getLogger("cloakbrowser.douyin.warmup")


async def run_warmup(
    client: DouyinClient,
    config: dict[str, Any],
    log_callback: Callable[[str, str], Any] | None = None,
) -> dict[str, Any]:
    """
    Run account warmup workflow on Douyin recommend feed.

    Config options:
      - video_count: int (default 10)
      - min_watch_sec: int (default 5)
      - max_watch_sec: int (default 12)
      - like_probability: float (0.0 - 1.0, default 0.20)
      - favorite_probability: float (0.0 - 1.0, default 0.05)
      - comment_probability: float (0.0 - 1.0, default 0.10)
      - enable_ai_comment: bool (default True)
      - comment_language: str ("zh" | "vi", default "zh")
    """
    video_count = int(config.get("video_count", 10))
    min_watch = int(config.get("min_watch_sec", 5))
    max_watch = int(config.get("max_watch_sec", 12))
    like_prob = float(config.get("like_probability", 0.20))
    fav_prob = float(config.get("favorite_probability", 0.05))
    cmt_prob = float(config.get("comment_probability", 0.10))
    enable_ai = bool(config.get("enable_ai_comment", True))
    cmt_lang = config.get("comment_language", "zh")

    ai_gen = AIGenerator()

    async def log(msg: str, level: str = "info"):
        logger.info("[%s] %s", client.profile_name, msg)
        if log_callback:
            await log_callback(msg, level)

    await log(f"🚀 Bắt đầu kịch bản Nuôi Tài Khoản ({video_count} video)...")

    # Connect to browser
    await client.connect()
    await client.navigate_recommend()

    watched = 0
    likes = 0
    favorites = 0
    comments = 0

    for i in range(1, video_count + 1):
        # Watch duration
        watch_time = random.uniform(min_watch, max_watch)
        
        title = "Douyin Video"
        if client.page:
            try:
                title = await client.page.title()
            except Exception:
                pass

        await log(f"▶️ Video {i}/{video_count}: Đang xem trong {watch_time:.1f}s... [{title[:40]}]")
        await asyncio.sleep(watch_time)
        watched += 1

        # Like action
        if random.random() < like_prob:
            liked = await client.like_current_video()
            if liked:
                likes += 1
                await log(f"❤️ Đã thả tim cho video {i}!")

        # Favorite action
        if random.random() < fav_prob:
            faved = await client.favorite_current_video()
            if faved:
                favorites += 1
                await log(f"⭐ Đã lưu video {i} vào mục yêu thích!")

        # Comment action
        if enable_ai and random.random() < cmt_prob:
            cmt_text = await ai_gen.generate_comment(video_title=title, language=cmt_lang)
            posted = await client.post_comment(cmt_text)
            if posted:
                comments += 1
                await log(f"💬 Đã bình luận: '{cmt_text}'")

        # Scroll to next video
        await client.next_video()

    await log(f"🎉 Hoàn thành nuôi acc! Đã xem {watched} video, Thả tim: {likes}, Lưu: {favorites}, Bình luận: {comments}")

    return {
        "videos_watched": watched,
        "likes_count": likes,
        "favorites_count": favorites,
        "comments_count": comments,
        "status": "success",
    }
