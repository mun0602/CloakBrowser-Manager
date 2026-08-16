import { useState, useCallback, useEffect } from "react";
import { Lock, PanelLeftClose, PanelLeft, Flame, Globe } from "lucide-react";
import { useProfiles } from "./hooks/useProfiles";
import { api, setOnUnauthorized, type ProfileCreateData } from "./lib/api";
import { ProfileList } from "./components/ProfileList";
import { ProfileForm } from "./components/ProfileForm";
import { ProfileViewer } from "./components/ProfileViewer";
import { NativeWindowStatus } from "./components/NativeWindowStatus";
import { LaunchButton } from "./components/LaunchButton";
import { StatusIndicator } from "./components/StatusIndicator";
import { LoginPage } from "./components/LoginPage";
import { DouyinManager } from "./components/douyin/DouyinManager";

type AuthState = "checking" | "required" | "ok" | "error";
type View = "empty" | "create" | "edit" | "view";
type AppMode = "douyin" | "antidetect";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    setOnUnauthorized(() => setAuthState("required"));

    api.authStatus()
      .then(({ auth_required, authenticated }) => {
        setAuthRequired(auth_required);
        if (!auth_required || authenticated) {
          setAuthState("ok");
        } else {
          setAuthState("required");
        }
      })
      .catch((err) => {
        console.warn("[auth] status check failed:", err);
        setAuthState("error");
      });

    return () => setOnUnauthorized(null);
  }, []);

  if (authState === "checking") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-0">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">Unable to reach the server</p>
          <button
            onClick={() => {
              setAuthState("checking");
              api.authStatus()
                .then(({ auth_required, authenticated }) => {
                  setAuthRequired(auth_required);
                  setAuthState(!auth_required || authenticated ? "ok" : "required");
                })
                .catch(() => setAuthState("error"));
            }}
            className="text-xs text-gray-400 hover:text-gray-200 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (authState === "required") {
    return <LoginPage onSuccess={() => setAuthState("ok")} />;
  }

  return (
    <AppContent
      authRequired={authRequired}
      onLogout={async () => {
        await api.logout();
        setAuthState("required");
      }}
    />
  );
}

interface AppContentProps {
  authRequired: boolean;
  onLogout: () => void;
}

function AppContent({ authRequired, onLogout }: AppContentProps) {
  const { profiles, loading, error, create, update, remove, launch, stop } = useProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("empty");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>("douyin");

  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const profile = profiles.find((p) => p.id === id);
    setView(profile?.status === "running" ? "view" : "edit");
  }, [profiles]);

  const handleNew = useCallback(() => {
    setSelectedId(null);
    setView("create");
  }, []);

  const handleCreate = useCallback(async (data: ProfileCreateData) => {
    const profile = await create(data);
    if (profile) {
      setSelectedId(profile.id);
      setView("edit");
    }
  }, [create]);

  const handleUpdate = useCallback(async (data: ProfileCreateData) => {
    if (!selectedId) return;
    await update(selectedId, data);
  }, [selectedId, update]);

  const handleDelete = useCallback(async () => {
    if (!selectedId) return;
    await remove(selectedId);
    setSelectedId(null);
    setView("empty");
  }, [selectedId, remove]);

  const handleLaunch = useCallback(async (id?: string) => {
    const targetId = id || selectedId;
    if (!targetId) return;
    const result = await launch(targetId);
    if (result && targetId === selectedId) setView("view");
  }, [selectedId, launch]);

  const handleStop = useCallback(async () => {
    if (!selectedId) return;
    await stop(selectedId);
    setView("edit");
  }, [selectedId, stop]);

  const handleVncDisconnect = useCallback(() => {
    setView("edit");
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#08090c] text-zinc-100 selection:bg-rose-500/20 selection:text-rose-300">
      {/* High-End Responsive Studio Header */}
      <header className="h-14 bg-surface-1/90 backdrop-blur-xl border-b border-white/[0.08] px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-bezel-sm">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          {/* Logo & Brand Status */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 flex items-center justify-center font-bold text-xs text-white shadow-glow-rose border border-white/20">
              <Flame className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-extrabold tracking-wider text-white uppercase flex items-center gap-1.5">
                CLOAK MATRIX
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">PRO</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">DOUYIN MULTI-BOT</p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-surface-2/80 border border-white/[0.06] shadow-inner">
            <button
              onClick={() => setAppMode("douyin")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                appMode === "douyin"
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-glow-rose border border-white/20 scale-[1.02]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Douyin Auto</span>
            </button>
            <button
              onClick={() => setAppMode("antidetect")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                appMode === "antidetect"
                  ? "bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-bezel border border-white/20 scale-[1.02]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Antidetect</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-zinc-300 ml-0.5">
                {profiles.length}
              </span>
            </button>
          </div>
        </div>

        {/* Right Status / Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            CDP ENGINE READY
          </div>

          {authRequired && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-surface-2 border border-transparent hover:border-white/10 transition"
              title="Đăng xuất"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Mode View */}
      {appMode === "douyin" ? (
        <DouyinManager
          profiles={profiles}
          onLaunchProfile={(id) => handleLaunch(id)}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-64 border-r border-border bg-surface-1 flex-shrink-0">
              <ProfileList
                profiles={profiles}
                selectedId={selectedId}
                onSelect={handleSelect}
                onNew={handleNew}
              />
            </div>
          )}

          {/* Main panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-500 hover:text-gray-300 p-1"
                  title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </button>
                {selected && (
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={selected.status} size="md" />
                    <span className="text-sm font-medium">{selected.name}</span>
                    <span className="text-xs text-gray-500 capitalize">{selected.platform}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selected && (
                  <LaunchButton
                    status={selected.status}
                    onLaunch={() => handleLaunch()}
                    onStop={handleStop}
                  />
                )}
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="px-4 py-2 bg-red-600/15 border-b border-red-600/30 text-red-400 text-sm">
                {error}
              </div>
            )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {view === "empty" && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Select a profile or create a new one</p>
              </div>
            </div>
          )}

          {view === "create" && (
            <ProfileForm
              profile={null}
              onSave={handleCreate}
              onCancel={() => setView("empty")}
            />
          )}

          {view === "edit" && selected && (
            <ProfileForm
              profile={selected}
              onSave={handleUpdate}
              onDelete={handleDelete}
              onCancel={() => {
                setSelectedId(null);
                setView("empty");
              }}
            />
          )}

          {view === "view" && selected && selected.status === "running" && (
            selected.viewer_mode === "vnc" ? (
              <ProfileViewer
                key={selected.id}
                profileId={selected.id}
                cdpUrl={selected.cdp_url}
                clipboardSync={selected.clipboard_sync}
                onDisconnect={handleVncDisconnect}
              />
            ) : (
              <NativeWindowStatus
                key={selected.id}
                profileName={selected.name}
                cdpUrl={selected.cdp_url}
              />
            )
          )}
        </div>
      </div>
    </div>
      )}
    </div>
  );
}
