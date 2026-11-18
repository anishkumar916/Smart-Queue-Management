import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';

// Public pages
import { Home } from './pages/public/Home';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { TrackToken } from './pages/public/TrackToken';
import { LiveBoard } from './pages/public/LiveBoard';
import { NotFound } from './pages/public/NotFound';

// Customer pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { JoinQueue } from './pages/customer/JoinQueue';
import { TokenDetails } from './pages/customer/TokenDetails';
import { TrackQueue } from './pages/customer/TrackQueue';
import { TokenHistory } from './pages/customer/TokenHistory';
import { NotificationsPage } from './pages/customer/Notifications';
import { CustomerProfile } from './pages/customer/Profile';

// Staff pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { QueueManagement } from './pages/staff/QueueManagement';
import { StaffProfile } from './pages/staff/StaffProfile';
import { QRScannerPage } from './pages/staff/QRScannerPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Organizations } from './pages/admin/Organizations';
import { Branches } from './pages/admin/Branches';
import { Services } from './pages/admin/Services';
import { Counters } from './pages/admin/Counters';
import { Staff } from './pages/admin/Staff';
import { Customers } from './pages/admin/Customers';
import { Analytics } from './pages/admin/Analytics';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isDashboard =
    location.pathname.startsWith('/customer') ||
    location.pathname.startsWith('/staff') ||
    location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {isDashboard && <Sidebar />}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/track" element={<TrackToken />} />
              <Route path="/live" element={<LiveBoard />} />
              <Route path="/join" element={<Navigate to="/customer/join" replace />} />

              {/* Customer Routes */}
              <Route
                path="/customer"
                element={
                  <RoleRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <CustomerDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/customer/join"
                element={
                  <RoleRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <JoinQueue />
                  </RoleRoute>
                }
              />
              <Route
                path="/customer/token/:id"
                element={
                  <RoleRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <TokenDetails />
                  </RoleRoute>
                }
              />
              <Route
                path="/customer/track"
                element={
                  <RoleRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <TrackQueue />
                  </RoleRoute>
                }
              />
              <Route
                path="/customer/history"
                element={
                  <RoleRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <TokenHistory />
                  </RoleRoute>
                }
              />
              <Route
                path="/customer/notifications"
                element={
                  <RoleRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <NotificationsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/customer/profile"
                element={
                  <RoleRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <CustomerProfile />
                  </RoleRoute>
                }
              />

              {/* Staff Routes */}
              <Route
                path="/staff"
                element={
                  <RoleRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/staff/queue"
                element={
                  <RoleRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <QueueManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="/staff/scan"
                element={
                  <RoleRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <QRScannerPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/staff/profile"
                element={
                  <RoleRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffProfile />
                  </RoleRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Analytics />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Organizations />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/branches"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Branches />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/services"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Services />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/counters"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Counters />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Staff />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Customers />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Reports />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <Settings />
                  </RoleRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
