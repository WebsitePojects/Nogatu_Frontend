import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineUserAdd, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const TIN_REGEX = /^[0-9-]{9,30}$/;

function normalizeTin(value) {
  return String(value || '').trim();
}

function Spinner() {
  return <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}

function ValidationIcon({ state }) {
  if (state === true)  return <HiOutlineCheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />;
  if (state === false) return <HiOutlineXCircle    className="w-4 h-4" style={{ color: '#f87171' }} />;
  return null;
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
    tin:            '',
    position:       explicitPosition,
    placementUid:   explicitPlacementUid,
  });
  const [codeValid, setCodeValid]         = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [placementLoading, setPlacementLoading] = useState(!hasExplicitPlacement);
  const [placementMeta, setPlacementMeta] = useState(
    hasExplicitPlacement
      ? {
          note: 'Placement was selected from the genealogy tree.',
          positionLabel: explicitPosition === '2' ? 'Right' : 'Left',
          placementUsername: null,
        }
      : null
  );

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultPlacement() {
      if (hasExplicitPlacement) {
        setPlacementLoading(false);
        return;
      }

      setPlacementLoading(true);
      try {
        const res = await api.get('/registration/default-placement');
        const placement = res.data?.placement;
        if (!cancelled && placement) {
          setForm((prev) => ({
            ...prev,
            placementUid: String(placement.placementUid || ''),
            position: String(placement.position || '1'),
          }));
          setPlacementMeta(placement);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.error || 'Unable to load the recommended placement.');
        }
      } finally {
        if (!cancelled) setPlacementLoading(false);
      }
    }

    loadDefaultPlacement();
    return () => { cancelled = true; };
  }, [hasExplicitPlacement]);

  async function validateCode() {
    if (!form.activationCode) return;
    try {
      const res = await api.get(`/registration/validate-code?code=${form.activationCode}`);
      setCodeValid(res.data.valid);
      if (!res.data.valid) toast.error('Invalid or unavailable activation code');
    } catch { setCodeValid(false); }
  }

  async function validateUsername() {
    if (!form.username) return;
    try {
      const res = await api.get(`/registration/validate-username?username=${form.username}`);
      setUsernameValid(!res.data.exists);
      if (res.data.exists) toast.error('Username already taken');
    } catch { setUsernameValid(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (codeValid === false)     return toast.error('Invalid activation code');
    if (usernameValid === false)  return toast.error('Username already taken');

    const normalizedTin = normalizeTin(form.tin);
    if (!TIN_REGEX.test(normalizedTin)) {
      return toast.error('TIN must be 9-30 characters using digits and dashes only');
    }

    setSubmitting(true);
    try {
      await api.post('/registration/register', {
        ...form,
        tin: normalizedTin,
      });
      toast.success('Account registered successfully!');
      navigate(`/genealogy?id=${form.placementUid}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setSubmitting(false); }
  }

  /* Input border color based on validation state */
  const validBorder   = 'rgba(74,222,128,0.4)';
  const invalidBorder = 'rgba(248,113,113,0.4)';
  const codeBorder    = codeValid === true ? validBorder : codeValid === false ? invalidBorder : undefined;
  const userBorder    = usernameValid === true ? validBorder : usernameValid === false ? invalidBorder : undefined;

  return (
    <div className="space-y-6">
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
                onBlur={validateCode}
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
            <p className="text-sm font-semibold text-white">
              {placementMeta?.positionLabel || (form.position === '2' ? 'Right' : 'Left')} leg placement
            </p>
            <p className="text-xs mt-1 text-white/70 leading-relaxed">
              {placementMeta?.placementUsername
                ? `Placement account: ${placementMeta.placementUsername} (#${form.placementUid})`
                : `Placement account UID: ${form.placementUid || 'Loading...'}`}
            </p>
            <p className="text-xs mt-2 text-white/65 leading-relaxed">
              {placementMeta?.note || 'System auto-assigns placement on the weak leg to help generate guaranteed binary points.'}
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

          {/* TIN No */}
          <div>
            <label className="label">TIN No.</label>
            <input
              type="text"
              value={form.tin}
              onChange={(e) => handleChange('tin', e.target.value)}
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
