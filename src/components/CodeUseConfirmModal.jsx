import { useEffect, useState } from 'react';

export default function CodeUseConfirmModal({
  open,
  tone = 'gold',
  title,
  message,
  hint = null,
  details = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  showCancel = true,
  onConfirm,
  onClose,
  busy = false,
  confirmDisabled = false,
}) {
  // Self-guarding confirm: while onConfirm's promise is in flight, further taps are
  // ignored and the button is disabled. A slow connection + repeated tapping once
  // fired the same money action 4x (ELENA54 incident) — the guard lives HERE so
  // every consumer of this modal is protected without wiring `busy` themselves.
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (open) setPending(false);
  }, [open]);
  if (!open) return null;

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm?.();
    } finally {
      setPending(false);
    }
  };
  const isDarkTheme = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const panelBackground = isDarkTheme ? '#141008' : '#ffffff';

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
      confirmBg: 'linear-gradient(135deg, #b91c1c, #ef4444)',
      confirmColor: '#fff5f5',
      confirmBorder: 'rgba(248,113,113,0.55)',
    },
  };

  const currentTone = tones[tone] || tones.gold;

  return (
    <div
      className="portal-overlay fixed inset-0 z-[130] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'none' }}
      onMouseDown={onClose}
    >
      <div
        className="portal-modal-panel rounded-2xl w-full max-w-lg p-6 shadow-2xl"
        style={{
          backgroundColor: panelBackground,
          backgroundImage: 'none',
          opacity: 1,
          position: 'relative',
          isolation: 'isolate',
          mixBlendMode: 'normal',
          overflow: 'hidden',
          boxShadow: '0 28px 64px rgba(15,23,42,0.32)',
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))' }}
        />
        <div
          className="relative inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{
            background: currentTone.badgeBg,
            color: currentTone.badgeColor,
            border: `1px solid ${currentTone.badgeBorder}`,
          }}
        >
          Code Confirmation
        </div>
        <h2 className="portal-modal-title relative mt-3 text-xl font-display font-bold">{title}</h2>
        <p className="portal-modal-text relative mt-3 text-sm leading-6">{message}</p>

        {hint ? (
          <div
            className="relative mt-3 rounded-xl px-3 py-2 text-xs font-medium leading-relaxed"
            style={{
              background: currentTone.badgeBg,
              color: currentTone.badgeColor,
              border: `1px solid ${currentTone.badgeBorder}`,
            }}
          >
            <span className="font-semibold uppercase tracking-wide">What to do: </span>
            {hint}
          </div>
        ) : null}

        {details.length > 0 && (
          <div className="portal-soft-panel relative mt-4 rounded-2xl p-4 space-y-2">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-start justify-between gap-4 text-sm">
                <span className="portal-card-muted">{detail.label}</span>
                <span className="portal-page-title text-right font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative mt-5 flex flex-wrap justify-end gap-2">
          {showCancel ? (
            <button
              type="button"
              onClick={onClose}
              className="portal-muted-button rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || pending || confirmDisabled}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{
              background: currentTone.confirmBg,
              color: currentTone.confirmColor,
              border: `1px solid ${currentTone.confirmBorder}`,
            }}
          >
            {busy || pending ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
