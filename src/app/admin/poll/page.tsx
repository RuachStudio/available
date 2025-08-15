"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: number;
  speaker: string;
  votes: number;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPollPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/poll", { cache: "no-store" });
    const json = await res.json();
    setRows(json.rows || []);
    setTotalVotes(json.totalVotes || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportHref = useMemo(() => "/api/admin/poll/export", []);

  const resetVotes = async () => {
    if (!confirm("Reset all votes to 0? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    setBusy(false);
    if (res.ok) load();
    else alert("Failed to reset votes.");
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Speaker Poll</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-sm underline">↩ Back to Admin</Link>
          <a href={exportHref} className="px-3 py-2 rounded bg-black text-white text-sm">Export CSV</a>
          <button
            onClick={resetVotes}
            disabled={busy}
            className="px-3 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Resetting…" : "Reset Votes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-gray-500">Total Votes</div>
          <div className="text-2xl font-semibold">{loading ? "…" : totalVotes}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3">Rank</th>
              <th className="p-3">Speaker</th>
              <th className="p-3">Votes</th>
              <th className="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-6 text-center text-gray-500" colSpan={4}>Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td className="p-6 text-center text-gray-500" colSpan={4}>No speakers yet</td></tr>
            )}
            {!loading && rows.map((r, idx) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{idx + 1}</td>
                <td className="p-3 font-medium">{r.speaker}</td>
                <td className="p-3">{r.votes ?? 0}</td>
                <td className="p-3 whitespace-nowrap">{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}