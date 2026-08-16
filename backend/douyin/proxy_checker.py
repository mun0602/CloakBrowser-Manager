"""Proxy checking and batch utilities."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any
import httpx

logger = logging.getLogger("cloakbrowser.proxy_checker")


def parse_proxy_line(raw: str) -> dict[str, str] | None:
    """
    Parse a raw proxy string into standard format.
    Accepts:
      - protocol://user:pass@host:port
      - protocol://host:port
      - host:port:user:pass
      - host:port
    """
    raw = raw.strip()
    if not raw or raw.startswith("#"):
        return None

    if raw.startswith(("http://", "https://", "socks5://")):
        return {"url": raw, "type": raw.split("://")[0]}

    parts = raw.split(":")
    if len(parts) == 4:
        host, port, user, passwd = parts
        return {"url": f"http://{user}:{passwd}@{host}:{port}", "type": "http"}
    elif len(parts) == 2:
        host, port = parts
        return {"url": f"http://{host}:{port}", "type": "http"}
    return None


async def check_proxy_latency(proxy_url: str, timeout: float = 8.0) -> dict[str, Any]:
    """Test proxy connectivity, measuring latency and resolving external IP/Country."""
    start_t = time.time()
    try:
        async with httpx.AsyncClient(proxy=proxy_url, timeout=timeout) as client:
            resp = await client.get("https://api.ipify.org?format=json")
            latency_ms = int((time.time() - start_t) * 1000)
            if resp.status_code == 200:
                ip = resp.json().get("ip")
                return {
                    "proxy": proxy_url,
                    "valid": True,
                    "ip": ip,
                    "latency_ms": latency_ms,
                    "error": None,
                }
            else:
                return {
                    "proxy": proxy_url,
                    "valid": False,
                    "ip": None,
                    "latency_ms": latency_ms,
                    "error": f"HTTP {resp.status_code}",
                }
    except Exception as e:
        latency_ms = int((time.time() - start_t) * 1000)
        return {
            "proxy": proxy_url,
            "valid": False,
            "ip": None,
            "latency_ms": latency_ms,
            "error": str(e)[:100],
        }


async def batch_check_proxies(proxy_lines: list[str], max_concurrent: int = 10) -> list[dict[str, Any]]:
    """Check a list of proxy strings concurrently."""
    parsed_list = [p for line in proxy_lines if (p := parse_proxy_line(line))]
    semaphore = asyncio.Semaphore(max_concurrent)

    async def _check(item: dict[str, str]):
        async with semaphore:
            return await check_proxy_latency(item["url"])

    tasks = [_check(item) for item in parsed_list]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    return results
