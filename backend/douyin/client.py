"""Playwright CDP client specialized for Douyin web automation."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, Callable
from playwright.async_api import Browser, BrowserContext, Page, async_playwright

logger = logging.getLogger("cloakbrowser.douyin.client")


class DouyinClient:
    """Manages CDP session and actions on Douyin."""

    def __init__(self, cdp_url: str, profile_name: str = "Profile"):
        self.cdp_url = cdp_url
        self.profile_name = profile_name
        self.pw: Any = None
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None
        self.page: Page | None = None

    async def connect(self) -> Page:
        """Connect to running browser instance via CDP."""
        self.pw = await async_playwright().start()
        self.browser = await self.pw.chromium.connect_over_cdp(self.cdp_url)
        self.context = self.browser.contexts[0] if self.browser.contexts else await self.browser.new_context()
        self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
        logger.info("[%s] Connected to browser via CDP: %s", self.profile_name, self.cdp_url)
        return self.page

    async def close(self):
        """Disconnect CDP session without killing browser if needed."""
        try:
            if self.browser:
                await self.browser.close()
        except Exception as e:
            logger.debug("[%s] Error closing browser CDP: %s", self.profile_name, e)
        finally:
            if self.pw:
                await self.pw.stop()

    async def dismiss_modals(self):
        """Close login popups, privacy dialogs, or cookie overlays."""
        if not self.page:
            return
        try:
            # Escape key is effective for Douyin login dialogs
            await self.page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
            # Try clicking close buttons if present
            close_selectors = [
                ".dy-account-close",
                "[data-e2e='close-icon']",
                ".login-guide-container .close-btn",
                "svg.semi-modal-close",
                ".semi-modal-close",
            ]
            for sel in close_selectors:
                el = await self.page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.3)
        except Exception:
            pass

    async def ensure_focus(self):
        """Click on the center of the page so keyboard events navigate properly."""
        if not self.page:
            return
        try:
            viewport = self.page.viewport_size or {"width": 1280, "height": 800}
            await self.page.mouse.click(viewport["width"] // 2, viewport["height"] // 2)
        except Exception:
            pass

    async def navigate_recommend(self):
        """Navigate to the main recommend video feed."""
        if not self.page:
            raise RuntimeError("Browser not connected")
        target_url = "https://www.douyin.com/?recommend=1"
        logger.info("[%s] Navigating to %s", self.profile_name, target_url)
        await self.page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
        await asyncio.sleep(4)
        await self.dismiss_modals()
        await self.ensure_focus()

    async def next_video(self):
        """Scroll down / switch to the next video."""
        if not self.page:
            return
        await self.page.keyboard.press("ArrowDown")
        await asyncio.sleep(1.0 + random.uniform(0.2, 0.8))

    async def like_current_video(self) -> bool:
        """Like current video (press 'z' shortcut or click like button)."""
        if not self.page:
            return False
        try:
            # Shortcut 'z' likes current video on Douyin desktop
            await self.page.keyboard.press("z")
            await asyncio.sleep(0.5)
            return True
        except Exception as e:
            logger.debug("[%s] Like failed: %s", self.profile_name, e)
            return False

    async def favorite_current_video(self) -> bool:
        """Favorite current video (press 'x' shortcut on Douyin)."""
        if not self.page:
            return False
        try:
            await self.page.keyboard.press("x")
            await asyncio.sleep(0.5)
            return True
        except Exception as e:
            logger.debug("[%s] Favorite failed: %s", self.profile_name, e)
            return False

    async def post_comment(self, text: str) -> bool:
        """Post a comment on current video."""
        if not self.page:
            return False
        try:
            # Douyin comment input selector
            input_sel = "[data-e2e='comment-input'], .comment-input-inner, textarea[placeholder*='善意']"
            el = await self.page.query_selector(input_sel)
            if not el:
                # Open comment sidebar if closed
                comment_btn = await self.page.query_selector("[data-e2e='comment-icon'], .comment-icon")
                if comment_btn:
                    await comment_btn.click()
                    await asyncio.sleep(1.0)
                    el = await self.page.query_selector(input_sel)

            if el:
                await el.click()
                await asyncio.sleep(0.5)
                # Type with humanized typing delay
                for char in text:
                    await self.page.keyboard.type(char, delay=random.randint(50, 150))
                await asyncio.sleep(0.8)
                await self.page.keyboard.press("Enter")
                await asyncio.sleep(1.5)
                return True
        except Exception as e:
            logger.warning("[%s] Comment post failed: %s", self.profile_name, e)
        return False

    async def check_login_status(self) -> dict[str, Any]:
        """Check if profile is logged into Douyin, extract nickname and avatar if available."""
        if not self.page:
            raise RuntimeError("Browser not connected")
        try:
            await self.page.goto("https://www.douyin.com", wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(3)
            await self.dismiss_modals()

            # Look for user avatar / profile link
            avatar_sel = ".avatar-component-avatar img, [data-e2e='user-avatar'] img, .header-author-avatar img"
            avatar_el = await self.page.query_selector(avatar_sel)
            
            is_logged_in = avatar_el is not None
            avatar_url = await avatar_el.get_attribute("src") if avatar_el else None

            # Get nickname
            name_sel = ".author-name, .user-name, [data-e2e='user-name']"
            name_el = await self.page.query_selector(name_sel)
            nickname = await name_el.inner_text() if name_el else None

            return {
                "logged_in": is_logged_in,
                "nickname": nickname,
                "avatar_url": avatar_url,
                "status": "valid" if is_logged_in else "guest",
            }
        except Exception as e:
            logger.warning("[%s] Login check failed: %s", self.profile_name, e)
            return {"logged_in": False, "status": "unknown", "error": str(e)}

    async def get_cookies(self) -> list[dict[str, Any]]:
        """Export all session cookies from browser context."""
        if not self.context:
            return []
        try:
            return await self.context.cookies()
        except Exception as e:
            logger.warning("[%s] Failed to get cookies: %s", self.profile_name, e)
            return []

    async def set_cookies(self, cookies: list[dict[str, Any]]) -> bool:
        """Import cookies into browser context."""
        if not self.context:
            return False
        try:
            await self.context.add_cookies(cookies)
            return True
        except Exception as e:
            logger.warning("[%s] Failed to set cookies: %s", self.profile_name, e)
            return False

    async def open_login_assistant(self, timeout_sec: int = 120) -> dict[str, Any]:
        """
        Open Douyin login dialog on the live browser and monitor until user logs in or timeout.
        """
        if not self.page:
            raise RuntimeError("Browser not connected")

        logger.info("[%s] Opening Douyin Login Assistant...", self.profile_name)
        await self.page.goto("https://www.douyin.com", wait_until="domcontentloaded", timeout=45000)
        await asyncio.sleep(2)

        # Click login button if not logged in
        login_btn = await self.page.query_selector("button:has-text('登录'), .header-login-button, [data-e2e='login-button']")
        if login_btn:
            try:
                await login_btn.click()
            except Exception:
                pass

        # Poll every 2 seconds to check if login succeeds
        deadline = asyncio.get_running_loop().time() + timeout_sec
        while asyncio.get_running_loop().time() < deadline:
            avatar_sel = ".avatar-component-avatar img, [data-e2e='user-avatar'] img, .header-author-avatar img"
            avatar_el = await self.page.query_selector(avatar_sel)
            if avatar_el:
                avatar_url = await avatar_el.get_attribute("src")
                name_sel = ".author-name, .user-name, [data-e2e='user-name']"
                name_el = await self.page.query_selector(name_sel)
                nickname = await name_el.inner_text() if name_el else None
                cookies = await self.get_cookies()

                logger.info("[%s] Login success detected! Nickname: %s", self.profile_name, nickname)
                return {
                    "logged_in": True,
                    "nickname": nickname,
                    "avatar_url": avatar_url,
                    "cookies_count": len(cookies),
                    "status": "valid",
                }
            await asyncio.sleep(2)

        return {"logged_in": False, "status": "timeout", "error": "Login timeout"}

