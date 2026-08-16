"""SQLite database operations for browser profiles."""

from __future__ import annotations

import datetime
import json
import random
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from .runtime import resolve_runtime

RUNTIME = resolve_runtime()
DATA_DIR = RUNTIME.data_dir
DB_PATH = DATA_DIR / "profiles.db"


@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                fingerprint_seed INTEGER NOT NULL,
                proxy TEXT,
                timezone TEXT,
                locale TEXT,
                platform TEXT DEFAULT 'windows',
                user_agent TEXT,
                screen_width INTEGER DEFAULT 1920,
                screen_height INTEGER DEFAULT 1080,
                gpu_vendor TEXT,
                gpu_renderer TEXT,
                hardware_concurrency INTEGER,
                humanize BOOLEAN DEFAULT 0,
                human_preset TEXT DEFAULT 'default',
                headless BOOLEAN DEFAULT 0,
                geoip BOOLEAN DEFAULT 0,
                clipboard_sync BOOLEAN DEFAULT 1,
                auto_launch BOOLEAN DEFAULT 0,
                color_scheme TEXT,
                notes TEXT,
                user_data_dir TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profile_tags (
                profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
                tag TEXT NOT NULL,
                color TEXT,
                PRIMARY KEY (profile_id, tag)
            );

            CREATE TABLE IF NOT EXISTS douyin_accounts (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                nickname TEXT,
                douyin_id TEXT,
                avatar_url TEXT,
                follower_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0,
                cookie_status TEXT DEFAULT 'unknown',
                proxy_url TEXT,
                tags TEXT DEFAULT '[]',
                last_active_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS workflows (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                action_type TEXT NOT NULL,
                config_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS action_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT NOT NULL,
                action_type TEXT NOT NULL,
                target_id TEXT,
                content TEXT,
                status TEXT DEFAULT 'success',
                created_at TEXT NOT NULL
            );
        """)
        conn.commit()

        # Migrations for existing databases
        cols = {row[1] for row in conn.execute("PRAGMA table_info(profiles)").fetchall()}
        if "clipboard_sync" not in cols:
            conn.execute("ALTER TABLE profiles ADD COLUMN clipboard_sync BOOLEAN DEFAULT 1")
            conn.commit()
        if "launch_args" not in cols:
            conn.execute("ALTER TABLE profiles ADD COLUMN launch_args TEXT DEFAULT '[]'")
            conn.commit()
        if "auto_launch" not in cols:
            conn.execute("ALTER TABLE profiles ADD COLUMN auto_launch BOOLEAN DEFAULT 0")
            conn.commit()


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def create_profile(
    name: str,
    fingerprint_seed: int | None = None,
    **fields: Any,
) -> dict[str, Any]:
    profile_id = str(uuid.uuid4())
    seed = fingerprint_seed if fingerprint_seed is not None else random.randint(10000, 99999)
    user_data_dir = str(DATA_DIR / "profiles" / profile_id)
    now = _now()
    tags = fields.pop("tags", None) or []

    with get_db() as conn:
        conn.execute(
            """INSERT INTO profiles (
                id, name, fingerprint_seed, proxy, timezone, locale, platform,
                user_agent, screen_width, screen_height, gpu_vendor, gpu_renderer,
                hardware_concurrency, humanize, human_preset, headless, geoip,
                clipboard_sync, auto_launch, color_scheme, launch_args, notes,
                user_data_dir, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                profile_id, name, seed,
                fields.get("proxy"),
                fields.get("timezone"),
                fields.get("locale"),
                fields.get("platform", "windows"),
                fields.get("user_agent"),
                fields.get("screen_width", 1920),
                fields.get("screen_height", 1080),
                fields.get("gpu_vendor"),
                fields.get("gpu_renderer"),
                fields.get("hardware_concurrency"),
                fields.get("humanize", False),
                fields.get("human_preset", "default"),
                fields.get("headless", False),
                fields.get("geoip", False),
                fields.get("clipboard_sync", True),
                fields.get("auto_launch", False),
                fields.get("color_scheme"),
                json.dumps(fields.get("launch_args") or []),
                fields.get("notes"),
                user_data_dir, now, now,
            ),
        )
        for t in tags:
            conn.execute(
                "INSERT INTO profile_tags (profile_id, tag, color) VALUES (?, ?, ?)",
                (profile_id, t["tag"], t.get("color")),
            )
        conn.commit()

    return get_profile(profile_id)  # type: ignore[return-value]


def get_profile(profile_id: str) -> dict[str, Any] | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
        if not row:
            return None
        profile = dict(row)
        profile["launch_args"] = json.loads(profile.get("launch_args") or "[]")
        tags = conn.execute(
            "SELECT tag, color FROM profile_tags WHERE profile_id = ?",
            (profile_id,),
        ).fetchall()
        profile["tags"] = [dict(t) for t in tags]
        return profile


def list_profiles() -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM profiles ORDER BY created_at DESC").fetchall()
        profiles = []
        for row in rows:
            profile = dict(row)
            profile["launch_args"] = json.loads(profile.get("launch_args") or "[]")
            tags = conn.execute(
                "SELECT tag, color FROM profile_tags WHERE profile_id = ?",
                (profile["id"],),
            ).fetchall()
            profile["tags"] = [dict(t) for t in tags]
            profiles.append(profile)
        return profiles


def update_profile(profile_id: str, **fields: Any) -> dict[str, Any] | None:
    existing = get_profile(profile_id)
    if not existing:
        return None

    tags = fields.pop("tags", None)

    # Only update fields that were explicitly provided
    update_cols = []
    update_vals = []
    # Pre-serialize launch_args to JSON before the generic update loop
    if "launch_args" in fields:
        fields["launch_args"] = json.dumps(fields["launch_args"] or [])

    for col in (
        "name", "fingerprint_seed", "proxy", "timezone", "locale", "platform",
        "user_agent", "screen_width", "screen_height", "gpu_vendor", "gpu_renderer",
        "hardware_concurrency", "humanize", "human_preset", "headless", "geoip",
        "clipboard_sync", "auto_launch", "color_scheme", "launch_args", "notes",
    ):
        if col in fields:
            update_cols.append(f"{col} = ?")
            update_vals.append(fields[col])

    if update_cols:
        update_cols.append("updated_at = ?")
        update_vals.append(_now())
        update_vals.append(profile_id)
        with get_db() as conn:
            conn.execute(
                f"UPDATE profiles SET {', '.join(update_cols)} WHERE id = ?",
                update_vals,
            )
            conn.commit()

    if tags is not None:
        with get_db() as conn:
            conn.execute("DELETE FROM profile_tags WHERE profile_id = ?", (profile_id,))
            for t in tags:
                conn.execute(
                    "INSERT INTO profile_tags (profile_id, tag, color) VALUES (?, ?, ?)",
                    (profile_id, t["tag"], t.get("color")),
                )
            conn.commit()

    return get_profile(profile_id)


def delete_profile(profile_id: str) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
        conn.commit()
        return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# Douyin Accounts & Workflows Operations
# ---------------------------------------------------------------------------

def create_douyin_account(
    profile_id: str,
    nickname: str | None = None,
    douyin_id: str | None = None,
    avatar_url: str | None = None,
    proxy_url: str | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any]:
    account_id = str(uuid.uuid4())
    now = _now()
    tags_json = json.dumps(tags or [])
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO douyin_accounts (
                id, profile_id, nickname, douyin_id, avatar_url,
                proxy_url, tags, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (account_id, profile_id, nickname, douyin_id, avatar_url, proxy_url, tags_json, now),
        )
        conn.commit()
    return get_douyin_account(account_id) or {}


def list_douyin_accounts() -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT da.*, p.name as profile_name
            FROM douyin_accounts da
            LEFT JOIN profiles p ON da.profile_id = p.id
            ORDER BY da.created_at DESC
            """
        ).fetchall()
        accounts = []
        for r in rows:
            acc = dict(r)
            acc["tags"] = json.loads(acc.get("tags") or "[]")
            accounts.append(acc)
        return accounts


def get_douyin_account(account_id: str) -> dict[str, Any] | None:
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT da.*, p.name as profile_name
            FROM douyin_accounts da
            LEFT JOIN profiles p ON da.profile_id = p.id
            WHERE da.id = ?
            """,
            (account_id,),
        ).fetchone()
        if not row:
            return None
        acc = dict(row)
        acc["tags"] = json.loads(acc.get("tags") or "[]")
        return acc


def update_douyin_account(account_id: str, **fields: Any) -> dict[str, Any] | None:
    if "tags" in fields and isinstance(fields["tags"], list):
        fields["tags"] = json.dumps(fields["tags"])

    cols = []
    vals = []
    for col in (
        "nickname", "douyin_id", "avatar_url", "follower_count",
        "following_count", "cookie_status", "proxy_url", "tags", "last_active_at"
    ):
        if col in fields:
            cols.append(f"{col} = ?")
            vals.append(fields[col])

    if cols:
        vals.append(account_id)
        with get_db() as conn:
            conn.execute(f"UPDATE douyin_accounts SET {', '.join(cols)} WHERE id = ?", vals)
            conn.commit()
    return get_douyin_account(account_id)


def delete_douyin_account(account_id: str) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM douyin_accounts WHERE id = ?", (account_id,))
        conn.commit()
        return cursor.rowcount > 0


def create_workflow(name: str, action_type: str, config: dict[str, Any]) -> dict[str, Any]:
    wf_id = str(uuid.uuid4())
    now = _now()
    config_json = json.dumps(config)
    with get_db() as conn:
        conn.execute(
            "INSERT INTO workflows (id, name, action_type, config_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (wf_id, name, action_type, config_json, now),
        )
        conn.commit()
    return {"id": wf_id, "name": name, "action_type": action_type, "config": config, "created_at": now}


def list_workflows() -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM workflows ORDER BY created_at DESC").fetchall()
        wfs = []
        for r in rows:
            wf = dict(r)
            wf["config"] = json.loads(wf.get("config_json") or "{}")
            wfs.append(wf)
        return wfs


def delete_workflow(wf_id: str) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM workflows WHERE id = ?", (wf_id,))
        conn.commit()
        return cursor.rowcount > 0


def record_action_log(
    account_id: str,
    action_type: str,
    target_id: str | None = None,
    content: str | None = None,
    status: str = "success",
) -> None:
    now = _now()
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO action_logs (account_id, action_type, target_id, content, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (account_id, action_type, target_id, content, status, now),
        )
        conn.commit()


def list_action_logs(limit: int = 50) -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT al.*, da.nickname as account_name
            FROM action_logs al
            LEFT JOIN douyin_accounts da ON al.account_id = da.id
            ORDER BY al.created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]

