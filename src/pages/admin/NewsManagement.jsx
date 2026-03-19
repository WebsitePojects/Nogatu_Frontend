import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineEyeOff, HiOutlineX } from 'react-icons/hi';

const TYPE_OPTS = [
  { value: 'news', label: 'News', color: 'bg-primary-100 text-primary-700' },
  { value: 'announcement', label: 'Announcement', color: 'bg-amber-50 text-amber-600' },
  { value: 'promo', label: 'Promo', color: 'bg-primary-50 text-primary-600' },
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">News & Announcements</h1>
          <p className="text-sm text-gray-500">Manage news, announcements, and promotions visible on the public site.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-sm">
          <HiOutlinePlus className="w-5 h-5" />
          New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.map((post) => {
                  const typeOpt = TYPE_OPTS.find((t) => t.value === post.type) || TYPE_OPTS[0];
                  return (
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{post.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{post.content?.slice(0, 80)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${typeOpt.color}`}>
                          {typeOpt.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggle(post.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            post.is_published ? 'bg-primary-50 text-primary-700 hover:bg-primary-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {post.is_published ? <HiOutlineEye className="w-3.5 h-3.5" /> : <HiOutlineEyeOff className="w-3.5 h-3.5" />}
                          {post.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(post)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer" aria-label="Edit">
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" aria-label="Delete">
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Edit Post' : 'Create New Post'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer" aria-label="Close">
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
                  className="input-field"
                  placeholder="Post title"
                />
              </div>
              <div>
                <label htmlFor="post-type" className="label">Type</label>
                <select
                  id="post-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input-field"
                >
                  {TYPE_OPTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="post-image" className="label">Image URL (optional)</label>
                <input
                  id="post-image"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="input-field"
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
                  className="input-field resize-none"
                  placeholder="Write your post content..."
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="post-published"
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="post-published" className="text-sm text-gray-700 font-medium">Publish immediately</label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60 cursor-pointer">
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
