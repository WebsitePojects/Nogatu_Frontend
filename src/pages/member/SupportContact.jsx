import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineMail, HiOutlineExternalLink, HiOutlinePencilAlt, HiOutlineX,
  HiOutlineChat, HiOutlineRefresh, HiOutlinePaperClip, HiOutlinePhotograph, HiOutlineTrash,
} from 'react-icons/hi';
import { FaFacebook } from 'react-icons/fa';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

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

// Renders an attachment inside a chat bubble (image opens lightbox, video plays inline).
function Attachment({ url, type, onZoom }) {
  if (!url) return null;
  if (type === 'video') {
    return (
      <video src={url} controls preload="metadata"
        className="mt-2 rounded-xl w-full" style={{ maxHeight: 240, background: '#000' }} />
    );
  }
  return (
    <button type="button" onClick={() => onZoom(url)} className="mt-2 block w-full" aria-label="View image full size">
      <img src={url} alt="Attachment" loading="lazy"
        className="rounded-xl w-full object-cover" style={{ maxHeight: 240 }} />
    </button>
  );
}

// Compose-area attachment preview chip.
function PreviewChip({ media, onRemove }) {
  if (!media) return null;
  return (
    <div className="flex items-center gap-2 mb-2 rounded-xl p-2" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
      {media.type === 'video' ? (
        <video src={media.url} className="size-12 rounded-lg object-cover flex-shrink-0" style={{ background: '#000' }} muted />
      ) : (
        <img src={media.url} alt="Preview" className="size-12 rounded-lg object-cover flex-shrink-0" />
      )}
      <p className="text-xs portal-card-muted flex-1 truncate">{media.file.name}</p>
      <button type="button" onClick={onRemove} className="portal-card-muted p-1.5 rounded-lg hover:text-red-400" aria-label="Remove attachment">
        <HiOutlineTrash className="size-4" />
      </button>
    </div>
  );
}

export default function SupportContact() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [newFile, setNewFile] = useState(null);
  const newFileRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
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

  const loadTickets = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { if (thread) threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  useEffect(() => {
    activeTicketRef.current = activeTicket;
    if (!activeTicket) return undefined;
    const timer = setInterval(async () => {
      const uid = activeTicketRef.current;
      if (!uid) return;
      try {
        const res = await api.get(`/support/tickets/${uid}`);
        if (activeTicketRef.current === uid) {
          setThread((cur) => {
            if (!cur) return res.data;
            return res.data.messages.length !== cur.messages.length ? res.data : cur;
          });
        }
      } catch { /* transient */ }
    }, 12000);
    return () => clearInterval(timer);
  }, [activeTicket]);

  function pickFile(file, setter) {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return toast.error('Only image or video files are allowed.');
    if (isImage && file.size > IMAGE_MAX) return toast.error('Image exceeds the 5 MB limit.');
    if (isVideo && file.size > VIDEO_MAX) return toast.error('Video exceeds the 50 MB limit.');
    setter((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file, url: URL.createObjectURL(file), type: isImage ? 'image' : 'video' };
    });
  }

  function clearFile(setter, inputRef) {
    setter((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; });
    if (inputRef?.current) inputRef.current.value = '';
  }

  async function submitTicket(event) {
    event.preventDefault();
    if (!form.subject.trim() || (!form.message.trim() && !newFile)) {
      return toast.error('Subject and a message or attachment are required.');
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('message', form.message);
      if (newFile) fd.append('media', newFile.file);
      await api.post('/support/ticket', fd);
      toast.success('Ticket submitted');
      setForm({ subject: '', message: '' });
      clearFile(setNewFile, newFileRef);
      setOpen(false);
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  // Open the ticket as a full dedicated chat page (not a modal).
  function openThread(ticketUid) {
    setTickets((list) => list.map((t) => (t.ticketUid === ticketUid ? { ...t, unread: false } : t)));
    navigate(`/support/${ticketUid}`);
  }

  function closeThread() {
    setActiveTicket(null);
    setThread(null);
    setReply('');
    clearFile(setReplyFile, replyFileRef);
    loadTickets();
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim() && !replyFile) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', reply);
      if (replyFile) fd.append('media', replyFile.file);
      const res = await api.post(`/support/tickets/${activeTicket}/reply`, fd);
      setThread((cur) => cur ? {
        ...cur,
        ticket: { ...cur.ticket, status: res.data.status, statusLabel: res.data.statusLabel },
        messages: [...cur.messages, res.data.reply],
      } : cur);
      setReply('');
      clearFile(setReplyFile, replyFileRef);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to send reply.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold portal-page-title">Issue or Concern</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* My Tickets */}
        <div className="order-2 lg:order-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold portal-card-title flex items-center gap-2">
              <HiOutlineChat className="size-4" style={{ color: '#34d399' }} />
              My Support Tickets
            </h2>
            <button type="button" onClick={loadTickets}
              className="portal-card-muted p-1.5 rounded-lg hover:text-[var(--portal-gold-text)]" title="Refresh">
              <HiOutlineRefresh className={`size-4 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingList ? (
            <div className="glass-card rounded-2xl p-6 text-sm portal-card-muted">Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-sm portal-card-muted">
              No tickets yet. Open one below and our support team will reply here.
            </div>
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
                        {t.lastReplyRole === 'admin' ? 'Support replied' : 'Updated'} · {t.lastActivity}
                      </p>
                    </div>
                    <StatusBadge status={t.status} label={t.statusLabel} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Channels */}
        <div className="order-1 lg:order-2 space-y-5">
          <div className="glass-card rounded-2xl p-6" style={{ borderLeft: '3px solid rgba(16,185,129,0.6)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }}>
                <HiOutlinePencilAlt className="size-5" style={{ color: '#34d399' }} />
              </div>
              <div>
                <p className="text-sm font-semibold portal-card-title">In-Portal Support Ticket</p>
                <p className="text-sm" style={{ color: '#0f8f66' }}>Chat with our team — attach a photo or video of your concern.</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(16,185,129,0.14)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
              Open New Ticket
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <FaFacebook className="size-5" style={{ color: '#60a5fa' }} />
              </div>
              <div>
                <p className="text-sm font-semibold portal-card-title">Facebook — NAWi Help Desk</p>
                <p className="text-sm portal-gold-text">Fastest response time</p>
              </div>
            </div>
            <a href="https://www.facebook.com/profile.php?id=61577667873284" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
              <FaFacebook className="size-4" />
              Message NAWi Help Desk
              <HiOutlineExternalLink className="size-3.5 opacity-60" />
            </a>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <HiOutlineMail className="size-5" style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <p className="text-sm font-semibold portal-card-title">Email Support</p>
                <p className="text-sm portal-gold-text">Alternative contact method</p>
              </div>
            </div>
            <a href="mailto:nogatu.assist@gmail.com?subject=Nogatu%20System%20Concern"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
              <HiOutlineMail className="size-4" />
              nogatu.assist@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* New ticket modal */}
      {open && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => setOpen(false)}>
          <form onSubmit={submitTicket} onMouseDown={(e) => e.stopPropagation()}
            className="portal-modal-panel w-full max-w-lg rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="portal-modal-title font-display text-xl font-bold">New Support Ticket</h2>
                <p className="portal-modal-muted text-sm mt-1">{user?.username || user?.accountname || 'Logged-in member'}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="portal-close-button p-2 rounded-lg">
                <HiOutlineX className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Subject</label>
                <input className="glass-input" value={form.subject} maxLength={180}
                  onChange={(e) => setForm((c) => ({ ...c, subject: e.target.value }))} />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="glass-input min-h-[130px]" value={form.message} maxLength={5000}
                  placeholder="Describe your concern…"
                  onChange={(e) => setForm((c) => ({ ...c, message: e.target.value }))} />
              </div>

              <PreviewChip media={newFile} onRemove={() => clearFile(setNewFile, newFileRef)} />
              <input ref={newFileRef} type="file" accept="image/*,video/*" className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0], setNewFile)} />
              <button type="button" onClick={() => newFileRef.current?.click()}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>
                <HiOutlinePhotograph className="size-4" /> Attach photo or video
              </button>

              <button type="submit" disabled={submitting} className="btn-success w-full">
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Thread / chatroom modal */}
      {activeTicket && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={closeThread}>
          <div onMouseDown={(e) => e.stopPropagation()}
            className="portal-modal-panel w-full max-w-lg rounded-2xl flex flex-col" style={{ maxHeight: '88vh' }}>
            <div className="flex items-start justify-between gap-3 p-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="min-w-0">
                <h2 className="portal-modal-title font-display text-lg font-bold truncate">
                  {thread?.ticket?.subject || 'Ticket'}
                </h2>
                {thread?.ticket && (
                  <div className="mt-1.5"><StatusBadge status={thread.ticket.status} label={thread.ticket.statusLabel} /></div>
                )}
              </div>
              <button type="button" onClick={closeThread} className="portal-close-button p-2 rounded-lg">
                <HiOutlineX className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
              {loadingThread ? (
                <p className="text-sm portal-card-muted">Loading conversation…</p>
              ) : (
                thread?.messages?.map((m, i) => {
                  const mine = m.authorRole === 'member';
                  return (
                    <div key={m.replyUid || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5"
                        style={mine
                          ? { background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)' }
                          : { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: mine ? '#34d399' : '#60a5fa' }}>
                          {mine ? 'You' : (m.authorName || 'Support Team')}
                        </p>
                        {m.body && <p className="text-sm portal-card-title whitespace-pre-wrap break-words">{m.body}</p>}
                        <Attachment url={m.attachmentUrl} type={m.attachmentType} onZoom={setLightbox} />
                        <p className="text-[10px] portal-card-muted mt-1 text-right">{m.createdAt}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {thread?.ticket?.status !== 'closed' && (
              <form onSubmit={sendReply} className="p-4" style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}>
                <PreviewChip media={replyFile} onRemove={() => clearFile(setReplyFile, replyFileRef)} />
                <div className="flex items-end gap-2">
                  <input ref={replyFileRef} type="file" accept="image/*,video/*" className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0], setReplyFile)} />
                  <button type="button" onClick={() => replyFileRef.current?.click()}
                    className="portal-card-muted p-2.5 rounded-xl flex-shrink-0 hover:text-[var(--portal-gold-text)]"
                    style={{ border: '1px solid rgba(212,175,55,0.2)' }} aria-label="Attach photo or video">
                    <HiOutlinePaperClip className="size-5" />
                  </button>
                  <textarea className="glass-input min-h-[44px] max-h-[120px] flex-1 resize-none" placeholder="Type your message…"
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

      {/* Image lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 p-2" aria-label="Close image">
            <HiOutlineX className="size-6" />
          </button>
          <img src={lightbox} alt="Attachment full size" className="max-w-full max-h-full rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
