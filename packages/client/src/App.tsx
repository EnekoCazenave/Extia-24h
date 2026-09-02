import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import GamesPage from './pages/GamesPage.tsx'
import GameDetailPage from './pages/GameDetailPage.tsx'
import PlayGamePage from './pages/PlayGamePage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import ModerationPage from './pages/ModerationPage.tsx'
import LeaderboardPage from './pages/LeaderboardPage.tsx'
import PrivacyPage from './pages/PrivacyPage.tsx'
import AssociationsPage from './pages/AssociationsPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ProgrammePage from "./pages/ProgrammePage.tsx";
import EventDetailPage from './pages/EventDetailPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/jeux" element={<GamesPage />} />
        <Route path="/jeux/:id" element={<GameDetailPage />} />
        <Route path="/classement" element={<LeaderboardPage />} />
        <Route path="/programme" element={<ProgrammePage />} />
        <Route path="/programme/:id" element={<EventDetailPage />} />
        <Route path="/associations" element={<AssociationsPage />} />
        <Route path="/politique-de-confidentialite" element={<PrivacyPage />} />

        {/* Protected routes — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/jeux/:id/jouer" element={<PlayGamePage />} />
          <Route path="/profil" element={<ProfilePage />} />
        </Route>

        {/* Protected routes — moderator + admin */}
        <Route element={<ProtectedRoute requiredRole="moderator" />}>
          <Route path="/moderation" element={<ModerationPage />} />
        </Route>

        {/* Protected routes — admin only */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
