import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck, HiOutlineExclamation,
  HiOutlineUserAdd, HiOutlineRefresh,
} from 'react-icons/hi';

const INPUT_CLASS =
  'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] text-[color:var(--portal-modal-title)] placeholder:text-[color:var(--portal-modal-muted)] focus:border-[rgba(212,175,55,0.5)]';

const EMPTY = { username: '', name: '', role: 'administrator', password: '' };

// Role → badge palette. readonly is intentionally cool/neutral so it reads as "no writes".
const ROLE_BADGE = {
  administrator: { label: 'Administrator', color: '#D4AF37', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' },
  bod:           { label: 'BOD',           color: '#a5b4fc', background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.28)' },
  cashier:       { label: 'Cashier',       color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' },
  readonly:      { label: 'Read Only',     color: '#94a3b8', background: 'rgba(148,163,184,0.14)', border: '1px solid rgba(148,163,184,0.3)' },
};

const ROLE_HINTS = {
  administrator: 'Full back-office access.',
  bod:           'Full access (Board of Directors).',
  cashier:       'Voucher transactions only. No admin pages.',
  readonly:      'Can view every page but cannot make any changes.',
};

function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="size-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function RoleBadge({ role }) {
  const def = ROLE_BADGE[role] || ROLE_BADGE.administrator;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ color: def.color, background: def.background, border: def.border }}>
      {def.label}
    </span>
  );
}

export default function AccessAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);      // account being edited, or null for create
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // account pending deletion
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await api.get('/admin/access-accounts');
      setAccounts(res.data.accounts || []);
      setRoles(res.data.roles || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load access accounts');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowPassword(false);
    setShowModal(true);
  }

  function openEdit(account) {
    setEditing(account);
    setForm({ username: account.username, name: account.name, role: account.role, password: '' });
    setShowPassword(false);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    const username = form.username.trim();
    const name = form.name.trim();
    const password = form.password;

    if (!editing && (username.length < 3 || username.length > 15)) {
      toast.error('Username must be 3–15 letters/numbers.');
      return;
    }
    if (!name) {
      toast.error('Name is required.');
      return;
    }
    if (!editing && password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (editing && password && password.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const payload = { name, role: form.role };
        if (password) payload.password = password;
        await api.put(`/admin/access-accounts/${editing.id}`, payload);
        toast.success('Account updated');
      } else {
        await api.post('/admin/access-accounts', { username, name, role: form.role, password });
        toast.success('Account created');
      }
      setShowModal(false);
      setEditing(null);
      await loadAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/access-accounts/${confirmDelete.id}`);
      toast.success('Account removed');
      setConfirmDelete(null);
      await loadAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Access Accounts</h1>
          <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Create and manage back-office logins (Administrator, BOD, Cashier, Read Only).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAccounts}
            type="button"
            className="text-xs px-3 py-2 rounded-lg inline-flex items-center gap-1.5"
            style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <HiOutlineRefresh className="size-4" /> Refresh
          </button>
          <button
            onClick={openCreate}
            type="button"
            className="text-sm px-4 py-2 rounded-lg inline-flex items-center gap-2 font-semibold text-always-white"
            style={{ background: 'linear-gradient(135deg,#7f1d1d,#991b1b)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            <HiOutlinePlus className="size-4" /> Add Account
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <HiOutlineShieldCheck className="size-5" style={{ color: '#D4AF37' }} />
          </div>
          <div className="text-sm leading-6" style={{ color: 'rgba(255,255,255,0.72)' }}>
            New <span className="font-semibold text-white">Administrator</span> and <span className="font-semibold text-white">BOD</span> accounts get the same full access you have.
            A <span className="font-semibold text-white">Cashier</span> only sees voucher transactions, and never this page.
            A <span className="font-semibold text-white">Read Only</span> account can open every page but cannot make changes.
          </div>
        </div>
      </div>

      {/* Accounts table */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <Spinner />
        ) : accounts.length === 0 ? (
          <div className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <HiOutlineUserAdd className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.45)' }} />
            No access accounts yet.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Username', 'Name', 'Role', 'Access', 'Actions'].map((h) => (
                      <th key={h} className="table-header py-2.5 px-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-t" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
                      <td className="py-2.5 px-2 text-white/85 font-mono text-xs">
                        {a.username}
                        {a.isSelf && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: '#34d399', background: 'rgba(16,185,129,0.12)' }}>you</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-white/75">{a.name}</td>
                      <td className="py-2.5 px-2"><RoleBadge role={a.role} /></td>
                      <td className="py-2.5 px-2 text-white/50 text-xs">{ROLE_HINTS[a.role]}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(a)}
                            type="button"
                            aria-label={`Edit ${a.username}`}
                            className="size-8 rounded-lg inline-flex items-center justify-center"
                            style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                          >
                            <HiOutlinePencil className="size-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(a)}
                            type="button"
                            disabled={a.isSelf}
                            aria-label={`Delete ${a.username}`}
                            title={a.isSelf ? 'You cannot delete your own account' : 'Delete account'}
                            className="size-8 rounded-lg inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)' }}
                          >
                            <HiOutlineTrash className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {accounts.map((a) => (
                <div key={a.id} className="rounded-xl p-4" style={{ border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{a.name}</p>
                      <p className="text-white/55 font-mono text-xs mt-0.5">
                        {a.username}{a.isSelf && <span className="ml-1.5" style={{ color: '#34d399' }}>(you)</span>}
                      </p>
                    </div>
                    <RoleBadge role={a.role} />
                  </div>
                  <p className="text-white/45 text-xs mt-2">{ROLE_HINTS[a.role]}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => openEdit(a)}
                      type="button"
                      className="flex-1 text-xs px-3 py-2 rounded-lg inline-flex items-center justify-center gap-1.5"
                      style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                    >
                      <HiOutlinePencil className="size-4" /> Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(a)}
                      type="button"
                      disabled={a.isSelf}
                      className="flex-1 text-xs px-3 py-2 rounded-lg inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                      style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)' }}
                    >
                      <HiOutlineTrash className="size-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={closeModal}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-5"
            style={{ background: 'var(--portal-modal-bg, rgba(18,16,12,0.98))', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 18px 38px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--portal-modal-title,#f8fafc)' }}>
                {editing ? 'Edit Access Account' : 'New Access Account'}
              </h3>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close dialog"
                className="size-8 rounded-lg inline-flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', color: '#e8d9a8' }}>
                <HiOutlineX className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="aa-username" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--portal-modal-muted,#cbb87a)' }}>
                  Username <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  id="aa-username"
                  type="text"
                  className={INPUT_CLASS}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. mariacashier"
                  maxLength={15}
                  autoComplete="off"
                  disabled={Boolean(editing)}
                  readOnly={Boolean(editing)}
                  required={!editing}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--portal-modal-muted,#9ca3af)' }}>
                  {editing ? 'Username cannot be changed.' : '3–15 letters/numbers, no spaces or symbols.'}
                </p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="aa-name" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--portal-modal-muted,#cbb87a)' }}>
                  Display Name <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  id="aa-name"
                  type="text"
                  className={INPUT_CLASS}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Maria - Cashier"
                  maxLength={40}
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="aa-role" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--portal-modal-muted,#cbb87a)' }}>
                  Role <span style={{ color: '#f87171' }}>*</span>
                </label>
                <select
                  id="aa-role"
                  className={INPUT_CLASS}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {(roles.length ? roles : Object.entries(ROLE_BADGE).map(([value, d]) => ({ value, label: d.label }))).map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--portal-modal-muted,#9ca3af)' }}>{ROLE_HINTS[form.role]}</p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="aa-password" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--portal-modal-muted,#cbb87a)' }}>
                  Password {editing ? <span className="font-normal">(leave blank to keep current)</span> : <span style={{ color: '#f87171' }}>*</span>}
                </label>
                <div className="relative">
                  <input
                    id="aa-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${INPUT_CLASS} pr-11`}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={editing ? '••••••••' : 'At least 6 characters'}
                    autoComplete="new-password"
                    required={!editing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-lg inline-flex items-center justify-center"
                    style={{ color: '#cbb87a' }}
                  >
                    {showPassword ? <HiOutlineEyeOff className="size-5" /> : <HiOutlineEye className="size-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={saving}
                className="px-3.5 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(212,175,55,0.1)', color: '#e2e8f0', border: '1px solid rgba(212,175,55,0.22)', opacity: saving ? 0.7 : 1 }}>
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-always-white"
                style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: '1px solid rgba(22,163,74,0.5)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--portal-modal-bg, rgba(18,16,12,0.98))', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 18px 38px rgba(0,0,0,0.6)' }}>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <HiOutlineExclamation className="size-5" style={{ color: '#f87171' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--portal-modal-title,#f8fafc)' }}>Delete this account?</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--portal-modal-muted,#cbd5e1)' }}>
                  <span className="font-semibold text-white">{confirmDelete.name}</span> ({confirmDelete.username}) will no longer be able to sign in. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} disabled={deleting}
                className="px-3.5 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(212,175,55,0.1)', color: '#e2e8f0', border: '1px solid rgba(212,175,55,0.22)', opacity: deleting ? 0.7 : 1 }}>
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-always-white"
                style={{ background: 'linear-gradient(135deg,#b91c1c,#ef4444)', border: '1px solid rgba(239,68,68,0.5)', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
