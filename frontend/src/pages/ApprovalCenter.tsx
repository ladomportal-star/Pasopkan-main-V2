import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Bell,
  Ban,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  Download,
  Eye,
  ExternalLink,
  Gift,
  LayoutDashboard,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AdminLiveOverview, {
  type AdminAnalytics,
} from "../components/AdminLiveOverview";
import AdminPayouts from "../components/AdminPayouts";
import AdminRefunds, { type AdminRefundItem } from "../components/AdminRefunds";

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
  eventType?: string | null;
  category?: string | null;
  venueName?: string | null;
  addressText?: string | null;
  province?: string | null;
  district?: string | null;
  description?: string | null;
  rejectionReason?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  coverImageUrl?: string | null;
  coverImageUrlDisplay?: string | null;
  viewsCount?: number;
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    user: { publicId: string | null; email: string; phone?: string | null };
  };
  privateDetails?: {
    bankName?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
  } | null;
  tiers: {
    id: string;
    name: string;
    priceKip: number;
    quantityTotal: number | null;
    quantitySold?: number;
  }[];
};
type PendingReviewSummary = { total: number; urgent: number };
type Refund = AdminRefundItem;
type AdminUser = {
  id: string;
  publicId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: "user" | "organizer" | "admin";
  isSuspended: boolean;
  suspendedAt: string | null;
  createdAt: string;
  organizer: { name: string } | null;
  _count: { orders: number };
};
type UserSummary = { total: number; active: number; suspended: number };
type UserEditDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminUser["role"];
  status: "active" | "suspended";
};
type AdminOrganizer = {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  createdAt: string;
  user: {
    id: string;
    publicId: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    isSuspended: boolean;
    suspendedAt: string | null;
  };
  _count: { events: number };
};
type OrganizerSummary = { total: number; active: number; suspended: number; events: number };
type OrganizerDetail = Omit<AdminOrganizer, "_count"> & {
  events: Array<{
    id: string;
    title: string;
    status: string;
    category: string | null;
    eventType: string | null;
    startDate: string | null;
    venueName: string | null;
    coverImageUrl: string | null;
    createdAt: string;
  }>;
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
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventCursor, setEventCursor] = useState<string | null>(null);
  const [pendingReviewSummary, setPendingReviewSummary] =
    useState<PendingReviewSummary>({ total: 0, urgent: 0 });
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [paymentReadiness, setPaymentReadiness] =
    useState<PaymentReadiness | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary>({
    total: 0,
    active: 0,
    suspended: 0,
  });
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [userStatus, setUserStatus] = useState("all");
  const [organizerCandidate, setOrganizerCandidate] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [editDraft, setEditDraft] = useState<UserEditDraft | null>(null);
  const [eventStatus, setEventStatus] = useState("all");
  const [eventMonth, setEventMonth] = useState("all");
  const [eventYear, setEventYear] = useState("all");
  const [eventSearch, setEventSearch] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null);
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
          api.get<{
            events: Event[];
            nextCursor?: string | null;
            pendingReviewSummary?: PendingReviewSummary;
          }>(
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
        setPendingReviewSummary(
          eventPage.data.pendingReviewSummary ?? {
            total: summary.data.events.pendingReview,
            urgent: 0,
          },
        );
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
      if (userStatus !== "all") params.set("status", userStatus);
      try {
        const result = await api.get<{
          users: AdminUser[];
          nextCursor: string | null;
          summary?: UserSummary;
        }>(`/admin/users?${params.toString()}`, authOptions);
        if (!result.data) throw new Error("Empty user list response");
        setUsers((current) =>
          append ? [...current, ...result.data!.users] : result.data!.users,
        );
        setUsersCursor(result.data.nextCursor ?? null);
        setUserSummary(
          result.data.summary ?? {
            total: result.data.users.length,
            active: result.data.users.length,
            suspended: 0,
          },
        );
      } catch (err) {
        setUsersError(
          err instanceof Error ? err.message : "Could not load users",
        );
      } finally {
        setUsersLoading(false);
      }
    },
    [authOptions, token, userRole, userSearch, userStatus],
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
      setRejectingEventId(null);
      await refresh(true);
      await loadUsers(null, false);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The action could not be completed",
      );
      return false;
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

  async function updateUserAccess(
    item: AdminUser,
    patch: {
      role?: AdminUser["role"];
      suspended?: boolean;
      firstName?: string | null;
      lastName?: string | null;
      email?: string;
      phone?: string | null;
    },
  ) {
    return runAction(
      `user:${item.id}`,
      () => api.patch(`/admin/users/${item.id}`, patch, authOptions),
      patch.role
        ? "ປັບສິດຜູ້ໃຊ້ສຳເລັດ"
        : patch.suspended
          ? "ລະງັບບັນຊີສຳເລັດ"
          : "ຄືນສະຖານະບັນຊີສຳເລັດ",
    );
  }

  function openUserEditor(item: AdminUser) {
    setEditingUser(item);
    setEditDraft({
      firstName: item.firstName ?? "",
      lastName: item.lastName ?? "",
      email: item.email,
      phone: item.phone ?? "",
      role: item.role,
      status: item.isSuspended ? "suspended" : "active",
    });
  }

  async function saveUserEdits() {
    if (!editingUser || !editDraft || !editDraft.email.trim()) return;
    const saved = await updateUserAccess(editingUser, {
      firstName: editDraft.firstName.trim() || null,
      lastName: editDraft.lastName.trim() || null,
      email: editDraft.email.trim(),
      phone: editDraft.phone.trim() || null,
      role: editDraft.role,
      suspended: editDraft.status === "suspended",
    });
    if (saved) {
      setEditingUser(null);
      setEditDraft(null);
    }
  }

  async function deleteUserAccount(item: AdminUser) {
    const deleted = await runAction(
      `user:${item.id}`,
      () => api.delete(`/admin/users/${item.id}`, authOptions),
      "ລົບບັນຊີອອກຈາກລາຍການສຳເລັດ",
    );
    if (deleted) setDeletingUser(null);
  }

  async function exportUsers() {
    setBusyKey("users:export");
    setError("");
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set("search", userSearch.trim());
      if (userRole !== "all") params.set("role", userRole);
      if (userStatus !== "all") params.set("status", userStatus);
      const result = await api.get<{
        users: Array<{
          publicId: string | null;
          firstName: string | null;
          lastName: string | null;
          email: string;
          phone: string | null;
          role: string;
          isSuspended: boolean;
          createdAt: string;
          _count: { orders: number };
        }>;
      }>(`/admin/users/export?${params.toString()}`, authOptions);
      if (!result.data) throw new Error("Could not export users");
      const csvCell = (value: unknown) =>
        `"${String(value ?? "").replaceAll('"', '""')}"`;
      const rows = [
        ["public_id", "name", "email", "phone", "role", "status", "orders", "joined_at"],
        ...result.data.users.map((item) => [
          item.publicId,
          displayName(item.firstName, item.lastName),
          item.email,
          item.phone,
          item.role,
          item.isSuspended ? "suspended" : "active",
          item._count.orders,
          item.createdAt,
        ]),
      ];
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
          type: "text/csv;charset=utf-8",
        }),
      );
      link.download = `pasopkan-users-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export users");
    } finally {
      setBusyKey("");
    }
  }

  async function loadMoreEvents() {
    if (!eventCursor || !token) return;
    setBusyKey("events:more");
    try {
      const page = await api.get<{
        events: Event[];
        nextCursor: string | null;
        pendingReviewSummary?: PendingReviewSummary;
      }>(
        `/admin/events?limit=50&cursor=${encodeURIComponent(eventCursor)}`,
        authOptions,
      );
      if (!page.data) throw new Error("Empty events response");
      setEvents((current) => [...current, ...page.data!.events]);
      setEventCursor(page.data.nextCursor ?? null);
      if (page.data.pendingReviewSummary)
        setPendingReviewSummary(page.data.pendingReviewSummary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load more events",
      );
    } finally {
      setBusyKey("");
    }
  }

  const eventYearOptions = useMemo(() => {
    const years = new Set<string>([String(new Date().getFullYear())]);
    for (const event of events) {
      const year = (event.startDate ?? event.createdAt ?? "").slice(0, 4);
      if (/^\d{4}$/.test(year)) years.add(year);
    }
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [events]);
  /** Events narrowed by the month/year filter (applies to the event tabs only). */
  const periodEvents = useMemo(
    () =>
      events.filter((event) => {
        const date = event.startDate ?? event.createdAt ?? "";
        return (
          (eventYear === "all" || date.slice(0, 4) === eventYear) &&
          (eventMonth === "all" || date.slice(5, 7) === eventMonth)
        );
      }),
    [events, eventMonth, eventYear],
  );

  const visibleEvents = useMemo(
    () =>
      (["events", "event-booking", "past"].includes(activeTab) ? periodEvents : events).filter(
        (event) =>
          event.status !== "draft" &&
          (eventStatus === "all" || event.status === eventStatus) &&
          (activeTab === "event-booking"
            ? event.dateType === "booking"
            : activeTab === "events"
              ? event.dateType !== "booking"
              : true) &&
          (!eventSearch.trim() ||
            [event.title, event.organizer.name, event.category, event.venueName]
              .filter(Boolean)
              .some((value) =>
                String(value).toLowerCase().includes(eventSearch.trim().toLowerCase()),
              )) &&
          (activeTab === "past" ? event.status === "completed" : true),
      ),
    [activeTab, eventSearch, eventStatus, events, periodEvents],
  );
  const bookingSummary = useMemo(() => {
    const bookingEvents = periodEvents.filter(
      (event) => event.dateType === "booking" && event.status !== "draft",
    );
    return bookingEvents.reduce(
      (summary, event) => {
        summary.tickets += event.tiers.reduce(
          (total, tier) => total + (tier.quantitySold ?? 0),
          0,
        );
        summary.valueKip += event.tiers.reduce(
          (total, tier) => total + tier.priceKip * (tier.quantitySold ?? 0),
          0,
        );
        if (event.status === "pending_review") summary.pending += 1;
        return summary;
      },
      { total: bookingEvents.length, pending: 0, tickets: 0, valueKip: 0 },
    );
  }, [periodEvents]);
  const pastSummary = useMemo(() => {
    const completedEvents = periodEvents.filter((event) => event.status === "completed");
    const tickets = completedEvents.reduce(
      (total, event) =>
        total + event.tiers.reduce((sum, tier) => sum + (tier.quantitySold ?? 0), 0),
      0,
    );
    const salesKip = completedEvents.reduce(
      (total, event) =>
        total +
        event.tiers.reduce((sum, tier) => sum + tier.priceKip * (tier.quantitySold ?? 0), 0),
      0,
    );
    return {
      total: completedEvents.length,
      tickets,
      salesKip,
      payoutKip: Math.round(salesKip * (1 - PLATFORM_FEE_RATE)),
    };
  }, [periodEvents]);

  function exportEvents() {
    const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["title", "type", "category", "status", "organizer", "date", "venue", "tickets_sold", "ticket_value_lak"],
      ...visibleEvents.map((event) => {
        const sold = event.tiers.reduce((total, tier) => total + (tier.quantitySold ?? 0), 0);
        const value = event.tiers.reduce(
          (total, tier) => total + tier.priceKip * (tier.quantitySold ?? 0),
          0,
        );
        return [event.title, event.eventType, event.category, event.status, event.organizer.name, event.startDate, event.venueName, sold, value];
      }),
    ];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    link.download = `pasopkan-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const navigation = [
    { id: "overview", label: "ພາບລວມ", icon: LayoutDashboard },
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
    { id: "payments", label: "ການເບີກຈ່າຍເງິນ", icon: Banknote },
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
    else if (["events", "event-booking", "past"].includes(id)) {
      setEventStatus("all");
      setEventMonth("all");
      setEventYear("all");
    }
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
    <>
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

              {activeTab === "payments" && <AdminPayouts token={token} />}

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

              {activeTab === "pending" && (
                <section className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        ກວດສອບກິດຈະກຳທີ່ລໍຖ້າອະນຸມັດ
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        ຂໍ້ມູນ, ຜູ້ຈັດງານ, ປີ້ ແລະບັນຊີຮັບເງິນມາຈາກຖານຂໍ້ມູນຈິງ
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                      <span className="grid h-12 w-12 place-items-center rounded-xl border border-amber-200 bg-white text-amber-600">
                        <CalendarDays className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-black text-slate-950">
                          {pendingReviewSummary.total}
                        </p>
                        <p className="font-bold text-amber-800">ລໍຖ້າການອະນຸມັດ</p>
                        <p className="text-xs text-slate-500">ກວດສອບກ່ອນເຜີຍແຜ່</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
                      <span className="grid h-12 w-12 place-items-center rounded-xl border border-rose-200 bg-white text-rose-600">
                        <AlertTriangle className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-black text-slate-950">
                          {pendingReviewSummary.urgent}
                        </p>
                        <p className="font-bold text-rose-700">ຈັດງານໃນ 14 ມື້</p>
                        <p className="text-xs text-slate-500">ຕ້ອງກວດສອບໂດຍໄວ</p>
                      </div>
                    </div>
                  </div>

                  {visibleEvents.length === 0 ? (
                    <EmptyState>ບໍ່ມີ Event ທີ່ລໍຖ້າການອະນຸມັດ.</EmptyState>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {visibleEvents.map((event) => {
                        const totalCapacity = event.tiers.reduce(
                          (sum, tier) => sum + (tier.quantityTotal ?? 0),
                          0,
                        );
                        const sold = event.tiers.reduce(
                          (sum, tier) => sum + (tier.quantitySold ?? 0),
                          0,
                        );
                        const minPrice = event.tiers.length
                          ? Math.min(...event.tiers.map((tier) => tier.priceKip))
                          : 0;
                        const contact =
                          event.organizer.contactPhone ||
                          event.organizer.user.phone ||
                          event.organizer.contactEmail ||
                          event.organizer.user.email;
                        const location = [
                          event.venueName,
                          event.district,
                          event.province,
                        ]
                          .filter(Boolean)
                          .join(", ");
                        const startAt = event.startDate
                          ? new Date(event.startDate)
                          : null;
                        const daysUntil = startAt
                          ? Math.ceil(
                              (startAt.getTime() - Date.now()) /
                                (24 * 60 * 60 * 1000),
                            )
                          : null;
                        const urgent =
                          daysUntil !== null && daysUntil >= 0 && daysUntil <= 14;
                        return (
                          <article
                            key={event.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                          >
                            <div className="space-y-4 p-4 sm:p-5">
                              <div className="flex gap-4">
                                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                  {event.coverImageUrlDisplay ? (
                                    <img
                                      src={event.coverImageUrlDisplay}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="grid h-full place-items-center text-slate-300">
                                      <CalendarDays className="h-8 w-8" />
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-blue-700 ring-1 ring-blue-200">
                                      {event.eventType || event.dateType || "EVENT"}
                                    </span>
                                    {event.category && (
                                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold uppercase text-slate-600 ring-1 ring-slate-200">
                                        {event.category}
                                      </span>
                                    )}
                                    {urgent && (
                                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                                        ເຫຼືອ {daysUntil} ມື້
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950">
                                    {event.title}
                                  </h3>
                                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                                    <CalendarDays className="h-4 w-4 shrink-0 text-orange-500" />
                                    {event.startDate
                                      ? dateTime(event.startDate, locale)
                                      : `ສ້າງ ${dateTime(event.createdAt, locale)}`}
                                  </p>
                                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{location || "ບໍ່ໄດ້ລະບຸສະຖານທີ່"}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                  <p className="text-xs font-bold uppercase text-slate-400">ຜູ້ຈັດງານ</p>
                                  <p className="mt-1 font-bold text-slate-800">{event.organizer.name}</p>
                                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                    <Phone className="h-3.5 w-3.5" /> {contact || "ບໍ່ໄດ້ລະບຸ"}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                  <p className="text-xs font-bold uppercase text-slate-400">ບັນຊີຮັບເງິນ</p>
                                  <p className="mt-1 font-bold text-slate-800">
                                    {event.privateDetails?.bankName || "ບໍ່ໄດ້ລະບຸ"}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-500">
                                    {event.privateDetails?.accountHolder || "—"}
                                    {event.privateDetails?.accountNumber
                                      ? ` · ${event.privateDetails.accountNumber}`
                                      : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5 text-sm">
                                <p className="font-bold text-slate-800">
                                  {minPrice > 0 ? money(minPrice, locale) : "Free Entry"}
                                  <span className="ml-1 font-normal text-slate-500">
                                    ({event.tiers.length} ປະເພດປີ້)
                                  </span>
                                </p>
                                <p className="font-bold text-slate-700">
                                  {sold}/{totalCapacity || "—"} ປີ້
                                </p>
                              </div>

                              {rejectingEventId === event.id && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                                  <label
                                    htmlFor={`reject-${event.id}`}
                                    className="text-sm font-bold text-rose-800"
                                  >
                                    ເຫດຜົນທີ່ປະຕິເສດ
                                  </label>
                                  <textarea
                                    id={`reject-${event.id}`}
                                    value={reasons[event.id] ?? ""}
                                    onChange={(e) =>
                                      setReasons((current) => ({
                                        ...current,
                                        [event.id]: e.target.value,
                                      }))
                                    }
                                    rows={3}
                                    className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
                                    placeholder="ລະບຸຈຸດທີ່ຜູ້ຈັດຕ້ອງແກ້ໄຂ"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                              <Link
                                to={`/event/${event.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-bold text-orange-700"
                              >
                                <Eye className="h-4 w-4" /> ເບິ່ງຕົວຢ່າງ
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={!!busyKey}
                                  onClick={() => {
                                    if (
                                      rejectingEventId === event.id &&
                                      reasons[event.id]?.trim()
                                    ) {
                                      void updateEventStatus(event, "rejected");
                                    } else {
                                      setRejectingEventId(event.id);
                                    }
                                  }}
                                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 disabled:opacity-50"
                                >
                                  <X className="mr-1 inline h-4 w-4" /> ປະຕິເສດ
                                </button>
                                <button
                                  type="button"
                                  disabled={!!busyKey}
                                  onClick={() => void updateEventStatus(event, "published")}
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                                >
                                  <Check className="mr-1 inline h-4 w-4" /> ອະນຸມັດ
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {["events", "event-booking", "past"].includes(activeTab) && (
                <section className="min-h-[420px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        {activeTab === "events"
                          ? "Event ທົ່ວໄປ (Event Type)"
                          : activeTab === "event-booking"
                            ? "ກິດຈະກຳຈອງ (Booking Type)"
                            : "Event ທີ່ສຳເລັດແລ້ວ"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        ຂໍ້ມູນ Event ຈິງຈາກ Backend API
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Filter events by month"
                        value={eventMonth}
                        onChange={(event) => setEventMonth(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600"
                      >
                        <option value="all">ທຸກເດືອນ</option>
                        {Array.from({ length: 12 }, (_, index) => {
                          const month = String(index + 1).padStart(2, "0");
                          return (
                            <option key={month} value={month}>
                              {new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2000, index, 1))}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        aria-label="Filter events by year"
                        value={eventYear}
                        onChange={(event) => setEventYear(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600"
                      >
                        <option value="all">ທຸກປີ</option>
                        {eventYearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => void refresh(true)} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> ໂຫຼດໃໝ່</button>
                      <button type="button" onClick={exportEvents} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white"><Download className="h-4 w-4" /> ສົ່ງອອກ CSV</button>
                      <label className="relative min-w-52"><Search className="absolute left-3 top-3 h-4 w-4 text-orange-500" /><input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="ຄົ້ນຫາ..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300" /></label>
                    </div>
                  </div>
                  {activeTab === "event-booking" && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        { value: bookingSummary.total, label: "ກິດຈະກຳຈອງທັງໝົດ", detail: "ກິດຈະກຳປະເພດຈອງ", icon: CalendarDays, tone: "text-orange-600 bg-orange-50" },
                        { value: bookingSummary.pending, label: "ລໍຖ້າການກວດ", detail: "Booking ລໍຖ້າອະນຸມັດ", icon: Clock, tone: "text-blue-600 bg-blue-50" },
                        { value: bookingSummary.tickets, label: "ຈຳນວນການຈອງທັງໝົດ", detail: "ບັດ Booking ທີ່ຂາຍ", icon: Ticket, tone: "text-emerald-600 bg-emerald-50" },
                        { value: money(bookingSummary.valueKip, locale), label: "ມູນຄ່າບັດຈອງ", detail: "ຈາກຈຳນວນບັດທີ່ຂາຍ", icon: Banknote, tone: "text-emerald-600 bg-emerald-50" },
                      ].map((card) => (
                        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">{card.label}</p><p className="mt-4 text-2xl font-black text-slate-950">{card.value}</p><p className="mt-1 text-xs text-slate-400">{card.detail}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${card.tone}`}><card.icon className="h-5 w-5" /></span></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === "past" && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        { value: pastSummary.total, label: "EVENT ທີ່ສຳເລັດແລ້ວ", detail: "ກິດຈະກຳທີ່ຈົບແລ້ວ", icon: CircleCheck, tone: "text-slate-500 bg-slate-50", valueTone: "text-slate-950" },
                        { value: pastSummary.tickets, label: "ບັດທີ່ຂາຍແລ້ວທັງໝົດ", detail: "ຈຳນວນບັດທີ່ຂາຍທັງໝົດ", icon: Ticket, tone: "text-orange-600 bg-orange-50", valueTone: "text-orange-600" },
                        { value: money(pastSummary.salesKip, locale), label: "ຍອດຂາຍລວມ", detail: "ລາຍຮັບກ່ອນຫັກຄ່າທຳນຽມ", icon: TrendingUp, tone: "text-blue-600 bg-blue-50", valueTone: "text-slate-950" },
                      ].map((card) => (
                        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">{card.label}</p><p className={`mt-4 text-2xl font-black ${card.valueTone}`}>{card.value}</p><p className="mt-1 text-xs text-slate-400">{card.detail}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${card.tone}`}><card.icon className="h-5 w-5" /></span></div>
                        </div>
                      ))}
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm">
                        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-emerald-100">ເງິນທີ່ຈະໂອນຄືນ (PAYOUT)</p><p className="mt-4 text-2xl font-black">{money(pastSummary.payoutKip, locale)}</p><p className="mt-1 text-xs font-bold text-emerald-100">ຫຼັງຫັກຄ່າທຳນຽມ {Math.round(PLATFORM_FEE_RATE * 100)}%</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Banknote className="h-5 w-5" /></span></div>
                      </div>
                    </div>
                  )}
                  {visibleEvents.length === 0 ? (
                    activeTab === "event-booking" ? (
                      <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/40 px-6 py-12 text-center">
                        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-slate-300 shadow-sm"><CalendarDays className="h-8 w-8" /></span>
                        <h3 className="mt-5 text-lg font-black text-slate-950">ຍັງບໍ່ມີກິດຈະກຳຈອງ</h3>
                        <p className="mt-2 max-w-lg text-sm text-slate-500">ສ້າງກິດຈະກຳແບບ Booking ເພື່ອກຳນົດມື້, ເວລາ ແລະຈຳນວນທີ່ຮັບຈອງ.</p>
                        <Link to="/create?new=1&type=booking" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-adv-orange px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-100"><span className="text-lg leading-none">+</span> ສ້າງກິດຈະກຳຈອງໃໝ່</Link>
                      </div>
                    ) : activeTab === "past" ? (
                      <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                        <CalendarDays className="h-8 w-8 text-slate-300" />
                        <p className="mt-4 text-sm font-semibold text-slate-500">ບໍ່ພົບ Event ທີ່ສຳເລັດແລ້ວ.</p>
                      </div>
                    ) : (
                      <EmptyState>ບໍ່ມີ Event ໃນສະຖານະນີ້.</EmptyState>
                    )
                  ) : (
                    <div className="mt-6 space-y-4">
                      {visibleEvents.map((event) => {
                        const sold = event.tiers.reduce((total, tier) => total + (tier.quantitySold ?? 0), 0);
                        const ticketValue = event.tiers.reduce((total, tier) => total + tier.priceKip * (tier.quantitySold ?? 0), 0);
                        return (
                        <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-orange-50 text-orange-500">{event.coverImageUrlDisplay || event.coverImageUrl ? <img src={event.coverImageUrlDisplay || event.coverImageUrl || ""} alt="" className="h-full w-full object-cover" /> : <CalendarDays className="h-7 w-7" />}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2"><span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-600">{activeTab === "event-booking" ? "Booking Type" : "Event ທົ່ວໄປ"}</span>{event.category && <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{event.category}</span>}</div>
                                <Link to={`/event/${event.id}`} className="mt-1 block truncate text-lg font-black text-slate-950 hover:text-orange-600">{event.title}</Link>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                                  <StatusBadge status={event.status} />
                                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{event.startDate ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(event.startDate)) : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(event.createdAt))}</span>
                                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.venueName || event.province || "—"}</span>
                                  <span className="rounded-lg bg-orange-50 px-2 py-1 text-orange-700">{sold} ບັດທີ່ຂາຍ</span>
                                  <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">ມູນຄ່າບັດ {money(ticketValue, locale)}</span>
                                  <span className="text-slate-400">{event.organizer.name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center justify-end gap-2">
                              <Link to={`/event/${event.id}`} target="_blank" rel="noreferrer" aria-label="ເບິ່ງໜ້າ Event" className="group relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"><Eye className="h-4 w-4" /><span role="tooltip" className="pointer-events-none absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">ເບິ່ງ Event</span></Link>
                              <Link to={`/create?adminEdit=${encodeURIComponent(event.id)}`} aria-label="ແກ້ໄຂ Event" className="group relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"><Pencil className="h-4 w-4" /><span role="tooltip" className="pointer-events-none absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">ແກ້ໄຂ Event</span></Link>
                            </div>
                          </div>
                        </article>
                        );
                      })}
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

              {activeTab === "users" && (
                <section className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        ຈັດການຜູ້ໃຊ້
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        ຂໍ້ມູນສົດຈາກ API ແລະຖານຂໍ້ມູນ — ບໍ່ມີລາຍການຕົວຢ່າງ
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void loadUsers(null, false)}
                        disabled={usersLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
                      >
                        <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
                        ໂຫຼດໃໝ່
                      </button>
                      <button
                        type="button"
                        onClick={() => void exportUsers()}
                        disabled={busyKey === "users:export"}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" /> ສົ່ງອອກ CSV
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-orange-600 shadow-sm">
                        <Users className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-black text-slate-950">{userSummary.total}</p>
                        <p className="text-sm font-bold text-slate-600">ຜູ້ໃຊ້ທັງໝົດ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <CircleCheck className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-black text-slate-950">{userSummary.active}</p>
                        <p className="text-sm font-bold text-slate-600">ບັນຊີທີ່ໃຊ້ງານ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-rose-600 shadow-sm">
                        <Ban className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-black text-slate-950">{userSummary.suspended}</p>
                        <p className="text-sm font-bold text-slate-600">ບັນຊີທີ່ຖືກລະງັບ</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <form
                      className="relative min-w-64 flex-1"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void loadUsers(null, false);
                      }}
                    >
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        placeholder="ຄົ້ນຫາຊື່, email, ເບີໂທ ຫຼື ID"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300"
                      />
                    </form>
                    {activeTab === "users" && (
                      <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                        {[
                          ["all", "ທຸກ role"],
                          ["user", "User"],
                          ["organizer", "Organizer"],
                          ["admin", "PskAdmin"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setUserRole(value)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${userRole === value ? "bg-slate-900 text-white" : "text-slate-500"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                      {[
                        ["all", "ທຸກສະຖານະ"],
                        ["active", "ໃຊ້ງານ"],
                        ["suspended", "ລະງັບ"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setUserStatus(value)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${userStatus === value ? "bg-adv-orange text-white" : "text-slate-500"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {usersError && (
                    <p
                      role="alert"
                      className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
                    >
                      {usersError}
                    </p>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[980px] text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-5 py-4">ຜູ້ໃຊ້</th>
                          <th className="px-4 py-4">Email</th>
                          <th className="px-4 py-4">ເບີໂທ</th>
                          <th className="px-4 py-4">Role</th>
                          <th className="px-4 py-4">ສະຖານະ</th>
                          <th className="px-5 py-4 text-right">ການຈັດການ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-orange-100 bg-orange-50 font-bold text-orange-600">
                                  {(item.firstName?.[0] || item.email?.[0] || "U").toUpperCase()}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {displayName(item.firstName, item.lastName)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {item.publicId || "—"} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.createdAt))}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">{item.email || "—"}</td>
                            <td className="px-4 py-3.5 text-slate-600">{item.phone || "—"}</td>
                            <td className="px-4 py-3.5">
                              <StatusBadge status={item.role} />
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${item.isSuspended ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {item.isSuspended ? "SUSPENDED" : "ACTIVE"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex justify-end gap-2">
                                {item.role === "user" && (
                                  <button
                                    type="button"
                                    disabled={!!busyKey}
                                    onClick={() => setOrganizerCandidate(item)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-700 disabled:opacity-50"
                                  >
                                    <UserPlus className="h-3.5 w-3.5" /> ເປັນ Organizer
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={!!busyKey}
                                  title="ແກ້ໄຂຜູ້ໃຊ້"
                                  onClick={() => openUserEditor(item)}
                                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-orange-200 hover:text-orange-600 disabled:opacity-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!!busyKey}
                                  title="ລົບຜູ້ໃຊ້"
                                  onClick={() => setDeletingUser(item)}
                                  className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && !usersLoading && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-3 py-8 text-center text-slate-500"
                            >
                              ບໍ່ພົບຜູ້ໃຊ້ໃນຖານຂໍ້ມູນ.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {usersLoading && (
                    <p className="mt-3 text-sm text-slate-500">
                      ກຳລັງໂຫຼດຜູ້ໃຊ້ຈາກ API…
                    </p>
                  )}
                  {usersCursor && (
                    <button
                      type="button"
                      disabled={usersLoading}
                      onClick={() => void loadUsers(usersCursor, true)}
                      className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      ໂຫຼດເພີ່ມ
                    </button>
                  )}
                </section>
              )}

              {activeTab === "organizers" && token && (
                <OrganizerManagement
                  token={token}
                  onChanged={() => void refresh(true)}
                />
              )}

              {activeTab === "refunds" && (
                <AdminRefunds
                  token={token}
                  initialRefunds={refunds}
                  onUpdated={() => void refresh(true)}
                />
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

      {organizerCandidate && (
        <AdminModal
          title="ປັບຜູ້ໃຊ້ເປັນຜູ້ຈັດງານ (Organizer)"
          subtitle="ມອບສິດໃຫ້ສ້າງ ແລະຈັດການ Event"
          icon={<Building2 className="h-5 w-5" />}
          onClose={() => setOrganizerCandidate(null)}
        >
          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 font-black text-white">
                  {(organizerCandidate.firstName?.[0] || organizerCandidate.email?.[0] || "U").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">
                    {displayName(organizerCandidate.firstName, organizerCandidate.lastName)}
                  </p>
                  <p className="truncate text-sm text-slate-500">{organizerCandidate.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 pt-4">
                <div>
                  <p className="text-xs font-bold text-slate-400">ສິດປັດຈຸບັນ</p>
                  <span className="mt-1 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase text-slate-600">
                    {organizerCandidate.role}
                  </span>
                </div>
                <span className="pb-1 text-xl text-slate-400">→</span>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400">ສິດໃໝ່</p>
                  <span className="mt-1 inline-flex rounded-lg border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                    ORGANIZER
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                ຫຼັງຈາກຢືນຢັນ ຜູ້ໃຊ້ຈະສາມາດສ້າງ Event, ຈັດການບັດ
                ແລະຈັດການຄຳສັ່ງຊື້ໄດ້.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOrganizerCandidate(null)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600"
            >
              ຍົກເລີກ
            </button>
            <button
              type="button"
              disabled={busyKey === `user:${organizerCandidate.id}`}
              onClick={async () => {
                const updated = await updateUserAccess(organizerCandidate, { role: "organizer" });
                if (updated) setOrganizerCandidate(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-adv-orange px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-100 disabled:opacity-50"
            >
              <CircleCheck className="h-4 w-4" /> ຢືນຢັນການປ່ຽນ
            </button>
          </div>
        </AdminModal>
      )}

      {editingUser && editDraft && (
        <AdminModal
          title="ແກ້ໄຂຜູ້ໃຊ້"
          subtitle={`ID: ${editingUser.publicId || editingUser.id}`}
          icon={<Users className="h-5 w-5" />}
          onClose={() => {
            setEditingUser(null);
            setEditDraft(null);
          }}
          size="lg"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveUserEdits();
            }}
          >
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-500">ຊື່</span>
                <input
                  value={editDraft.firstName}
                  onChange={(event) => setEditDraft({ ...editDraft, firstName: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-orange-300 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-500">ນາມສະກຸນ</span>
                <input
                  value={editDraft.lastName}
                  onChange={(event) => setEditDraft({ ...editDraft, lastName: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-orange-300 focus:bg-white"
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-bold text-slate-500">Email ໂປຣໄຟລ໌</span>
                <input
                  required
                  type="email"
                  value={editDraft.email}
                  onChange={(event) => setEditDraft({ ...editDraft, email: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-orange-300 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-500">ບົດບາດ</span>
                <select
                  value={editDraft.role}
                  onChange={(event) => setEditDraft({ ...editDraft, role: event.target.value as AdminUser["role"] })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-orange-300 focus:bg-white"
                >
                  <option value="user">User</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">PskAdmin</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-500">ສະຖານະ</span>
                <select
                  value={editDraft.status}
                  onChange={(event) => setEditDraft({ ...editDraft, status: event.target.value as UserEditDraft["status"] })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-orange-300 focus:bg-white"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-bold text-slate-500">ເບີໂທ</span>
                <input
                  value={editDraft.phone}
                  onChange={(event) => setEditDraft({ ...editDraft, phone: event.target.value })}
                  placeholder="+856 20 ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-orange-300 focus:bg-white"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setEditDraft(null);
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                disabled={busyKey === `user:${editingUser.id}` || !editDraft.email.trim()}
                className="rounded-xl bg-adv-orange px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                ບັນທຶກການປ່ຽນແປງ
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {deletingUser && (
        <AdminModal
          title="ລົບຜູ້ໃຊ້"
          subtitle="ການດຳເນີນການນີ້ຈະປິດການເຂົ້າໃຊ້ງານທັນທີ"
          icon={<Trash2 className="h-5 w-5" />}
          onClose={() => setDeletingUser(null)}
        >
          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="font-black text-slate-950">
                {displayName(deletingUser.firstName, deletingUser.lastName)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{deletingUser.email}</p>
              <p className="mt-3 text-sm leading-6 text-rose-700">
                ບັນຊີຈະຖືກນຳອອກຈາກລາຍການ ແລະບໍ່ສາມາດເຂົ້າລະບົບໄດ້.
                ປະຫວັດ order/event ຈະຖືກເກັບໄວ້ເພື່ອຄວາມຖືກຕ້ອງທາງບັນຊີ.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600"
            >
              ຍົກເລີກ
            </button>
            <button
              type="button"
              disabled={busyKey === `user:${deletingUser.id}`}
              onClick={() => void deleteUserAccount(deletingUser)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> ຢືນຢັນລົບ
            </button>
          </div>
        </AdminModal>
      )}
    </>
  );
}

function OrganizerManagement({
  token,
  onChanged,
}: {
  token: string;
  onChanged: () => void;
}) {
  const locale = "lo-LA";
  const authOptions = useMemo(
    () => ({ token, throwOnError: true as const }),
    [token],
  );
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [summary, setSummary] = useState<OrganizerSummary>({
    total: 0,
    active: 0,
    suspended: 0,
    events: 0,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState<AdminOrganizer | null>(null);
  const [detail, setDetail] = useState<OrganizerDetail | null>(null);
  const [editing, setEditing] = useState<AdminOrganizer | null>(null);
  const [demoting, setDemoting] = useState<AdminOrganizer | null>(null);
  const [deleting, setDeleting] = useState<AdminOrganizer | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    status: "active" as "active" | "suspended",
  });

  const loadOrganizers = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    try {
      const result = await api.get<{
        organizers: AdminOrganizer[];
        summary: OrganizerSummary;
      }>(`/admin/organizers?${params.toString()}`, authOptions);
      if (!result.data) throw new Error("Empty organizer list response");
      setOrganizers(result.data.organizers);
      setSummary(result.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load organizers");
    } finally {
      setLoading(false);
    }
  }, [authOptions, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrganizers(), 250);
    return () => window.clearTimeout(timer);
  }, [loadOrganizers]);

  async function runOrganizerAction(
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      await loadOrganizers();
      onChanged();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action could not be completed");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function openDetails(item: AdminOrganizer) {
    setViewing(item);
    setDetail(null);
    setBusy(`detail:${item.id}`);
    setError("");
    try {
      const result = await api.get<{ organizer: OrganizerDetail }>(
        `/admin/organizers/${item.id}`,
        authOptions,
      );
      if (!result.data) throw new Error("Empty organizer detail response");
      setDetail(result.data.organizer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load organizer details");
    } finally {
      setBusy("");
    }
  }

  function openEditor(item: AdminOrganizer) {
    setEditing(item);
    setDraft({
      name: item.name,
      contactEmail: item.contactEmail || item.user.email,
      contactPhone: item.contactPhone || item.user.phone || "",
      bankName: item.bankName || "",
      accountNumber: item.accountNumber || "",
      accountHolder: item.accountHolder || "",
      status: item.user.isSuspended ? "suspended" : "active",
    });
  }

  async function saveOrganizer() {
    if (!editing || !draft.name.trim() || !draft.contactEmail.trim()) return;
    const saved = await runOrganizerAction(
      `edit:${editing.id}`,
      () =>
        api.patch(
          `/admin/organizers/${editing.id}`,
          {
            name: draft.name.trim(),
            contactEmail: draft.contactEmail.trim(),
            contactPhone: draft.contactPhone.trim() || null,
            bankName: draft.bankName.trim() || null,
            accountNumber: draft.accountNumber.trim() || null,
            accountHolder: draft.accountHolder.trim() || null,
            suspended: draft.status === "suspended",
          },
          authOptions,
        ),
      "ບັນທຶກຂໍ້ມູນຜູ້ຈັດງານສຳເລັດ",
    );
    if (saved) setEditing(null);
  }

  async function demoteOrganizer(item: AdminOrganizer) {
    const saved = await runOrganizerAction(
      `demote:${item.id}`,
      () => api.patch(`/admin/users/${item.user.id}`, { role: "user" }, authOptions),
      "ປ່ຽນຜູ້ຈັດງານເປັນ User ສຳເລັດ",
    );
    if (saved) setDemoting(null);
  }

  async function deleteOrganizer(item: AdminOrganizer) {
    const saved = await runOrganizerAction(
      `delete:${item.id}`,
      () => api.delete(`/admin/users/${item.user.id}`, authOptions),
      "ລົບບັນຊີຜູ້ຈັດງານສຳເລັດ",
    );
    if (saved) setDeleting(null);
  }

  async function exportOrganizers() {
    setBusy("export");
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      const result = await api.get<{ organizers: AdminOrganizer[] }>(
        `/admin/organizers/export?${params.toString()}`,
        authOptions,
      );
      if (!result.data) throw new Error("Could not export organizers");
      const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const rows = [
        ["name", "email", "phone", "bank", "account_holder", "account_number", "events", "status", "joined_at"],
        ...result.data.organizers.map((item) => [
          item.name,
          item.contactEmail || item.user.email,
          item.contactPhone || item.user.phone,
          item.bankName,
          item.accountHolder,
          item.accountNumber,
          item._count.events,
          item.user.isSuspended ? "suspended" : "active",
          item.createdAt,
        ]),
      ];
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([rows.map((row) => row.map(cell).join(",")).join("\r\n")], {
          type: "text/csv;charset=utf-8",
        }),
      );
      link.download = `pasopkan-organizers-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export organizers");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">ຈັດການຜູ້ຈັດງານ</h2>
          <p className="mt-1 text-sm text-slate-500">
            ຂໍ້ມູນ Organizer, ບັນຊີທະນາຄານ ແລະ Event ຈາກ API ຈິງ
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadOrganizers()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> ໂຫຼດໃໝ່
          </button>
          <button
            type="button"
            onClick={() => void exportOrganizers()}
            disabled={busy === "export"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> ສົ່ງອອກ CSV
          </button>
        </div>
      </div>

      {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { value: summary.total, label: "ຜູ້ຈັດງານທັງໝົດ", icon: Building2, tone: "border-orange-200 bg-orange-50/40 text-orange-600" },
          { value: summary.active, label: "ຜູ້ຈັດງານທີ່ໃຊ້ງານ", icon: CircleCheck, tone: "border-emerald-200 bg-emerald-50/50 text-emerald-600" },
          { value: summary.suspended, label: "ຜູ້ຈັດງານທີ່ຖືກລະງັບ", icon: Ban, tone: "border-rose-200 bg-rose-50/50 text-rose-600" },
          { value: summary.events, label: "Event ທີ່ສ້າງ", icon: CalendarDays, tone: "border-blue-200 bg-blue-50/50 text-blue-600" },
        ].map((card) => (
          <div key={card.label} className={`flex items-center gap-4 rounded-2xl border p-5 ${card.tone}`}>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm"><card.icon className="h-5 w-5" /></span>
            <div><p className="text-2xl font-black text-slate-950">{card.value}</p><p className="text-sm font-bold text-slate-600">{card.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ຄົ້ນຫາຊື່, email, ເບີໂທ ຫຼືບັນຊີ"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300"
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {[["all", "ທຸກສະຖານະ"], ["active", "ໃຊ້ງານ"], ["suspended", "ລະງັບ"]].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === value ? "bg-adv-orange text-white" : "text-slate-500"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-4">ຜູ້ຈັດງານ</th><th className="px-4 py-4">Email & ເບີໂທ</th><th className="px-4 py-4">ບັນຊີທະນາຄານ</th><th className="px-4 py-4">Event ທີ່ສ້າງ</th><th className="px-4 py-4">ສະຖານະ</th><th className="px-5 py-4 text-right">ການຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {organizers.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600"><Building2 className="h-4 w-4" /></span><div><p className="font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">ເຂົ້າຮ່ວມ {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.createdAt))}</p></div></div></td>
                <td className="px-4 py-3.5"><p className="font-semibold text-slate-700">{item.contactEmail || item.user.email}</p><p className="mt-1 text-xs text-slate-500">{item.contactPhone || item.user.phone || "—"}</p></td>
                <td className="px-4 py-3.5"><p className="font-bold text-slate-700">{item.bankName || "—"}</p><p className="mt-1 text-xs text-slate-500">{item.accountNumber || "ຍັງບໍ່ຕັ້ງຄ່າ"}</p></td>
                <td className="px-4 py-3.5"><button type="button" onClick={() => void openDetails(item)} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{item._count.events} ງານ</button></td>
                <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${item.user.isSuspended ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{item.user.isSuspended ? "SUSPENDED" : "ACTIVE"}</span></td>
                <td className="px-5 py-3.5"><div className="flex justify-end gap-1.5">
                  <button type="button" title="ເບິ່ງ Event" onClick={() => void openDetails(item)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-600"><Eye className="h-4 w-4" /></button>
                  <button type="button" title="ແກ້ໄຂ" onClick={() => openEditor(item)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-600"><Pencil className="h-4 w-4" /></button>
                  <button type="button" title="ປ່ຽນເປັນ User" onClick={() => setDemoting(item)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Users className="h-4 w-4" /></button>
                  <button type="button" title="ລົບ" onClick={() => setDeleting(item)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}
            {!loading && organizers.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">ບໍ່ພົບຜູ້ຈັດງານຈາກຖານຂໍ້ມູນ.</td></tr>}
          </tbody>
        </table>
        {loading && <p className="p-5 text-sm text-slate-500">ກຳລັງໂຫຼດຂໍ້ມູນຈາກ API…</p>}
      </div>

      {viewing && (
        <AdminModal title={viewing.name} subtitle={viewing.contactEmail || viewing.user.email} icon={<Building2 className="h-5 w-5" />} onClose={() => { setViewing(null); setDetail(null); }} size="lg">
          <div className="p-5 sm:p-6">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Event ທີ່ຜູ້ຈັດງານນີ້ສ້າງ</p>
            {busy === `detail:${viewing.id}` && <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">ກຳລັງໂຫຼດ Event…</p>}
            {detail && detail.events.length === 0 && <EmptyState>ຍັງບໍ່ມີ Event ສຳລັບຜູ້ຈັດງານນີ້.</EmptyState>}
            {detail && detail.events.length > 0 && <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">{detail.events.map((event) => <article key={event.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3"><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-orange-50 text-orange-600">{event.coverImageUrl ? <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" /> : <CalendarDays className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-900">{event.title}</p><StatusBadge status={event.status} /></div><p className="mt-1 text-xs text-slate-500">{event.category || event.eventType || "Event"}{event.startDate ? ` · ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(event.startDate))}` : ""}{event.venueName ? ` · ${event.venueName}` : ""}</p></div></article>)}</div>}
          </div>
        </AdminModal>
      )}

      {editing && (
        <AdminModal title="ແກ້ໄຂຜູ້ຈັດງານ" subtitle={editing.user.publicId || editing.user.id} icon={<Users className="h-5 w-5" />} onClose={() => setEditing(null)} size="lg">
          <form onSubmit={(event) => { event.preventDefault(); void saveOrganizer(); }}>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
              <OrganizerField label="ຊື່ຜູ້ຈັດງານ" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} className="sm:col-span-2" required />
              <OrganizerField label="Email" type="email" value={draft.contactEmail} onChange={(value) => setDraft({ ...draft, contactEmail: value })} className="sm:col-span-2" required />
              <label className="space-y-2"><span className="text-sm font-bold text-slate-500">ບົດບາດ</span><input value="Organizer" disabled className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-bold text-slate-500" /></label>
              <label className="space-y-2"><span className="text-sm font-bold text-slate-500">ສະຖານະ</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as "active" | "suspended" })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-orange-300"><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
              <OrganizerField label="ເບີໂທ" value={draft.contactPhone} onChange={(value) => setDraft({ ...draft, contactPhone: value })} className="sm:col-span-2" />
              <div className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50/40 p-4 sm:col-span-2"><p className="flex items-center gap-2 text-sm font-black text-orange-700"><Building2 className="h-4 w-4" /> ຂໍ້ມູນບັນຊີຜູ້ຈັດງານ</p><OrganizerField label="ຊື່ບັນຊີ / ບໍລິສັດ" value={draft.accountHolder} onChange={(value) => setDraft({ ...draft, accountHolder: value })} /><div className="grid gap-4 sm:grid-cols-2"><OrganizerField label="ທະນາຄານ" value={draft.bankName} onChange={(value) => setDraft({ ...draft, bankName: value })} /><OrganizerField label="ເລກບັນຊີ" value={draft.accountNumber} onChange={(value) => setDraft({ ...draft, accountNumber: value })} /></div></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-7"><button type="button" onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500">ຍົກເລີກ</button><button type="submit" disabled={busy === `edit:${editing.id}` || !draft.name.trim() || !draft.contactEmail.trim()} className="rounded-xl bg-adv-orange px-6 py-2.5 text-sm font-black text-white disabled:opacity-50">ບັນທຶກການປ່ຽນແປງ</button></div>
          </form>
        </AdminModal>
      )}

      {demoting && (
        <AdminModal title="ປ່ຽນຜູ້ຈັດງານເປັນຜູ້ໃຊ້ທົ່ວໄປ (User)" subtitle="ປິດສິດຈັດການ Event" icon={<Users className="h-5 w-5" />} onClose={() => setDemoting(null)}>
          <div className="space-y-4 p-5 sm:p-6"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black text-slate-950">{demoting.name}</p><p className="mt-1 text-sm text-slate-500">{demoting.contactEmail || demoting.user.email}</p><div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4"><span className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">ORGANIZER</span><span className="text-slate-400">→</span><span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">USER</span></div></div><div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>ສິດການສ້າງ ແລະຈັດການ Event ຈະຖືກປິດ; ຂໍ້ມູນ Event ແລະປະຫວັດເກົ່າຈະຍັງຖືກເກັບໄວ້.</p></div></div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4"><button type="button" onClick={() => setDemoting(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600">ຍົກເລີກ</button><button type="button" disabled={busy === `demote:${demoting.id}`} onClick={() => void demoteOrganizer(demoting)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">ຢືນຢັນການປ່ຽນ</button></div>
        </AdminModal>
      )}

      {deleting && (
        <AdminModal title="ລົບຜູ້ຈັດງານ" subtitle="ບັນຊີຈະຖືກປິດໃຊ້ງານ" icon={<Trash2 className="h-5 w-5" />} onClose={() => setDeleting(null)}>
          <div className="p-5 sm:p-6"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-black text-slate-950">{deleting.name}</p><p className="mt-1 text-sm text-slate-600">{deleting.contactEmail || deleting.user.email}</p><p className="mt-3 text-sm leading-6 text-rose-700">ບັນຊີຈະຖືກນຳອອກຈາກລາຍການ ແລະບໍ່ສາມາດເຂົ້າລະບົບ; ປະຫວັດ Event ຈະຍັງຖືກເກັບໄວ້.</p></div></div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4"><button type="button" onClick={() => setDeleting(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600">ຍົກເລີກ</button><button type="button" disabled={busy === `delete:${deleting.id}`} onClick={() => void deleteOrganizer(deleting)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"><Trash2 className="h-4 w-4" /> ຢືນຢັນລົບ</button></div>
        </AdminModal>
      )}
    </section>
  );
}

function OrganizerField({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-300" />
    </label>
  );
}

/** Platform fee deducted from ticket sales when estimating organizer payout (10%). */
const PLATFORM_FEE_RATE = 0.1;

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

function AdminModal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto w-full overflow-hidden rounded-[28px] bg-white shadow-2xl ${size === "lg" ? "max-w-xl" : "max-w-md"}`}
      >
        <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-slate-950">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
