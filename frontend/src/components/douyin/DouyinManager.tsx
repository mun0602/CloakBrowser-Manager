import { useState } from "react";
import { UserCheck, Flame, ListFilter, Sparkles, Activity } from "lucide-react";
import { type Profile } from "../../lib/api";
import { DouyinAccountManager } from "./DouyinAccountManager";
import { DouyinWorkflowStudio } from "./DouyinWorkflowStudio";
import { DouyinTaskQueue } from "./DouyinTaskQueue";
import { DouyinAICommenter } from "./DouyinAICommenter";

interface Props {
  profiles: Profile[];
  onLaunchProfile: (id: string) => void;
}

export function DouyinManager({ profiles, onLaunchProfile }: Props) {
  const [activeNav, setActiveNav] = useState<"accounts" | "workflows" | "queue" | "ai">("workflows");

  const navItems = [
    { id: "workflows", label: "Kịch Bản Auto", icon: Flame, badge: "Matrix" },
    { id: "accounts", label: "Tài Khoản Douyin", icon: UserCheck, badge: profiles.length.toString() },
    { id: "queue", label: "Hàng Đợi & Log", icon: ListFilter, badge: "Live" },
    { id: "ai", label: "AI Commenter", icon: Sparkles, badge: "GPT/Gemini" },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08090c] overflow-hidden">
      {/* Sub Header & Responsive Navigation Dock */}
      <div className="bg-surface-1/70 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-bezel-sm">
        {/* Title & Micro Metrics */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Douyin Automation Suite
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Activity className="w-3 h-3 animate-spin" /> v2.4 Native
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden xs:block">
              Điều phối ma trận tương tác và nuôi nick Douyin qua Playwright CDP Stealth
            </p>
          </div>
        </div>

        {/* Responsive Horizontal Dock Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2/90 border border-white/[0.06] overflow-x-auto no-scrollbar shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-glow-rose border border-white/20 scale-[1.01]"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span>{item.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-surface-3 text-zinc-400 border border-white/[0.05]"
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Responsive Viewport */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#08090c] via-[#0b0d13] to-[#08090c]">
        {activeNav === "workflows" && (
          <DouyinWorkflowStudio
            profiles={profiles}
            onTasksDispatched={() => setActiveNav("queue")}
          />
        )}
        {activeNav === "accounts" && (
          <DouyinAccountManager
            profiles={profiles}
            onLaunchProfile={onLaunchProfile}
          />
        )}
        {activeNav === "queue" && <DouyinTaskQueue />}
        {activeNav === "ai" && <DouyinAICommenter />}
      </div>
    </div>
  );
}
