"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type PaymentRow = {
  id: string;
  createdAt: string;
  type: "donation" | "shirt" | string;
  amountCents: number;
  currency: string | null;
  name: string | null;
  email: string | null;
  shirtSize: string | null;
  stripeId: string;
};

type ApiResp = {
  rows: PaymentRow[];
  total: number;
  page: number;
  take: number;
};

type FilterType = "" | "donation" | "shirt";

const formatter = (currency?: string | null) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "usd").toUpperCase() });

export default function AdminPaymentsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<FilterType>("");
  const [page, setPage] = useState(0);
  const [take] = useState(25);
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.take));
  }, [data]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), take: String(take) });
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    const res = await fetch(`/api/admin/payments?` + params.toString(), { cache: "no-store" });
    const json = await res.json();
    setData(json as ApiResp);
    setLoading(false);
  }, [page, take, q, type]);

  useEffect(() => { load(); }, [load]);
  // Debounce search a bit
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (type) p.set("type", type);
    return `/api/admin/payments/export?${p.toString()}`;
  }, [q, type]);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex items-center gap-2">
          <a href="/admin" className="text-sm underline">↩ Back to Admin</a>
          <a href={exportHref} className="px-3 py-2 rounded bg-black text-white text-sm">Export CSV</a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Search name / email / stripeId / size"
        />
        <select
          value={type}
          onChange={(e) => { setPage(0); setType(e.target.value as FilterType); }}
          className="border rounded px-3 py-2"
        >
          <option value="">All types</option>
          <option value="donation">Donations</option>
          <option value="shirt">Shirts</option>
        </select>
        {loading && <span className="text-sm text-gray-500 self-center">Loading…</span>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Name / Email</th>
              <th className="p-3">Size</th>
              <th className="p-3">Stripe</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r) => {
              const f = formatter(r.currency);
              const amount = f.format((r.amountCents ?? 0) / 100);
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3 capitalize">{r.type}</td>
                  <td className="p-3">{amount}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.name || "—"}</div>
                    <div className="text-gray-600">{r.email || "—"}</div>
                  </td>
                  <td className="p-3">{r.type === "shirt" ? (r.shirtSize || "—") : "—"}</td>
                  <td className="p-3">
                    <a
                      className="text-blue-600 hover:underline"
                      href={`https://dashboard.stripe.com/${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_") ? "" : "test/"}payments?query=${encodeURIComponent(r.stripeId)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.stripeId}
                    </a>
                  </td>
                </tr>
              );
            })}
            {!data?.rows?.length && (
              <tr><td className="p-6 text-center text-gray-500" colSpan={6}>No payments</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Prev
        </button>
        <div>
          Page {page + 1} / {totalPages}
        </div>
        <button
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
          disabled={page + 1 >= totalPages}
        >
          Next
        </button>
      </div>
    </main>
  );
}