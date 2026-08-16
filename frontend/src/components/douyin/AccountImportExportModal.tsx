import { useState } from "react";
import { Download, Upload, Cookie, FileText, X, Check, Copy } from "lucide-react";
import { api, type DouyinAccount } from "../../lib/api";

interface Props {
  accounts: DouyinAccount[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AccountImportExportModal({ accounts, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<"import_txt" | "cookie_vault">("import_txt");
  const [rawText, setRawText] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [cookieJson, setCookieJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleImportTxt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    try {
      setLoading(true);
      const res = await api.batchImportAccounts({ raw_text: rawText });
      alert(`🎉 Đã nhập thành công ${res.imported_count} tài khoản Douyin và tạo Profile tương ứng!`);
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Lỗi nhập tài khoản: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCookies = async () => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      const res = await api.exportCookies(selectedAccountId);
      setCookieJson(JSON.stringify(res.cookies, null, 2));
      alert(`✅ Đã trích xuất ${res.count} cookies từ phiên trình duyệt!`);
    } catch (err) {
      alert(`Lỗi xuất cookie: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCookies = async () => {
    if (!selectedAccountId || !cookieJson.trim()) return;
    try {
      setLoading(true);
      const parsed = JSON.parse(cookieJson);
      if (!Array.isArray(parsed)) {
        alert("Cookie JSON phải là danh sách mảng các Cookie object!");
        return;
      }
      const res = await api.importCookies(selectedAccountId, parsed);
      alert(
        res.login_status?.logged_in
          ? `🎉 Nhập Cookie thành công! Đã đăng nhập vào tài khoản: ${res.login_status.nickname || "Douyin User"}`
          : "⚠️ Đã nạp Cookie vào trình duyệt nhưng phiên có thể đã hết hạn."
      );
      onSuccess();
    } catch (err) {
      alert(`Lỗi nạp cookie: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAccountsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `douyin_accounts_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bezel-card p-6 sm:p-8 w-full max-w-2xl space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Nhập / Xuất Tài Khoản & Quản Lý Cookie Vault
              </h3>
              <p className="text-xs text-zinc-400 font-mono">DOUYIN CREDENTIAL & COOKIE HUB</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-2 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setTab("import_txt")}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              tab === "import_txt" ? "bg-rose-600 text-white shadow-glow-rose" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Nhập Danh Sách Tài Khoản
          </button>
          <button
            type="button"
            onClick={() => setTab("cookie_vault")}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              tab === "cookie_vault" ? "bg-rose-600 text-white shadow-glow-rose" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Cookie className="w-3.5 h-3.5" /> Cookie JSON Vault
          </button>
        </div>

        {tab === "import_txt" && (
          <form onSubmit={handleImportTxt} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="label">
                Dán danh sách tài khoản (Định dạng: <span className="text-rose-400">Tên|DouyinID|ProxyURL</span>):
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Kênh Thời Trang 01|12345678|http://user:pass@1.2.3.4:8080&#10;Kênh Làm Đẹp 02|87654321|socks5://user:pass@5.6.7.8:1080"
                className="w-full bg-surface-2 border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-rose-500/50"
              />
              <p className="text-[11px] text-zinc-400">
                Mỗi dòng sẽ tự động tạo một Antidetect Profile mới và gắn tương ứng với tài khoản Douyin.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleExportAccountsJson}
                className="btn-tactile-dark py-2 px-4 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Xuất Tất Cả (.JSON)
              </button>
              <button type="submit" disabled={loading || !rawText.trim()} className="btn-tactile-rose py-2 px-6">
                {loading ? "Đang nhập..." : "Bắt Đầu Nhập Hàng Loạt"}
              </button>
            </div>
          </form>
        )}

        {tab === "cookie_vault" && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="label">Chọn tài khoản Douyin:</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="input cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nickname || "Douyin User"} ({a.profile_name || a.profile_id.slice(0, 8)}) - {a.cookie_status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Cookie JSON Data:</label>
                {cookieJson && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(cookieJson);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-[11px] text-rose-400 font-mono flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Đã chép!" : "Sao chép JSON"}
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                value={cookieJson}
                onChange={(e) => setCookieJson(e.target.value)}
                placeholder='[{"name": "sessionid", "value": "...", "domain": ".douyin.com", "path": "/"}]'
                className="w-full bg-surface-2 border border-white/[0.08] rounded-xl p-3 font-mono text-[11px] text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleExportCookies}
                disabled={loading || !selectedAccountId}
                className="btn-tactile-dark py-2 px-4 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Trích Xuất Cookie Trình Duyệt
              </button>
              <button
                type="button"
                onClick={handleImportCookies}
                disabled={loading || !cookieJson.trim() || !selectedAccountId}
                className="btn-tactile-rose py-2 px-6 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Nạp Cookie Vào Phiên
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
