import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
  { key: 'resolved', label: 'Resolved' },
];

export default function Messages() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [counts, setCounts] = useState({ all: 0, unread: 0, read: 0, resolved: 0 });
  const [active, setActive] = useState(null);

  useEffect(() => {
    loadData();
  }, [page, status]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/messages?page=${page}&status=${status}`);
      setRows(res.data.messages || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
      setCounts(res.data.counts || { all: 0, unread: 0, read: 0, resolved: 0 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await api.put(`/admin/messages/${id}/read`);
      toast.success('Message marked as read');
      loadData();
      if (active?.id === id) {
        setActive({ ...active, status: 1, statusLabel: 'Read' });
      }
    } catch {
      toast.error('Failed to mark as read');
    }
  }

  async function markResolved(id) {
    try {
      await api.put(`/admin/messages/${id}/resolve`);
      toast.success('Message marked as resolved');
      loadData();
      if (active?.id === id) {
        setActive({ ...active, status: 2, statusLabel: 'Resolved' });
      }
    } catch {
      toast.error('Failed to mark as resolved');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Contact Messages</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatus(f.key); setPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={
                status === f.key
                  ? { background: 'rgba(212,175,55,0.16)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {f.label} ({counts[f.key] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Name', 'Email', 'Subject', 'Date', 'Status', 'Action'].map((h) => (
                    <th key={h} className="table-header py-3 px-3 text-left text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3 px-3 text-white/80">{r.name}</td>
                    <td className="py-3 px-3 text-white/60">{r.email || 'N/A'}</td>
                    <td className="py-3 px-3 text-white/70">{r.subject || 'No subject'}</td>
                    <td className="py-3 px-3 text-white/50 text-xs">{r.submittedAt}</td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-block text-xs px-2.5 py-0.5 rounded-full"
                        style={
                          Number(r.status) === 2
                            ? { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }
                            : Number(r.status) === 1
                              ? { color: '#93c5fd', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }
                              : { color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }
                        }
                      >
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setActive(r)}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No messages found.
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
          >
            Prev
          </button>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{pagination.page} / {pagination.totalPages || 1}</span>
          <button
            onClick={() => setPage((p) => Math.min(Number(pagination.totalPages || 1), p + 1))}
            disabled={pagination.page >= Number(pagination.totalPages || 1)}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            Next
          </button>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl p-6" style={{ background: '#141008', border: '1px solid rgba(212,175,55,0.25)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-white">Message Details</h2>
              <button onClick={() => setActive(null)} className="text-white/60 hover:text-white">Close</button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p style={{ color: 'rgba(255,255,255,0.75)' }}><strong>Name:</strong> {active.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.75)' }}><strong>Email:</strong> {active.email || 'N/A'}</p>
              <p style={{ color: 'rgba(255,255,255,0.75)' }}><strong>Subject:</strong> {active.subject || 'No subject'}</p>
              <p style={{ color: 'rgba(255,255,255,0.75)' }}><strong>Date:</strong> {active.submittedAt}</p>
              <p className="pt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{active.message}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => markRead(active.id)}
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                Mark Read
              </button>
              <button
                onClick={() => markResolved(active.id)}
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                Mark Resolved
              </button>
              <a
                href={`mailto:${active.email || ''}?subject=${encodeURIComponent(active.subject || 'NOGATU Reply')}`}
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
              >
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
