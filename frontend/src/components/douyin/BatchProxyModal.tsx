import { useState } from "react";
import { Globe, Plus, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, Zap } from "lucide-react";
import { api, type Profile, type ProxyCheckResult } from "../../lib/api";

interface Props {
  profiles: Profile[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BatchProxyModal({ profiles, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"assign" | "create">("create");
  const [proxyText, setProxyText] = useState("");
  const [namePrefix, setNamePrefix] = useState("Douyin Acc");
  const [platform, setPlatform] = useState("windows");
  const [autoGeoip, setAutoGeoip] = useState(true);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(profiles.map((p) => p.id));

  // Check state
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<ProxyCheckResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const getProxyLines = () => {
    return proxyText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
  };

  const handleCheckProxies = async () => {
    const lines = getProxyLines();
    if (lines.length === 0) {
      alert("Vui lòng nhập ít nhất 1 dòng proxy!");
      return;
    }
    try {
      setChecking(true);
      const results = await api.checkProxiesBatch(lines);
      setCheckResults(results);
    } catch (err) {
      alert(`Lỗi kiểm tra proxy: ${err}`);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = getProxyLines();
    if (lines.length === 0) {
      alert("Vui lòng nhập danh sách proxy!");
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "assign") {
        if (selectedProfileIds.length === 0) {
          alert("Vui lòng chọn ít nhất 1 Profile để gán proxy!");
          return;
        }
        const res = await api.batchAssignProxies({
          proxies: lines,
          profile_ids: selectedProfileIds,
          geoip: autoGeoip,
        });
        alert(`✅ Đã gán proxy thành công cho ${res.updated_count} Profile!`);
      } else {
        const res = await api.batchCreateProfilesWithProxies({
          proxies: lines,
          name_prefix: namePrefix,
          platform,
          geoip: autoGeoip,
        });
        alert(`🎉 Đã tạo thành công ${res.created_count} Profile & Tài Khoản Douyin mới kèm Proxy!`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Lỗi thực hiện: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = checkResults.filter((r) => r.valid).length;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bezel-card p-6 sm:p-8 w-full max-w-2xl space-y-6 shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Cấu Hình & Khởi Tạo Proxy Hàng Loạt
              </h3>
              <p className="text-xs text-zinc-400 font-mono">BATCH PROXY ROTATION & BINDING ENGINE</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-2 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === "create"
                ? "bg-rose-600 text-white shadow-glow-rose"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Tạo N Profile Mới Từ Proxy
          </button>
          <button
            type="button"
            onClick={() => setMode("assign")}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === "assign"
                ? "bg-rose-600 text-white shadow-glow-rose"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Gán Vào Profile Hiện Có
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Proxy Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0">
                Nhập danh sách Proxy (1 proxy/dòng):
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                {getProxyLines().length} proxies nhập vào
              </span>
            </div>
            <textarea
              rows={4}
              value={proxyText}
              onChange={(e) => setProxyText(e.target.value)}
              placeholder="103.14.22.1:1080:username:password&#10;socks5://user:pass@103.14.22.2:1080&#10;http://103.14.22.3:8080"
              className="w-full bg-surface-2 border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-rose-500/50"
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Hỗ trợ: HTTP, HTTPS, SOCKS5 (ip:port:user:pass)</span>
              <button
                type="button"
                onClick={handleCheckProxies}
                disabled={checking || getProxyLines().length === 0}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
                Kiểm tra kết nối Live
              </button>
            </div>
          </div>

          {/* Check Results Drawer */}
          {checkResults.length > 0 && (
            <div className="bezel-card-inner p-4 space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-white/[0.06]">
                <span className="text-zinc-300 font-bold">KẾT QUẢ KIỂM TRA PROXY:</span>
                <span className="text-emerald-400 font-bold">
                  {validCount}/{checkResults.length} Hoạt động tốt
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                {checkResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 truncate max-w-xs">{r.proxy}</span>
                    {r.valid ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {r.ip} ({r.latency_ms}ms)
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 truncate max-w-[150px]">
                        <AlertCircle className="w-3 h-3" /> {r.error || "Failed"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode-specific Fields */}
          {mode === "create" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="label">Tiền tố tên Profile:</label>
                <input
                  type="text"
                  value={namePrefix}
                  onChange={(e) => setNamePrefix(e.target.value)}
                  className="input"
                  placeholder="Douyin Acc"
                />
              </div>
              <div className="space-y-1.5">
                <label className="label">Hệ điều hành giả lập:</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="input cursor-pointer"
                >
                  <option value="windows">Windows 11 (Chromium)</option>
                  <option value="macos">macOS Sonoma (Chromium)</option>
                  <option value="linux">Linux (Chromium)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Chọn Profiles nhận Proxy:</label>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProfileIds(
                      selectedProfileIds.length === profiles.length ? [] : profiles.map((p) => p.id)
                    )
                  }
                  className="text-[11px] text-rose-400 font-mono"
                >
                  {selectedProfileIds.length === profiles.length ? "Bỏ chọn" : "Chọn tất cả"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {profiles.map((p) => {
                  const isSel = selectedProfileIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() =>
                        setSelectedProfileIds((prev) =>
                          prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        )
                      }
                      className={`p-2 rounded-xl border text-xs cursor-pointer truncate transition ${
                        isSel
                          ? "bg-rose-950/40 border-rose-500/50 text-white font-bold"
                          : "bg-surface-2 border-white/[0.05] text-zinc-400"
                      }`}
                    >
                      {p.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Auto GeoIP Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoGeoip"
              checked={autoGeoip}
              onChange={(e) => setAutoGeoip(e.target.checked)}
              className="rounded accent-rose-500 w-4 h-4"
            />
            <label htmlFor="autoGeoip" className="text-xs text-zinc-300 font-medium cursor-pointer">
              🌍 Tự động khớp Múi giờ, Ngôn ngữ và Vị trí theo IP của Proxy (GeoIP Emulation)
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button type="button" onClick={onClose} className="btn-tactile-dark py-2.5 px-5">
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting || getProxyLines().length === 0}
              className="btn-tactile-rose py-2.5 px-6 flex items-center gap-2"
            >
              {submitting ? "Đang xử lý..." : "Xác Nhận Áp Dụng Proxy"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
