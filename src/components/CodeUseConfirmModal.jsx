export default function CodeUseConfirmModal({
  open,
  tone = 'gold',
  title,
  message,
  details = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  busy = false,
  confirmDisabled = false,
}) {
  if (!open) return null;

  const tones = {
    gold: {
      badgeBg: 'rgba(212,175,55,0.12)',
      badgeColor: '#D4AF37',
      badgeBorder: 'rgba(212,175,55,0.22)',
      confirmBg: 'linear-gradient(135deg,#9A7B0A,#D4AF37)',
      confirmColor: '#080604',
      confirmBorder: 'rgba(212,175,55,0.28)',
    },
    red: {
      badgeBg: 'rgba(248,113,113,0.12)',
      badgeColor: '#fca5a5',
      badgeBorder: 'rgba(248,113,113,0.25)',
      confirmBg: 'rgba(248,113,113,0.12)',
      confirmColor: '#fecaca',
      confirmBorder: 'rgba(248,113,113,0.25)',
    },
  };

  const currentTone = tones[tone] || tones.gold;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4">
      <div className="glass-card rounded-2xl w-full max-w-lg p-6 border border-brand-gold/20 shadow-2xl">
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{
            background: currentTone.badgeBg,
            color: currentTone.badgeColor,
            border: `1px solid ${currentTone.badgeBorder}`,
          }}
        >
          Code Confirmation
        </div>
        <h2 className="mt-3 text-xl font-display font-bold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{message}</p>

        {details.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-white/45">{detail.label}</span>
                <span className="text-right font-medium text-white/85">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium border"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.72)' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{
              background: currentTone.confirmBg,
              color: currentTone.confirmColor,
              border: `1px solid ${currentTone.confirmBorder}`,
            }}
          >
            {busy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
