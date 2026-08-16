"""AI Comment and Content Generator for Douyin using Gemini API on custom VPS."""

from __future__ import annotations

import json
import logging
import os
import random
from typing import Any
import httpx

logger = logging.getLogger("cloakbrowser.douyin.ai")

# VPS Mun-AI Gemini Gateway Defaults
DEFAULT_BASE_URL = os.environ.get("GEMINI_BASE_URL", "https://vps.mun-ai.art/v1")
DEFAULT_API_KEY = os.environ.get("GEMINI_API_KEY", "sk-66da4d6b4a70202f-mc9tyu-1f1e7ba0")
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "ag/ag-gemini-3.6-flash")

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
    """Generates natural comments and captions using Gemini AI via OpenAI-compatible endpoint."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        self.api_key = api_key or DEFAULT_API_KEY
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.model = model or DEFAULT_MODEL

    async def generate_comment(
        self,
        video_title: str = "",
        language: str = "zh",
        style: str = "positive",
    ) -> str:
        """Generate a natural contextual comment using Gemini."""
        if not self.api_key:
            pool = DEFAULT_CHINESE_COMMENTS if language == "zh" else DEFAULT_VIETNAMESE_COMMENTS
            return random.choice(pool)

        if language == "zh":
            lang_prompt = "tiếng Trung Giản Thể (Chinese Simplified)"
        else:
            lang_prompt = "tiếng Việt"

        system_instruction = (
            "Bạn là một người dùng thật trên mạng xã hội Douyin (TikTok Trung Quốc). "
            "Nhiệm vụ của bạn là viết đúng MỘT câu bình luận ngắn (dưới 20 chữ), tự nhiên, chân thực, "
            "phù hợp với nội dung video để tăng tương tác. "
            "QUY TẮC BẮT BUỘC: CHỈ trả về đúng 1 câu bình luận duy nhất kèm 1 emoji ở cuối. "
            "KHÔNG viết giải thích, KHÔNG viết phiên âm Pinyin, KHÔNG dùng dấu ngoặc kép, KHÔNG đưa ra nhiều lựa chọn."
        )

        user_content = f"Viết 1 câu bình luận ngắn bằng {lang_prompt} cho video có tiêu đề: '{video_title}'."

        try:
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content},
                ],
                "stream": False,
                "max_tokens": 100,
                "temperature": 0.7,
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    text = res.text.strip()
                    # If returned as direct JSON
                    try:
                        data = json.loads(text)
                        if "choices" in data and len(data["choices"]) > 0:
                            choice = data["choices"][0]
                            content = choice.get("message", {}).get("content", "")
                            # Clean up
                            lines = [l.strip() for l in content.splitlines() if l.strip()]
                            if lines:
                                # Pick the first clean sentence
                                clean_text = lines[0].replace('"', "").replace("'", "").strip()
                                if clean_text.startswith(">"):
                                    clean_text = clean_text.lstrip("> ").strip()
                                return clean_text
                    except Exception:
                        # Handle SSE text if streamed
                        collected = ""
                        for line in text.splitlines():
                            if line.startswith("data: ") and not line.endswith("[DONE]"):
                                try:
                                    chunk = json.loads(line[6:])
                                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                    collected += delta
                                except Exception:
                                    pass
                        if collected.strip():
                            return collected.strip().replace('"', "")
                else:
                    logger.warning("Gemini API error (%s): %s", res.status_code, res.text[:200])

        except Exception as e:
            logger.warning("AI Comment generation failed: %s, using fallback", e)

        pool = DEFAULT_CHINESE_COMMENTS if language == "zh" else DEFAULT_VIETNAMESE_COMMENTS
        return random.choice(pool)
