import { useState, useEffect } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';
import { apiUrl } from '../../utils/apiBase';

const TYPE_LABELS = { news: 'News', announcement: 'Announcement', promo: 'Promo', memo: 'Memo' };

// Detect a video from the (Cloudinary) media URL so the landing renders <video> not <img>.
function isVideoUrl(url) {
  if (!url) return false;
  if (url.includes('/video/')) return true;
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'webm', 'avi', 'mkv', 'ogg', 'm4v'].includes(ext);
}

// Detect a document (PDF/office) so it renders as a downloadable card, not an <img>.
function isDocumentUrl(url) {
  if (!url) return false;
  if (url.includes('/raw/')) return true;
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  return ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);
}

// Turn an original upload name into a Cloudinary-safe fl_attachment token (no path/ext).
function sanitizeAttachmentName(name) {
  if (!name) return '';
  const base = String(name).split('/').pop().split('\\').pop();
  const noExt = base.replace(/\.[^.]+$/, '');
  return noExt.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100);
}

// Force a download (Content-Disposition: attachment) for Cloudinary assets via the
// fl_attachment delivery flag, keeping the original filename when known; non-Cloudinary
// URLs fall back to the raw link.
function toDownloadUrl(url, filename) {
  if (!url) return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const safe = sanitizeAttachmentName(filename);
    const flag = safe ? `fl_attachment:${safe}` : 'fl_attachment';
    return url.replace('/upload/', `/upload/${flag}/`);
  }
  return url;
}

function DownloadButton({ url, filename, className = '', style }) {
  if (!url) return null;
  return (
    <a
      href={toDownloadUrl(url, filename)}
      download={filename || true}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label="Download media"
      title="Download"
      style={style}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${className}`}
    >
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" />
      </svg>
      Download
    </a>
  );
}
const TYPE_COLORS = {
  news: { bg: 'rgba(184,134,11,0.1)', color: '#B8860B' },
  announcement: { bg: 'rgba(212,165,40,0.1)', color: '#D4A528' },
  promo: { bg: 'rgba(89,34,25,0.08)', color: '#592219' },
  memo: { bg: 'rgba(16,185,129,0.12)', color: '#0f766e' },
};

function PageHero({ title, subtitle }) {
  return (
    <section className="landing-page-hero relative pt-28 pb-10 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(212,165,40,0.08), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(89,34,25,0.05), transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #D4A528 50%, transparent)' }} />
      <div className="section-container relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5 motion-safe:animate-fade-up">
            <div className="h-0.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#B8860B' }}>NOGATU Alliance</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-tight mb-3 sm:mb-4 motion-safe:animate-fade-up" style={{ color: '#3A1000', animationDelay: '0.05s' }}>{title}</h1>
          {subtitle && <p className="text-base sm:text-lg leading-relaxed max-w-xl motion-safe:animate-fade-up" style={{ color: '#6d3028', animationDelay: '0.15s' }}>{subtitle}</p>}
          <div className="mt-6 w-16 h-1 rounded-full motion-safe:animate-fade-up" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)', animationDelay: '0.2s' }} />
        </div>
      </div>
    </section>
  );
}

// tz-safe date format (a bare YYYY-MM-DD stays that calendar day).
function fmtPostDate(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PostCard({ post, delay, onExpand, isExpanded, onLightbox }) {
  const ref = useScrollReveal({ delay });
  const tc = TYPE_COLORS[post.type] || TYPE_COLORS.news;
  return (
    <article ref={ref} className="reveal group rounded-2xl border overflow-hidden motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-1 motion-safe:transition-all motion-safe:duration-300" style={{ backgroundColor: '#FFFDF5', borderColor: 'rgba(184,134,11,0.15)' }}>
      {post.image_url && (
        <div className="relative h-48 overflow-hidden" style={{ backgroundColor: '#FFF8E1' }}>
          {isDocumentUrl(post.image_url) ? (
            <a
              href={post.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="size-full flex flex-col items-center justify-center gap-2 px-4 text-center cursor-pointer"
              style={{ backgroundColor: '#FFF8E1' }}
            >
              <span className="size-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(184,134,11,0.12)', border: '1px solid rgba(184,134,11,0.25)' }}>
                <svg className="size-7" style={{ color: '#B8860B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>
              </span>
              <span className="text-sm font-semibold" style={{ color: '#3A1000' }}>View document</span>
            </a>
          ) : isVideoUrl(post.image_url) ? (
            <div className="size-full cursor-pointer" onClick={() => onLightbox(post.image_url, 'video', post.media_filename)}>
              <video
                src={post.image_url}
                className="size-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              {/* Play affordance */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="size-12 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center">
                  <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </div>
            </div>
          ) : (
            <div className="size-full cursor-pointer" onClick={() => onLightbox(post.image_url, 'image', post.media_filename)}>
              <img src={post.image_url} alt={post.title} className="size-full object-cover motion-safe:group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-500" loading="lazy" />
            </div>
          )}
          <DownloadButton url={post.image_url} filename={post.media_filename} className="absolute top-2 right-2 px-2.5 py-1.5 bg-black/55 hover:bg-black/70 text-white backdrop-blur-sm" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: tc.bg, color: tc.color }}>
            {TYPE_LABELS[post.type] || 'News'}
          </span>
          <span className="text-xs" style={{ color: '#B8860B' }}>{fmtPostDate(post.display_date || post.post_date || post.created_at)}</span>
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#3A1000' }}>{post.title}</h3>
        {post.content?.trim() ? (
          <p className="text-sm leading-relaxed" style={{ color: '#6d3028' }}>
            {isExpanded ? post.content : post.content?.slice(0, 150)}
            {post.content?.length > 150 && (
              <button onClick={() => onExpand(isExpanded ? null : post.id)} className="font-medium ml-1 hover:underline cursor-pointer" style={{ color: '#B8860B' }} type="button">
                {isExpanded ? 'Show less' : '...Read more'}
              </button>
            )}
          </p>
        ) : (
          isDocumentUrl(post.image_url) && (
            <DownloadButton url={post.image_url} filename={post.media_filename} className="px-3 py-1.5" style={{ background: 'rgba(184,134,11,0.1)', color: '#B8860B', border: '1px solid rgba(184,134,11,0.2)' }} />
          )
        )}
      </div>
    </article>
  );
}

export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const ref1 = useScrollReveal();
  const lightbox = useLightbox();

  useEffect(() => {
    fetch(apiUrl('/news'), { credentials: 'include' }).then(r => r.json()).then(data => setPosts(data.posts || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);

  return (
    <>
      <PageHero title="News & Announcements" subtitle="Stay updated with the latest from NOGATU Alliance." />

      <section className="section-padding bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="section-container">
          {/* Section header */}
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#3A1000' }}>Latest Updates</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
          </div>

          {/* Filter tabs */}
          <div ref={ref1} className="reveal flex flex-wrap items-center justify-center gap-2 mb-12 mt-8">
            {['all', 'news', 'announcement', 'promo', 'memo'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium motion-safe:transition-all motion-safe:duration-200 cursor-pointer"
                style={filter === f
                  ? { background: 'linear-gradient(135deg, #B8860B, #D4A528)', color: '#fff', boxShadow: '0 4px 14px rgba(184,134,11,0.25)' }
                  : { backgroundColor: '#FFF8E1', color: '#592219' }}
               type="button">
                {f === 'all' ? 'All' : TYPE_LABELS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="size-10 border-4 rounded-full motion-safe:animate-spin" style={{ borderColor: '#E7C679', borderTopColor: '#B8860B' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="size-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#FFF8E1' }}>
                <svg className="size-10" style={{ color: '#E7C679' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#3A1000' }}>No posts yet</h3>
              <p className="text-sm" style={{ color: '#6d3028' }}>Check back later for news, announcements, and promotions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  delay={i * 60}
                  isExpanded={expanded === post.id}
                  onExpand={setExpanded}
                  onLightbox={lightbox.open}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox src={lightbox.src} type={lightbox.type} filename={lightbox.filename} onClose={lightbox.close} />
    </>
  );
}
