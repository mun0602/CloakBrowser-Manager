/**
 * API client for CloakBrowser Manager backend.
 */

export type HostOS = "windows" | "macos" | "linux";
export type RuntimeMode = "native" | "docker";
export type ViewerMode = "native-window" | "vnc";

export interface Profile {
  id: string;
  name: string;
  fingerprint_seed: number;
  proxy: string | null;
  timezone: string | null;
  locale: string | null;
  platform: string;
  user_agent: string | null;
  screen_width: number;
  screen_height: number;
  gpu_vendor: string | null;
  gpu_renderer: string | null;
  hardware_concurrency: number | null;
  humanize: boolean;
  human_preset: string;
  headless: boolean;
  geoip: boolean;
  clipboard_sync: boolean;
  auto_launch: boolean;
  color_scheme: string | null;
  launch_args: string[];
  notes: string | null;
  user_data_dir: string;
  created_at: string;
  updated_at: string;
  tags: { tag: string; color: string | null }[];
  status: "running" | "stopped";
  runtime_mode: RuntimeMode;
  viewer_mode: ViewerMode;
  vnc_ws_port: number | null;
  cdp_url: string | null;
}

export interface ProfileCreateData {
  name: string;
  fingerprint_seed?: number | null;
  proxy?: string | null;
  timezone?: string | null;
  locale?: string | null;
  platform?: string;
  user_agent?: string | null;
  screen_width?: number;
  screen_height?: number;
  gpu_vendor?: string | null;
  gpu_renderer?: string | null;
  hardware_concurrency?: number | null;
  humanize?: boolean;
  human_preset?: string;
  headless?: boolean;
  geoip?: boolean;
  clipboard_sync?: boolean;
  auto_launch?: boolean;
  color_scheme?: string | null;
  launch_args?: string[];
  notes?: string | null;
  tags?: { tag: string; color: string | null }[];
}

export interface LaunchResult {
  profile_id: string;
  status: string;
  runtime_mode: RuntimeMode;
  viewer_mode: ViewerMode;
  vnc_ws_port: number | null;
  display: string | null;
  cdp_url: string | null;
}

export interface SystemStatus {
  running_count: number;
  binary_version: string;
  profiles_total: number;
  host_os: HostOS;
  runtime_mode: RuntimeMode;
  viewer_mode: ViewerMode;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Global 401 callback — set by App to trigger login page on auth failure
let _onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: (() => void) | null) {
  _onUnauthorized = cb;
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401 && _onUnauthorized) {
      _onUnauthorized();
      throw new ApiError(401, "Unauthorized");
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  authStatus: () =>
    request<{ auth_required: boolean; authenticated: boolean }>("/api/auth/status"),

  login: (token: string) =>
    request<{ ok: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  listProfiles: () => request<Profile[]>("/api/profiles"),

  getProfile: (id: string) => request<Profile>(`/api/profiles/${id}`),

  createProfile: (data: ProfileCreateData) =>
    request<Profile>("/api/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProfile: (id: string, data: Partial<ProfileCreateData>) =>
    request<Profile>(`/api/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProfile: (id: string) =>
    request<{ ok: boolean }>(`/api/profiles/${id}`, { method: "DELETE" }),

  launchProfile: (id: string) =>
    request<LaunchResult>(`/api/profiles/${id}/launch`, { method: "POST" }),

  stopProfile: (id: string) =>
    request<{ ok: boolean }>(`/api/profiles/${id}/stop`, { method: "POST" }),

  getStatus: () => request<SystemStatus>("/api/status"),

  setClipboard: (id: string, text: string) =>
    request<{ ok: boolean }>(`/api/profiles/${id}/clipboard`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  getClipboard: (id: string) =>
    request<{ text: string }>(`/api/profiles/${id}/clipboard`),

  // Douyin API methods
  listDouyinAccounts: () => request<DouyinAccount[]>("/api/douyin/accounts"),

  createDouyinAccount: (data: { profile_id: string; nickname?: string; douyin_id?: string; proxy_url?: string; tags?: string[] }) =>
    request<DouyinAccount>("/api/douyin/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDouyinAccount: (id: string, data: Partial<DouyinAccount>) =>
    request<DouyinAccount>(`/api/douyin/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteDouyinAccount: (id: string) =>
    request<{ success: boolean }>(`/api/douyin/accounts/${id}`, { method: "DELETE" }),

  checkDouyinLogin: (id: string) =>
    request<{ logged_in: boolean; nickname?: string; avatar_url?: string; status: string }>(
      `/api/douyin/accounts/${id}/check-login`,
      { method: "POST" }
    ),

  listDouyinWorkflows: () => request<DouyinWorkflow[]>("/api/douyin/workflows"),

  createDouyinWorkflow: (data: { name: string; action_type: string; config: Record<string, any> }) =>
    request<DouyinWorkflow>("/api/douyin/workflows", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteDouyinWorkflow: (id: string) =>
    request<{ success: boolean }>(`/api/douyin/workflows/${id}`, { method: "DELETE" }),

  dispatchDouyinTasks: (data: { profile_ids: string[]; action_type: string; config: Record<string, any> }) =>
    request<{ success: boolean; dispatched_count: number; task_ids: string[] }>("/api/douyin/tasks/dispatch", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listDouyinTasks: () => request<DouyinTask[]>("/api/douyin/tasks"),

  generateAIComment: (data: { video_title: string; language?: string; style?: string }) =>
    request<{ comment: string }>("/api/douyin/ai/comment", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export interface DouyinAccount {
  id: string;
  profile_id: string;
  profile_name?: string;
  profile_status?: "running" | "stopped";
  nickname?: string;
  douyin_id?: string;
  avatar_url?: string;
  follower_count: number;
  following_count: number;
  cookie_status: string;
  proxy_url?: string;
  tags: string[];
  last_active_at?: string;
  created_at: string;
}

export interface DouyinWorkflow {
  id: string;
  name: string;
  action_type: "warmup" | "search_interact" | "live_interact" | "uploader";
  config: Record<string, any>;
  created_at: string;
}

export interface DouyinTask {
  id: string;
  profile_id: string;
  profile_name: string;
  action_type: string;
  config: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed";
  progress_current: number;
  progress_total: number;
  logs: { time: string; message: string; level: string }[];
  started_at?: string;
  finished_at?: string;
  result?: any;
  error?: string;
}

