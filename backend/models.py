"""Pydantic models for profile CRUD operations."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from .runtime import HostOS, RuntimeMode, ViewerMode


class ProfileCreate(BaseModel):
    name: str
    fingerprint_seed: int | None = None  # random if not set
    proxy: str | None = None  # "http://user:pass@host:port" or null
    timezone: str | None = None  # "America/New_York"
    locale: str | None = None  # "en-US"
    platform: Literal["windows", "macos", "linux"] = "windows"
    user_agent: str | None = None
    screen_width: int = 1920
    screen_height: int = 1080
    gpu_vendor: str | None = None
    gpu_renderer: str | None = None
    hardware_concurrency: int | None = None
    humanize: bool = False
    human_preset: Literal["default", "careful"] = "default"
    headless: bool = False
    geoip: bool = False
    clipboard_sync: bool = True
    auto_launch: bool = False
    color_scheme: Literal["light", "dark", "no-preference"] | None = None
    launch_args: list[str] = Field(default_factory=list)
    notes: str | None = None
    tags: list[TagCreate] | None = None


class ProfileUpdate(BaseModel):
    name: str | None = None
    fingerprint_seed: int | None = None
    proxy: str | None = Field(default=None)
    timezone: str | None = Field(default=None)
    locale: str | None = Field(default=None)
    platform: Literal["windows", "macos", "linux"] | None = None
    user_agent: str | None = Field(default=None)
    screen_width: int | None = None
    screen_height: int | None = None
    gpu_vendor: str | None = Field(default=None)
    gpu_renderer: str | None = Field(default=None)
    hardware_concurrency: int | None = Field(default=None)
    humanize: bool | None = None
    human_preset: Literal["default", "careful"] | None = None
    headless: bool | None = None
    geoip: bool | None = None
    clipboard_sync: bool | None = None
    auto_launch: bool | None = None
    color_scheme: Literal["light", "dark", "no-preference"] | None = Field(default=None)
    launch_args: list[str] | None = None
    notes: str | None = Field(default=None)
    tags: list[TagCreate] | None = None


class TagCreate(BaseModel):
    tag: str
    color: str | None = None  # hex color


class TagResponse(BaseModel):
    tag: str
    color: str | None = None


class ProfileResponse(BaseModel):
    id: str
    name: str
    fingerprint_seed: int
    proxy: str | None = None
    timezone: str | None = None
    locale: str | None = None
    platform: str = "windows"
    user_agent: str | None = None
    screen_width: int = 1920
    screen_height: int = 1080
    gpu_vendor: str | None = None
    gpu_renderer: str | None = None
    hardware_concurrency: int | None = None
    humanize: bool = False
    human_preset: str = "default"
    headless: bool = False
    geoip: bool = False
    clipboard_sync: bool = True
    auto_launch: bool = False

    @field_validator("clipboard_sync", mode="before")
    @classmethod
    def coerce_clipboard_sync(cls, v: object) -> bool:
        return True if v is None else bool(v)

    color_scheme: str | None = None
    launch_args: list[str] = []
    notes: str | None = None
    user_data_dir: str
    created_at: str
    updated_at: str
    tags: list[TagResponse] = []
    status: str = "stopped"  # "running" | "stopped"
    runtime_mode: RuntimeMode = "docker"
    viewer_mode: ViewerMode = "vnc"
    vnc_ws_port: int | None = None
    cdp_url: str | None = None


class LaunchResponse(BaseModel):
    profile_id: str
    status: str = "running"
    runtime_mode: RuntimeMode
    viewer_mode: ViewerMode
    vnc_ws_port: int | None = None
    display: str | None = None
    cdp_url: str | None = None


class StatusResponse(BaseModel):
    running_count: int
    binary_version: str
    profiles_total: int
    host_os: HostOS
    runtime_mode: RuntimeMode
    viewer_mode: ViewerMode


class ProfileStatusResponse(BaseModel):
    status: str  # "running" | "stopped"
    runtime_mode: RuntimeMode
    viewer_mode: ViewerMode
    vnc_ws_port: int | None = None
    display: str | None = None
    cdp_url: str | None = None


class ClipboardRequest(BaseModel):
    text: str = Field(max_length=1_048_576)  # 1MB max


class LoginRequest(BaseModel):
    token: str


# ---------------------------------------------------------------------------
# Douyin Matrix Automation Models
# ---------------------------------------------------------------------------

class DouyinAccountCreate(BaseModel):
    profile_id: str
    nickname: str | None = None
    douyin_id: str | None = None
    proxy_url: str | None = None
    tags: list[str] = Field(default_factory=list)


class DouyinAccountUpdate(BaseModel):
    nickname: str | None = None
    douyin_id: str | None = None
    avatar_url: str | None = None
    follower_count: int | None = None
    following_count: int | None = None
    cookie_status: str | None = None
    proxy_url: str | None = None
    tags: list[str] | None = None


class DouyinAccountResponse(BaseModel):
    id: str
    profile_id: str
    profile_name: str | None = None
    profile_status: str | None = None
    nickname: str | None = None
    douyin_id: str | None = None
    avatar_url: str | None = None
    follower_count: int = 0
    following_count: int = 0
    cookie_status: str = "unknown"
    proxy_url: str | None = None
    tags: list[str] = []
    last_active_at: str | None = None
    created_at: str


class WorkflowCreate(BaseModel):
    name: str
    action_type: Literal["warmup", "search_interact", "live_interact", "uploader"] = "warmup"
    config: dict[str, Any] = Field(default_factory=dict)


class WorkflowResponse(BaseModel):
    id: str
    name: str
    action_type: str
    config: dict[str, Any]
    created_at: str


class TaskDispatchReq(BaseModel):
    profile_ids: list[str]
    action_type: Literal["warmup", "search_interact", "live_interact", "uploader"] = "warmup"
    config: dict[str, Any] = Field(default_factory=dict)


class AICommentReq(BaseModel):
    video_title: str
    language: Literal["zh", "vi"] = "zh"
    style: str = "positive"


class BatchProxyCheckReq(BaseModel):
    proxies: list[str]


class BatchProxyAssignReq(BaseModel):
    proxies: list[str]
    profile_ids: list[str]
    geoip: bool = True


class BatchProfileWithProxyReq(BaseModel):
    proxies: list[str]
    name_prefix: str = "Douyin Profile"
    platform: Literal["windows", "macos", "linux"] = "windows"
    geoip: bool = True


class BatchAccountImportReq(BaseModel):
    raw_text: str | None = None
    accounts: list[dict[str, Any]] = Field(default_factory=list)


class CookieImportReq(BaseModel):
    cookies: list[dict[str, Any]]


class ScheduleCreateReq(BaseModel):
    name: str
    action_type: Literal["warmup", "search_interact", "live_interact", "uploader"] = "warmup"
    profile_ids: list[str]
    config: dict[str, Any] = Field(default_factory=dict)
    schedule_type: Literal["daily_time", "interval_hours", "interval_minutes", "once_at"] = "daily_time"
    schedule_value: str = "08:30"


class ScheduleUpdateReq(BaseModel):
    name: str | None = None
    action_type: Literal["warmup", "search_interact", "live_interact", "uploader"] | None = None
    profile_ids: list[str] | None = None
    config: dict[str, Any] | None = None
    schedule_type: Literal["daily_time", "interval_hours", "interval_minutes", "once_at"] | None = None
    schedule_value: str | None = None
    is_active: bool | None = None


class ScheduleResponse(BaseModel):
    id: str
    name: str
    action_type: str
    profile_ids: list[str]
    config: dict[str, Any]
    schedule_type: str
    schedule_value: str
    is_active: bool
    last_run_at: str | None = None
    next_run_at: str | None = None
    created_at: str



