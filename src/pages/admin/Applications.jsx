import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'followed_up', label: 'Followed Up' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'done', label: 'Done' },
];

function statusStyle(status) {
  if (status === 'done') return { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' };
  if (status === 'cancelled') return { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' };
  if (status === 'followed_up') return { color: '#93c5fd', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' };
  return { color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' };
}

function statusLabel(status) {
  if (status === 'followed_up') return 'Followed Up';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'done') return 'Done';
  return 'New';
}

export default function Applications() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, followed_up: 0, cancelled: 0, done: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [active, setActive] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadData();
  }, [page, status]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/applications?page=${page}&status=${status}`);
      setRows(res.data.applications || []);
      setCounts(res.data.counts || { all: 0, new: 0, followed_up: 0, cancelled: 0, done: 0 });
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch {
      setRows([]);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function updateFollowUp(id, nextStatus) {
    try {
      await api.put(`/admin/applications/${id}/follow-up/${nextStatus}`, { note });
      toast.success(`Marked as ${statusLabel(nextStatus)}`);
      setActive(null);
      setNote('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update application');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Distributor Applications</h1>
        <p className="text-sm text-white/45 mt-1">Track distributor application interest, follow up with leads, and enforce the 30-day re-application cooldown.</p>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => { setStatus(filter.key); setPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={status === filter.key
                ? { background: 'rgba(212,175,55,0.16)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
             type="button">
              {filter.label} ({counts[filter.key] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="size-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Name', 'Contact No.', 'Email', 'Submitted', 'Follow Up', 'Action'].map((heading) => (
                    <th key={heading} className="table-header p-3 text-left text-xs uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3 text-white/80">{row.name}</td>
                    <td className="p-3 text-white/60">{row.phone}</td>
                    <td className="p-3 text-white/60">{row.email}</td>
                    <td className="p-3 text-white/50 text-xs">{row.submittedAt}</td>
                    <td className="p-3">
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full" style={statusStyle(row.followUpStatus)}>
                        {statusLabel(row.followUpStatus)}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => { setActive(row); setNote(row.adminNote || ''); }}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}
                       type="button">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
           type="button">
            Prev
          </button>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{pagination.page} / {pagination.totalPages || 1}</span>
          <button
            onClick={() => setPage((p) => Math.min(Number(pagination.totalPages || 1), p + 1))}
            disabled={pagination.page >= Number(pagination.totalPages || 1)}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
           type="button">
            Next
          </button>
        </div>
      </div>

      {active && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="portal-modal-panel w-full max-w-2xl rounded-3xl p-6 shadow-[0_28px_64px_rgba(15,23,42,0.22)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="portal-modal-title font-display text-xl">Application Review</h2>
              <button onClick={() => setActive(null)} className="portal-modal-muted text-sm font-medium hover:opacity-80" type="button">Close</button>
            </div>
            <div className="portal-modal-text mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <p><strong className="portal-modal-title">Name:</strong> {active.name}</p>
              <p><strong className="portal-modal-title">Contact No.:</strong> {active.phone}</p>
              <p><strong className="portal-modal-title">Email:</strong> {active.email}</p>
              <p><strong className="portal-modal-title">Submitted:</strong> {active.submittedAt}</p>
              <p><strong className="portal-modal-title">Follow Up:</strong> {statusLabel(active.followUpStatus)}</p>
            </div>
            <label className="block mt-5">
              <span className="portal-modal-title block text-sm font-semibold mb-2">Admin Note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full rounded-2xl px-4 py-3 text-sm portal-modal-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] focus:border-[color:var(--portal-warning-border)]"
                placeholder="Optional follow-up note"
              />
            </label>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => updateFollowUp(active.id, 'followed_up')}
                className="portal-button portal-info-button text-xs px-3.5 py-2.5"
               type="button">
                Followed Up
              </button>
              <button
                onClick={() => updateFollowUp(active.id, 'cancelled')}
                className="portal-button portal-danger-button text-xs px-3.5 py-2.5"
               type="button">
                Cancelled
              </button>
              <button
                onClick={() => updateFollowUp(active.id, 'done')}
                className="portal-button portal-success-button text-xs px-3.5 py-2.5"
               type="button">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
