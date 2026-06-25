import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineFilm,
  HiOutlineUpload,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
} from 'react-icons/hi';

const DOC_EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

const TYPE_OPTS = [
  { value: 'news', label: 'News', style: { background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' } },
  { value: 'announcement', label: 'Announcement', style: { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' } },
  { value: 'promo', label: 'Promo', style: { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' } },
  { value: 'memo', label: 'Memo', style: { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' } },
];

const EMPTY = { title: '', content: '', type: 'news', image_url: '', is_published: true, display_date: '' };

// Today as YYYY-MM-DD in the admin's local time (for the date input default/max).
function todayLocalISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffset).toISOString().slice(0, 10);
}

// Format a post's effective date (memo display_date when set, else upload date).
// display_date is a plain YYYY-MM-DD string → parse as a local calendar date so it
// never rolls back a day across timezones.
function formatPostDate(post) {
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  if (post.display_date) {
    const [y, m, d] = String(post.display_date).split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
  }
  return new Date(post.created_at).toLocaleDateString('en-US', opts);
}

const INPUT_CLASS =
  'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] text-[color:var(--portal-modal-title)] placeholder:text-[color:var(--portal-modal-muted)]';

function detectMediaType(url) {
  if (!url) return 'image';
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (url.includes('/video/') || ['mp4', 'mov', 'webm', 'avi', 'mkv', 'ogg'].includes(ext)) return 'video';
  if (url.includes('/raw/') || DOC_EXTS.includes(ext)) return 'document';
  return 'image';
}

function fileMediaType(file) {
  if (!file) return 'image';
  if (file.type?.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf' || DOC_EXTS.includes((file.name?.split('.').pop() || '').toLowerCase())) return 'document';
  return 'image';
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewsManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [clearMedia, setClearMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadPosts(); }, []);

  useEffect(() => {
    if (mediaFile) {
      const objectUrl = URL.createObjectURL(mediaFile);
      setMediaPreview(objectUrl);
      setMediaType(fileMediaType(mediaFile));
      return () => URL.revokeObjectURL(objectUrl);
    }
    if (!clearMedia && form.image_url) {
      setMediaPreview(form.image_url);
      setMediaType(detectMediaType(form.image_url));
    } else {
      setMediaPreview('');
    }
    return undefined;
  }, [mediaFile, form.image_url, clearMedia]);

  async function loadPosts() {
    try {
      const res = await api.get('/admin/news');
      setPosts(res.data.posts || []);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setMediaFile(null);
    setClearMedia(false);
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
      display_date: post.display_date || '',
    });
    setMediaFile(null);
    setClearMedia(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setMediaFile(null);
    setClearMedia(false);
  }

  function applyFile(file) {
    if (!file) return;
    const kind = fileMediaType(file); // image | video | document
    const isImage = file.type?.startsWith('image/');
    const isVideo = file.type?.startsWith('video/');
    const isDoc = kind === 'document';
    if (!isImage && !isVideo && !isDoc) {
      toast.error('Only images, videos, or PDF documents are allowed');
      return;
    }
    const maxBytes = isVideo ? 100 * 1024 * 1024 : isDoc ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(isVideo ? 'Video must be under 100 MB' : isDoc ? 'Document must be under 15 MB' : 'Image must be under 5 MB');
      return;
    }
    setMediaFile(file);
    setClearMedia(false);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    applyFile(file);
    if (e.target) e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0] || null;
    if (file) applyFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function removeMedia() {
    setMediaFile(null);
    setClearMedia(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('title', form.title || '');
      payload.append('content', form.content || '');
      payload.append('type', form.type || 'news');
      payload.append('is_published', form.is_published ? '1' : '0');
      payload.append('display_date', form.display_date || '');

      if (mediaFile) {
        payload.append('media', mediaFile);
      } else if (clearMedia) {
        payload.append('image_url', '');
      } else {
        payload.append('image_url', form.image_url || '');
      }

      if (editing) {
        await api.put(`/admin/news/${editing}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Post updated');
      } else {
        await api.post('/admin/news', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Post created');
      }

      closeModal();
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post and its media from Cloudinary?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/news/${id}`);
      toast.success('Post deleted');
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggle(id) {
    try {
      await api.patch(`/admin/news/${id}/toggle`);
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, is_published: !p.is_published } : p));
    } catch {
      toast.error('Failed to toggle');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="animate-spin rounded-full size-10 border-4"
          style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
        />
      </div>
    );
  }

  const hasExistingMedia = !clearMedia && !mediaFile && form.image_url;
  const showingMedia = !!mediaPreview;
  // Memos can be a document/announcement with no body text.
  const contentRequired = form.type !== 'memo';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">News &amp; Announcements</h1>
          <div className="w-12 h-0.5 mt-2 mb-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Manage news, announcements, memos, and promotions visible on the public site.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="gold-btn inline-flex items-center gap-2 rounded-xl py-2.5 px-5 text-sm font-semibold flex-shrink-0 ml-4"
          type="button"
        >
          <HiOutlinePlus className="size-5" />
          New Post
        </button>
      </div>

      {/* Table */}
      {posts.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center py-16">
          <div
            className="size-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <HiOutlinePhotograph className="size-8" style={{ color: 'rgba(212,175,55,0.4)' }} />
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Title', 'Type', 'Status', 'Media', 'Date', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={`table-header px-5 py-3.5 font-semibold text-xs uppercase tracking-wide ${i === 5 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((post, idx) => {
                  const typeOpt = TYPE_OPTS.find((t) => t.value === post.type) || TYPE_OPTS[0];
                  const postMediaType = detectMediaType(post.image_url);
                  return (
                    <tr
                      key={post.id}
                      className="motion-safe:transition-colors"
                      style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'; }}
                    >
                      <td className="px-5 py-4" style={{ borderLeft: '3px solid rgba(212,175,55,0.25)' }}>
                        <p className="text-sm font-medium text-white/80 truncate max-w-xs">{post.title}</p>
                        <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {post.content?.slice(0, 80)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold" style={typeOpt.style}>
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
                          type="button"
                        >
                          {post.is_published ? <HiOutlineEye className="size-3.5" /> : <HiOutlineEyeOff className="size-3.5" />}
                          {post.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        {post.image_url ? (
                          <a
                            href={post.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                            style={{ color: 'rgba(212,175,55,0.8)', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
                          >
                            {postMediaType === 'video' ? <HiOutlineFilm className="size-3.5" /> : postMediaType === 'document' ? <HiOutlineDocumentText className="size-3.5" /> : <HiOutlinePhotograph className="size-3.5" />}
                            {postMediaType === 'video' ? 'Video' : postMediaType === 'document' ? 'Document' : 'Image'}
                            <HiOutlineExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {formatPostDate(post)}
                        {post.display_date && (
                          <span className="block text-[10px] mt-0.5" style={{ color: 'rgba(212,175,55,0.65)' }}>
                            Memo date
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(post)}
                            className="p-2 rounded-lg motion-safe:transition-colors cursor-pointer"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                            aria-label="Edit"
                            type="button"
                          >
                            <HiOutlinePencil className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deleting === post.id}
                            className="p-2 rounded-lg motion-safe:transition-colors cursor-pointer disabled:opacity-40"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                            aria-label="Delete"
                            type="button"
                          >
                            <HiOutlineTrash className="size-4" />
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
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={closeModal}
          />
          <div
            className="relative rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
            style={{
              background: 'var(--portal-modal-bg)',
              border: '1px solid var(--portal-modal-border)',
              boxShadow: 'var(--portal-box-shadow)',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0 rounded-t-2xl"
              style={{ borderBottom: '1px solid var(--portal-modal-border)' }}
            >
              <div>
                <h3 className="font-display text-lg font-bold" style={{ color: 'var(--portal-modal-title)' }}>
                  {editing ? 'Edit Post' : 'Create New Post'}
                </h3>
                <div className="w-10 h-0.5 mt-1.5" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg motion-safe:transition-colors cursor-pointer"
                style={{ color: 'var(--portal-modal-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148,163,184,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                aria-label="Close"
                type="button"
              >
                <HiOutlineX className="size-5" />
              </button>
            </div>

            {/* Form */}
            <form id="news-post-form" onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="post-title" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--portal-modal-muted)' }}>
                  Title <span style={{ color: 'var(--portal-danger-text)' }}>*</span>
                </label>
                <input
                  id="post-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  maxLength={255}
                  className={INPUT_CLASS}
                  placeholder="Post title"
                />
              </div>

              {/* Type + Memo date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="post-type" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--portal-modal-muted)' }}>
                    Type
                  </label>
                  <select
                    id="post-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={INPUT_CLASS}
                  >
                    {TYPE_OPTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="post-display-date" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--portal-modal-muted)' }}>
                    Memo Date <span className="normal-case font-normal" style={{ color: 'var(--portal-modal-muted)' }}>(optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="post-display-date"
                      type="date"
                      value={form.display_date}
                      max={todayLocalISO()}
                      onChange={(e) => setForm({ ...form, display_date: e.target.value })}
                      className={INPUT_CLASS}
                    />
                    {form.display_date && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, display_date: '' })}
                        className="shrink-0 p-2 rounded-lg motion-safe:transition-colors"
                        style={{ color: 'var(--portal-modal-muted)' }}
                        title="Clear memo date"
                        aria-label="Clear memo date"
                      >
                        <HiOutlineX className="size-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--portal-modal-muted)' }}>
                    Shown on the public site. Defaults to the upload date when left blank.
                  </p>
                </div>
              </div>

              {/* Media upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--portal-modal-muted)' }}>
                  Media <span className="normal-case font-normal" style={{ color: 'var(--portal-modal-muted)' }}>(image, video, or PDF — optional)</span>
                </label>

                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,application/pdf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {showingMedia ? (
                  /* Preview zone */
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--portal-modal-border)' }}
                  >
                    {mediaType === 'video' ? (
                      /* eslint-disable-next-line jsx-a11y/media-has-caption */
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full max-h-48 object-contain"
                        style={{ background: 'rgba(0,0,0,0.4)' }}
                      />
                    ) : mediaType === 'document' ? (
                      <div className="w-full h-44 flex flex-col items-center justify-center gap-2 px-4 text-center" style={{ background: 'rgba(212,175,55,0.05)' }}>
                        <div className="size-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}>
                          <HiOutlineDocumentText className="size-7" style={{ color: '#D4AF37' }} />
                        </div>
                        <p className="text-sm font-medium break-all" style={{ color: 'var(--portal-modal-title)' }}>
                          {mediaFile ? mediaFile.name : 'Document attached'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--portal-modal-muted)' }}>Document preview not available — it will be downloadable on the site.</p>
                      </div>
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Media preview"
                        className="w-full h-44 object-cover"
                      />
                    )}

                    {/* Info bar with Replace / Remove */}
                    <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--portal-soft-bg)', borderTop: '1px solid var(--portal-modal-border)' }}>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--portal-modal-muted)' }}>
                        {mediaType === 'video' ? <HiOutlineFilm className="size-3.5" /> : mediaType === 'document' ? <HiOutlineDocumentText className="size-3.5" /> : <HiOutlinePhotograph className="size-3.5" />}
                        <span>{mediaFile ? `${mediaFile.name} — ${formatBytes(mediaFile.size)}` : `Current ${mediaType} (will be kept)`}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ color: '#D4AF37' }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={removeMedia}
                          className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ color: 'var(--portal-danger-text)' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Upload drop zone */
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="w-full rounded-xl py-8 flex flex-col items-center gap-2 transition-colors cursor-pointer"
                    style={{
                      background: dragActive ? 'rgba(212,175,55,0.08)' : 'var(--portal-soft-bg)',
                      border: dragActive ? '2px dashed rgba(212,175,55,0.7)' : '2px dashed var(--portal-soft-border)',
                    }}
                    onMouseEnter={(e) => { if (!dragActive) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
                    onMouseLeave={(e) => { if (!dragActive) e.currentTarget.style.borderColor = 'var(--portal-soft-border)'; }}
                  >
                    <div
                      className="size-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                    >
                      <HiOutlineUpload className="size-6" style={{ color: 'rgba(212,175,55,0.7)' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: 'var(--portal-modal-title)' }}>
                        {dragActive ? 'Drop the file to upload' : 'Click to upload, or drag & drop a file'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--portal-modal-muted)' }}>
                        Images up to 5 MB · Videos up to 100 MB · PDF/Docs up to 15 MB
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--portal-modal-muted)' }}>
                        JPG, PNG, GIF, WebP, MP4, MOV, WebM, PDF
                      </p>
                    </div>
                  </button>
                )}

                {/* Optional external URL fallback */}
                {!showingMedia && (
                  <div className="mt-2">
                    <label htmlFor="post-image-url" className="block text-[11px] mb-1" style={{ color: 'var(--portal-modal-muted)' }}>
                      Or paste an external URL
                    </label>
                    <input
                      id="post-image-url"
                      value={form.image_url}
                      onChange={(e) => {
                        setForm({ ...form, image_url: e.target.value });
                        setClearMedia(false);
                      }}
                      className={INPUT_CLASS}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label htmlFor="post-content" className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--portal-modal-muted)' }}>
                  Content {contentRequired
                    ? <span style={{ color: 'var(--portal-danger-text)' }}>*</span>
                    : <span className="normal-case font-normal" style={{ color: 'var(--portal-modal-muted)' }}>(optional for memos)</span>}
                </label>
                <textarea
                  id="post-content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required={contentRequired}
                  maxLength={8000}
                  rows={5}
                  className={`${INPUT_CLASS} resize-none`}
                  placeholder={contentRequired ? 'Write your post content...' : 'Optional — add details, or leave blank for a document-only memo'}
                />
                <p className="text-right text-[11px] mt-1" style={{ color: 'var(--portal-modal-muted)' }}>
                  {form.content.length} / 8000
                </p>
              </div>

              {/* Publish toggle */}
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer select-none"
                style={{ background: 'var(--portal-soft-bg)', border: '1px solid var(--portal-soft-border)' }}
                onClick={() => setForm({ ...form, is_published: !form.is_published })}
              >
                <div
                  className="size-5 rounded flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    background: form.is_published ? '#D4AF37' : 'transparent',
                    border: form.is_published ? '2px solid #D4AF37' : '2px solid var(--portal-soft-border)',
                  }}
                >
                  {form.is_published && (
                    <svg className="size-3 text-black" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--portal-modal-title)' }}>Publish immediately</p>
                  <p className="text-[11px]" style={{ color: 'var(--portal-modal-muted)' }}>
                    {form.is_published ? 'Visible to members on save' : 'Saved as draft — not visible to members'}
                  </p>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 rounded-b-2xl"
              style={{ borderTop: '1px solid var(--portal-modal-border)' }}
            >
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-xl py-2 px-4 text-sm font-semibold motion-safe:transition-colors"
                style={{
                  background: 'var(--portal-button-muted-bg)',
                  color: 'var(--portal-button-muted-text)',
                  border: '1px solid var(--portal-button-muted-border)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="news-post-form"
                disabled={saving}
                className="gold-btn disabled:opacity-60 cursor-pointer rounded-xl py-2 px-5 text-sm font-semibold"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    Saving…
                  </span>
                ) : editing ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
