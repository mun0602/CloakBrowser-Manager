import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Trash2,
  Plus,
  Calendar,
  Flame,
  Search,
  Tv,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
} from "lucide-react";
import { api, DouyinSchedule, Profile } from "../../lib/api";

interface Props {
  profiles: Profile[];
  onTasksDispatched: () => void;
}

export function DouyinScheduleManager({ profiles, onTasksDispatched }: Props) {
  const [schedules, setSchedules] = useState<DouyinSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new schedule
  const [name, setName] = useState("");
  const [actionType, setActionType] = useState<"warmup" | "search_interact" | "live_interact" | "uploader">("warmup");
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<"daily_time" | "interval_hours" | "interval_minutes" | "once_at">("daily_time");
  const [scheduleValue, setScheduleValue] = useState("08:30");
  
  // Action config
  const [videoCount, setVideoCount] = useState(8);
  const [minWatchSec, setMinWatchSec] = useState(6);
  const [maxWatchSec, setMaxWatchSec] = useState(14);
  const [minInteractDelaySec, setMinInteractDelaySec] = useState(2);
  const [maxInteractDelaySec, setMaxInteractDelaySec] = useState(6);
  const [likeProb, setLikeProb] = useState(30);
  const [commentProb, setCommentProb] = useState(15);
  const [enableAI, setEnableAI] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("穿搭");

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await api.listDouyinSchedules();
      setSchedules(data);
    } catch (err) {
      console.error("Failed to load schedules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    const interval = setInterval(loadSchedules, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await api.toggleDouyinSchedule(id);
      loadSchedules();
    } catch (err) {
      alert(`Lỗi chuyển trạng thái lịch: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lịch trình tự động này?")) return;
    try {
      await api.deleteDouyinSchedule(id);
      loadSchedules();
    } catch (err) {
      alert(`Lỗi xóa lịch trình: ${err}`);
    }
  };

  const handleTriggerNow = async (id: string) => {
    try {
      const res = await api.triggerDouyinSchedule(id);
      alert(`🚀 Đã kích hoạt chạy ngay lập tức ${res.dispatched_count} tác vụ!`);
      onTasksDispatched();
      loadSchedules();
    } catch (err) {
      alert(`Lỗi kích hoạt chạy ngay: ${err}`);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên lịch trình!");
      return;
    }
    if (selectedProfileIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 Profile!");
      return;
    }

    let config: Record<string, any> = {};
    if (actionType === "warmup") {
      config = {
        video_count: videoCount,
        min_watch_sec: minWatchSec,
        max_watch_sec: maxWatchSec,
        min_interact_delay_sec: minInteractDelaySec,
        max_interact_delay_sec: maxInteractDelaySec,
        like_probability: likeProb / 100,
        comment_probability: commentProb / 100,
        enable_ai_comment: enableAI,
        comment_language: "zh",
      };
    } else if (actionType === "search_interact") {
      config = {
        keyword: searchKeyword,
        video_count: videoCount,
        min_watch_sec: minWatchSec,
        max_watch_sec: maxWatchSec,
        min_interact_delay_sec: minInteractDelaySec,
        max_interact_delay_sec: maxInteractDelaySec,
        like_probability: likeProb / 100,
        enable_comment: enableAI,
      };
    }

    try {
      await api.createDouyinSchedule({
        name: name.trim(),
        action_type: actionType,
        profile_ids: selectedProfileIds,
        config,
        schedule_type: scheduleType,
        schedule_value: scheduleValue,
      });
      setShowAddModal(false);
      setName("");
      loadSchedules();
    } catch (err) {
      alert(`Lỗi tạo lịch trình: ${err}`);
    }
  };

  const toggleSelectProfile = (id: string) => {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const formatScheduleValue = (type: string, val: string) => {
    if (type === "daily_time") {
      return `Hàng ngày lúc ${val}`;
    } else if (type === "interval_hours") {
      return `Lặp lại mỗi ${val} giờ`;
    } else if (type === "interval_minutes") {
      return `Lặp lại mỗi ${val} phút`;
    } else if (type === "once_at") {
      return `Chạy 1 lần vào ${val.replace("T", " ")}`;
    }
    return val;
  };

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return "Chưa có";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-1 border border-white/[0.08] shadow-bezel-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-glow-sky">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                Auto Hẹn Giờ Chạy Định Kỳ
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  CRON ENGINE LIVE
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Tự động lên lịch nuôi nick, thả tim, tương tác và đăng bài theo các khung giờ vàng hoàn toàn tự động
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSchedules}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-zinc-300 border border-white/10 transition-all"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
          <button
            onClick={() => {
              setSelectedProfileIds(profiles.map((p) => p.id));
              setShowAddModal(true);
            }}
            className="btn-tactile-sky py-2.5 px-4 text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo Lịch Tự Động Mới
          </button>
        </div>
      </div>

      {/* Schedules Grid */}
      {schedules.length === 0 ? (
        <div className="bezel-card p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-glow-sky">
            <Calendar className="w-8 h-8 opacity-60" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Chưa có lịch trình tự động nào</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Hãy bấm "Tạo Lịch Tự Động Mới" để thiết lập kịch bản nuôi nick tự chạy vào các khung giờ sáng, trưa, tối hoặc định kỳ mỗi vài giờ.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedProfileIds(profiles.map((p) => p.id));
              setShowAddModal(true);
            }}
            className="btn-tactile-sky py-2.5 px-5 text-xs mx-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thiết Lập Lịch Trình Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map((sch) => {
            const isWarmup = sch.action_type === "warmup";
            const isSearch = sch.action_type === "search_interact";
            const isLive = sch.action_type === "live_interact";

            return (
              <div
                key={sch.id}
                className={`bezel-card p-5 space-y-4 transition-all duration-300 ${
                  sch.is_active ? "border-sky-500/30" : "opacity-60 border-white/[0.05]"
                }`}
              >
                {/* Top: Name and Active Switch */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg text-xs ${
                          isWarmup
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : isSearch
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}
                      >
                        {isWarmup && <Flame className="w-3.5 h-3.5" />}
                        {isSearch && <Search className="w-3.5 h-3.5" />}
                        {isLive && <Tv className="w-3.5 h-3.5" />}
                        {sch.action_type === "uploader" && <UploadCloud className="w-3.5 h-3.5" />}
                      </div>
                      <h4 className="text-sm font-extrabold text-white tracking-wide">{sch.name}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 block">
                      {isWarmup && "Nuôi Nick Feed Đề Xuất"}
                      {isSearch && `Tìm Kiếm: "${sch.config?.keyword || '...'}"`}
                      {isLive && "Dạo Phòng Livestream"}
                      {sch.action_type === "uploader" && "Tự Động Đăng Video"}
                    </span>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggle(sch.id)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                      sch.is_active ? "bg-sky-500 justify-end shadow-glow-sky" : "bg-surface-4 justify-start"
                    }`}
                    title={sch.is_active ? "Bấm để tạm dừng" : "Bấm để kích hoạt"}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                  </button>
                </div>

                {/* Schedule Frequency Badge */}
                <div className="bezel-card-inner p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-sky-400" /> Tần suất chạy:
                    </span>
                    <span className="font-mono font-bold text-sky-300">
                      {formatScheduleValue(sch.schedule_type, sch.schedule_value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Profiles áp dụng:</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {sch.profile_ids.length} Profiles
                    </span>
                  </div>
                </div>

                {/* Timers & Status info */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-surface-2/60 border border-white/[0.04] space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">LẦN CHẠY GẦN NHẤT</span>
                    <span className="text-zinc-300 font-semibold">{formatDateTime(sch.last_run_at)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-sky-950/30 border border-sky-500/20 space-y-0.5">
                    <span className="text-sky-400/80 text-[10px] block">LẦN CHẠY KẾ TIẾP</span>
                    <span className="text-sky-300 font-bold">{formatDateTime(sch.next_run_at)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleTriggerNow(sch.id)}
                    className="btn-tactile-dark py-1.5 px-3 text-xs flex items-center gap-1.5 text-sky-400 hover:text-sky-300"
                    title="Chạy ngay các tác vụ của lịch trình này"
                  >
                    <Play className="w-3 h-3 fill-sky-400/20" /> Chạy Ngay
                  </button>
                  <button
                    onClick={() => handleDelete(sch.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Xóa lịch trình"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Lịch Trình Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bezel-card max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-glow-sky">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Thiết Lập Lịch Trình Tự Động</h3>
                  <p className="text-[11px] text-zinc-400">Hệ thống sẽ chạy nền tự động mà không cần can thiệp</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="label">Tên Lịch Trình:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nuôi Nick Buổi Sáng 08:30"
                  className="input font-medium"
                />
              </div>

              {/* Chọn Kịch bản */}
              <div className="space-y-1.5">
                <label className="label">Chọn Kịch Bản Chạy:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "warmup", label: "Nuôi Nick Feed", icon: Flame },
                    { id: "search_interact", label: "Tìm Kiếm Từ Khóa", icon: Search },
                    { id: "live_interact", label: "Dạo Livestream", icon: Tv },
                    { id: "uploader", label: "Đăng Video", icon: UploadCloud },
                  ].map((act) => {
                    const Icon = act.icon;
                    const isSel = actionType === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setActionType(act.id as any)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          isSel
                            ? "bg-sky-950/30 border-sky-500/40 text-white shadow-glow-sky"
                            : "bg-surface-2/40 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSel ? "text-sky-400" : "text-zinc-500"}`} />
                        <span className="text-xs font-bold">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cấu hình thời gian chạy */}
              <div className="bezel-card-inner p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Loại Lịch Trình & Tần Suất:</label>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">24/7 Automation</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "daily_time", label: "Hàng Ngày" },
                    { id: "interval_hours", label: "Mỗi N Giờ" },
                    { id: "interval_minutes", label: "Mỗi N Phút" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setScheduleType(t.id as any);
                        if (t.id === "daily_time") setScheduleValue("08:30");
                        if (t.id === "interval_hours") setScheduleValue("2");
                        if (t.id === "interval_minutes") setScheduleValue("45");
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        scheduleType === t.id
                          ? "bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold"
                          : "bg-surface-2 border-white/[0.06] text-zinc-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Presets for Daily Time */}
                {scheduleType === "daily_time" && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { time: "08:30", label: "08:30 Sáng", icon: Sunrise },
                        { time: "12:15", label: "12:15 Trưa", icon: Sun },
                        { time: "18:30", label: "18:30 Chiều", icon: Sunset },
                        { time: "21:00", label: "21:00 Tối", icon: Moon },
                      ].map((slot) => {
                        const Icon = slot.icon;
                        const isChosen = scheduleValue === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setScheduleValue(slot.time)}
                            className={`p-2 rounded-xl border text-[11px] flex flex-col items-center gap-1 transition-all ${
                              isChosen
                                ? "bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold"
                                : "bg-surface-2/60 border-white/[0.04] text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{slot.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-zinc-400 whitespace-nowrap">Giờ chạy tùy chỉnh (HH:MM):</span>
                      <input
                        type="time"
                        value={scheduleValue}
                        onChange={(e) => setScheduleValue(e.target.value)}
                        className="input text-center font-mono py-1"
                      />
                    </div>
                  </div>
                )}

                {/* Interval Hours / Minutes Input */}
                {scheduleType === "interval_hours" && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {["1", "2", "4", "6"].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setScheduleValue(h)}
                          className={`py-1.5 rounded-xl border text-xs font-mono font-bold ${
                            scheduleValue === h
                              ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                              : "bg-surface-2 text-zinc-400"
                          }`}
                        >
                          Mỗi {h} giờ
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-zinc-400">Số giờ lặp lại:</span>
                      <input
                        type="number"
                        min={1}
                        max={48}
                        value={scheduleValue}
                        onChange={(e) => setScheduleValue(e.target.value)}
                        className="input text-center font-mono py-1"
                      />
                    </div>
                  </div>
                )}

                {scheduleType === "interval_minutes" && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-zinc-400">Số phút lặp lại:</span>
                    <input
                      type="number"
                      min={5}
                      max={720}
                      value={scheduleValue}
                      onChange={(e) => setScheduleValue(e.target.value)}
                      className="input text-center font-mono py-1"
                    />
                  </div>
                )}
              </div>

              {/* Search Keyword if search action */}
              {actionType === "search_interact" && (
                <div className="bezel-card-inner p-3 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-semibold block">Từ khóa Douyin:</span>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Ví dụ: 穿搭 / 美妆"
                    className="input text-xs"
                  />
                </div>
              )}

              {/* Thông số tương tác từ s - s */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bezel-card-inner p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-semibold block">Số video:</span>
                    <span className="text-xs font-mono font-bold text-sky-400">{videoCount} clips</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    value={videoCount}
                    onChange={(e) => setVideoCount(Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                <div className="bezel-card-inner p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-semibold block">Tỷ lệ like / cmt:</span>
                    <span className="text-[11px] font-mono font-bold text-cyan-400">❤️{likeProb}% 💬{commentProb}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={likeProb}
                      onChange={(e) => setLikeProb(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                      title="Tỷ lệ like"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={commentProb}
                      onChange={(e) => setCommentProb(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                      title="Tỷ lệ comment"
                    />
                  </div>
                </div>
              </div>

              {/* Thông số thời gian s - s */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bezel-card-inner p-3 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-semibold block">Thời gian xem (s - s):</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={minWatchSec}
                      onChange={(e) => setMinWatchSec(Number(e.target.value))}
                      className="input text-center font-mono py-1 text-xs"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={maxWatchSec}
                      onChange={(e) => setMaxWatchSec(Number(e.target.value))}
                      className="input text-center font-mono py-1 text-xs"
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="bezel-card-inner p-3 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-semibold block">Thời gian nghỉ (s - s):</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={minInteractDelaySec}
                      onChange={(e) => setMinInteractDelaySec(Number(e.target.value))}
                      className="input text-center font-mono py-1 text-xs"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={maxInteractDelaySec}
                      onChange={(e) => setMaxInteractDelaySec(Number(e.target.value))}
                      className="input text-center font-mono py-1 text-xs"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* AI Comment Toggle */}
              <div
                onClick={() => setEnableAI(!enableAI)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  enableAI
                    ? "bg-sky-950/20 border-sky-500/40 shadow-glow-sky"
                    : "bg-surface-2/40 border-white/[0.06] opacity-70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Smart Gemini AI Commenting</span>
                </div>
                <div
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
                    enableAI ? "bg-sky-500 justify-end" : "bg-surface-4 justify-start"
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"></div>
                </div>
              </div>

              {/* Chọn Profiles */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Chọn Profiles chạy ({selectedProfileIds.length}/{profiles.length}):</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedProfileIds.length === profiles.length) setSelectedProfileIds([]);
                      else setSelectedProfileIds(profiles.map((p) => p.id));
                    }}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    {selectedProfileIds.length === profiles.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-surface-2/40 border border-white/[0.06]">
                  {profiles.map((p) => {
                    const isSel = selectedProfileIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleSelectProfile(p.id)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSel
                            ? "bg-sky-500/20 text-white font-bold border border-sky-500/30"
                            : "bg-surface-3/30 text-zinc-400 hover:bg-surface-3/60"
                        }`}
                      >
                        <span>{p.name}</span>
                        {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-tactile-dark py-2 px-4 text-xs"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-tactile-sky py-2 px-5 text-xs">
                  Kích Hoạt Lịch Trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
