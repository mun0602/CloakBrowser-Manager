"""Douyin Multi-Worker Task Scheduler, Dispatcher, and Automated Cron Engine."""

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


def compute_next_run(schedule_type: str, schedule_value: str, from_dt: datetime.datetime | None = None) -> datetime.datetime | None:
    """Calculate the next execution timestamp based on schedule type and value."""
    now = from_dt or datetime.datetime.now(datetime.timezone.utc)

    if schedule_type == "daily_time":
        # schedule_value: "HH:MM" (e.g. "08:30" or multiple comma-separated "08:30,12:00,20:00")
        times = [t.strip() for t in schedule_value.split(",") if t.strip()]
        candidates = []
        for t_str in times:
            try:
                parts = t_str.split(":")
                hour, minute = int(parts[0]), int(parts[1])
                # Check for today
                cand = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if cand <= now:
                    # Move to tomorrow
                    cand += datetime.timedelta(days=1)
                candidates.append(cand)
            except Exception:
                pass
        if candidates:
            return min(candidates)
        return now + datetime.timedelta(days=1)

    elif schedule_type == "interval_hours":
        # schedule_value: integer or float hours (e.g. "2" or "4")
        try:
            hours = float(schedule_value)
            return now + datetime.timedelta(hours=hours)
        except Exception:
            return now + datetime.timedelta(hours=2)

    elif schedule_type == "interval_minutes":
        # schedule_value: integer minutes (e.g. "30" or "60")
        try:
            mins = float(schedule_value)
            return now + datetime.timedelta(minutes=mins)
        except Exception:
            return now + datetime.timedelta(minutes=30)

    elif schedule_type == "once_at":
        # schedule_value: ISO string (e.g. "2026-08-17T09:00:00")
        try:
            dt = datetime.datetime.fromisoformat(schedule_value)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            return dt if dt > now else None
        except Exception:
            return None

    return now + datetime.timedelta(hours=1)


class DouyinTaskScheduler:
    """Manages concurrent execution and automated cron scheduling of Douyin automation tasks."""

    def __init__(self, browser_manager: Any, max_concurrent: int = 3):
        self.browser_manager = browser_manager
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_tasks: dict[str, dict[str, Any]] = {}
        self.listeners: list[Callable[[dict[str, Any]], Any]] = []
        self._cron_task: asyncio.Task | None = None

    def start(self):
        """Start the background cron loop."""
        if not self._cron_task or self._cron_task.done():
            self._cron_task = asyncio.create_task(self._cron_loop())
            logger.info("Douyin Automated Cron Engine started.")

    def register_listener(self, callback: Callable[[dict[str, Any]], Any]):
        """Register a callback for task state updates (e.g. WebSocket)."""
        self.listeners.append(callback)

    async def _broadcast(self, event_type: str, data: dict[str, Any]):
        message = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
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
                from ..database import get_profile, record_action_log
                profile_record = get_profile(profile_id)
                if not profile_record:
                    raise RuntimeError(f"Profile {profile_id} not found in database")

                running = self.browser_manager.running.get(profile_id)
                if not running:
                    running = await self.browser_manager.launch(profile_record)

                cdp_url = f"http://127.0.0.1:8080/api/profiles/{profile_id}/cdp"
                client = DouyinClient(cdp_url=cdp_url, profile_name=profile_name)

                async def task_logger(msg: str, level: str = "info"):
                    entry = {
                        "time": datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S"),
                        "message": msg,
                        "level": level,
                    }
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

                # Record database action log
                try:
                    record_action_log(
                        account_id=profile_id,
                        action_type=action_type,
                        content=json.dumps(res, ensure_ascii=False),
                        status="success",
                    )
                except Exception:
                    pass

            except Exception as e:
                logger.error("Task %s failed: %s", task_id, e, exc_info=True)
                task["status"] = "failed"
                task["error"] = str(e)
            finally:
                task["finished_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                if client:
                    await client.close()
                await self._broadcast("task_finished", task)

    async def trigger_schedule(self, sch_id: str) -> list[str]:
        """Manually or automatically trigger all profile tasks for a given schedule."""
        from ..database import get_schedule, update_schedule, get_profile
        sch = get_schedule(sch_id)
        if not sch:
            raise ValueError("Schedule not found")

        profile_ids = sch.get("profile_ids", [])
        action_type = sch.get("action_type", "warmup")
        config = sch.get("config", {})

        task_ids = []
        for pid in profile_ids:
            p = get_profile(pid)
            p_name = p.get("name", pid) if p else pid
            tid = await self.submit_task(
                profile_id=pid,
                profile_name=p_name,
                action_type=action_type,
                config=config,
            )
            task_ids.append(tid)

        # Update last_run_at and next_run_at
        now = datetime.datetime.now(datetime.timezone.utc)
        next_run = compute_next_run(sch["schedule_type"], sch["schedule_value"], from_dt=now)
        update_schedule(
            sch_id,
            last_run_at=now.isoformat(),
            next_run_at=next_run.isoformat() if next_run else None,
            is_active=False if sch["schedule_type"] == "once_at" else sch["is_active"],
        )

        await self._broadcast("schedule_triggered", {"schedule_id": sch_id, "task_ids": task_ids})
        return task_ids

    async def _cron_loop(self):
        """Background loop that evaluates active schedules every 20 seconds."""
        from ..database import list_schedules, update_schedule

        while True:
            try:
                await asyncio.sleep(20)
                now = datetime.datetime.now(datetime.timezone.utc)
                active_schedules = list_schedules(only_active=True)

                for sch in active_schedules:
                    sch_id = sch["id"]
                    next_run_str = sch.get("next_run_at")

                    if not next_run_str:
                        # Initialize next_run_at if missing
                        next_dt = compute_next_run(sch["schedule_type"], sch["schedule_value"], from_dt=now)
                        if next_dt:
                            update_schedule(sch_id, next_run_at=next_dt.isoformat())
                        continue

                    try:
                        next_dt = datetime.datetime.fromisoformat(next_run_str)
                        if next_dt.tzinfo is None:
                            next_dt = next_dt.replace(tzinfo=datetime.timezone.utc)

                        # Check if due
                        if now >= next_dt:
                            logger.info("Cron triggering schedule '%s' (%s)", sch.get("name"), sch_id)
                            await self.trigger_schedule(sch_id)
                    except Exception as err:
                        logger.warning("Error evaluating schedule %s: %s", sch_id, err)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in cron loop: %s", e)

    def get_tasks(self) -> list[dict[str, Any]]:
        return list(self.active_tasks.values())

    def get_task(self, task_id: str) -> dict[str, Any] | None:
        return self.active_tasks.get(task_id)
