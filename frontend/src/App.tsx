import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/hooks/useToast'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import PublicScanPage from '@/pages/PublicScanPage'
import DashboardHome from '@/pages/DashboardHome'
import PersonalInfoPage from '@/pages/PersonalInfoPage'
import MedicalProfilePage from '@/pages/MedicalProfilePage'
import EmergencyContactsPage from '@/pages/EmergencyContactsPage'
import FamilyPage from '@/pages/FamilyPage'
import WristbandPage from '@/pages/WristbandPage'
import ScanHistoryPage from '@/pages/ScanHistoryPage'
import AccountSettingsPage from '@/pages/AccountSettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/emergency-scan" element={<PublicScanPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="personal" element={<PersonalInfoPage />} />
            <Route path="medical" element={<MedicalProfilePage />} />
            <Route path="contacts" element={<EmergencyContactsPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="wristband" element={<WristbandPage />} />
            <Route path="scans" element={<ScanHistoryPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
