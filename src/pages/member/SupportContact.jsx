import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineExternalLink, HiOutlinePencilAlt, HiOutlineX } from 'react-icons/hi';
import { FaFacebook } from 'react-icons/fa';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function SupportContact() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });

  async function submitTicket(event) {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      return toast.error('Subject and message are required.');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/support/ticket', form);
      toast.success(`Ticket submitted: ${res.data.ticketUid}`);
      setForm({ subject: '', message: '' });
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold portal-page-title">Issue or Concern</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="max-w-xl">
        <div className="glass-card rounded-2xl p-6 mb-5" style={{ borderLeft: '3px solid rgba(59,130,246,0.6)' }}>
          <p className="text-sm font-medium portal-card-text mb-1">Preferred support channel</p>
          <p className="text-lg font-bold portal-card-title">NAWi Help Desk</p>
          <p className="text-sm leading-6 portal-card-muted mt-2">
            For faster response, message us directly on Facebook first. Include your username,
            date/time, and a short description of your concern.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <FaFacebook className="w-5 h-5" style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <p className="text-sm font-semibold portal-card-title">Facebook - NAWi Help Desk</p>
              <p className="text-sm portal-gold-text">Fastest response time</p>
            </div>
          </div>
          <a
            href="https://www.facebook.com/profile.php?id=61577667873284"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <FaFacebook className="w-4 h-4" />
            Message NAWi Help Desk
            <HiOutlineExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }}>
              <HiOutlinePencilAlt className="w-5 h-5" style={{ color: '#34d399' }} />
            </div>
            <div>
              <p className="text-sm font-semibold portal-card-title">In-Portal Support Ticket</p>
              <p className="text-sm" style={{ color: '#0f8f66' }}>
                Your member identity is attached automatically without logging you out.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(16,185,129,0.14)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            Open Ticket Form
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <HiOutlineMail className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <p className="text-sm font-semibold portal-card-title">Email Support</p>
              <p className="text-sm portal-gold-text">Alternative contact method</p>
            </div>
          </div>
          <a
            href="mailto:nogatu.assist@gmail.com?subject=Nogatu%20System%20Concern"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <HiOutlineMail className="w-4 h-4" />
            nogatu.assist@gmail.com
          </a>
        </div>
      </div>

      {open && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => setOpen(false)}>
          <form
            onSubmit={submitTicket}
            onMouseDown={(event) => event.stopPropagation()}
            className="portal-modal-panel w-full max-w-lg rounded-2xl p-6"
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="portal-modal-title font-display text-xl font-bold">Support Ticket</h2>
                <p className="portal-modal-muted text-sm mt-1">
                  {user?.username || user?.accountname || 'Logged-in member'}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="portal-close-button p-2 rounded-lg">
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Subject</label>
                <input className="glass-input" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} maxLength={180} />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="glass-input min-h-[150px]" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} maxLength={5000} />
              </div>
              <button type="submit" disabled={submitting} className="btn-success w-full">
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
