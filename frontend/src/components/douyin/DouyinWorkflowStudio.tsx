import { useState } from "react";
import { Sparkles, Flame, Search, Video, Upload, CheckCircle2, Sliders, ArrowRight, Shield, Zap } from "lucide-react";
import { api, type Profile } from "../../lib/api";

interface Props {
  profiles: Profile[];
  onTasksDispatched: () => void;
}

export function DouyinWorkflowStudio({ profiles, onTasksDispatched }: Props) {
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"warmup" | "search_interact" | "live_interact" | "uploader">("warmup");

  // Form states
  // Warmup
  const [videoCount, setVideoCount] = useState(10);
  const [minWatchSec, setMinWatchSec] = useState(5);
  const [maxWatchSec, setMaxWatchSec] = useState(12);
  const [likeProb, setLikeProb] = useState(25);
  const [commentProb, setCommentProb] = useState(15);
  const [enableAI, setEnableAI] = useState(true);

  // Search
  const [searchKeyword, setSearchKeyword] = useState("穿搭");
  const [searchVideoCount, setSearchVideoCount] = useState(5);

  // Livestream
  const [liveUrl, setLiveUrl] = useState("https://live.douyin.com");
  const [liveDurationMin, setLiveDurationMin] = useState(3);
  const [heartClicks, setHeartClicks] = useState(30);

  // Uploader
  const [videoPath, setVideoPath] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoTags, setVideoTags] = useState("日常, 推荐");

  const [running, setRunning] = useState(false);

  const toggleSelectProfile = (id: string) => {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAllProfiles = () => {
    if (selectedProfileIds.length === profiles.length) {
      setSelectedProfileIds([]);
    } else {
      setSelectedProfileIds(profiles.map((p) => p.id));
    }
  };

  const handleRunWorkflow = async () => {
    if (selectedProfileIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 Profile để chạy kịch bản!");
      return;
    }

    let config: Record<string, any> = {};

    if (activeTab === "warmup") {
      config = {
        video_count: videoCount,
        min_watch_sec: minWatchSec,
        max_watch_sec: maxWatchSec,
        like_probability: likeProb / 100,
        comment_probability: commentProb / 100,
        enable_ai_comment: enableAI,
        comment_language: "zh",
      };
    } else if (activeTab === "search_interact") {
      config = {
        keyword: searchKeyword,
        video_count: searchVideoCount,
        min_watch_sec: minWatchSec,
        max_watch_sec: maxWatchSec,
        like_probability: likeProb / 100,
        enable_comment: enableAI,
      };
    } else if (activeTab === "live_interact") {
      config = {
        live_url: liveUrl,
        duration_min: liveDurationMin,
        heart_clicks: heartClicks,
      };
    } else if (activeTab === "uploader") {
      if (!videoPath) {
        alert("Vui lòng nhập đường dẫn file video .mp4!");
        return;
      }
      config = {
        video_path: videoPath,
        title: videoTitle,
        tags: videoTags.split(",").map((t) => t.trim()),
      };
    }

    try {
      setRunning(true);
      const res = await api.dispatchDouyinTasks({
        profile_ids: selectedProfileIds,
        action_type: activeTab,
        config,
      });

      alert(`🎉 Đã đưa thành công ${res.dispatched_count} tác vụ vào hàng đợi điều phối!`);
      onTasksDispatched();
    } catch (err) {
      alert(`Lỗi khởi chạy tác vụ: ${err}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Workflow Tabs (Segmented Glass Bar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-surface-1/90 border border-white/[0.08] shadow-bezel-sm">
        {[
          { id: "warmup", label: "Nuôi Nick Feed", desc: "Xem đề xuất + Like + Cmt", icon: Flame },
          { id: "search_interact", label: "Tìm Kiếm Từ Khóa", desc: "Seeding theo Hashtag", icon: Search },
          { id: "live_interact", label: "Dạo Livestream", desc: "Thả tim + Chat phòng", icon: Video },
          { id: "uploader", label: "Đăng Video Auto", desc: "Xuất bản hàng loạt", icon: Upload },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 sm:p-4 rounded-xl text-left transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? "bg-gradient-to-br from-sky-600/90 to-cyan-700 text-white shadow-glow-sky border border-white/25 scale-[1.01]"
                  : "bg-surface-2/40 text-zinc-400 border border-transparent hover:bg-surface-2 hover:text-zinc-200 hover:border-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? "bg-white/20 text-white" : "bg-surface-3 text-zinc-400 group-hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs tracking-wide">{tab.label}</div>
              </div>
              <div className={`text-[11px] ${isActive ? "text-sky-100" : "text-zinc-400"}`}>
                {tab.desc}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Double Bezel (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bezel-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide">
                    Cấu Hình Thông Số Kịch Bản
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {activeTab === "warmup" && "MODE: ALGORITHM_WARMUP_FEED"}
                    {activeTab === "search_interact" && "MODE: KEYWORD_DISCOVERY"}
                    {activeTab === "live_interact" && "MODE: LIVESTREAM_INTERACT"}
                    {activeTab === "uploader" && "MODE: CREATOR_UPLOADER"}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/5 text-zinc-300 border border-white/10">
                Stealth CDP v2
              </span>
            </div>

            {/* Warmup Form */}
            {activeTab === "warmup" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bezel-card-inner p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="label mb-0">Số video muốn xem</label>
                      <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                        {videoCount} clips
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={50}
                      value={videoCount}
                      onChange={(e) => setVideoCount(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="bezel-card-inner p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="label mb-0">Thời gian xem/video</label>
                      <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {minWatchSec}s – {maxWatchSec}s
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="number"
                        value={minWatchSec}
                        onChange={(e) => setMinWatchSec(Number(e.target.value))}
                        className="input text-center font-mono"
                        placeholder="Min (s)"
                      />
                      <input
                        type="number"
                        value={maxWatchSec}
                        onChange={(e) => setMaxWatchSec(Number(e.target.value))}
                        className="input text-center font-mono"
                        placeholder="Max (s)"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bezel-card-inner p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="label mb-0">Tỷ lệ Thả Tim (Like)</label>
                      <span className="text-xs font-mono font-bold text-sky-400">{likeProb}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={likeProb}
                      onChange={(e) => setLikeProb(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="bezel-card-inner p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="label mb-0">Tỷ lệ Bình Luận</label>
                      <span className="text-xs font-mono font-bold text-cyan-400">{commentProb}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={commentProb}
                      onChange={(e) => setCommentProb(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* AI Toggle */}
                <div
                  onClick={() => setEnableAI(!enableAI)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    enableAI
                      ? "bg-sky-950/20 border-sky-500/40 shadow-glow-sky"
                      : "bg-surface-2/40 border-white/[0.06] opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">Smart Contextual AI Commenting</div>
                      <div className="text-[11px] text-zinc-400">
                        Tự động đọc tiêu đề video và sinh bình luận khen ngợi tự nhiên bằng tiếng Trung
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                      enableAI ? "bg-sky-500 justify-end" : "bg-surface-4 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Form */}
            {activeTab === "search_interact" && (
              <div className="space-y-4">
                <div className="bezel-card-inner p-4 space-y-2">
                  <label className="label">Từ khóa hoặc Hashtag Douyin:</label>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Ví dụ: 穿搭 (Thời trang) / 美妆 (Làm đẹp)"
                    className="input font-medium text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bezel-card-inner p-4 space-y-2">
                    <label className="label">Số clip top tương tác:</label>
                    <input
                      type="number"
                      value={searchVideoCount}
                      onChange={(e) => setSearchVideoCount(Number(e.target.value))}
                      className="input font-mono"
                    />
                  </div>
                  <div className="bezel-card-inner p-4 space-y-2">
                    <label className="label">Tỷ lệ like: {likeProb}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={likeProb}
                      onChange={(e) => setLikeProb(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Livestream Form */}
            {activeTab === "live_interact" && (
              <div className="space-y-4">
                <div className="bezel-card-inner p-4 space-y-2">
                  <label className="label">Link phòng Livestream:</label>
                  <input
                    type="text"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://live.douyin.com/..."
                    className="input font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bezel-card-inner p-4 space-y-2">
                    <label className="label">Thời gian xem (Phút):</label>
                    <input
                      type="number"
                      value={liveDurationMin}
                      onChange={(e) => setLiveDurationMin(Number(e.target.value))}
                      className="input font-mono"
                    />
                  </div>
                  <div className="bezel-card-inner p-4 space-y-2">
                    <label className="label">Lượt click thả tim:</label>
                    <input
                      type="number"
                      value={heartClicks}
                      onChange={(e) => setHeartClicks(Number(e.target.value))}
                      className="input font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Uploader Form */}
            {activeTab === "uploader" && (
              <div className="space-y-4">
                <div className="bezel-card-inner p-4 space-y-2">
                  <label className="label">Đường dẫn file video trên máy (.mp4):</label>
                  <input
                    type="text"
                    value={videoPath}
                    onChange={(e) => setVideoPath(e.target.value)}
                    placeholder="/Users/macmoon/Movies/video.mp4"
                    className="input font-mono text-xs"
                  />
                </div>
                <div className="bezel-card-inner p-4 space-y-2">
                  <label className="label">Tiêu đề & Caption:</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Nhập tiêu đề thu hút người xem..."
                    className="input font-medium"
                  />
                </div>
                <div className="bezel-card-inner p-4 space-y-2">
                  <label className="label">Hashtag (ngăn cách bằng dấu phẩy):</label>
                  <input
                    type="text"
                    value={videoTags}
                    onChange={(e) => setVideoTags(e.target.value)}
                    placeholder="fashion, viral, trending"
                    className="input font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account Multi-Selector & Nested CTA (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bezel-card p-6 flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-extrabold text-white tracking-wide">
                    Chọn Profile Thực Thi
                  </h3>
                </div>
                <button
                  onClick={selectAllProfiles}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 font-mono tracking-wider transition"
                >
                  {selectedProfileIds.length === profiles.length ? "UNSELECT ALL" : "SELECT ALL"}
                </button>
              </div>

              <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {profiles.length === 0 ? (
                  <div className="text-zinc-400 text-xs py-8 text-center font-mono">
                    Chưa có profile antidetect nào.
                  </div>
                ) : (
                  profiles.map((p) => {
                    const isSelected = selectedProfileIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleSelectProfile(p.id)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all duration-200 ${
                          isSelected
                            ? "bg-sky-950/40 border-sky-500/50 text-white shadow-glow-sky"
                            : "bg-surface-2/50 border-white/[0.05] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-sky-600 border-sky-400 text-white shadow-sm"
                                : "border-white/10 bg-surface-3"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-xs">{p.name}</div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {p.proxy ? `Proxy: ${p.proxy.split("@").pop()}` : "Direct IP (Không Proxy)"}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] font-mono font-bold">
                          {p.status === "running" ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
                            </span>
                          ) : (
                            <span className="text-zinc-400">Idle</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Nested Tactile CTA Button */}
            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400">TARGET ACCOUNTS:</span>
                <span className="text-sky-400 font-extrabold text-sm">{selectedProfileIds.length} ACTIVE</span>
              </div>

              <button
                onClick={handleRunWorkflow}
                disabled={running || selectedProfileIds.length === 0}
                className={`w-full group rounded-2xl p-1 transition-all duration-300 ${
                  running || selectedProfileIds.length === 0
                    ? "bg-zinc-800 opacity-50 cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-600 shadow-glow-sky hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                <div className="w-full bg-[#0b1018]/90 group-hover:bg-transparent rounded-[calc(1rem-2px)] py-3.5 px-5 flex items-center justify-between transition-all duration-300">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-sky-400 group-hover:text-white" />
                    <span className="text-xs sm:text-sm font-extrabold text-white tracking-wider">
                      BẮT ĐẦU CHẠY MA TRẬN
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 group-hover:bg-white/20 flex items-center justify-center text-sky-400 group-hover:text-white transition-transform group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
