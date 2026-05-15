import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ReferralInvite() {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const inviteToken = invite?.slug || invite?.referral_slug || invite?.token;
  const placement = invite?.placement || null;
  const inviteUrl = inviteToken ? `${window.location.origin}/join/${inviteToken}` : '';

  useEffect(() => {
    loadInvite();
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
                <button onClick={copyLink} disabled={!inviteUrl} className="gold-btn px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                  Copy
                </button>
              </div>
              {invite && (
                <p className="text-xs text-white/45 mt-3">
                  {invite.slug ? `Reusable sponsor slug: ${invite.slug}` : `Placement UID: ${invite.placement_uid} | Position: ${Number(invite.position) === 1 ? 'Left' : 'Right'}`}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-5">
              <p className="text-sm text-white/70 leading-relaxed">
                Prospects still need a valid activation code. The reusable referral link supplies your sponsor identity, and the server auto-assigns the new account to your weak leg for the best chance to generate binary points.
              </p>
              {placement && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/70 space-y-1">
                  <p className="font-semibold text-white">Current recommended placement</p>
                  <p>
                    {placement.placementUsername
                      ? `${placement.placementUsername} (#${placement.placementUid})`
                      : `Placement UID #${placement.placementUid}`}
                    {' '}• {placement.positionLabel || (Number(placement.position) === 2 ? 'Right' : 'Left')} leg
                  </p>
                  <p>{placement.note}</p>
                </div>
              )}
            </div>

            <button onClick={regenerateInvite} disabled={creating} className="gold-btn w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm disabled:opacity-60">
              {creating ? 'Refreshing...' : 'Refresh Weak-Leg Placement'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
