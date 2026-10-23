import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  Gift,
  LogOut,
  RotateCcw,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import EventStaffManager from "../components/EventStaffManager";
import AdminLiveOverview, {
  type AdminAnalytics,
} from "../components/AdminLiveOverview";

type Application = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  user: {
    publicId: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};
type Event = {
  id: string;
  title: string;
  status: string;
  dateType: string;
  venueName?: string | null;
  description?: string | null;
  rejectionReason?: string | null;
  startDate?: string | null;
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    user: { publicId: string | null; email: string };
  };
  tiers: {
    id: string;
    name: string;
    priceKip: number;
    quantityTotal: number | null;
  }[];
};
type Refund = {
  id: string;
  amountKip: number;
  currency: string;
  status: string;
  reason: string;
  createdAt: string;
  payment: {
    provider: string;
    providerTransactionId: string | null;
    order: {
      orderNumber: string;
      eventTitle: string;
      user: { publicId: string | null; email: string };
    };
  };
};
type AdminUser = {
  id: string;
  publicId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "user" | "organizer" | "admin";
  createdAt: string;
  organizer: { name: string } | null;
  _count: { orders: number };
};
type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: {
    publicId: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};
type Overview = {
  users: number;
  organizers: number;
  events: {
    total: number;
    pendingReview: number;
    published: number;
    cancelled: number;
  };
  organizerApplicationsPending: number;
  orders: { total: number; pending: number; confirmed: number };
  verifiedPayments: { count: number; grossKip: number };
  refunds: {
    pendingApproval: number;
    processing: number;
    succeeded: number;
    refundedKip: number;
  };
  payouts: { enabled: boolean };
};
type PaymentReadiness = {
  configured: boolean;
  adapterRegistered: boolean;
  provider: string | null;
  checkoutEnabled: boolean;
  refundsEnabled: boolean;
};

const emptyOverview: Overview = {
  users: 0,
  organizers: 0,
  events: { total: 0, pendingReview: 0, published: 0, cancelled: 0 },
  organizerApplicationsPending: 0,
  orders: { total: 0, pending: 0, confirmed: 0 },
  verifiedPayments: { count: 0, grossKip: 0 },
  refunds: { pendingApproval: 0, processing: 0, succeeded: 0, refundedKip: 0 },
  payouts: { enabled: false },
};

const money = (amount: number, locale: string) =>
  `${new Intl.NumberFormat(locale).format(amount)} LAK`;
const dateTime = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const displayName = (firstName?: string | null, lastName?: string | null) =>
  [firstName, lastName].filter(Boolean).join(" ") || "—";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published" ||
    status === "approved" ||
    status === "succeeded" ||
    status === "confirmed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : status === "rejected" || status === "cancelled" || status === "failed"
        ? "bg-rose-50 text-rose-700 ring-rose-600/20"
        : "bg-amber-50 text-amber-800 ring-amber-600/20";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-sm font-semibold capitalize ring-1 ring-inset ${tone}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function SectionHeading({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-600">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

/** Admin actions and facts are fetched from guarded backend endpoints only. */
export default function ApprovalCenter({ admin = false }: { admin?: boolean }) {
  const { user, loading, token } = useAuth();
  const allowed =
    !!user &&
    (admin
      ? user.role === "admin"
      : user.role === "organizer" || user.role === "admin");
  const locale = "lo-LA";
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventCursor, setEventCursor] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [paymentReadiness, setPaymentReadiness] =
    useState<PaymentReadiness | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [eventStatus, setEventStatus] = useState("pending_review");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loadingPage, setLoadingPage] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [message, setMessage] = useState("");

  const authOptions = useMemo(
    () => ({ token, throwOnError: true as const }),
    [token],
  );
  const refresh = useCallback(
    async (quiet = false) => {
      if (!token) return;
      if (quiet) setRefreshing(true);
      else setLoadingPage(true);
      setError("");
      try {
        const [
          summary,
          analyticsData,
          apps,
          eventPage,
          refundData,
          logData,
          readiness,
        ] = await Promise.all([
          api.get<Overview>("/admin/overview", authOptions),
          api
            .get<AdminAnalytics>("/admin/analytics", authOptions)
            .catch(() => ({ data: null })),
          api.get<{ applications: Application[] }>(
            "/admin/organizer-applications",
            authOptions,
          ),
          api.get<{ events: Event[]; nextCursor?: string | null }>(
            "/admin/events?limit=50",
            authOptions,
          ),
          api.get<{ refunds: Refund[] }>("/admin/refunds", authOptions),
          api.get<{ logs: AuditLog[] }>("/admin/audit-logs", authOptions),
          api.get<PaymentReadiness>("/admin/payment/readiness", authOptions),
        ]);
        if (
          !summary.data ||
          !apps.data ||
          !eventPage.data ||
          !refundData.data ||
          !logData.data ||
          !readiness.data
        ) {
          throw new Error("The server returned an incomplete admin response");
        }
        setOverview(summary.data);
        setAnalytics(analyticsData.data ?? null);
        setApplications(apps.data.applications ?? []);
        setEvents(eventPage.data.events ?? []);
        setEventCursor(eventPage.data.nextCursor ?? null);
        setRefunds(refundData.data.refunds ?? []);
        setAuditLogs(logData.data.logs ?? []);
        setPaymentReadiness(readiness.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load admin data",
        );
      } finally {
        setLoadingPage(false);
        setRefreshing(false);
      }
    },
    [authOptions, token],
  );

  const loadUsers = useCallback(
    async (cursor?: string | null, append = false) => {
      if (!token) return;
      setUsersLoading(true);
      setUsersError("");
      const params = new URLSearchParams({ limit: "25" });
      if (cursor) params.set("cursor", cursor);
      if (userSearch.trim()) params.set("search", userSearch.trim());
      if (userRole !== "all") params.set("role", userRole);
      try {
        const result = await api.get<{
          users: AdminUser[];
          nextCursor: string | null;
        }>(`/admin/users?${params.toString()}`, authOptions);
        if (!result.data) throw new Error("Empty user list response");
        setUsers((current) =>
          append ? [...current, ...result.data!.users] : result.data!.users,
        );
        setUsersCursor(result.data.nextCursor ?? null);
      } catch (err) {
        setUsersError(
          err instanceof Error ? err.message : "Could not load users",
        );
      } finally {
        setUsersLoading(false);
      }
    },
    [authOptions, token, userRole, userSearch],
  );

  useEffect(() => {
    if (!allowed || !admin) return;
    void refresh();
  }, [allowed, admin, refresh]);

  useEffect(() => {
    if (!allowed || !admin) return;
    const timer = window.setTimeout(() => void loadUsers(null, false), 250);
    return () => window.clearTimeout(timer);
  }, [allowed, admin, loadUsers]);

  async function runAction(
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setBusyKey(key);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      await refresh(true);
      await loadUsers(null, false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The action could not be completed",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function decideApplication(id: string, approve: boolean) {
    const reason = reasons[id]?.trim();
    if (!approve && !reason) return;
    await runAction(
      `application:${id}`,
      () =>
        api.post(
          `/admin/organizer-applications/${id}/review`,
          { approve, ...(approve ? {} : { reason }) },
          authOptions,
        ),
      approve ? "ອະນຸມັດ Organizer ສຳເລັດ" : "ປະຕິເສດຄຳຂໍສຳເລັດ",
    );
  }

  async function updateEventStatus(
    event: Event,
    status: "published" | "rejected" | "pending_review",
  ) {
    const reason = reasons[event.id]?.trim();
    if (status === "rejected" && !reason) return;
    await runAction(
      `event:${event.id}`,
      () =>
        api.put(
          `/events/${event.id}`,
          {
            status,
            ...(status === "rejected" ? { rejectionReason: reason } : {}),
          },
          authOptions,
        ),
      status === "published"
        ? "ອະນຸມັດເຜີຍແຜ່ Event ສຳເລັດ"
        : status === "rejected"
          ? "ສົ່ງຄຳປະຕິເສດແລ້ວ"
          : "ສົ່ງ Event ເຂົ້າກວດແລ້ວ",
    );
  }

  async function loadMoreEvents() {
    if (!eventCursor || !token) return;
    setBusyKey("events:more");
    try {
      const page = await api.get<{
        events: Event[];
        nextCursor: string | null;
      }>(
        `/admin/events?limit=50&cursor=${encodeURIComponent(eventCursor)}`,
        authOptions,
      );
      if (!page.data) throw new Error("Empty events response");
      setEvents((current) => [...current, ...page.data!.events]);
      setEventCursor(page.data.nextCursor ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load more events",
      );
    } finally {
      setBusyKey("");
    }
  }

  const visibleEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          (eventStatus === "all" || event.status === eventStatus) &&
          (activeTab === "event-booking"
            ? event.dateType === "booking"
            : true) &&
          (activeTab === "past" ? event.status === "completed" : true),
      ),
    [activeTab, eventStatus, events],
  );

  const navigation = [
    { id: "pending", label: "ລໍຖ້າການອະນຸມັດ", icon: Check },
    { id: "users", label: "ຈັດການຜູ້ໃຊ້", icon: Users },
    { id: "organizers", label: "ຈັດການຜູ້ຈັດງານ", icon: Users },
    { id: "events", label: "Event ທົ່ວໄປ (Event Type)", icon: CalendarDays },
    {
      id: "event-booking",
      label: "ກິດຈະກຳຈອງ (Booking Type)",
      icon: CalendarDays,
    },
    { id: "past", label: "event ທີ່ສຳເລັດແລ້ວ", icon: Check },
    { id: "payments", label: "ການຊຳລະເງິນ", icon: Banknote },
    { id: "refunds", label: "ການຄືນເງິນ", icon: RotateCcw },
    { id: "activity", label: "Activity Log", icon: Activity },
  ];
  const unavailableNavigation = [
    { label: "ການແຈ້ງເຕືອນ", icon: Bell },
    { label: "ຕັ້ງຄ່າລະບົບ", icon: Settings },
    { label: "ຈັດການບົດຄວາມ", icon: BookOpen },
    { label: "ປີ້ຂອງຂວັນ (Gift Tickets)", icon: Gift },
  ];

  function selectTab(id: string) {
    if (id === "pending") setEventStatus("pending_review");
    else if (["events", "event-booking", "past"].includes(id))
      setEventStatus("all");
    if (id === "organizers") setUserRole("organizer");
    else if (id === "users") setUserRole("all");
    setActiveTab(id);
  }

  function exportOverview() {
    const rows = [
      "metric,value",
      `verified_gross_lak,${overview.verifiedPayments.grossKip}`,
      `confirmed_orders,${overview.orders.confirmed}`,
      `published_events,${overview.events.published}`,
      `pending_event_reviews,${overview.events.pendingReview}`,
      `confirmed_refunds_lak,${overview.refunds.refundedKip}`,
    ];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" }),
    );
    link.download = "pasopkan-admin-overview.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (loading)
    return (
      <main className="mx-auto max-w-6xl p-6 text-slate-600">
        ກຳລັງກວດສອບ session…
      </main>
    );
  if (!user)
    return (
      <main className="mx-auto max-w-6xl p-6">
        <Link className="font-semibold text-orange-700 underline" to="/login">
          ກະລຸນາເຂົ້າລະບົບ / Sign in
        </Link>
      </main>
    );
  if (!allowed)
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5 font-semibold text-rose-800"
        >
          ບັນຊີນີ້ບໍ່ມີສິດ PskAdmin / This account does not have PskAdmin
          access.
        </div>
      </main>
    );
  if (!admin)
    return (
      <main className="mx-auto max-w-6xl p-6">
        <Link to="/account">← ກັບໄປບັນຊີ</Link>
        <p className="mt-4">Organizer review page is unavailable.</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f7f8fa] lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col border-r border-slate-100 bg-white shadow-sm lg:flex">
        <div className="border-b border-slate-50 px-4 py-5">
          <button
            type="button"
            aria-label="Open PskAdmin overview"
            onClick={() => setActiveTab("overview")}
            className="flex w-full justify-center"
          >
            <img
              src="/pasopkan_logo.png"
              alt="Pasopkan"
              className="h-24 w-auto max-w-full object-contain"
            />
          </button>
          <p className="mt-2 text-xs font-bold tracking-wide text-slate-500">
            ລະບົບຈັດການຂໍ້ມູນ · PSKADMIN
          </p>
        </div>
        <nav
          aria-label="PskAdmin"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-[15px] font-bold leading-snug transition-colors ${activeTab === id ? "border-adv-orange bg-adv-orange text-white shadow-md shadow-orange-100" : "border-slate-100 bg-white text-slate-600 hover:border-orange-200 hover:text-adv-orange"}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
          {unavailableNavigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              disabled
              title="ຍັງບໍ່ມີ API ຮອງຮັບ"
              className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3 text-left text-[15px] font-bold leading-snug text-slate-400"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </nav>
        <Link
          to="/account"
          className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm font-bold text-slate-600"
        >
          <span>PskAdmin</span>
          <LogOut className="h-4 w-4" />
        </Link>
      </aside>
      <div className="min-w-0 flex-1 px-3 py-5 sm:px-6 lg:px-10 lg:py-7">
        <div className="w-full space-y-5 rounded-[30px] border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-950">
                {navigation.find((item) => item.id === activeTab)?.label ??
                  "ພາບລວມ"}
              </h1>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[13px] font-bold uppercase text-slate-500">
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  year: "numeric",
                }).format(new Date())}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void refresh(true)}
                disabled={refreshing || loadingPage}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
                />{" "}
                ທົບທວນ
              </button>
              {activeTab === "overview" && (
                <button
                  type="button"
                  onClick={exportOverview}
                  disabled={loadingPage}
                  className="rounded-xl bg-adv-orange px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  ↧ ສົ່ງອອກ CSV
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white"
              >
                ພິມ
              </button>
              <Link
                to="/account"
                className="rounded-xl border border-slate-100 px-3 py-2 text-sm font-bold text-slate-600"
              >
                ບັນຊີ
              </Link>
            </div>
          </header>
          <nav
            aria-label="PskAdmin mobile"
            className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
          >
            {navigation.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold ${activeTab === id ? "bg-adv-orange text-white" : "bg-slate-50 text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
            >
              {message}
            </div>
          )}

          {loadingPage ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border bg-white"
                />
              ))}
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <AdminLiveOverview summary={overview} analytics={analytics} />
              )}

              {activeTab === "payments" && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div className="space-y-1">
                      <p className="font-bold">
                        Payment / refund operations are not active
                      </p>
                      <p>
                        ການອະນຸມັດ refund ໃນ dashboard ແມ່ນການອະນຸມັດໃນ database
                        ເທົ່ານັ້ນ—ບໍ່ໄດ້ໂອນເງິນ.
                        ຢ່າຢືນຢັນກັບລູກຄ້າວ່າຄືນເງິນສຳເລັດ ຈົນກວ່າ provider
                        ຢືນຢັນ.
                      </p>
                      <p className="text-sm">
                        Readiness:{" "}
                        {paymentReadiness?.configured
                          ? "credentials present"
                          : "credentials not configured"}
                        ;{" "}
                        {paymentReadiness?.adapterRegistered
                          ? "adapter registered"
                          : "adapter not registered"}
                        ; checkout/refunds remain disabled.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "applications" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <SectionHeading
                    title="Organizer applications · ຄຳຂໍ Organizer"
                    count={applications.length}
                  />
                  {applications.length === 0 ? (
                    <EmptyState>ບໍ່ມີຄຳຂໍລໍຖ້າກວດ.</EmptyState>
                  ) : (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {applications.map((application) => (
                        <article
                          key={application.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {application.name}
                              </h3>
                              <p className="mt-1 text-sm text-slate-600">
                                {displayName(
                                  application.user.firstName,
                                  application.user.lastName,
                                )}{" "}
                                · {application.user.email}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                ID {application.user.publicId ?? "—"} ·{" "}
                                {dateTime(application.createdAt, locale)}
                              </p>
                            </div>
                            <StatusBadge status={application.status} />
                          </div>
                          {application.description && (
                            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                              {application.description}
                            </p>
                          )}
                          <input
                            aria-label="Rejection reason"
                            value={reasons[application.id] ?? ""}
                            onChange={(event) =>
                              setReasons((current) => ({
                                ...current,
                                [application.id]: event.target.value,
                              }))
                            }
                            placeholder="ເຫດຜົນກໍລະນີປະຕິເສດ"
                            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          />
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              disabled={!!busyKey}
                              onClick={() =>
                                void decideApplication(application.id, true)
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={
                                !!busyKey || !reasons[application.id]?.trim()
                              }
                              onClick={() =>
                                void decideApplication(application.id, false)
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {["events", "pending", "event-booking", "past"].includes(activeTab) && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <SectionHeading
                    title="Event moderation · ກວດສອບ Event"
                    count={visibleEvents.length}
                    action={
                      <select
                        aria-label="Filter events by status"
                        value={eventStatus}
                        onChange={(event) => setEventStatus(event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending_review">Pending review</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    }
                  />
                  {visibleEvents.length === 0 ? (
                    <EmptyState>ບໍ່ມີ Event ໃນສະຖານະນີ້.</EmptyState>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {visibleEvents.map((event) => (
                        <article
                          key={event.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link
                                to={`/event/${event.id}`}
                                className="font-bold text-slate-900 hover:text-orange-700"
                              >
                                {event.title}
                              </Link>
                              <p className="mt-1 text-sm text-slate-600">
                                {event.organizer.name} ·{" "}
                                {event.organizer.user.email}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {event.venueName || "—"} ·{" "}
                                {event.startDate
                                  ? dateTime(event.startDate, locale)
                                  : `Created ${dateTime(event.createdAt, locale)}`}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {event.tiers.length} ticket tiers ·{" "}
                                {event.tiers
                                  .map(
                                    (tier) =>
                                      `${tier.name} (${money(tier.priceKip, locale)})`,
                                  )
                                  .join(", ") || "No ticket tiers"}
                              </p>
                            </div>
                            <StatusBadge status={event.status} />
                          </div>
                          {event.rejectionReason && (
                            <p className="mt-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-800">
                              Previous reason: {event.rejectionReason}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {event.status === "pending_review" && (
                              <>
                                <button
                                  type="button"
                                  disabled={!!busyKey}
                                  onClick={() =>
                                    void updateEventStatus(event, "published")
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                  Approve & publish
                                </button>
                                <input
                                  aria-label="Event rejection reason"
                                  value={reasons[event.id] ?? ""}
                                  onChange={(e) =>
                                    setReasons((current) => ({
                                      ...current,
                                      [event.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Rejection reason"
                                  className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                                <button
                                  type="button"
                                  disabled={
                                    !!busyKey || !reasons[event.id]?.trim()
                                  }
                                  onClick={() =>
                                    void updateEventStatus(event, "rejected")
                                  }
                                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {(["draft", "rejected"] as string[]).includes(
                              event.status,
                            ) && (
                              <button
                                type="button"
                                disabled={!!busyKey}
                                onClick={() =>
                                  void updateEventStatus(
                                    event,
                                    "pending_review",
                                  )
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50"
                              >
                                Move to review
                              </button>
                            )}
                            {!(["cancelled", "completed"] as string[]).includes(
                              event.status,
                            ) && (
                              <button
                                type="button"
                                disabled={!!busyKey}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Cancel “${event.title}”? Existing paid orders will create refund requests, not automatic transfers.`,
                                    )
                                  )
                                    void runAction(
                                      `cancel:${event.id}`,
                                      () =>
                                        api.post(
                                          `/admin/events/${event.id}/cancel`,
                                          undefined,
                                          authOptions,
                                        ),
                                      "Event cancelled; any refund records still require provider execution.",
                                    );
                                }}
                                className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                              >
                                Cancel event
                              </button>
                            )}
                            <EventStaffManager
                              eventId={event.id}
                              token={token}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {eventCursor && (
                    <button
                      type="button"
                      disabled={!!busyKey}
                      onClick={() => void loadMoreEvents()}
                      className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      Load more events
                    </button>
                  )}
                </section>
              )}

              {(activeTab === "users" || activeTab === "organizers") && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <SectionHeading
                    title="User directory · ລາຍຊື່ຜູ້ໃຊ້"
                    count={users.length}
                    action={
                      <form
                        className="flex flex-wrap gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void loadUsers(null, false);
                        }}
                      >
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            value={userSearch}
                            onChange={(event) =>
                              setUserSearch(event.target.value)
                            }
                            placeholder="ຄົ້ນຫາຊື່, email, ID"
                            className="w-56 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                          />
                        </div>
                        <select
                          value={userRole}
                          onChange={(event) => setUserRole(event.target.value)}
                          disabled={activeTab === "organizers"}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="all">All roles</option>
                          <option value="user">Users</option>
                          <option value="organizer">Organizers</option>
                          <option value="admin">PskAdmins</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                        >
                          Search
                        </button>
                      </form>
                    }
                  />
                  {usersError && (
                    <p
                      role="alert"
                      className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
                    >
                      {usersError}
                    </p>
                  )}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="bg-slate-50 text-sm uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-3">Account</th>
                          <th className="px-3 py-3">Role</th>
                          <th className="px-3 py-3">Orders</th>
                          <th className="px-3 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-3">
                              <p className="font-semibold text-slate-900">
                                {displayName(item.firstName, item.lastName)}
                              </p>
                              <p className="text-sm text-slate-500">
                                {item.email || "No email"} ·{" "}
                                {item.publicId || "No public ID"}
                              </p>
                              {item.organizer && (
                                <p className="text-sm text-slate-500">
                                  {item.organizer.name}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <StatusBadge status={item.role} />
                            </td>
                            <td className="px-3 py-3">{item._count.orders}</td>
                            <td className="px-3 py-3 text-slate-600">
                              {dateTime(item.createdAt, locale)}
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && !usersLoading && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-3 py-8 text-center text-slate-500"
                            >
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {usersLoading && (
                    <p className="mt-3 text-sm text-slate-500">
                      Loading users…
                    </p>
                  )}
                  {usersCursor && (
                    <button
                      type="button"
                      disabled={usersLoading}
                      onClick={() => void loadUsers(usersCursor, true)}
                      className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      Load more users
                    </button>
                  )}
                </section>
              )}

              {activeTab === "refunds" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <SectionHeading
                    title="Refunds · ຄຳຂໍຄືນເງິນ"
                    count={refunds.length}
                  />
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Approve ຈະບັນທຶກສະຖານະໃນ database ເທົ່ານັ້ນ.
                      ບໍ່ມີການໂອນ/refund ເງິນຈິງຈົນກວ່າ payment provider
                      ຈະເຊື່ອມຕໍ່.
                    </p>
                  </div>
                  {refunds.length === 0 ? (
                    <EmptyState>
                      ຍັງບໍ່ມີ refund records ໃນ database.
                    </EmptyState>
                  ) : (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {refunds.map((refund) => (
                        <article
                          key={refund.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900">
                                {money(refund.amountKip, locale)}
                              </p>
                              <p className="mt-1 text-sm text-slate-700">
                                {refund.payment.order.eventTitle}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Order {refund.payment.order.orderNumber} ·{" "}
                                {refund.payment.order.user.email}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Provider {refund.payment.provider} ·{" "}
                                {refund.payment.providerTransactionId ??
                                  "No transaction ID"}
                              </p>
                            </div>
                            <StatusBadge status={refund.status} />
                          </div>
                          <p className="mt-3 text-sm text-slate-700">
                            {refund.reason}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Requested {dateTime(refund.createdAt, locale)}
                          </p>
                          {refund.status === "pending_approval" && (
                            <button
                              type="button"
                              disabled={!!busyKey}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Approve ${money(refund.amountKip, locale)} refund for order ${refund.payment.order.orderNumber}? This will not transfer funds.`,
                                  )
                                )
                                  void runAction(
                                    `refund:${refund.id}`,
                                    () =>
                                      api.post(
                                        `/admin/refunds/${refund.id}/approve`,
                                        undefined,
                                        authOptions,
                                      ),
                                    "Refund approved in the database; no money was transferred.",
                                  );
                              }}
                              className="mt-3 rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                            >
                              Approve request (no transfer)
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "activity" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <SectionHeading
                    title="Audit trail · ປະຫວັດການດຳເນີນການ"
                    count={auditLogs.length}
                  />
                  {auditLogs.length === 0 ? (
                    <EmptyState>ຍັງບໍ່ມີ audit records.</EmptyState>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <article
                          key={log.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Activity className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="font-semibold text-slate-800">
                                {log.action.replaceAll(".", " · ")}
                              </p>
                              <p className="text-sm text-slate-500">
                                {log.entityType} · {log.entityId} ·{" "}
                                {displayName(
                                  log.actor?.firstName,
                                  log.actor?.lastName,
                                )}
                              </p>
                            </div>
                          </div>
                          <time className="text-sm text-slate-500">
                            {dateTime(log.createdAt, locale)}
                          </time>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
          <footer className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4" /> PskAdmin-only data · Server
            verifies every privileged action
          </footer>
        </div>
      </div>
    </main>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
