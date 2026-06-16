/**
 * Shared support chat message list — used by both the member SupportThread page
 * and the admin Support page so bubbles, date separators, read receipts, and
 * entrance animations stay identical on both sides.
 */
import { HiOutlineCheck } from 'react-icons/hi';

function dayLabel(createdAt) {
  // createdAt arrives as 'YYYY-MM-DD HH:mm'. Group/label by the date part.
  const datePart = String(createdAt || '').slice(0, 10);
  if (!datePart) return '';
  const d = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(d.getTime())) return datePart;
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const iso = (x) => x.toISOString().slice(0, 10);
  if (datePart === iso(today)) return 'Today';
  if (datePart === iso(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// 'YYYY-MM-DD HH:mm' (24h) -> '11:08 AM' / '9:34 PM'
function timeLabel(createdAt) {
  const hm = String(createdAt || '').slice(11, 16);
  const [hStr, mStr] = hm.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return hm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
}

// Sent = single check; delivered/read = double; read = gold.
function Ticks({ status }) {
  const read = status === 'read';
  const doubled = status === 'delivered' || status === 'read';
  const color = read ? '#D4AF37' : 'rgba(148,163,184,0.85)';
  return (
    <span className="inline-flex items-center" style={{ color }} aria-label={`Message ${status}`}>
      <HiOutlineCheck className="size-3" />
      {doubled && <HiOutlineCheck className="size-3 -ml-1.5" />}
    </span>
  );
}

function OneAttachment({ url, type, onZoom, compact }) {
  if (!url) return null;
  if (type === 'video') {
    return <video src={url} controls className="rounded-lg max-w-full" style={{ maxHeight: compact ? 120 : 220, background: '#000', width: compact ? '100%' : undefined }} />;
  }
  return (
    <img
      src={url}
      alt="Attachment"
      onClick={() => onZoom?.(url)}
      className="rounded-lg cursor-zoom-in"
      style={compact
        ? { width: '100%', height: 96, objectFit: 'cover' }
        : { maxHeight: 220, maxWidth: '100%', objectFit: 'cover' }}
    />
  );
}

// Renders all of a message's attachments chronologically. Single = full width;
// multiple = a compact 2-3 column grid. Falls back to the legacy single field.
function MessageAttachments({ message, onZoom }) {
  const list = Array.isArray(message.attachments) && message.attachments.length > 0
    ? message.attachments
    : (message.attachmentUrl ? [{ url: message.attachmentUrl, type: message.attachmentType || 'image' }] : []);
  if (list.length === 0) return null;
  if (list.length === 1) {
    return <div className="mt-1.5"><OneAttachment url={list[0].url} type={list[0].type} onZoom={onZoom} /></div>;
  }
  return (
    <div className={`mt-1.5 grid gap-1 ${list.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`} style={{ minWidth: 180 }}>
      {list.map((a, i) => (
        <OneAttachment key={`${a.url}-${i}`} url={a.url} type={a.type} onZoom={onZoom} compact />
      ))}
    </div>
  );
}

export default function ChatMessages({ messages = [], viewerRole = 'member', onZoom }) {
  let lastDay = null;
  return (
    <>
      {messages.map((m, i) => {
        const mine = m.authorRole === viewerRole;
        const day = String(m.createdAt || '').slice(0, 10);
        const showSeparator = day && day !== lastDay;
        lastDay = day || lastDay;
        return (
          <div key={m.replyUid || i}>
            {showSeparator && (
              <div className="flex justify-center my-3">
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full portal-card-muted"
                  style={{ background: 'rgba(148,163,184,0.12)' }}
                >
                  {dayLabel(m.createdAt)}
                </span>
              </div>
            )}
            <div className={`chat-bubble-in flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3.5 py-2.5"
                style={mine
                  ? { background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)' }
                  : { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <p className="text-[11px] font-semibold mb-0.5" style={{ color: mine ? '#34d399' : '#60a5fa' }}>
                  {m.authorName || (m.authorRole === 'admin' ? 'Support Team' : 'Member')}
                  {m.authorUsername && <span className="font-normal opacity-70"> @{m.authorUsername}</span>}
                  {mine && <span className="font-normal opacity-60"> (you)</span>}
                </p>
                {m.body && <p className="text-sm portal-card-title whitespace-pre-wrap break-words">{m.body}</p>}
                <MessageAttachments message={m} onZoom={onZoom} />
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] portal-card-muted">{timeLabel(m.createdAt)}</span>
                  {mine && m.status && <Ticks status={m.status} />}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
