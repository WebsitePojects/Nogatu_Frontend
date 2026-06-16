import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineRefresh, HiOutlineArrowLeft, HiOutlinePaperClip, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import useSupportStream from '../../hooks/useSupportStream';
import ChatMessages from '../../components/support/ChatMessages';

const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Needs Reply' },
  { key: 'open', label: 'Open' },
  { key: 'in_review', label: 'In Review' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_TONE = {
  open:      { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: '#60a5fa' },
  in_review: { bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.3)', color: '#D4AF37' },
  resolved:  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: '#34d399' },
  closed:    { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', color: '#94a3b8' },
};

function StatusBadge({ status, label }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.open;
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color }}>
      {label}
    </span>
  );
}

const EMPTY_COUNTS = { all: 0, unread: 0, open: 0, in_review: 0, resolved: 0, closed: 0 };

export default function Support() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [activeTicket, setActiveTicket] = useState(null);
  const [thread, setThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [replyFile, setReplyFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const replyFileRef = useRef(null);
  const threadEndRef = useRef(null);
  const activeTicketRef = useRef(null);

  function pickFile(file) {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return toast.error('Only image or video files are allowed.');
    if (isImage && file.size > IMAGE_MAX) return toast.error('Image exceeds the 5 MB limit.');
    if (isVideo && file.size > VIDEO_MAX) return toast.error('Video exceeds the 50 MB limit.');
    setReplyFile((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return { file, url: URL.createObjectURL(file), type: isImage ? 'image' : 'video' }; });
  }
  function clearReplyFile() {
    setReplyFile((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; });
    if (replyFileRef.current) replyFileRef.current.value = '';
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/support?status=${status}&page=${page}`);
      setTickets(res.data.tickets || []);
      setCounts(res.data.counts || EMPTY_COUNTS);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [status]);
  useEffect(() => { if (thread) threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  // Light polling: refresh the open thread so staff see member replies live.
  useEffect(() => {
    activeTicketRef.current = activeTicket;
    if (!activeTicket) return undefined;
    const timer = setInterval(async () => {
      const uid = activeTicketRef.current;
      if (!uid) return;
      try {
        const res = await api.get(`/admin/support/${uid}`);
        if (activeTicketRef.current === uid) {
          setThread((cur) => {
            if (!cur) return res.data;
            // Only replace if the message count grew, to avoid clobbering scroll.
            return res.data.messages.length !== cur.messages.length ? res.data : cur;
          });
        }
      } catch { /* transient: keep current view */ }
    }, 12000);
    return () => clearInterval(timer);
  }, [activeTicket]);

  // Open the ticket as a dedicated full chat page (not a modal).
  function openThread(ticketUid) {
    setTickets((list) => list.map((t) => (t.ticketUid === ticketUid ? { ...t, unread: false } : t)));
    navigate(`/admin/support/${ticketUid}`);
  }

  function closeThread() {
    setActiveTicket(null);
    setThread(null);
    setReply('');
    loadData();
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim() && !replyFile) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', reply);
      if (replyFile) fd.append('media', replyFile.file);
      const res = await api.post(`/admin/support/${activeTicket}/reply`, fd);
      setThread((cur) => cur ? {
        ...cur,
        ticket: { ...cur.ticket, status: res.data.status, statusLabel: res.data.statusLabel },
        messages: [...cur.messages, res.data.reply],
      } : cur);
      setReply('');
      clearReplyFile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to send reply.');
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(newStatus) {
    try {
      const res = await api.put(`/admin/support/${activeTicket}/status`, { status: newStatus });
      setThread((cur) => cur ? { ...cur, ticket: { ...cur.ticket, status: res.data.status, statusLabel: res.data.statusLabel } } : cur);
      toast.success(`Marked ${res.data.statusLabel}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update status.');
    }
  }

  // Realtime: append live messages to the open thread and refresh the list/counts.
  useSupportStream(useCallback((event, data) => {
    if (!data) return;
    const current = activeTicketRef.current;
    if (event === 'support.reply' && data.ticketUid === current && !data.adminEcho) {
      setThread((cur) => {
        if (!cur) return cur;
        if (cur.messages.some((m) => m.replyUid === data.replyUid)) return cur;
        return {
          ...cur,
          messages: [...cur.messages, {
            replyUid: data.replyUid, authorRole: data.authorRole, authorName: data.authorName,
            body: data.body, attachmentUrl: data.attachmentUrl, attachmentType: data.attachmentType,
            createdAt: data.createdAt, status: data.authorRole === 'member' ? 'read' : (data.status || 'sent'),
          }],
        };
      });
      api.get(`/admin/support/${current}`).catch(() => {}); // marks member msgs read server-side
    } else if (event === 'support.read' && data.ticketUid === current && data.by === 'member') {
      setThread((cur) => cur ? { ...cur, messages: cur.messages.map((m) => (m.authorRole === 'admin' ? { ...m, status: 'read' } : m)) } : cur);
    }
    // Any support event can change list ordering / counts.
    loadData();
  }, [loadData]), { admin: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold portal-page-title">Support Tickets</h1>
          <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        </div>
        <button type="button" onClick={loadData}
          className="portal-card-muted p-2 rounded-lg hover:text-[var(--portal-gold-text)]" title="Refresh">
          <HiOutlineRefresh className={`size-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => {
          const isActive = status === f.key;
          const count = counts[f.key];
          return (
            <button key={f.key} type="button" onClick={() => setStatus(f.key)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={isActive
                ? { background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.35)', color: 'var(--brand-gold)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--portal-card-muted)' }}>
              {f.label}{typeof count === 'number' ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="glass-card rounded-2xl p-6 text-sm portal-card-muted">Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-sm portal-card-muted">No tickets in this view.</div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((t) => (
            <button key={t.ticketUid} type="button" onClick={() => openThread(t.ticketUid)}
              className="glass-card rounded-xl p-4 w-full text-left transition-transform active:scale-[0.99]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold portal-card-title truncate flex items-center gap-2">
                    {t.unread && <span className="size-2 rounded-full flex-shrink-0" style={{ background: '#34d399' }} />}
                    {t.subject}
                  </p>
                  <p className="text-xs portal-card-muted mt-1">
                    {t.name} · {t.email || 'no email'} · {t.lastReplyRole === 'member' ? 'member replied' : t.lastReplyRole === 'admin' ? 'you replied' : 'new'} · {t.lastActivity}
                  </p>
                </div>
                <StatusBadge status={t.status} label={t.statusLabel} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs portal-card-muted">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--portal-card-muted)' }}>
              Previous
            </button>
            <button type="button" disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--portal-card-muted)' }}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Thread modal */}
      {activeTicket && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={closeThread}>
          <div onMouseDown={(e) => e.stopPropagation()}
            className="portal-modal-panel w-full max-w-xl rounded-2xl flex flex-col" style={{ maxHeight: '88vh' }}>
            <div className="p-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button type="button" onClick={closeThread} className="portal-card-muted text-xs flex items-center gap-1 mb-1.5 hover:text-[var(--portal-gold-text)]">
                    <HiOutlineArrowLeft className="size-3.5" /> Back to list
                  </button>
                  <h2 className="portal-modal-title font-display text-lg font-bold truncate">{thread?.ticket?.subject || 'Ticket'}</h2>
                  <p className="text-xs portal-card-muted mt-0.5">
                    {thread?.ticket?.name} · {thread?.ticket?.email || 'no email'}
                  </p>
                </div>
                {thread?.ticket && <StatusBadge status={thread.ticket.status} label={thread.ticket.statusLabel} />}
              </div>

              {/* Status controls */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s.value} type="button" onClick={() => changeStatus(s.value)}
                    disabled={thread?.ticket?.status === s.value}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--portal-card-muted)' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
              {loadingThread ? (
                <p className="text-sm portal-card-muted">Loading conversation…</p>
              ) : (
                <ChatMessages messages={thread?.messages || []} viewerRole="admin" onZoom={setLightbox} />
              )}
              <div ref={threadEndRef} />
            </div>

            {thread?.ticket?.status !== 'closed' && (
              <form onSubmit={sendReply} className="p-4" style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}>
                {replyFile && (
                  <div className="flex items-center gap-2 mb-2 rounded-xl p-2" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    {replyFile.type === 'video'
                      ? <video src={replyFile.url} muted className="size-12 rounded-lg object-cover flex-shrink-0" style={{ background: '#000' }} />
                      : <img src={replyFile.url} alt="Preview" className="size-12 rounded-lg object-cover flex-shrink-0" />}
                    <p className="text-xs portal-card-muted flex-1 truncate">{replyFile.file.name}</p>
                    <button type="button" onClick={clearReplyFile} className="portal-card-muted p-1.5 rounded-lg hover:text-red-400" aria-label="Remove attachment">
                      <HiOutlineTrash className="size-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input ref={replyFileRef} type="file" accept="image/*,video/*" className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0])} />
                  <button type="button" onClick={() => replyFileRef.current?.click()}
                    className="portal-card-muted p-2.5 rounded-xl flex-shrink-0 hover:text-[var(--portal-gold-text)]"
                    style={{ border: '1px solid rgba(212,175,55,0.2)' }} aria-label="Attach photo or video">
                    <HiOutlinePaperClip className="size-5" />
                  </button>
                  <textarea className="glass-input min-h-[44px] max-h-[120px] flex-1 resize-none" placeholder="Reply to member…"
                    value={reply} maxLength={5000}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); } }} />
                  <button type="submit" disabled={sending || (!reply.trim() && !replyFile)} className="btn-success px-4 py-2.5 flex-shrink-0">
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/80 p-2" aria-label="Close image">
            <HiOutlineX className="size-6" />
          </button>
          <img src={lightbox} alt="Attachment full size" className="max-w-full max-h-full rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
