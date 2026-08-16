import { useState, useEffect, useRef } from "react";
import { ListFilter, Terminal, RotateCw, CheckCircle2, AlertCircle, Zap, PlayCircle } from "lucide-react";
import { api, type DouyinTask } from "../../lib/api";

export function DouyinTaskQueue() {
  const [tasks, setTasks] = useState<DouyinTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const fetchTasks = async () => {
    try {
      const data = await api.listDouyinTasks();
      setTasks(data);
      if (!selectedTaskId && data.length > 0 && data[0]) {
        setSelectedTaskId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const runningCount = tasks.filter((t) => t.status === "running").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top HUD Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bezel-card p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Tổng Tác Vụ</div>
            <div className="text-xl font-extrabold font-mono text-white">{tasks.length}</div>
          </div>
        </div>

        <div className="bezel-card p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PlayCircle className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Đang Thực Thi</div>
            <div className="text-xl font-extrabold font-mono text-blue-400">{runningCount}</div>
          </div>
        </div>

        <div className="bezel-card p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Hoàn Tất</div>
            <div className="text-xl font-extrabold font-mono text-emerald-400">{completedCount}</div>
          </div>
        </div>

        <div className="bezel-card p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Lỗi / Thất Bại</div>
            <div className="text-xl font-extrabold font-mono text-red-400">{failedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Tasks & Realtime Terminal Window */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Task List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bezel-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-extrabold text-white tracking-wider uppercase font-mono">
                  Hàng Đợi ({tasks.length})
                </h3>
              </div>
              <button
                onClick={fetchTasks}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-surface-2 border border-white/[0.06] transition"
                title="Làm mới"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-zinc-400 text-xs py-16 text-center font-mono">
                  Chưa có tác vụ nào trong hàng đợi.
                </div>
              ) : (
                tasks.map((task) => {
                  const isSelected = selectedTask?.id === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-rose-950/30 border-rose-500/50 shadow-glow-rose text-white"
                          : "bg-surface-2/60 border-white/[0.05] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-extrabold text-white text-xs flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          {task.action_type === "warmup" && "Nuôi Nick Feed"}
                          {task.action_type === "search_interact" && "Tìm Kiếm Từ Khóa"}
                          {task.action_type === "live_interact" && "Seeding Live"}
                          {task.action_type === "uploader" && "Đăng Video Auto"}
                        </div>

                        <div>
                          {task.status === "running" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span> RUNNING
                            </span>
                          )}
                          {task.status === "completed" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ✓ DONE
                            </span>
                          )}
                          {task.status === "failed" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              ✕ FAILED
                            </span>
                          )}
                          {task.status === "pending" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                              PENDING
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 mb-2.5 flex items-center justify-between">
                        <span>
                          Target: <strong className="text-zinc-200">{task.profile_name}</strong>
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {task.progress_current}/{task.progress_total}
                        </span>
                      </div>

                      {/* Smooth Progress Bar */}
                      <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            task.status === "completed"
                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                              : task.status === "failed"
                              ? "bg-red-400"
                              : "bg-gradient-to-r from-rose-500 to-pink-500 shadow-glow-rose"
                          }`}
                          style={{
                            width: `${
                              task.progress_total > 0
                                ? Math.min(100, (task.progress_current / task.progress_total) * 100)
                                : task.status === "completed"
                                ? 100
                                : 15
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Studio CRT Console Terminal (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bezel-card p-5 flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                </div>
                <h3 className="text-xs font-extrabold text-white tracking-wider uppercase font-mono">
                  LIVE ACTION CONSOLE & CDP LOGS
                </h3>
              </div>
              {selectedTask && (
                <div className="text-[11px] font-mono text-zinc-400">
                  TASK ID: <span className="text-rose-400 font-bold">{selectedTask.id.slice(0, 8)}</span>
                </div>
              )}
            </div>

            {/* Terminal Window with Syntax Highlighting */}
            <div
              ref={logContainerRef}
              className="bg-[#050608] rounded-xl p-4.5 font-mono text-[12px] text-zinc-300 h-[480px] overflow-y-auto space-y-2 border border-white/[0.04] shadow-inner"
            >
              {!selectedTask || selectedTask.logs.length === 0 ? (
                <div className="text-zinc-400 text-center py-28">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Chưa có nhật ký ghi nhận cho tác vụ đang chọn.
                </div>
              ) : (
                selectedTask.logs.map((l, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-zinc-400 select-none text-[11px]">[{l.time}]</span>
                    <span
                      className={
                        l.level === "error"
                          ? "text-red-400 font-bold"
                          : l.message.includes("✅") || l.message.includes("🎉")
                          ? "text-emerald-400 font-bold"
                          : l.message.includes("❤️") || l.message.includes("💬")
                          ? "text-rose-300"
                          : l.message.includes("▶️")
                          ? "text-cyan-300"
                          : "text-zinc-200"
                      }
                    >
                      {l.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
