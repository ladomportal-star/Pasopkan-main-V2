import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarDays,
  CircleCheck,
  Search,
  ShieldCheck,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { api } from "../lib/api";

export type AdminBroadcastItem = {
  id: string;
  title: string;
  message: string;
  category: "new_event" | "urgent";
  audience: "all" | "organizers";
  imageUrl: string | null;
  scheduledAt: string | null;
  recipientCount: number;
  readCount: number;
  createdAt: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export default function AdminNotifications({ token }: { token: string | null }) {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"new_event" | "urgent">("new_event");
  const [audience, setAudience] = useState<"all" | "organizers">("all");
  const [bodyMessage, setBodyMessage] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const authOptions = useMemo(() => ({ token, throwOnError: true as const }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.get<{ broadcasts: AdminBroadcastItem[] }>(
        "/admin/notifications",
        authOptions,
      );
      setBroadcasts(result.data?.broadcasts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notification history");
    } finally {
      setLoading(false);
    }
  }, [authOptions, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleBroadcasts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return broadcasts;
    return broadcasts.filter((item) =>
      [item.title, item.message, item.category, item.audience]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [broadcasts, search]);

  async function handleFileSelect(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("ຮອງຮັບສະເພາະຮູບ PNG, JPEG ຫຼື WebP");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("ຮູບພາບຕ້ອງບໍ່ເກີນ 5 MB");
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setImageDataUrl(dataUrl);
      setImageName(file.name);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read image");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !bodyMessage.trim()) {
      setError("ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ຂໍ້ຄວາມການແຈ້ງເຕືອນ");
      return;
    }
    setSending(true);
    setError("");
    setMessageText("");
    try {
      const result = await api.post<{ broadcast: AdminBroadcastItem }>(
        "/admin/notifications/broadcast",
        {
          title: title.trim(),
          message: bodyMessage.trim(),
          category,
          audience,
          imageDataUrl,
          scheduledAt: scheduledAt || null,
        },
        authOptions,
      );
      if (result.data?.broadcast) {
        setBroadcasts((prev) => [result.data!.broadcast, ...prev]);
      } else {
        await load();
      }
      setTitle("");
      setBodyMessage("");
      setImageDataUrl(null);
      setImageName("");
      setScheduledAt("");
      setMessageText("ສົ່ງການແຈ້ງເຕືອນສຳເລັດແລ້ວ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="min-h-[420px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <h2 className="text-xl font-black text-slate-950">ການແຈ້ງເຕືອນ</h2>
        <label className="relative min-w-60">
          <Search className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ຄົ້ນຫາ..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
      {messageText && !error && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          {messageText}
        </p>
      )}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left: Send Notification Form */}
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 text-base font-black text-slate-950">
            <Bell className="h-4 w-4 text-orange-500" />
            <span>ສົ່ງການແຈ້ງເຕືອນ</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              ຫົວຂໍ້ການແຈ້ງເຕືອນ
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="ຕົວຢ່າງ: ປີ້ໃກ້ຈະໝົດແລ້ວ!"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500">ປະເພດ</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategory("new_event")}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition ${
                  category === "new_event"
                    ? "border-blue-300 bg-blue-50/70 text-blue-600"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>ກິດຈະກຳໃໝ່</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory("urgent")}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition ${
                  category === "urgent"
                    ? "border-orange-300 bg-orange-50/70 text-orange-600"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>ບັນຫາດ່ວນ</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500">ກຸ່ມເປົ້າໝາຍ</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAudience("all")}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition ${
                  audience === "all"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>ຜູ້ໃຊ້ທັງໝົດ</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience("organizers")}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition ${
                  audience === "organizers"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>ຜູ້ຈັດງານເທົ່ານັ້ນ</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">ຂໍ້ຄວາມ</label>
            <textarea
              rows={4}
              value={bodyMessage}
              onChange={(event) => setBodyMessage(event.target.value)}
              placeholder="ພິມຂໍ້ຄວາມການແຈ້ງເຕືອນຂອງທ່ານຢູ່ນີ້..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500">ຮູບພາບການແຈ້ງເຕືອນ (URL)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleFileSelect(file);
              }}
            />
            {imageDataUrl ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={imageDataUrl}
                    alt="Notification preview"
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                  <span className="truncate text-xs font-bold text-slate-700">
                    {imageName || "Uploaded image"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageDataUrl(null);
                    setImageName("");
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-4 text-center transition hover:border-orange-300 hover:bg-orange-50/20"
              >
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  CLICK TO UPLOAD IMAGE
                </span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              ເວລາສົ່ງ (ຖ້າຕ້ອງການ)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-adv-orange px-5 py-3.5 text-sm font-black text-white shadow-md shadow-orange-100 transition hover:bg-orange-600 disabled:opacity-60"
          >
            <Bell className="h-4 w-4" />
            <span>{sending ? "ກຳລັງສົ່ງ..." : "ສົ່ງການແຈ້ງເຕືອນ"}</span>
          </button>
        </form>

        {/* Right: Notification Broadcast History */}
        <div>
          <div className="flex items-center gap-2 text-base font-black text-slate-950">
            <Activity className="h-4 w-4 text-slate-400" />
            <span>ປະຫວັດການແຈ້ງເຕືອນ</span>
          </div>

          <div className="mt-4 space-y-3">
            {loading && broadcasts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm font-semibold text-slate-400">
                ກຳລັງໂຫຼດປະຫວັດການແຈ້ງເຕືອນ...
              </div>
            ) : visibleBroadcasts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center text-sm font-semibold text-slate-400">
                ຍັງບໍ່ມີປະຫວັດການແຈ້ງເຕືອນ.
              </div>
            ) : (
              visibleBroadcasts.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    {item.category === "urgent" ? (
                      <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600">
                        ບັນຫາດ່ວນ
                      </span>
                    ) : (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
                        ກິດຈະກຳໃໝ່
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-6 w-6 rounded-md border border-slate-200 object-cover"
                        />
                      )}
                      <span className="text-[11px] font-bold uppercase text-slate-400">
                        {shortDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-2.5 text-sm font-black text-slate-950">{item.title}</h3>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.audience === "organizers" ? "ຜູ້ຈັດງານເທົ່ານັ້ນ" : "ຜູ້ໃຊ້ທັງໝົດ"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-black text-emerald-600">
                        <CircleCheck className="h-3 w-3" /> SENT
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> ອ່ານແລ້ວໂດຍ {item.readCount} ຜູ້ໃຊ້
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
