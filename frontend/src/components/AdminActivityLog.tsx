import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Download, RefreshCw, Search } from "lucide-react";
import { api } from "../lib/api";

export type AdminAuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  targetName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    publicId: string | null;
    email?: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

function formatActionAndDetails(log: AdminAuditLogItem): {
  actionLabel: string;
  details: string;
} {
  const meta =
    log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? log.metadata
      : {};
  const target = log.targetName || `${log.entityType} ${log.entityId.slice(0, 8)}`;

  switch (log.action) {
    case "user.access_updated": {
      const prevRole = typeof meta.previousRole === "string" ? meta.previousRole : null;
      const nextRole = typeof meta.role === "string" ? meta.role : null;
      const prevSusp = typeof meta.previousSuspended === "boolean" ? meta.previousSuspended : null;
      const nextSusp = typeof meta.suspended === "boolean" ? meta.suspended : null;
      if (prevRole && nextRole && prevRole !== nextRole) {
        return {
          actionLabel: "User role changed",
          details: `${target} changed to ${nextRole}`,
        };
      }
      if (prevSusp !== null && nextSusp !== null && prevSusp !== nextSusp) {
        return {
          actionLabel: nextSusp ? "User suspended" : "User reactivated",
          details: target,
        };
      }
      return {
        actionLabel: "User profile updated",
        details: target,
      };
    }
    case "user.deleted":
      return {
        actionLabel: "User deleted",
        details: target,
      };
    case "organizer.profile_updated":
      return {
        actionLabel: "Organizer updated",
        details: target,
      };
    case "organizer.approved":
      return {
        actionLabel: "Organizer approved",
        details: target,
      };
    case "organizer.rejected":
      return {
        actionLabel: "Organizer rejected",
        details: target,
      };
    case "organizer.self_activated":
      return {
        actionLabel: "User role changed",
        details: `${target} changed to organizer`,
      };
    case "organizer.terms_accepted":
      return {
        actionLabel: "Organizer terms accepted",
        details: target,
      };
    case "event.status": {
      const after = typeof meta.after === "string" ? meta.after : "";
      if (after === "published") {
        return { actionLabel: "Event approved", details: target };
      }
      if (after === "rejected") {
        return { actionLabel: "Event rejected", details: target };
      }
      if (after === "pending_review") {
        return { actionLabel: "Event submitted", details: target };
      }
      if (after === "completed") {
        return { actionLabel: "Event completed", details: target };
      }
      return {
        actionLabel: "Event status updated",
        details: after ? `${target} (${after})` : target,
      };
    }
    case "event.cancelled":
      return {
        actionLabel: "Event cancelled",
        details: target,
      };
    case "event.terms_accepted":
      return {
        actionLabel: "Event terms accepted",
        details: target,
      };
    case "event.staff.assigned":
      return {
        actionLabel: "Event staff assigned",
        details: target,
      };
    case "event.staff.revoked":
      return {
        actionLabel: "Event staff revoked",
        details: target,
      };
    case "payout.fee_updated": {
      const fee = typeof meta.feePercent === "number" ? `${meta.feePercent}%` : "";
      return {
        actionLabel: "Payout fee updated",
        details: fee ? `${target} (${fee})` : target,
      };
    }
    case "payout.marked_paid":
      return {
        actionLabel: "Payout marked paid",
        details: target,
      };
    case "payout.bill_replaced":
      return {
        actionLabel: "Payout bill updated",
        details: target,
      };
    case "refund.approved":
      return {
        actionLabel: "Refund approved",
        details: target,
      };
    case "refund.rejected":
      return {
        actionLabel: "Refund rejected",
        details: target,
      };
    case "refund.created":
      return {
        actionLabel: "Refund created",
        details: target,
      };
    case "order.expired":
      return {
        actionLabel: "Order expired",
        details: target,
      };
    case "notification.broadcast":
      return {
        actionLabel: "Notification sent",
        details: target,
      };
    case "site_settings.updated":
      return {
        actionLabel: "Site settings updated",
        details: log.entityId.replace(/_/g, " "),
      };
    case "blog.created":
      return {
        actionLabel: "Blog article created",
        details: typeof meta.title === "string" ? meta.title : target,
      };
    case "blog.updated":
      return {
        actionLabel: "Blog article updated",
        details: typeof meta.title === "string" ? meta.title : target,
      };
    case "blog.status_changed":
      return {
        actionLabel: "Blog status changed",
        details: `${typeof meta.title === "string" ? meta.title : target} (${meta.isPublished ? "Published" : "Draft"})`,
      };
    case "blog.deleted":
      return {
        actionLabel: "Blog article deleted",
        details: typeof meta.title === "string" ? meta.title : target,
      };
    default: {
      const words = log.action
        .replace(/[._]/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase());
      return {
        actionLabel: words,
        details: target,
      };
    }
  }
}

function formatActor(actor: AdminAuditLogItem["actor"]): string {
  if (!actor) return "System";
  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (actor.email) return actor.email.split("@")[0] || actor.email;
  if (actor.publicId) return `Admin (${actor.publicId})`;
  return "Admin User";
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toUpperCase();
}

export default function AdminActivityLog({
  token,
  initialLogs,
}: {
  token: string | null;
  initialLogs?: AdminAuditLogItem[];
}) {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>(initialLogs ?? []);
  const [loading, setLoading] = useState(!initialLogs);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const authOptions = useMemo(() => ({ token, throwOnError: true as const }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.get<{ logs: AdminAuditLogItem[] }>(
        "/admin/audit-logs",
        authOptions,
      );
      setLogs(result.data?.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load activity logs");
    } finally {
      setLoading(false);
    }
  }, [authOptions, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs
      .map((log) => {
        const { actionLabel, details } = formatActionAndDetails(log);
        const actorName = formatActor(log.actor);
        const timestamp = formatTimestamp(log.createdAt);
        return {
          id: log.id,
          raw: log,
          actionLabel,
          details,
          actorName,
          timestamp,
        };
      })
      .filter((row) => {
        if (!query) return true;
        return [
          row.actionLabel,
          row.details,
          row.actorName,
          row.raw.action,
          row.raw.entityType,
          row.raw.entityId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [logs, search]);

  function exportCsv() {
    const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csvRows = [
      ["action", "details", "admin_or_system", "timestamp", "raw_action", "entity_type", "entity_id"],
      ...rows.map((row) => [
        row.actionLabel,
        row.details,
        row.actorName,
        row.raw.createdAt,
        row.raw.action,
        row.raw.entityType,
        row.raw.entityId,
      ]),
    ];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csvRows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    link.download = `pasopkan-activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section className="min-h-[420px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <h2 className="text-xl font-black text-slate-950">Activity Log</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> ຣີເຟຣຊ
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white"
          >
            <Download className="h-4 w-4" /> ສົ່ງອອກ CSV
          </button>
          <label className="relative min-w-52">
            <Search className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ຄົ້ນຫາ..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300"
            />
          </label>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">ACTION</th>
                <th className="px-5 py-3.5">DETAILS</th>
                <th className="px-5 py-3.5">ADMIN/SYSTEM</th>
                <th className="px-5 py-3.5 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm font-semibold text-slate-400"
                  >
                    ກຳລັງໂຫຼດ Activity Log...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm font-semibold text-slate-400"
                  >
                    ຍັງບໍ່ມີ Activity Log.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                          <Activity className="h-4 w-4" />
                        </span>
                        <span className="font-black text-slate-950">{row.actionLabel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{row.details}</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-500">
                      {row.actorName}
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                      {row.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
