import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import MemberLayout from './layouts/MemberLayout';
import AdminLayout from './layouts/AdminLayout';

const Login = lazy(() => import('./pages/member/Login'));
const Dashboard = lazy(() => import('./pages/member/Dashboard'));
const DashboardMetricDetail = lazy(() => import('./pages/member/DashboardMetricDetail'));
const EWallet = lazy(() => import('./pages/member/EWallet'));
const AccountDetails = lazy(() => import('./pages/member/AccountDetails'));
const ActivationCodes = lazy(() => import('./pages/member/ActivationCodes'));
const DirectReferrals = lazy(() => import('./pages/member/DirectReferrals'));
const GenealogyTree = lazy(() => import('./pages/member/GenealogyTree'));
const UnilevelTree = lazy(() => import('./pages/member/UnilevelTree'));
const PairingReports = lazy(() => import('./pages/member/PairingReports'));
const HiFiveBonus = lazy(() => import('./pages/member/HiFiveBonus'));
const RankingProgress = lazy(() => import('./pages/member/RankingProgress'));
const Leaderboard = lazy(() => import('./pages/member/Leaderboard'));
const Vouchers = lazy(() => import('./pages/member/Vouchers'));
const Transactions = lazy(() => import('./pages/member/Transactions'));
const TransactionDetails = lazy(() => import('./pages/member/TransactionDetails'));
const UpgradeAccount = lazy(() => import('./pages/member/UpgradeAccount'));
const Registration = lazy(() => import('./pages/member/Registration'));
const SupportContact = lazy(() => import('./pages/member/SupportContact'));
const SupportThread = lazy(() => import('./pages/member/SupportThread'));
const ReferralInvite = lazy(() => import('./pages/member/ReferralInvite'));
const MemberGlobalBonus = lazy(() => import('./pages/member/MemberGlobalBonus'));

const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AccountMasterlist = lazy(() => import('./pages/admin/AccountMasterlist'));
const GenerateCodes = lazy(() => import('./pages/admin/GenerateCodes'));
const ManageCodes = lazy(() => import('./pages/admin/ManageCodes'));
const Encashment = lazy(() => import('./pages/admin/Encashment'));
const Redeem = lazy(() => import('./pages/admin/Redeem'));
const HiFivePackageClaims = lazy(() => import('./pages/admin/HiFivePackageClaims'));
const UpdateAccounts = lazy(() => import('./pages/admin/UpdateAccounts'));
const IncomeDetails = lazy(() => import('./pages/admin/IncomeDetails'));
const CDPaymentDetails = lazy(() => import('./pages/admin/CDPaymentDetails'));
const AdminGenealogy = lazy(() => import('./pages/admin/AdminGenealogy'));
const AdminUnilevelTree = lazy(() => import('./pages/admin/AdminUnilevelTree'));
const ChangePassword = lazy(() => import('./pages/admin/ChangePassword'));
const NewsManagement = lazy(() => import('./pages/admin/NewsManagement'));
const Messages = lazy(() => import('./pages/admin/Messages'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));
const AdminSupportThread = lazy(() => import('./pages/admin/SupportThread'));
const Rankings = lazy(() => import('./pages/admin/Rankings'));
const GlobalBonus = lazy(() => import('./pages/admin/GlobalBonus'));
const CDAccounts = lazy(() => import('./pages/admin/CDAccounts'));
const Finance = lazy(() => import('./pages/admin/Finance'));
const VoucherManagement = lazy(() => import('./pages/admin/VoucherManagement'));
const VoucherGrant = lazy(() => import('./pages/admin/VoucherGrant'));
const Applications = lazy(() => import('./pages/admin/Applications'));
const AccessAccounts = lazy(() => import('./pages/admin/AccessAccounts'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-screen portal-bg">
      <div className="size-12 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function ProtectedMember({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen portal-bg">
        <div className="size-12 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
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
        <div className="size-12 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
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
        <div className="size-12 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const rights = Number(admin.rights || 0);
  if (!allowed.includes(rights)) {
    const fallback = rights === 2 ? '/admin/voucher-management' : '/admin/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<RouteFallback />}>
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
            <Route path="unilevel" element={<UnilevelTree />} />
            <Route path="pairing" element={<PairingReports />} />
            <Route path="hifive" element={<HiFiveBonus />} />
            <Route path="ranking" element={<RankingProgress />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="vouchers" element={<Vouchers />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/:pid" element={<TransactionDetails />} />
            <Route path="upgrade" element={<UpgradeAccount />} />
            <Route path="register" element={<Registration />} />
            <Route path="referral-invite" element={<ReferralInvite />} />
            <Route path="support" element={<SupportContact />} />
            <Route path="support/:ticketUid" element={<SupportThread />} />
            <Route path="global-bonus" element={<MemberGlobalBonus />} />
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
              element={<ProtectedAdminRoles allowed={[1, 2, 3]}><GenerateCodes /></ProtectedAdminRoles>}
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
              path="voucher-management/:voucherId"
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
              path="hifive-package-claims"
              element={<ProtectedAdminRoles allowed={[1, 3]}><HiFivePackageClaims /></ProtectedAdminRoles>}
            />
            <Route
              path="rankings"
              element={<ProtectedAdminRoles allowed={[1, 3]}><Rankings /></ProtectedAdminRoles>}
            />
            <Route
              path="finance"
              element={<ProtectedAdminRoles allowed={[1, 3]}><Finance /></ProtectedAdminRoles>}
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
              path="unilevel-tree"
              element={<ProtectedAdminRoles allowed={[1, 3]}><AdminUnilevelTree /></ProtectedAdminRoles>}
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
              path="support"
              element={<ProtectedAdminRoles allowed={[1, 3]}><AdminSupport /></ProtectedAdminRoles>}
            />
            <Route
              path="support/:ticketUid"
              element={<ProtectedAdminRoles allowed={[1, 3]}><AdminSupportThread /></ProtectedAdminRoles>}
            />
            <Route
              path="applications"
              element={<ProtectedAdminRoles allowed={[1, 3]}><Applications /></ProtectedAdminRoles>}
            />
            <Route
              path="access-accounts"
              element={<ProtectedAdminRoles allowed={[1, 3]}><AccessAccounts /></ProtectedAdminRoles>}
            />
            <Route
              path="change-password"
              element={<ProtectedAdminRoles allowed={[1, 3]}><ChangePassword /></ProtectedAdminRoles>}
            />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
