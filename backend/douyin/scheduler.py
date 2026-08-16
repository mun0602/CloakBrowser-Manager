"""Douyin Multi-Worker Task Scheduler and Dispatcher."""

from __future__ import annotations

import asyncio
import datetime
import json
import logging
import uuid
from typing import Any, Callable
from .client import DouyinClient
from .actions.warmup import run_warmup
from .actions.search_interact import run_search_interact
from .actions.live_interact import run_live_interact
from .actions.uploader import run_uploader

logger = logging.getLogger("cloakbrowser.douyin.scheduler")


class DouyinTaskScheduler:
    """Manages concurrent execution of Douyin automation tasks."""

    def __init__(self, browser_manager: Any, max_concurrent: int = 3):
        self.browser_manager = browser_manager
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_tasks: dict[str, dict[str, Any]] = {}
        self.listeners: list[Callable[[dict[str, Any]], Any]] = []

    def register_listener(self, callback: Callable[[dict[str, Any]], Any]):
        """Register a callback for task state updates (e.g. WebSocket)."""
        self.listeners.append(callback)

    async def _broadcast(self, event_type: str, data: dict[str, Any]):
        message = {"event": event_type, "data": data, "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}
        for listener in list(self.listeners):
            try:
                res = listener(message)
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass

    async def submit_task(
        self,
        profile_id: str,
        profile_name: str,
        action_type: str,
        config: dict[str, Any],
        task_id: str | None = None,
    ) -> str:
        """Submit a new Douyin automation task into the queue."""
        t_id = task_id or str(uuid.uuid4())
        task_info = {
            "id": t_id,
            "profile_id": profile_id,
            "profile_name": profile_name,
            "action_type": action_type,
            "config": config,
            "status": "pending",
            "progress_current": 0,
            "progress_total": int(config.get("video_count", 10)),
            "logs": [],
            "started_at": None,
            "finished_at": None,
            "result": None,
            "error": None,
        }
        self.active_tasks[t_id] = task_info
        await self._broadcast("task_created", task_info)

        # Spawn background worker
        asyncio.create_task(self._run_task_worker(t_id))
        return t_id

    async def _run_task_worker(self, task_id: str):
        task = self.active_tasks.get(task_id)
        if not task:
            return

        async with self.semaphore:
            task["status"] = "running"
            task["started_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            await self._broadcast("task_started", task)

            profile_id = task["profile_id"]
            profile_name = task["profile_name"]
            action_type = task["action_type"]
            config = task["config"]

            client: DouyinClient | None = None
            try:
                # 1. Launch profile if not running
                from ..database import get_profile
                profile_record = get_profile(profile_id)
                if not profile_record:
                    raise RuntimeError(f"Profile {profile_id} not found in database")

                running = self.browser_manager.running.get(profile_id)
                if not running:
                    running = await self.browser_manager.launch(profile_record)

                cdp_url = f"http://127.0.0.1:8080/api/profiles/{profile_id}/cdp"
                client = DouyinClient(cdp_url=cdp_url, profile_name=profile_name)

                async def task_logger(msg: str, level: str = "info"):
                    entry = {"time": datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S"), "message": msg, "level": level}
                    task["logs"].append(entry)
                    await self._broadcast("task_log", {"task_id": task_id, "log": entry})

                # 2. Dispatch action
                if action_type == "warmup":
                    res = await run_warmup(client, config, log_callback=task_logger)
                elif action_type == "search_interact":
                    res = await run_search_interact(client, config, log_callback=task_logger)
                elif action_type == "live_interact":
                    res = await run_live_interact(client, config, log_callback=task_logger)
                elif action_type == "uploader":
                    res = await run_uploader(client, config, log_callback=task_logger)
                else:
                    raise ValueError(f"Unknown action type: {action_type}")

                task["status"] = "completed"
                task["result"] = res
                task["progress_current"] = task["progress_total"]
            except Exception as e:
                logger.error("Task %s failed: %s", task_id, e, exc_info=True)
                task["status"] = "failed"
                task["error"] = str(e)
            finally:
                task["finished_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                if client:
                    await client.close()
                await self._broadcast("task_finished", task)

    def get_tasks(self) -> list[dict[str, Any]]:
        return list(self.active_tasks.values())

    def get_task(self, task_id: str) -> dict[str, Any] | None:
        return self.active_tasks.get(task_id)
