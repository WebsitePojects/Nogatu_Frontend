import { HiOutlineMail, HiOutlineExternalLink } from 'react-icons/hi';
import { FaFacebook } from 'react-icons/fa';

export default function SupportContact() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Issue or Concern</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="max-w-xl">
        {/* Info banner */}
        <div
          className="glass-card rounded-2xl p-6 mb-5"
          style={{ borderLeft: '3px solid rgba(59,130,246,0.6)' }}
        >
          <p className="text-sm font-medium text-white/70 mb-1">Preferred support channel</p>
          <p className="text-lg font-bold text-white">NAWi Help Desk</p>
          <p className="text-sm text-white/50 mt-1">
            For faster response, message us directly on Facebook first. Include your username,
            date/time, and a short description of your concern.
          </p>
        </div>

        {/* Facebook button */}
        <div className="glass-card rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <FaFacebook className="w-5 h-5" style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Facebook — NAWi Help Desk</p>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>Fastest response time</p>
            </div>
          </div>
          <a
            href="https://www.facebook.com/profile.php?id=61577667873284"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold motion-safe:transition-colors"
            style={{
              background: 'rgba(59,130,246,0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; }}
          >
            <FaFacebook className="w-4 h-4" />
            Message NAWi Help Desk
            <HiOutlineExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        {/* Landing contact feedback form */}
        <div className="glass-card rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }}
            >
              <HiOutlineMail className="w-5 h-5" style={{ color: '#34d399' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Send a Message Form</p>
              <p className="text-xs" style={{ color: 'rgba(52,211,153,0.75)' }}>
                We will reply using the email address you submit in the form.
              </p>
            </div>
          </div>
          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold motion-safe:transition-colors"
            style={{
              background: 'rgba(16,185,129,0.14)',
              color: '#34d399',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)'; }}
          >
            Open Feedback Form
            <HiOutlineExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* Email */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              <HiOutlineMail className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Email Support</p>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>Alternative contact method</p>
            </div>
          </div>
          <a
            href="mailto:nogatu.assist@gmail.com?subject=Nogatu%20System%20Concern"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold motion-safe:transition-colors"
            style={{
              background: 'rgba(212,175,55,0.08)',
              color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
          >
            <HiOutlineMail className="w-4 h-4" />
            nogatu.assist@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
