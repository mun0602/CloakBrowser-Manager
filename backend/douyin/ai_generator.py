"""AI Comment and Content Generator for Douyin."""

from __future__ import annotations

import json
import logging
import os
import random
from typing import Any
import httpx

logger = logging.getLogger("cloakbrowser.douyin.ai")

# Natural fallback comments tailored for Douyin video engagement
DEFAULT_CHINESE_COMMENTS = [
    "太厉害了，学到了！👍",
    "这视频拍得真好，必须点赞！✨",
    "内容太棒了，期待更新！🔥",
    "收藏了，回去慢慢看 ❤️",
    "拍得好有质感，关注了！",
    "哈哈太真实了，简直就是我 😂",
    "很有帮助，感谢分享！🙏",
    "这个角度很新颖，支持一下！",
    "看完心情大好，太治愈了 🌸",
    "太强了，博主多发点这类视频！👏",
    "很有创意，给作者打call 🚀",
    "真不错，每次看都有收获！",
]

DEFAULT_VIETNAMESE_COMMENTS = [
    "Video hay và ý nghĩa quá! 👍",
    "Xem cuốn thực sự, cho 1 tim nhé ❤️",
    "Nội dung chất lượng quá ạ 🔥",
    "Đã lưu lại để xem dần, cảm ơn bạn đã chia sẻ 🙏",
    "Kịch bản đỉnh thật, hóng các video tiếp theo 🚀",
    "Đẹp mắt và truyền cảm hứng ghê ✨",
]


class AIGenerator:
    """Generates natural comments and captions using LLM API or fallback templates."""

    def __init__(self, api_key: str | None = None, provider: str = "gemini"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        self.provider = provider

    async def generate_comment(
        self,
        video_title: str = "",
        language: str = "zh",
        style: str = "positive",
    ) -> str:
        """Generate a natural contextual comment."""
        if not self.api_key:
            # Fallback to curated templates
            pool = DEFAULT_CHINESE_COMMENTS if language == "zh" else DEFAULT_VIETNAMESE_COMMENTS
            return random.choice(pool)

        prompt = (
            f"Bạn là một người dùng thật trên nền tảng mạng xã hội Douyin (TikTok Trung Quốc). "
            f"Hãy viết một câu bình luận ngắn (từ 5 đến 20 từ) tự nhiên, thân thiện, mang tính khen ngợi "
            f"dành cho video có tiêu đề: '{video_title}'. "
            f"Ngôn ngữ yêu cầu: {'Tiếng Trung giản thể (Chinese)' if language == 'zh' else 'Tiếng Việt'}. "
            f"Chỉ trả về trực tiếp nội dung bình luận, kèm 1 emoji phù hợp, không giải thích gì thêm."
        )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if self.provider == "gemini":
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
                    payload = {"contents": [{"parts": [{"text": prompt}]}]}
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        return text
                elif self.provider == "openai":
                    url = "https://api.openai.com/v1/chat/completions"
                    headers = {"Authorization": f"Bearer {self.api_key}"}
                    payload = {
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 60,
                    }
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.warning("AI Comment generation failed: %s, using fallback", e)

        pool = DEFAULT_CHINESE_COMMENTS if language == "zh" else DEFAULT_VIETNAMESE_COMMENTS
        return random.choice(pool)
