import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineUserAdd, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import CodeUseConfirmModal from '../../components/CodeUseConfirmModal';
import { formatTin, isValidTin } from '../../utils/tin';

function Spinner() {
  return <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}

function ValidationIcon({ state }) {
  if (state === true)  return <HiOutlineCheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />;
  if (state === false) return <HiOutlineXCircle    className="w-4 h-4" style={{ color: '#f87171' }} />;
  return null;
}

function PlacementPolicyModal({ open, placementMeta, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
      <div className="glass-card rounded-2xl w-full max-w-lg p-6 border border-brand-gold/25">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">Binary Structure Updated</p>
        <h2 className="mt-2 text-xl font-display font-bold text-white">Your first direct recruit follows the company safetynet</h2>
        <p className="mt-3 text-sm text-white/70 leading-relaxed">
          When a sponsor is still placing a first direct recruit, the system follows the sponsor&apos;s inherited side in the binary tree. That means this registration was automatically routed to the{' '}
          <span className="font-semibold text-white">{placementMeta?.positionLabel || 'Left'}</span> leg.
        </p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70 leading-relaxed space-y-2">
          <p>Illustration:</p>
          <p>If your sponsor was placed on the left, your first invite goes left too.</p>
          <p>If your sponsor was placed on the right, your first invite goes right.</p>
          <p>If you are a root account, your first invite starts on the left.</p>
          <p>After that first invite is done, left and right become selectable again.</p>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="gold-btn px-5 py-2.5 rounded-xl text-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Registration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const explicitPlacementUid = searchParams.get('placement') || '';
  const explicitPosition = searchParams.get('position') || '1';
  const hasExplicitPlacement = Boolean(explicitPlacementUid);

  const [form, setForm] = useState({
    activationCode: '',
    username:       '',
    password:       '',
    firstname:      '',
    lastname:       '',
    middlename:     '',
    email:          '',
    address:        '',
    tin:            '',
    contactno:      '',
    dob:            '',
    position:       explicitPosition,
    placementUid:   explicitPlacementUid,
  });
  const [codeValid, setCodeValid]         = useState(null);
  const [codePreview, setCodePreview]     = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [placementLoading, setPlacementLoading] = useState(true);
  const [placementMeta, setPlacementMeta] = useState(null);
  const [showPlacementPolicyModal, setShowPlacementPolicyModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultPlacement() {
      setPlacementLoading(true);
      try {
        const res = await api.get('/registration/default-placement');
        const placement = res.data?.placement;
        if (!cancelled && placement) {
          const forcedMode = placement?.placementPolicy?.mode === 'forced';
          const explicitConflict = hasExplicitPlacement && (
            String(explicitPlacementUid) !== String(placement.placementUid || '') ||
            String(explicitPosition) !== String(placement.position || '1')
          );

          setForm((prev) => ({
            ...prev,
            placementUid: forcedMode
              ? String(placement.placementUid || '')
              : (hasExplicitPlacement ? explicitPlacementUid : String(placement.placementUid || '')),
            position: forcedMode
              ? String(placement.position || '1')
              : (hasExplicitPlacement ? explicitPosition : String(placement.position || '1')),
          }));

          setPlacementMeta(
            forcedMode
              ? placement
              : hasExplicitPlacement
                ? {
                    ...placement,
                    placementUid: explicitPlacementUid,
                    position: explicitPosition,
                    positionLabel: explicitPosition === '2' ? 'Right' : 'Left',
                    note: 'Placement was selected from the genealogy tree. The backend will still validate this slot before saving.',
                  }
                : placement
          );

          if (forcedMode && explicitConflict) {
            setShowPlacementPolicyModal(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.error || 'Unable to load the placement policy.');
        }
      } finally {
        if (!cancelled) setPlacementLoading(false);
      }
    }

    loadDefaultPlacement();
    return () => { cancelled = true; };
  }, [hasExplicitPlacement]);

  async function validateCode(showFeedback = true) {
    if (!form.activationCode) return null;
    try {
      const res = await api.get(`/registration/validate-code?code=${form.activationCode}`);
      setCodePreview(res.data);
      setCodeValid(Boolean(res.data.valid && res.data.canRegister));
      if (showFeedback && (!res.data.valid || !res.data.canRegister)) {
        setConfirmModal({
          tone: 'red',
          title: 'This code cannot be used for registration',
          message: res.data.reason || 'Only available package entry codes can be used for registration.',
          confirmLabel: 'Close',
          onConfirm: () => setConfirmModal(null),
          details: res.data.code
            ? [
                { label: 'Code', value: res.data.code },
                { label: 'Detected type', value: res.data.accountLabel || 'Unknown' },
              ]
            : [],
        });
      }
      return res.data;
    } catch {
      setCodeValid(false);
      return null;
    }
  }

  async function validateUsername() {
    if (!form.username) return;
    try {
      const res = await api.get(`/registration/validate-username?username=${form.username}`);
      setUsernameValid(!res.data.exists);
      if (res.data.exists) toast.error('Username already taken');
    } catch { setUsernameValid(false); }
  }

  async function submitRegistration() {
    setSubmitting(true);
    try {
      await api.post('/registration/register', {
        ...form,
        tin: formatTin(form.tin),
      });
      toast.success('Account registered successfully!');
      setConfirmModal(null);
      navigate(`/genealogy?id=${form.placementUid}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setSubmitting(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let preview = codePreview;
    if (!preview || String(preview.code || '').toLowerCase() !== String(form.activationCode || '').trim().toLowerCase()) {
      preview = await validateCode(false);
    }

    if (!preview?.valid || !preview?.canRegister || codeValid === false) {
      setConfirmModal({
        tone: 'red',
        title: 'Registration code is not ready to use',
        message: preview?.reason || 'Please use a valid package entry code before continuing with registration.',
        confirmLabel: 'Close',
        onConfirm: () => setConfirmModal(null),
        details: preview?.code
          ? [
              { label: 'Code', value: preview.code },
              { label: 'Detected type', value: preview.accountLabel || 'Unknown' },
            ]
          : [],
      });
      return;
    }
    if (usernameValid === false)  return toast.error('Username already taken');

    const normalizedTin = formatTin(form.tin);
    if (!isValidTin(normalizedTin)) {
      return toast.error('TIN must contain 9-15 digits');
    }

    setConfirmModal({
      tone: 'gold',
      title: 'Consume this code and register the account?',
      message: 'This activation code will be consumed immediately after confirmation and cannot be reused.',
      confirmLabel: 'Register Account',
      onConfirm: submitRegistration,
      details: [
        { label: 'Code', value: preview.code || form.activationCode },
        { label: 'Account type', value: preview.accountLabel || 'Package entry code' },
        { label: 'Placement', value: `${placementMeta?.positionLabel || (form.position === '2' ? 'Right' : 'Left')} leg / UID ${form.placementUid}` },
      ],
    });
  }

  /* Input border color based on validation state */
  const validBorder   = 'rgba(74,222,128,0.4)';
  const invalidBorder = 'rgba(248,113,113,0.4)';
  const codeBorder    = codeValid === true ? validBorder : codeValid === false ? invalidBorder : undefined;
  const userBorder    = usernameValid === true ? validBorder : usernameValid === false ? invalidBorder : undefined;
  const placementPolicyMode = placementMeta?.placementPolicy?.mode || 'manual';
  const placementPolicyMessage = placementMeta?.placementPolicy?.message || placementMeta?.note;

  return (
    <div className="space-y-6">
      <CodeUseConfirmModal
        open={Boolean(confirmModal)}
        tone={confirmModal?.tone || 'gold'}
        title={confirmModal?.title}
        message={confirmModal?.message}
        details={confirmModal?.details || []}
        confirmLabel={confirmModal?.confirmLabel || 'Confirm'}
        onConfirm={confirmModal?.onConfirm}
        onClose={() => setConfirmModal(null)}
        busy={submitting}
      />

      <PlacementPolicyModal
        open={showPlacementPolicyModal}
        placementMeta={placementMeta}
        onClose={() => setShowPlacementPolicyModal(false)}
      />

      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Register New Account</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-7 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Activation Code */}
          <div>
            <label className="label">Activation Code</label>
            <div className="relative">
              <input
                type="text"
                value={form.activationCode}
                onChange={(e) => handleChange('activationCode', e.target.value)}
                onBlur={() => validateCode(true)}
                className="glass-input pr-9"
                placeholder="Enter activation code"
                required
                style={codeBorder ? { borderColor: codeBorder } : {}}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <ValidationIcon state={codeValid} />
              </span>
            </div>
          </div>

          {/* Sponsor (read-only) */}
          <div>
            <label className="label">Sponsor</label>
            <input type="text" value={user?.username || ''} className="glass-input opacity-50 cursor-not-allowed" disabled />
          </div>

          {/* Placement UID */}
          <div>
            <label className="label">Placement UID</label>
            <input
              type="text"
              value={form.placementUid}
              readOnly
              className="glass-input opacity-70"
              placeholder={placementLoading ? 'Loading placement...' : 'Placement account UID'}
              required
            />
          </div>

          {/* Position */}
          <div>
            <label className="label">Position</label>
            <input
              type="text"
              value={form.position === '2' ? 'Right (Position B)' : 'Left (Position A)'}
              readOnly
              className="glass-input opacity-70"
              placeholder="Assigned position"
            />
          </div>

          <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">
                {placementPolicyMode === 'forced' ? 'Forced First Invite Placement' : 'Placement Summary'}
              </p>
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-brand-gold">
                {placementPolicyMode === 'forced' ? 'Safetynet Active' : 'Manual Placement'}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-3">
              {placementMeta?.positionLabel || (form.position === '2' ? 'Right' : 'Left')} leg placement
            </p>
            <p className="text-xs mt-1 text-white/70 leading-relaxed">
              {placementMeta?.placementUsername
                ? `Placement account: ${placementMeta.placementUsername} (#${form.placementUid})`
                : `Placement account UID: ${form.placementUid || 'Loading...'}`}
            </p>
            <p className="text-xs mt-2 text-white/65 leading-relaxed">
              {placementPolicyMessage || 'The system will validate the live placement policy before saving this registration.'}
            </p>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" value={form.firstname} onChange={(e) => handleChange('firstname', e.target.value)} className="glass-input" required />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" value={form.lastname} onChange={(e) => handleChange('lastname', e.target.value)} className="glass-input" required />
            </div>
            <div>
              <label className="label">Middle Name</label>
              <input type="text" value={form.middlename} onChange={(e) => handleChange('middlename', e.target.value)} className="glass-input" />
            </div>
            {codePreview?.accountLabel && codeValid === true && (
              <p className="mt-2 text-xs text-white/55">
                This code will consume: <span className="font-semibold text-brand-gold">{codePreview.accountLabel}</span>
              </p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="glass-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="glass-input"
              placeholder="Complete address"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Number</label>
              <input
                type="text"
                value={form.contactno}
                onChange={(e) => handleChange('contactno', e.target.value)}
                className="glass-input"
                placeholder="09XXXXXXXXX"
                required
              />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                className="glass-input"
                required
              />
            </div>
          </div>

          {/* TIN No */}
          <div>
            <label className="label">TIN No.</label>
            <input
              type="text"
              value={form.tin}
              onChange={(e) => handleChange('tin', formatTin(e.target.value))}
              className="glass-input"
              placeholder="e.g. 123-456-789-000"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="label">Username</label>
            <div className="relative">
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onBlur={validateUsername}
                className="glass-input pr-9"
                required
                style={userBorder ? { borderColor: userBorder } : {}}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <ValidationIcon state={usernameValid} />
              </span>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || placementLoading || !form.placementUid}
              className="gold-btn w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {submitting ? <><Spinner /> Registering…</> : <><HiOutlineUserAdd className="w-4 h-4" /> Register Account</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
