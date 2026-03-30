import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineEyeOff, HiOutlineX } from 'react-icons/hi';

const TYPE_OPTS = [
  { value: 'news', label: 'News', style: { background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' } },
  { value: 'announcement', label: 'Announcement', style: { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' } },
  { value: 'promo', label: 'Promo', style: { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' } },
];

const EMPTY = { title: '', content: '', type: 'news', image_url: '', is_published: true };

export default function NewsManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    try {
      const res = await api.get('/admin/news');
      setPosts(res.data.posts || []);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(post) {
    setEditing(post.id);
    setForm({
      title: post.title,
      content: post.content,
      type: post.type,
      image_url: post.image_url || '',
      is_published: !!post.is_published,
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/news/${editing}`, form);
        toast.success('Post updated');
      } else {
        await api.post('/admin/news', form);
        toast.success('Post created');
      }
      setShowModal(false);
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/admin/news/${id}`);
      toast.success('Post deleted');
      loadPosts();
    } catch { toast.error('Failed to delete'); }
  }

  async function handleToggle(id) {
    try {
      await api.patch(`/admin/news/${id}/toggle`);
      loadPosts();
    } catch { toast.error('Failed to toggle'); }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div
        className="animate-spin rounded-full h-10 w-10 border-4"
        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">News &amp; Announcements</h1>
          <div className="w-12 h-0.5 mt-2 mb-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Manage news, announcements, and promotions visible on the public site.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="gold-btn inline-flex items-center gap-2 rounded-xl py-2.5 px-5 text-sm font-semibold flex-shrink-0 ml-4"
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(212,175,55,0.4)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Title', 'Type', 'Status', 'Date', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={`table-header px-5 py-3.5 font-semibold text-xs uppercase tracking-wide ${i === 4 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((post, idx) => {
                  const typeOpt = TYPE_OPTS.find((t) => t.value === post.type) || TYPE_OPTS[0];
                  return (
                    <tr
                      key={post.id}
                      className="motion-safe:transition-colors"
                      style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                    >
                      <td className="px-5 py-4" style={{ borderLeft: '3px solid rgba(212,175,55,0.25)' }}>
                        <p className="text-sm font-medium text-white/80 truncate max-w-xs">{post.title}</p>
                        <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {post.content?.slice(0, 80)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={typeOpt.style}
                        >
                          {typeOpt.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggle(post.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer motion-safe:transition-colors"
                          style={
                            post.is_published
                              ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                          }
                        >
                          {post.is_published
                            ? <HiOutlineEye className="w-3.5 h-3.5" />
                            : <HiOutlineEyeOff className="w-3.5 h-3.5" />}
                          {post.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(post)}
                            className="p-2 rounded-lg motion-safe:transition-colors cursor-pointer"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                            aria-label="Edit"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 rounded-lg motion-safe:transition-colors cursor-pointer"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                            aria-label="Delete"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{
              background: 'rgba(18,14,8,0.97)',
              border: '1px solid rgba(212,175,55,0.2)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.08)',
            }}
          >
            <div
              className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}
            >
              <h3 className="font-display text-lg font-bold text-white">
                {editing ? 'Edit Post' : 'Create New Post'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg motion-safe:transition-colors cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
                aria-label="Close"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label htmlFor="post-title" className="label">Title</label>
                <input
                  id="post-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                  placeholder="Post title"
                />
              </div>
              <div>
                <label htmlFor="post-type" className="label">Type</label>
                <select
                  id="post-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                >
                  {TYPE_OPTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="post-image" className="label">Image URL <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>(optional)</span></label>
                <input
                  id="post-image"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label htmlFor="post-content" className="label">Content</label>
                <textarea
                  id="post-content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={6}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5 resize-none"
                  placeholder="Write your post content..."
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="post-published"
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#D4AF37' }}
                />
                <label htmlFor="post-published" className="text-sm text-white/60 font-medium cursor-pointer">
                  Publish immediately
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="gold-btn-outline cursor-pointer rounded-xl py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="gold-btn disabled:opacity-60 cursor-pointer rounded-xl py-2 px-5 text-sm font-semibold"
                >
                  {saving ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
