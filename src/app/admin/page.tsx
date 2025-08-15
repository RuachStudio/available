"use client";
import { useEffect, useState, useCallback } from "react";

type ShirtStat = { size: string | null; count: number };
type Stats = {
  registrations: number;
  attendees: number;
  donationsUsd?: number;
  shirts: ShirtStat[];
};

type Row = {
  id: string;
  createdAt: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string;
  attendees: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    wantsShirt: boolean;
    shirtSize: string | null;
  }[];
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const take = 25;

  const loadStats = useCallback(async () => {
    const r = await fetch("/api/admin/stats");
    const data = (await r.json()) as Stats;
    setStats(data);
  }, []);

  const loadRows = useCallback(async () => {
    const params = new URLSearchParams({ take: String(take), skip: String(page * take) });
    if (q) params.set("q", q);
    const r = await fetch("/api/admin/registrations?" + params.toString());
    const data = await r.json();
    setRows(data.rows as Row[]);
    setTotal(Number(data.total) || 0);
  }, [q, page, take]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadRows(); }, [loadRows]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Registrations" value={stats?.registrations ?? "…"} />
        <Card title="Attendees" value={stats?.attendees ?? "…"} />
        <Card title="Donations (30d)" value={stats?.donationsUsd != null ? `$${stats.donationsUsd.toFixed(2)}` : "—"} />
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="font-semibold mb-2">Shirts</div>
          <ul className="text-sm text-gray-700 space-y-1">
            {((stats?.shirts as ShirtStat[]) || []).map((s) => (
              <li key={s.size}>{s.size || "(none)"} — {s.count}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Search name / email / phone"
          value={q}
          onChange={(e) => { setPage(0); setQ(e.target.value); }}
        />
        <a
          href="/api/admin/export"
          className="px-3 py-2 rounded bg-black text-white"
        >
          Export CSV
        </a>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Attendees</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  <div className="font-medium">{r.contactName}</div>
                  <div className="text-gray-600">{r.contactEmail}</div>
                </td>
                <td className="p-3">{r.contactPhone}</td>
                <td className="p-3">
                  <ul className="space-y-1">
                    {r.attendees.map((a) => (
                      <li key={a.id}>
                        {a.name} — {a.phone}
                        {a.wantsShirt && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">
                            {a.shirtSize || "Shirt"}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-6 text-center text-gray-500" colSpan={4}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Prev
        </button>
        <div>Page {page + 1} / {Math.max(1, Math.ceil(total / take))}</div>
        <button
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => (p + 1 < Math.ceil(total / take) ? p + 1 : p))}
          disabled={page + 1 >= Math.ceil(total / take)}
        >
          Next
        </button>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}