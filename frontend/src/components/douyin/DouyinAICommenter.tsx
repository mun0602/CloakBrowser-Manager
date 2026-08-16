import { useState } from "react";
import { Sparkles, MessageSquare, Copy, Check, Wand2, Lightbulb } from "lucide-react";
import { api } from "../../lib/api";

export function DouyinAICommenter() {
  const [videoTitle, setVideoTitle] = useState("Cách phối đồ mùa đông phong cách tối giản cực đẹp");
  const [language, setLanguage] = useState<"zh" | "vi">("zh");
  const [generatedComment, setGeneratedComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const presets = [
    { title: "Hướng dẫn phối đồ mùa đông", desc: "Thời trang / Outfit" },
    { title: "Review quán ăn lẩu cay Tứ Xuyên ngon nức tiếng", desc: "Ẩm thực / Food" },
    { title: "Mẹo công nghệ và thủ thuật iPhone cực đỉnh", desc: "Công nghệ / Tips" },
    { title: "Chăm sóc da căng bóng chuẩn Hàn Quốc", desc: "Mỹ phẩm / Skincare" },
  ];

  const handleGenerate = async () => {
    if (!videoTitle) return;
    try {
      setLoading(true);
      const res = await api.generateAIComment({
        video_title: videoTitle,
        language,
        style: "positive",
      });
      setGeneratedComment(res.comment);
      setCopied(false);
    } catch (err) {
      alert(`Lỗi sinh bình luận: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedComment) {
      navigator.clipboard.writeText(generatedComment);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bezel-card p-6 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
              Phòng Thí Nghiệm AI Comment Douyin
            </h2>
            <p className="text-xs text-zinc-400">
              Sinh bình luận ngữ cảnh tự nhiên bằng tiếng Trung Giản Thể bản địa hoặc tiếng Việt
            </p>
          </div>
        </div>
      </div>

      {/* Main Lab Form */}
      <div className="bezel-card p-6 sm:p-8 space-y-6">
        {/* Preset quick pills */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-2.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> CÁC CHỦ ĐỀ MẪU:
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setVideoTitle(p.title)}
                className="px-3 py-1.5 rounded-xl text-xs bg-surface-2/80 hover:bg-surface-3 text-zinc-300 hover:text-white border border-white/[0.06] hover:border-white/[0.15] transition flex items-center gap-2"
              >
                <span>{p.title}</span>
                <span className="text-[10px] text-zinc-400 font-mono">({p.desc})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="label">Tiêu đề video / Nội dung Douyin:</label>
          <input
            type="text"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Nhập tiêu đề video hoặc từ khóa nội dung..."
            className="input text-sm font-medium"
          />
        </div>

        {/* Language selector */}
        <div className="bezel-card-inner p-4 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-bold text-zinc-300">Ngôn ngữ sinh bình luận:</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer font-medium">
              <input
                type="radio"
                name="lang"
                checked={language === "zh"}
                onChange={() => setLanguage("zh")}
                className="accent-rose-500 w-4 h-4"
              />
              🇨🇳 Tiếng Trung Giản Thể (Douyin Native)
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer font-medium">
              <input
                type="radio"
                name="lang"
                checked={language === "vi"}
                onChange={() => setLanguage("vi")}
                className="accent-rose-500 w-4 h-4"
              />
              🇻🇳 Tiếng Việt
            </label>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !videoTitle}
          className="btn-tactile-rose w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
        >
          <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> SINH BÌNH LUẬN NGAY
        </button>

        {/* Result Area */}
        {generatedComment && (
          <div className="bezel-card-inner p-5 space-y-3 pt-4 border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-4 h-4" /> KẾT QUẢ SINH TỰ ĐỘNG:
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-surface-3 border border-white/10 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
              </button>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white bg-black/60 p-4 rounded-xl border border-white/[0.06] shadow-inner font-sans tracking-wide">
              {generatedComment}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
