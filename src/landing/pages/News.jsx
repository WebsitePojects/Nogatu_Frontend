import { useState, useEffect } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

const TYPE_LABELS = { news: 'News', announcement: 'Announcement', promo: 'Promo' };
const TYPE_COLORS = {
  news: { bg: 'rgba(55,148,46,0.08)', color: '#37942E' },
  announcement: { bg: 'rgba(245,158,11,0.08)', color: '#d97706' },
  promo: { bg: 'rgba(89,34,25,0.06)', color: '#592219' },
};

function PageHero({ title, subtitle }) {
  return (
    <section className="relative pt-40 pb-40 lg:pt-52 lg:pb-52 overflow-hidden" style={{ backgroundColor: '#592219' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="section-container relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight animate-fade-up">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '0.15s' }}>{subtitle}</p>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-white to-transparent" />
    </section>
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

      <section className="section-padding bg-white">
        <div className="section-container">
          {/* Filter tabs */}
          <div ref={ref1} className="reveal flex flex-wrap items-center justify-center gap-2 mb-12">
            {['all', 'news', 'announcement', 'promo'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={filter === f
                  ? { background: '#37942E', color: '#fff', boxShadow: '0 4px 14px rgba(55,148,46,0.2)' }
                  : { background: '#f3f4f6', color: '#4b5563' }}
              >
                {f === 'all' ? 'All' : TYPE_LABELS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#37942E' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
              <p className="text-gray-500 text-sm">Check back later for news, announcements, and promotions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => {
                const ref = useScrollReveal({ delay: i * 60 });
                const isExpanded = expanded === post.id;
                const tc = TYPE_COLORS[post.type] || TYPE_COLORS.news;
                return (
                  <article key={post.id} ref={ref} className="reveal group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {post.image_url && (
                      <div className="h-48 overflow-hidden bg-gray-50 cursor-pointer" onClick={() => lightbox.open(post.image_url)}>
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: tc.bg, color: tc.color }}>
                          {TYPE_LABELS[post.type] || 'News'}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 transition-colors" style={{ '--hover-color': '#37942E' }}>{post.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {isExpanded ? post.content : post.content?.slice(0, 150)}
                        {post.content?.length > 150 && (
                          <button onClick={() => setExpanded(isExpanded ? null : post.id)} className="font-medium ml-1 hover:underline cursor-pointer" style={{ color: '#37942E' }}>
                            {isExpanded ? 'Show less' : '...Read more'}
                          </button>
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </>
  );
}
