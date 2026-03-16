import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import MemberLayout from './layouts/MemberLayout';
import AdminLayout from './layouts/AdminLayout';

// Member Pages
import Login from './pages/member/Login';
import Dashboard from './pages/member/Dashboard';
import EWallet from './pages/member/EWallet';
import AccountDetails from './pages/member/AccountDetails';
import ActivationCodes from './pages/member/ActivationCodes';
import DirectReferrals from './pages/member/DirectReferrals';
import GenealogyTree from './pages/member/GenealogyTree';
import PairingReports from './pages/member/PairingReports';
import HiFiveBonus from './pages/member/HiFiveBonus';
import Transactions from './pages/member/Transactions';
import UpgradeAccount from './pages/member/UpgradeAccount';
import Registration from './pages/member/Registration';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AccountMasterlist from './pages/admin/AccountMasterlist';
import GenerateCodes from './pages/admin/GenerateCodes';
import ManageCodes from './pages/admin/ManageCodes';
import Encashment from './pages/admin/Encashment';
import Redeem from './pages/admin/Redeem';
import UpdateAccounts from './pages/admin/UpdateAccounts';
import AdminGenealogy from './pages/admin/AdminGenealogy';
import ChangePassword from './pages/admin/ChangePassword';

function ProtectedMember({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function ProtectedAdmin({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  return admin ? children : <Navigate to="/admin/login" replace />;
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
          <Route path="ewallet" element={<EWallet />} />
          <Route path="account" element={<AccountDetails />} />
          <Route path="codes" element={<ActivationCodes />} />
          <Route path="referrals" element={<DirectReferrals />} />
          <Route path="genealogy" element={<GenealogyTree />} />
          <Route path="pairing" element={<PairingReports />} />
          <Route path="hifive" element={<HiFiveBonus />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="upgrade" element={<UpgradeAccount />} />
          <Route path="register" element={<Registration />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="accounts" element={<AccountMasterlist />} />
          <Route path="accounts/:uid" element={<UpdateAccounts />} />
          <Route path="generate-codes" element={<GenerateCodes />} />
          <Route path="manage-codes" element={<ManageCodes />} />
          <Route path="encashment" element={<Encashment />} />
          <Route path="redeem" element={<Redeem />} />
          <Route path="genealogy" element={<AdminGenealogy />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
