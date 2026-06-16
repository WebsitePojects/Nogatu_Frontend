import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePaperClip, HiOutlinePaperAirplane, HiOutlineX, HiOutlineExclamationCircle } from 'react-icons/hi';
import api from '../../api';
import useSupportStream from '../../hooks/useSupportStream';
import ChatMessages from '../../components/support/ChatMessages';
import { uploadSingleSupportFile, discardSupportUpload, validateSupportFiles } from '../../utils/supportUpload';

function StatusBadge({ label }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(212,175,55,0.14)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}>
      {label || 'Open'}
    </span>
  );
}

export default function SupportThread() {
  const { ticketUid } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState([]); // [{ file, url, type }]
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef(null);
  const endRef = useRef(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/support/tickets/${ticketUid}`);
      setTicket(res.data.ticket || null);
      setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
    } catch {
      setTicket(null);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }, [ticketUid, scrollToEnd]);

  useEffect(() => { load(); }, [load]);

  // Realtime: append admin replies for THIS ticket, mark my messages read, status changes.
  useSupportStream(useCallback((event, data) => {
    if (!data || data.ticketUid !== ticketUid) return;
    if (event === 'support.reply' && data.authorRole === 'admin') {
      setMessages((prev) => {
        if (prev.some((m) => m.replyUid === data.replyUid)) return prev;
        return [...prev, {
          replyUid: data.replyUid, authorRole: 'admin', authorName: data.authorName,
          body: data.body, attachmentUrl: data.attachmentUrl, attachmentType: data.attachmentType,
          attachments: data.attachments || [], createdAt: data.createdAt, status: 'read',
        }];
      });
      // I'm looking at the thread, so tell the server it's read.
      api.get(`/support/tickets/${ticketUid}`).catch(() => {});
      scrollToEnd();
    } else if (event === 'support.read' && data.by === 'admin') {
      setMessages((prev) => prev.map((m) => (m.authorRole === 'member' ? { ...m, status: 'read' } : m)));
    } else if (event === 'support.status') {
      setTicket((t) => (t ? { ...t, status: data.status, statusLabel: data.statusLabel } : t));
    }
  }, [ticketUid, scrollToEnd]));

  // Upload-on-attach: each file uploads to Cloudinary immediately so (a) sending is
  // instant and (b) discarding can delete the staged upload from Cloudinary.
  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;
    const check = validateSupportFiles([...files.map((x) => x.file), ...incoming]);
    if (!check.ok) { toast.error(check.error); return; }
    if (fileRef.current) fileRef.current.value = '';
    incoming.forEach((f) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const entry = { id, file: f, localUrl: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image', status: 'uploading', url: null, publicId: null };
      setFiles((prev) => [...prev, entry]);
      uploadSingleSupportFile(f, { admin: false })
        .then((up) => setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'done', url: up.url, publicId: up.publicId } : x))))
        .catch(() => { toast.error(`Upload failed: ${f.name}`); setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'error' } : x))); });
    });
  }

  function removeFile(id) {
    setFiles((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.localUrl) URL.revokeObjectURL(target.localUrl);
      if (target?.publicId) discardSupportUpload(target.publicId, target.type, { admin: false });
      return prev.filter((x) => x.id !== id);
    });
  }

  function clearFiles() {
    setFiles((prev) => {
      prev.forEach((p) => { if (p.localUrl) URL.revokeObjectURL(p.localUrl); });
      return [];
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  const anyUploading = files.some((f) => f.status === 'uploading');

  const send = async (e) => {
    e.preventDefault();
    const ready = files.filter((f) => f.status === 'done');
    if ((!reply.trim() && ready.length === 0) || sending) return;
    if (anyUploading) { toast('Please wait for attachments to finish uploading.'); return; }
    setSending(true);
    const text = reply.trim();
    try {
      const res = await api.post(`/support/tickets/${ticketUid}/reply`, {
        message: text,
        attachments: ready.map((f) => ({ type: f.type, url: f.url, publicId: f.publicId })),
      });
      const r = res.data.reply;
      setMessages((prev) => [...prev, {
        replyUid: r.replyUid, authorRole: 'member', authorName: r.authorName,
        body: r.body, attachmentUrl: r.attachmentUrl, attachmentType: r.attachmentType,
        attachments: r.attachments || [], createdAt: r.createdAt, status: r.status || 'sent',
      }]);
      if (res.data.status) setTicket((t) => (t ? { ...t, status: res.data.status, statusLabel: res.data.statusLabel } : t));
      setReply('');
      clearFiles();
      scrollToEnd();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const closed = ticket?.status === 'closed';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 7rem)' }}>
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/support')}
          className="portal-card-muted p-2 rounded-lg flex-shrink-0" aria-label="Back to tickets">
          <HiOutlineArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="portal-page-title font-display text-lg font-bold truncate">{ticket?.subject || 'Conversation'}</h1>
          <div className="mt-1"><StatusBadge label={ticket?.statusLabel} /></div>
        </div>
      </div>

      {/* Messages */}
      <div className="glass-card rounded-2xl mt-3 flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <p className="text-sm portal-card-muted">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm portal-card-muted">No messages yet.</p>
        ) : (
          <ChatMessages messages={messages} viewerRole="member" onZoom={setLightbox} />
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      {!closed ? (
        <form onSubmit={send} className="glass-card rounded-2xl mt-3 p-3">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((f) => (
                <div key={f.id} className="relative size-16 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
                  {f.type === 'video'
                    ? <video src={f.localUrl} muted className="size-full object-cover" style={{ background: '#000' }} />
                    : <img src={f.localUrl} alt="Preview" className="size-full object-cover" />}
                  {f.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                      <span className="inline-block size-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {f.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(127,29,29,0.55)' }}>
                      <HiOutlineExclamationCircle className="size-5 text-always-white" />
                    </div>
                  )}
                  <button type="button" onClick={() => removeFile(f.id)}
                    className="absolute top-0.5 right-0.5 rounded-full p-0.5 text-always-white" style={{ background: 'rgba(0,0,0,0.6)' }}
                    aria-label="Remove"><HiOutlineX className="size-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
              onChange={(e) => addFiles(e.target.files)} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="portal-card-muted p-2.5 rounded-xl flex-shrink-0" style={{ border: '1px solid rgba(212,175,55,0.2)' }}
              title="Attach up to 5 photos + 1 video" aria-label="Attach photos or video"><HiOutlinePaperClip className="size-5" /></button>
            <textarea className="glass-input min-h-[44px] max-h-[120px] flex-1 resize-none" placeholder="Type your message…"
              value={reply} maxLength={5000} onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }} />
            <button type="submit" disabled={sending || anyUploading || (!reply.trim() && !files.some((f) => f.status === 'done'))}
              className="p-2.5 rounded-xl flex-shrink-0 disabled:opacity-50 text-always-white"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#b8860b)' }} aria-label="Send message">
              {sending ? <span className="inline-block size-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <HiOutlinePaperAirplane className="size-5" />}
            </button>
          </div>
        </form>
      ) : (
        <div className="glass-card rounded-2xl mt-3 p-4 text-center text-sm portal-card-muted">
          This ticket is closed. Open a new ticket if you need more help.
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Attachment" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
