"""Douyin Video Uploader Action (Creator Hub Auto Publishing)."""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any, Callable
from ..client import DouyinClient

logger = logging.getLogger("cloakbrowser.douyin.uploader")


async def run_uploader(
    client: DouyinClient,
    config: dict[str, Any],
    log_callback: Callable[[str, str], Any] | None = None,
) -> dict[str, Any]:
    """
    Auto upload a video to Douyin Creator Hub.

    Config options:
      - video_path: str (local absolute path to .mp4)
      - title: str (video caption/title)
      - tags: list[str] (hashtags e.g. ["#穿搭", "#日常"])
      - publish_now: bool (default True)
    """
    video_path = config.get("video_path")
    title = config.get("title", "")
    tags = config.get("tags", [])
    publish_now = bool(config.get("publish_now", True))

    async def log(msg: str, level: str = "info"):
        logger.info("[%s] %s", client.profile_name, msg)
        if log_callback:
            await log_callback(msg, level)

    if not video_path or not Path(video_path).exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    await log(f"📤 Đang mở Douyin Creator Studio để tải lên video: {video_path}...")

    await client.connect()
    page = client.page
    if not page:
        raise RuntimeError("Browser not connected")

    creator_url = "https://creator.douyin.com/creator-micro/content/upload"
    await page.goto(creator_url, wait_until="domcontentloaded", timeout=45000)
    await asyncio.sleep(4)
    await client.dismiss_modals()

    # Upload video file input
    file_input = await page.query_selector("input[type='file'][accept*='video']")
    if not file_input:
        await log("⚠️ Cần đăng nhập tài khoản Creator Douyin để tải lên video!")
        return {"status": "failed", "error": "Creator login required"}

    await file_input.set_input_files(video_path)
    await log("⏳ Đang tải file video lên máy chủ Douyin...")
    await asyncio.sleep(8)

    # Set title & hashtags
    full_caption = title
    if tags:
        full_caption += " " + " ".join([t if t.startswith("#") else f"#{t}" for t in tags])

    title_input = await page.query_selector("input[placeholder*='输入标题'], .zone-title-input input, textarea")
    if title_input:
        await title_input.fill(full_caption)
        await log(f"📝 Đã điền tiêu đề & hashtag: {full_caption}")

    if publish_now:
        publish_btn = await page.query_selector("button:has-text('发布'), button:has-text('立即发布')")
        if publish_btn:
            await publish_btn.click()
            await log("🚀 Đã bấm nút Xuất bản video!")
            await asyncio.sleep(5)

    await log("✅ Hoàn thành quy trình tải lên video!")
    return {
        "video_path": video_path,
        "caption": full_caption,
        "status": "success",
    }
