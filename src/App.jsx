import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import MemberLayout from './layouts/MemberLayout';
import AdminLayout from './layouts/AdminLayout';

// Member Pages
import Login from './pages/member/Login';
import Dashboard from './pages/member/Dashboard';
import DashboardMetricDetail from './pages/member/DashboardMetricDetail';
import EWallet from './pages/member/EWallet';
import AccountDetails from './pages/member/AccountDetails';
import ActivationCodes from './pages/member/ActivationCodes';
import DirectReferrals from './pages/member/DirectReferrals';
import GenealogyTree from './pages/member/GenealogyTree';
import PairingReports from './pages/member/PairingReports';
import HiFiveBonus from './pages/member/HiFiveBonus';
import RankingProgress from './pages/member/RankingProgress';
import Leaderboard from './pages/member/Leaderboard';
import Vouchers from './pages/member/Vouchers';
import Transactions from './pages/member/Transactions';
import UpgradeAccount from './pages/member/UpgradeAccount';
import Registration from './pages/member/Registration';
import SupportContact from './pages/member/SupportContact';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AccountMasterlist from './pages/admin/AccountMasterlist';
import GenerateCodes from './pages/admin/GenerateCodes';
import ManageCodes from './pages/admin/ManageCodes';
import Encashment from './pages/admin/Encashment';
import Redeem from './pages/admin/Redeem';
import UpdateAccounts from './pages/admin/UpdateAccounts';
import IncomeDetails from './pages/admin/IncomeDetails';
import CDPaymentDetails from './pages/admin/CDPaymentDetails';
import AdminGenealogy from './pages/admin/AdminGenealogy';
import ChangePassword from './pages/admin/ChangePassword';
import NewsManagement from './pages/admin/NewsManagement';
import Messages from './pages/admin/Messages';
import Rankings from './pages/admin/Rankings';
import GlobalBonus from './pages/admin/GlobalBonus';
import CDAccounts from './pages/admin/CDAccounts';
import VoucherManagement from './pages/admin/VoucherManagement';
import VoucherGrant from './pages/admin/VoucherGrant';
import Applications from './pages/admin/Applications';
import ReferralInvite from './pages/member/ReferralInvite';

function ProtectedMember({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen portal-bg">
        <div className="w-12 h-12 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function ProtectedAdmin({ children }) {
  const { admin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen portal-bg">
        <div className="w-12 h-12 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
      </div>
    );
  }
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function ProtectedAdminRoles({ allowed, children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen portal-bg">
        <div className="w-12 h-12 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const rights = Number(admin.rights || 0);
  if (!allowed.includes(rights)) {
    const fallback = rights === 2 ? '/admin/manage-codes' : '/admin/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Member Portal */}
        <Route path="/" element={<ProtectedMember><MemberLayout /></ProtectedMember>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/details/:metric" element={<DashboardMetricDetail />} />
          <Route path="ewallet" element={<EWallet />} />
          <Route path="account" element={<AccountDetails />} />
          <Route path="codes" element={<ActivationCodes />} />
          <Route path="referrals" element={<DirectReferrals />} />
          <Route path="genealogy" element={<GenealogyTree />} />
          <Route path="pairing" element={<PairingReports />} />
          <Route path="hifive" element={<HiFiveBonus />} />
          <Route path="ranking" element={<RankingProgress />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="upgrade" element={<UpgradeAccount />} />
          <Route path="register" element={<Registration />} />
          <Route path="referral-invite" element={<ReferralInvite />} />
          <Route path="support" element={<SupportContact />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
          <Route
            index
            element={<ProtectedAdminRoles allowed={[1, 3]}><AdminDashboard /></ProtectedAdminRoles>}
          />
          <Route
            path="dashboard"
            element={<ProtectedAdminRoles allowed={[1, 3]}><AdminDashboard /></ProtectedAdminRoles>}
          />
          <Route
            path="accounts"
            element={<ProtectedAdminRoles allowed={[1, 3]}><AccountMasterlist /></ProtectedAdminRoles>}
          />
          <Route
            path="accounts/:uid"
            element={<ProtectedAdminRoles allowed={[1, 3]}><UpdateAccounts /></ProtectedAdminRoles>}
          />
          <Route
            path="accounts/:uid/income"
            element={<ProtectedAdminRoles allowed={[1, 3]}><IncomeDetails /></ProtectedAdminRoles>}
          />
          <Route
            path="accounts/:uid/cd"
            element={<ProtectedAdminRoles allowed={[1, 3]}><CDPaymentDetails /></ProtectedAdminRoles>}
          />
          <Route
            path="generate-codes"
            element={<ProtectedAdminRoles allowed={[1, 3]}><GenerateCodes /></ProtectedAdminRoles>}
          />
          <Route
            path="manage-codes"
            element={<ProtectedAdminRoles allowed={[1, 2, 3]}><ManageCodes /></ProtectedAdminRoles>}
          />
          <Route
            path="voucher-management"
            element={<ProtectedAdminRoles allowed={[1, 2, 3]}><VoucherManagement /></ProtectedAdminRoles>}
          />
          <Route
            path="voucher-management/grant"
            element={<ProtectedAdminRoles allowed={[1, 2, 3]}><VoucherGrant /></ProtectedAdminRoles>}
          />
          <Route
            path="encashment"
            element={<ProtectedAdminRoles allowed={[1, 3]}><Encashment /></ProtectedAdminRoles>}
          />
          <Route
            path="redeem"
            element={<ProtectedAdminRoles allowed={[1, 3]}><Redeem /></ProtectedAdminRoles>}
          />
          <Route
            path="rankings"
            element={<ProtectedAdminRoles allowed={[1, 3]}><Rankings /></ProtectedAdminRoles>}
          />
          <Route
            path="global-bonus"
            element={<ProtectedAdminRoles allowed={[1, 3]}><GlobalBonus /></ProtectedAdminRoles>}
          />
          <Route
            path="cd-accounts"
            element={<ProtectedAdminRoles allowed={[1, 3]}><CDAccounts /></ProtectedAdminRoles>}
          />
          <Route
            path="genealogy"
            element={<ProtectedAdminRoles allowed={[1, 3]}><AdminGenealogy /></ProtectedAdminRoles>}
          />
          <Route
            path="news"
            element={<ProtectedAdminRoles allowed={[1, 3]}><NewsManagement /></ProtectedAdminRoles>}
          />
          <Route
            path="messages"
            element={<ProtectedAdminRoles allowed={[1, 3]}><Messages /></ProtectedAdminRoles>}
          />
          <Route
            path="applications"
            element={<ProtectedAdminRoles allowed={[1, 3]}><Applications /></ProtectedAdminRoles>}
          />
          <Route
            path="change-password"
            element={<ProtectedAdminRoles allowed={[1, 3]}><ChangePassword /></ProtectedAdminRoles>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
