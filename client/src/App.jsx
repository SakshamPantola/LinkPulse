import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout      from './components/AppLayout';
import AuthPage       from './pages/AuthPage';
import Dashboard      from './pages/Dashboard';
import LinksPage      from './pages/LinksPage';
import LinkDetailPage from './pages/LinkDetailPage';
import CampaignsPage      from './pages/CampaignsPage';
import CampaignDetailPage  from './pages/CampaignDetailPage';
import QRPage             from './pages/QRPage';
import AnalyticsPage      from './pages/AnalyticsPage';
import AdminPage          from './pages/AdminPage';
import CreateLinkPage     from './pages/CreateLinkPage';
import RedirectHandler    from './components/RedirectHandler';



export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          
          <Route path="/login" element={<AuthPage />} />

          <Route path="/:code" element={<RedirectHandler />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="links"          element={<LinksPage />} />
            <Route path="links/new"      element={<CreateLinkPage />} />
            <Route path="links/:id"      element={<LinkDetailPage />} />
            <Route path="campaigns"      element={<CampaignsPage />} />
            <Route path="campaigns/:id"  element={<CampaignDetailPage />} />
            <Route path="qr"             element={<QRPage />} />
            <Route path="analytics"      element={<AnalyticsPage />} />

            <Route
              path="admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

// 