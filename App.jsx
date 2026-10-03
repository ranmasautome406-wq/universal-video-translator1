import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Pricing from './pages/Pricing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Translate from './pages/Translate.jsx';
import Result from './pages/Result.jsx';
import SubtitleEditor from './pages/SubtitleEditor.jsx';
import Compare from './pages/Compare.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/translate" element={<ProtectedRoute><Translate /></ProtectedRoute>} />
        <Route path="/projects/:videoId" element={<ProtectedRoute><Result /></ProtectedRoute>} />
        <Route path="/editor/:jobId" element={<ProtectedRoute><SubtitleEditor /></ProtectedRoute>} />
        <Route path="/compare/:jobId" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
