import { useState, useEffect } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

const TYPE_LABELS = { news: 'News', announcement: 'Announcement', promo: 'Promo' };
const TYPE_COLORS = {
  news: { bg: 'rgba(184,134,11,0.1)', color: '#B8860B' },
  announcement: { bg: 'rgba(212,165,40,0.1)', color: '#D4A528' },
  promo: { bg: 'rgba(89,34,25,0.08)', color: '#592219' },
};

function PageHero({ title, subtitle }) {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(212,165,40,0.08), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(89,34,25,0.05), transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #D4A528 50%, transparent)' }} />
      <div className="section-container relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5 motion-safe:animate-fade-up">
            <div className="h-0.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#B8860B' }}>NOGATU Alliance</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-tight mb-4 motion-safe:animate-fade-up" style={{ color: '#3A1000', animationDelay: '0.05s' }}>{title}</h1>
          {subtitle && <p className="text-lg leading-relaxed max-w-xl motion-safe:animate-fade-up" style={{ color: '#6d3028', animationDelay: '0.15s' }}>{subtitle}</p>}
          <div className="mt-6 w-16 h-1 rounded-full motion-safe:animate-fade-up" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)', animationDelay: '0.2s' }} />
        </div>
      </div>
    </section>
  );
}

function PostCard({ post, delay, onExpand, isExpanded, onLightbox }) {
  const ref = useScrollReveal({ delay });
  const tc = TYPE_COLORS[post.type] || TYPE_COLORS.news;
  return (
    <article ref={ref} className="reveal group rounded-2xl border overflow-hidden motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-1 motion-safe:transition-all motion-safe:duration-300" style={{ backgroundColor: '#FFFDF5', borderColor: 'rgba(184,134,11,0.15)' }}>
      {post.image_url && (
        <div className="h-48 overflow-hidden cursor-pointer" style={{ backgroundColor: '#FFF8E1' }} onClick={() => onLightbox(post.image_url)}>
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover motion-safe:group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-500" loading="lazy" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: tc.bg, color: tc.color }}>
            {TYPE_LABELS[post.type] || 'News'}
          </span>
          <span className="text-xs" style={{ color: '#B8860B' }}>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#3A1000' }}>{post.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#6d3028' }}>
          {isExpanded ? post.content : post.content?.slice(0, 150)}
          {post.content?.length > 150 && (
            <button onClick={() => onExpand(isExpanded ? null : post.id)} className="font-medium ml-1 hover:underline cursor-pointer" style={{ color: '#B8860B' }}>
              {isExpanded ? 'Show less' : '...Read more'}
            </button>
          )}
        </p>
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
    fetch('/api/news').then(r => r.json()).then(data => setPosts(data.posts || [])).catch(() => {}).finally(() => setLoading(false));
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
            {['all', 'news', 'announcement', 'promo'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium motion-safe:transition-all motion-safe:duration-200 cursor-pointer"
                style={filter === f
                  ? { background: 'linear-gradient(135deg, #B8860B, #D4A528)', color: '#fff', boxShadow: '0 4px 14px rgba(184,134,11,0.25)' }
                  : { backgroundColor: '#FFF8E1', color: '#592219' }}
              >
                {f === 'all' ? 'All' : TYPE_LABELS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 rounded-full motion-safe:animate-spin" style={{ borderColor: '#E7C679', borderTopColor: '#B8860B' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#FFF8E1' }}>
                <svg className="w-10 h-10" style={{ color: '#E7C679' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
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

      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </>
  );
}
