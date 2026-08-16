import { useState, useEffect } from "react";
import { RefreshCw, Plus, Trash2, Globe, Shield, Search, LayoutGrid, List } from "lucide-react";
import { api, type DouyinAccount, type Profile } from "../../lib/api";

interface Props {
  profiles: Profile[];
  onLaunchProfile: (id: string) => void;
}

export function DouyinAccountManager({ profiles, onLaunchProfile }: Props) {
  const [accounts, setAccounts] = useState<DouyinAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Add modal states
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [nickname, setNickname] = useState("");
  const [tagInput, setTagInput] = useState("");

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.listDouyinAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load Douyin accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCheckLogin = async (acc: DouyinAccount) => {
    try {
      setCheckingId(acc.id);
      const res = await api.checkDouyinLogin(acc.id);
      alert(
        res.logged_in
          ? `✅ Đã đăng nhập thành công!\nTài khoản: ${res.nickname || "Douyin User"}`
          : `⚠️ Tài khoản chưa đăng nhập / Chế độ khách. Hãy bấm "Mở Trình Duyệt" và quét mã QR Douyin.`
      );
      loadAccounts();
    } catch (err) {
      alert(`Lỗi kiểm tra: ${err}`);
    } finally {
      setCheckingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) {
      alert("Vui lòng chọn Profile Antidetect");
      return;
    }
    try {
      const tags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await api.createDouyinAccount({
        profile_id: selectedProfileId,
        nickname: nickname || undefined,
        tags,
      });
      setShowAddModal(false);
      setNickname("");
      setTagInput("");
      loadAccounts();
    } catch (err) {
      alert(`Lỗi tạo tài khoản: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa liên kết tài khoản Douyin này?")) return;
    try {
      await api.deleteDouyinAccount(id);
      loadAccounts();
    } catch (err) {
      alert(`Lỗi xóa: ${err}`);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      (acc.nickname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.profile_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Search Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface-1/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-white/[0.08] shadow-bezel-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
              Quản Lý Tài Khoản Douyin Matrix
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
              {accounts.length} Profiles
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Mỗi tài khoản vận hành trên môi trường Chromium Stealth độc lập, tách biệt cookie và vân tay
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, profile, tag..."
              className="w-full h-9 bg-surface-2/80 border border-white/[0.08] rounded-xl pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-white/[0.08]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Dạng Lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Dạng Danh Sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={loadAccounts}
            className="p-2.5 rounded-xl bg-surface-2 text-zinc-400 hover:text-zinc-200 border border-white/[0.08] hover:border-white/[0.15] transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-tactile-rose flex items-center gap-1.5 text-xs py-2"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Tài Khoản
          </button>
        </div>
      </div>

      {/* Grid Mode View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.length === 0 ? (
            <div className="col-span-full bezel-card p-12 text-center text-zinc-400 text-xs font-mono">
              Chưa tìm thấy tài khoản Douyin nào phù hợp.
            </div>
          ) : (
            filteredAccounts.map((acc) => (
              <div key={acc.id} className="bezel-card p-5 space-y-4 hover:border-white/[0.16] group">
                {/* Account Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-surface-3 border border-white/10 overflow-hidden flex items-center justify-center text-white font-extrabold text-base shadow-inner">
                        {acc.avatar_url ? (
                          <img src={acc.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (acc.nickname || "D").charAt(0).toUpperCase()
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface-1 ${
                          acc.cookie_status === "valid" ? "bg-emerald-500" : "bg-zinc-600"
                        }`}
                      ></span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-sm tracking-tight group-hover:text-rose-400 transition">
                        {acc.nickname || "Douyin User"}
                      </h4>
                      <div className="text-[11px] font-mono text-zinc-400">
                        ID: {acc.douyin_id || acc.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                    title="Xóa liên kết"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Profile & Proxy Info Bezel */}
                <div className="bezel-card-inner p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-cyan-400" /> Profile:
                    </span>
                    <span className="font-bold text-zinc-200">{acc.profile_name || acc.profile_id.slice(0, 8)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-rose-400" /> Proxy:
                    </span>
                    <span className="font-mono text-[11px] text-zinc-300">
                      {acc.proxy_url ? acc.proxy_url.split("@").pop() : "Direct IP"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <span className="text-zinc-400 text-[11px]">Trạng thái:</span>
                    {acc.cookie_status === "valid" ? (
                      <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ Đã đăng nhập</span>
                    ) : (
                      <span className="text-amber-400 font-mono text-[11px] font-bold">Chế độ khách</span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {acc.tags && acc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {acc.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] text-zinc-300 border border-white/[0.06]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleCheckLogin(acc)}
                    disabled={checkingId === acc.id}
                    className="btn-tactile-dark py-2 text-xs text-rose-400 hover:text-rose-300"
                  >
                    {checkingId === acc.id ? "Đang check..." : "Check Login"}
                  </button>
                  <button
                    onClick={() => onLaunchProfile(acc.profile_id)}
                    className="btn-tactile-rose py-2 text-xs"
                  >
                    Mở Browser
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* List Mode View */}
      {viewMode === "list" && (
        <div className="bezel-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/80 text-zinc-400 uppercase text-[10px] font-mono tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="px-5 py-3.5">Tài Khoản</th>
                  <th className="px-5 py-3.5">Profile Antidetect</th>
                  <th className="px-5 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5">Proxy Gắn Kèm</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-surface-3 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                        {acc.avatar_url ? (
                          <img src={acc.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          (acc.nickname || "D").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-white">{acc.nickname || "Douyin User"}</div>
                        <div className="text-[10px] font-mono text-zinc-400">ID: {acc.id.slice(0, 8)}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-zinc-200">
                      {acc.profile_name || acc.profile_id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5">
                      {acc.cookie_status === "valid" ? (
                        <span className="text-emerald-400 font-mono font-bold">✓ Login OK</span>
                      ) : (
                        <span className="text-amber-400 font-mono font-bold">Guest Mode</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">
                      {acc.proxy_url ? acc.proxy_url.split("@").pop() : "Direct IP"}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleCheckLogin(acc)}
                        disabled={checkingId === acc.id}
                        className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/30 transition"
                      >
                        Check
                      </button>
                      <button
                        onClick={() => onLaunchProfile(acc.profile_id)}
                        className="px-3 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition"
                      >
                        Mở Trình Duyệt
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-1 text-zinc-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Account with Double Bezel */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bezel-card p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" /> Gán Tài Khoản Douyin Vào Profile
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ESC / CLOSE
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="label">Chọn Profile Antidetect:</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="input cursor-pointer"
                  required
                >
                  <option value="">-- Chọn Profile Antidetect --</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.platform} - Proxy: {p.proxy || "Direct IP"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="label">Tên Gợi Nhớ / Kênh:</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ví dụ: Acc Thời Trang Nữ 01"
                  className="input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="label">Thẻ / Phân Loại (phân cách bằng dấu phẩy):</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="thoitrang, mypham, giadung"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-tactile-dark py-2 px-4 text-xs"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-tactile-rose py-2 px-5 text-xs">
                  Lưu Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
