import { useState } from "react";
import { UserCheck, Flame, ListFilter, Sparkles, Activity, Clock } from "lucide-react";
import { type Profile } from "../../lib/api";
import { DouyinAccountManager } from "./DouyinAccountManager";
import { DouyinWorkflowStudio } from "./DouyinWorkflowStudio";
import { DouyinTaskQueue } from "./DouyinTaskQueue";
import { DouyinAICommenter } from "./DouyinAICommenter";
import { DouyinScheduleManager } from "./DouyinScheduleManager";

interface Props {
  profiles: Profile[];
  onLaunchProfile: (id: string) => void;
}

export function DouyinManager({ profiles, onLaunchProfile }: Props) {
  const [activeNav, setActiveNav] = useState<"accounts" | "workflows" | "schedules" | "queue" | "ai">("workflows");

  const navItems = [
    { id: "workflows", label: "Kịch Bản Auto", icon: Flame, badge: "Matrix" },
    { id: "schedules", label: "Lịch Trình Hẹn Giờ", icon: Clock, badge: "Cron 24/7" },
    { id: "accounts", label: "Tài Khoản Douyin", icon: UserCheck, badge: profiles.length.toString() },
    { id: "queue", label: "Hàng Đợi & Log", icon: ListFilter, badge: "Live" },
    { id: "ai", label: "AI Commenter", icon: Sparkles, badge: "Gemini" },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07090e] overflow-hidden">
      {/* Sub Header & Responsive Navigation Dock */}
      <div className="bg-surface-1/70 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-bezel-sm">
        {/* Title & Micro Metrics */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Douyin Automation Suite
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Activity className="w-3 h-3 animate-spin text-sky-400" /> v2.4 Native
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
                    ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-glow-sky border border-white/20 scale-[1.01]"
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
      <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#07090e] via-[#0b1018] to-[#07090e]">
        {activeNav === "workflows" && (
          <DouyinWorkflowStudio
            profiles={profiles}
            onTasksDispatched={() => setActiveNav("queue")}
          />
        )}
        {activeNav === "schedules" && (
          <DouyinScheduleManager
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
