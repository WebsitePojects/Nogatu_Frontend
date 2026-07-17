import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { postIdempotent } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineUserAdd, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import CodeUseConfirmModal from '../../components/CodeUseConfirmModal';
import DobPicker from '../../components/DobPicker';
import { formatTin, isValidTin, isZeroTin } from '../../utils/tin';

function Spinner() {
  return <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}

function ValidationIcon({ state }) {
  if (state === true)  return <HiOutlineCheckCircle className="size-4" style={{ color: '#4ade80' }} />;
  if (state === false) return <HiOutlineXCircle    className="size-4" style={{ color: '#f87171' }} />;
  return null;
}

function RequiredMark() {
  return <span className="portal-required">*</span>;
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
  const explicitPlacementUser = searchParams.get('placementUser') || '';
  const explicitPlacementLabel = searchParams.get('placementLabel') || '';
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
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [availableCodes, setAvailableCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(true);

  const requiredFields = [
    ['activationCode', 'Activation Code'],
    ['firstname', 'First Name'],
    ['lastname', 'Last Name'],
    ['email', 'Email'],
    ['address', 'Address'],
    ['contactno', 'Contact Number'],
    ['dob', 'Date of Birth'],
    ['username', 'Username'],
    ['password', 'Password'],
  ];

  const NAME_FIELDS = new Set(['firstname', 'lastname', 'middlename']);

  const handleChange = (field, rawValue) => {
    const value = NAME_FIELDS.has(field)
      ? rawValue.replace(/[0-9]/g, '')
      : rawValue;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'activationCode') {
      setCodeValid(null);
      setCodePreview(null);
    }
  };

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
                    placementUsername: explicitPlacementUser || placement.placementUsername || null,
                    placementLabel: explicitPlacementLabel || `${explicitPosition === '2' ? 'Right Leg' : 'Left Leg'} of ${explicitPlacementUser || `UID ${explicitPlacementUid}`}`,
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

  useEffect(() => {
    let cancelled = false;

    async function loadAvailableCodes() {
      setCodesLoading(true);
      try {
        const res = await api.get('/registration/available-codes');
        if (!cancelled) {
          setAvailableCodes(Array.isArray(res.data?.codes) ? res.data.codes : []);
        }
      } catch (err) {
        if (!cancelled) {
          setAvailableCodes([]);
          toast.error(err.response?.data?.error || 'Unable to load activation codes.');
        }
      } finally {
        if (!cancelled) setCodesLoading(false);
      }
    }

    loadAvailableCodes();
    return () => { cancelled = true; };
  }, []);

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
      if (res.data.exists) {
        setConfirmModal({
          tone: 'red',
          title: 'Username already exists',
          message: 'Please choose another username before continuing with registration.',
          confirmLabel: 'Close',
          showCancel: false,
          onConfirm: () => setConfirmModal(null),
        });
      }
    } catch { setUsernameValid(false); }
  }

  async function submitRegistration() {
    setSubmitting(true);
    try {
      await postIdempotent('/registration/register', {
        ...form,
        tin: formatTin(form.tin),
      });
      setFeedbackModal({
        tone: 'gold',
        title: 'Account registered successfully',
        message: 'The new member account is now saved. You may continue back to the genealogy tree.',
        confirmLabel: 'Go to Genealogy',
        onConfirm: () => {
          setFeedbackModal(null);
          navigate(`/genealogy?id=${form.placementUid}`);
        },
      });
    } catch (err) {
      setFeedbackModal({
        tone: 'red',
        title: err.response?.data?.errorCode === 'USERNAME_TAKEN'
          ? 'Username already exists'
          : 'Registration failed',
        message: err.response?.data?.error || 'Registration failed',
        confirmLabel: 'Close',
        onConfirm: () => setFeedbackModal(null),
      });
    } finally { setSubmitting(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = requiredFields.reduce((errors, [field, label]) => {
      if (!String(form[field] || '').trim()) {
        errors[field] = `${label} is required.`;
      }
      return errors;
    }, {});

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setConfirmModal({
        tone: 'red',
        title: 'Required fields are missing',
        message: 'Please complete all required fields before continuing.',
        confirmLabel: 'Close',
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    setFieldErrors({});

    // Phone: accept 10–11 digits (Philippine mobile 09XXXXXXXXX or 10-digit)
    const phoneDigits = String(form.contactno || '').replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setConfirmModal({
        tone: 'red',
        title: 'Invalid contact number',
        message: 'Contact number must be 10–11 digits (e.g. 09XXXXXXXXX).',
        confirmLabel: 'Close',
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    // DOB: must be in the past (no future dates)
    if (form.dob) {
      const dob = new Date(form.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxAge = new Date(today);
      maxAge.setFullYear(maxAge.getFullYear() - 120);
      if (dob >= today) {
        setConfirmModal({ tone: 'red', title: 'Invalid date of birth', message: 'Date of birth must be in the past.', confirmLabel: 'Close', onConfirm: () => setConfirmModal(null) });
        return;
      }
      if (dob < maxAge) {
        setConfirmModal({ tone: 'red', title: 'Invalid date of birth', message: 'Please enter a valid date of birth.', confirmLabel: 'Close', onConfirm: () => setConfirmModal(null) });
        return;
      }
    }

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
    if (usernameValid === false) {
      setConfirmModal({
        tone: 'red',
        title: 'Username already exists',
        message: 'Please choose another username before continuing with registration.',
        confirmLabel: 'Close',
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    const normalizedTin = formatTin(form.tin);
    if (normalizedTin && !isZeroTin(normalizedTin) && !isValidTin(normalizedTin)) {
      setConfirmModal({
        tone: 'red',
        title: 'Invalid TIN',
        message: 'TIN must be 9–12 digits (e.g. 123-456-789-000). Use 000-000-000-000 if you do not have a TIN.',
        confirmLabel: 'Close',
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }

    setConfirmModal({
      tone: 'gold',
      title: 'Consume this code and register the account?',
      message: 'This activation code will be consumed immediately after confirmation and cannot be reused.',
      confirmLabel: 'Register Account',
      onConfirm: async () => {
        setConfirmModal(null);
        await submitRegistration();
      },
      details: [
        { label: 'Code', value: preview.code || form.activationCode },
        { label: 'Account type', value: preview.accountLabel || 'Package entry code' },
        {
          label: 'Placement',
          value: explicitPlacementLabel
            ? `Your ${placementMeta?.positionLabel || (form.position === '2' ? 'Right' : 'Left')} Leg / ${explicitPlacementLabel}`
            : `${placementMeta?.positionLabel || (form.position === '2' ? 'Right' : 'Left')} Leg / ${placementMeta?.placementUsername || `UID ${form.placementUid}`}`,
        },
      ],
    });
  }

  /* Input border color based on validation state */
  const validBorder   = 'rgba(74,222,128,0.4)';
  const invalidBorder = 'rgba(248,113,113,0.4)';
  const codeBorder    = codeValid === true ? validBorder : codeValid === false ? invalidBorder : undefined;
  const userBorder    = usernameValid === true ? validBorder : usernameValid === false ? invalidBorder : undefined;
  const placementPolicyMode = placementMeta?.placementPolicy?.mode || 'manual';
  const inputClassName = (field, extra = '') => `glass-input ${fieldErrors[field] ? 'portal-input-error' : ''} ${extra}`.trim();
  const activationOptions = form.activationCode && !availableCodes.some((item) => String(item.code || '').toLowerCase() === String(form.activationCode || '').trim().toLowerCase())
    ? [
        {
          id: 'legacy-selected',
          code: form.activationCode,
          dropdownLabel: codePreview?.dropdownLabel || 'Existing valid code',
        },
        ...availableCodes,
      ]
    : availableCodes;

  return (
    <div className="space-y-6">
      <CodeUseConfirmModal
        open={Boolean(confirmModal)}
        tone={confirmModal?.tone || 'gold'}
        title={confirmModal?.title}
        message={confirmModal?.message}
        details={confirmModal?.details || []}
        confirmLabel={confirmModal?.confirmLabel || 'Confirm'}
        showCancel={confirmModal?.showCancel !== false}
        onConfirm={confirmModal?.onConfirm}
        onClose={() => setConfirmModal(null)}
        busy={submitting}
      />

      <CodeUseConfirmModal
        open={Boolean(feedbackModal)}
        tone={feedbackModal?.tone || 'gold'}
        title={feedbackModal?.title}
        message={feedbackModal?.message}
        details={feedbackModal?.details || []}
        confirmLabel={feedbackModal?.confirmLabel || 'Close'}
        showCancel={false}
        onConfirm={feedbackModal?.onConfirm || (() => setFeedbackModal(null))}
        onClose={() => setFeedbackModal(null)}
      />

      <PlacementPolicyModal
        open={showPlacementPolicyModal}
        placementMeta={placementMeta}
        onClose={() => setShowPlacementPolicyModal(false)}
      />

      {/* Heading */}
      <div>
        <h1 className="portal-page-title font-display text-2xl font-bold">Register New Account</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="portal-field-hint">Fields marked with an asterisk are required. If you do not have a TIN yet, you may type `000-000-000-000` or leave it blank for now.</p>
      </div>

      <div className="glass-card rounded-2xl p-7 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Activation Code */}
          <div>
            <label className="label">Activation Code <RequiredMark /></label>
            <div className="relative">
              <select
                value={form.activationCode}
                onChange={(e) => handleChange('activationCode', e.target.value)}
                onBlur={() => validateCode(true)}
                className={inputClassName('activationCode', 'pr-9 appearance-none')}
                aria-invalid={fieldErrors.activationCode ? 'true' : 'false'}
                required
                style={codeBorder ? { borderColor: codeBorder } : {}}
                disabled={codesLoading}
              >
                <option value="">
                  {codesLoading ? 'Loading available activation codes...' : 'Select an activation code'}
                </option>
                {activationOptions.map((item) => (
                  <option key={item.id || item.code} value={item.code}>
                    {`${item.code} - ${item.dropdownLabel || item.accountLabel || 'Available code'}`}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <ValidationIcon state={codeValid} />
              </span>
            </div>
            {fieldErrors.activationCode ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.activationCode}</p> : null}
            {!codesLoading && activationOptions.length === 0 ? (
              <p className="portal-field-hint">No released registration codes are currently available in your inventory.</p>
            ) : null}
          </div>

          {/* Sponsor (read-only) — show full name + username so the encoder confirms the account */}
          <div>
            <label className="label">Sponsor</label>
            <input
              type="text"
              value={user?.accountname ? `${user.accountname} (${user?.username || ''})` : (user?.username || '')}
              className="glass-input opacity-50 cursor-not-allowed"
              disabled
            />
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
                ? `Placement account: ${placementMeta.placementUsername}`
                : `Placement account UID: ${form.placementUid || 'Loading...'}`}
            </p>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">First Name <RequiredMark /></label>
              <input type="text" value={form.firstname} onChange={(e) => handleChange('firstname', e.target.value)} className={inputClassName('firstname')} aria-invalid={fieldErrors.firstname ? 'true' : 'false'} required />
              {fieldErrors.firstname ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.firstname}</p> : null}
            </div>
            <div>
              <label className="label">Last Name <RequiredMark /></label>
              <input type="text" value={form.lastname} onChange={(e) => handleChange('lastname', e.target.value)} className={inputClassName('lastname')} aria-invalid={fieldErrors.lastname ? 'true' : 'false'} required />
              {fieldErrors.lastname ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.lastname}</p> : null}
            </div>
            <div>
              <label className="label">Middle Name</label>
              <input type="text" value={form.middlename} onChange={(e) => handleChange('middlename', e.target.value)} className={inputClassName('middlename')} aria-invalid={fieldErrors.middlename ? 'true' : 'false'} />
              {fieldErrors.middlename ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.middlename}</p> : null}
            </div>
            {codePreview?.accountLabel && codeValid === true && (
              <p className="mt-2 text-xs portal-card-muted">
                This code will consume: <span className="font-semibold text-brand-gold">{codePreview.accountLabel}</span>
              </p>
            )}
          </div>

          <div>
            <label className="label">Email <RequiredMark /></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={inputClassName('email')}
              placeholder="you@example.com"
              aria-invalid={fieldErrors.email ? 'true' : 'false'}
              required
            />
            {fieldErrors.email ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.email}</p> : null}
          </div>

          <div>
            <label className="label">Address <RequiredMark /></label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={inputClassName('address')}
              placeholder="Complete address"
              aria-invalid={fieldErrors.address ? 'true' : 'false'}
              required
            />
            {fieldErrors.address ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.address}</p> : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Number <RequiredMark /></label>
              <input
                type="text"
                value={form.contactno}
                onChange={(e) => handleChange('contactno', e.target.value)}
                className={inputClassName('contactno')}
                placeholder="09XXXXXXXXX"
                aria-invalid={fieldErrors.contactno ? 'true' : 'false'}
                required
              />
              {fieldErrors.contactno ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.contactno}</p> : null}
            </div>
            <div>
              <label className="label">Date of Birth <RequiredMark /></label>
              <DobPicker
                value={form.dob}
                onChange={(v) => handleChange('dob', v)}
                selectClassName={inputClassName('dob')}
                id="reg-dob"
                required
              />
              <p className="portal-field-hint" style={{ color: 'var(--portal-card-muted)' }}>Pick the month, day, and year — type to jump (e.g. type "19" in Year).</p>
              {fieldErrors.dob ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.dob}</p> : null}
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
            />
            <p className="portal-field-hint">Optional. If you do not have a TIN yet, type `000-000-000-000`.</p>
          </div>

          {/* Username */}
          <div>
            <label className="label">Username <RequiredMark /></label>
            <div className="relative">
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onBlur={validateUsername}
                className={inputClassName('username', 'pr-9')}
                aria-invalid={fieldErrors.username ? 'true' : 'false'}
                required
                style={userBorder ? { borderColor: userBorder } : {}}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <ValidationIcon state={usernameValid} />
              </span>
            </div>
            {fieldErrors.username ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.username}</p> : null}
          </div>

          {/* Password */}
          <div>
            <label className="label">Password <RequiredMark /></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={inputClassName('password', 'pr-11')}
                aria-invalid={fieldErrors.password ? 'true' : 'false'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 portal-card-muted transition-colors hover:text-[var(--portal-title)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiOutlineEyeOff className="size-5" /> : <HiOutlineEye className="size-5" />}
              </button>
            </div>
            {fieldErrors.password ? <p className="portal-field-hint" style={{ color: 'var(--portal-danger-text)' }}>{fieldErrors.password}</p> : null}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || placementLoading || !form.placementUid}
              className="gold-btn w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {submitting ? <><Spinner /> Registering…</> : <><HiOutlineUserAdd className="size-4" /> Register Account</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
