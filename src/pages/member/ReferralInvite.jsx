import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ReferralInvite() {
  const [invite, setInvite] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const inviteToken = invite?.slug || invite?.referral_slug || invite?.token;
  const inviteUrl = inviteToken ? `${window.location.origin}/join/${inviteToken}` : '';
  const placementMode = invite?.placement?.placementPolicy?.mode || invite?.placementMode || 'manual';

  useEffect(() => {
    loadInvite();
    loadCodes();
  }, []);

  async function loadInvite() {
    setLoading(true);
    try {
      const res = await api.get('/registration/referral-link');
      setInvite(res.data);
    } catch {
      try {
        const res = await api.get('/registration/referral-invite');
        setInvite(res.data.invite);
      } catch {
        setInvite(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function regenerateInvite() {
    setCreating(true);
    try {
      const res = await api.get('/registration/referral-link');
      setInvite(res.data);
      toast.success('Referral setup refreshed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to refresh referral setup');
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success('Referral link copied');
  }

  async function loadCodes() {
    try {
      const res = await api.get('/registration/available-codes');
      setCodes(Array.isArray(res.data?.codes) ? res.data.codes : []);
    } catch {
      setCodes([]);
    }
  }

  async function copyCode(code) {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success('Activation code copied');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Referral ID</h1>
        <p className="text-sm text-white/45 mt-1">Generate a self-registration link so your prospect can create their own account under your sponsorship.</p>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6 max-w-3xl">
        {loading ? (
          <div className="py-8 text-white/50">Loading referral invite...</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-gold mb-2">Current Referral Link</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={inviteUrl || 'No active referral link yet'} readOnly className="glass-input flex-1" />
                <button onClick={copyLink} disabled={!inviteUrl} className="gold-btn px-5 py-2.5 rounded-xl text-sm disabled:opacity-50" type="button">
                  Copy
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-5">
              <p className="text-sm text-white/70 leading-relaxed">
                Share this link with your prospect. They still need a valid activation code, and the server will validate the live placement policy before saving the account.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Available Activation Codes</p>
                <span className="text-xs text-white/45">{codes.length} available</span>
              </div>
              {codes.length === 0 ? (
                <p className="text-sm text-white/45">No released registration codes are available in your inventory right now.</p>
              ) : (
                <div className="space-y-3">
                  {codes.map((item) => (
                    <div key={item.code} className="rounded-xl border border-white/10 bg-black/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white break-all">{item.code}</p>
                        <p className="text-xs text-white/55 mt-1">{item.dropdownLabel || item.accountLabel || 'Available code'}</p>
                      </div>
                      <button onClick={() => copyCode(item.code)} className="gold-btn px-4 py-2 rounded-xl text-sm self-start sm:self-auto" type="button">
                        Copy Code
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={regenerateInvite} disabled={creating} className="gold-btn w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm disabled:opacity-60" type="button">
              {creating ? 'Refreshing...' : placementMode === 'forced' ? 'Refresh Placement Policy' : 'Refresh Placement Guidance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
