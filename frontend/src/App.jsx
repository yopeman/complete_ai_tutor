import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import CourseDetails from './pages/CourseDetails';
import LessonPlayer from './pages/LessonPlayer';
import AITutorChat from './pages/AITutorChat';
import Progress from './pages/Progress';
import Flashcards from './pages/Flashcards';
import Certificates from './pages/Certificates';
import Payments from './pages/Payments';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AppLayout from './components/layout/AppLayout';
import TextToSpeech from './pages/TextToSpeech';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Authenticated Routes */}
      <Route element={user ? <AppLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<MyCourses />} />
        <Route path="/courses/:courseId" element={<CourseDetails />} />
        <Route path="/lessons/:lessonId" element={<LessonPlayer />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/payments" element={user ? <Payments /> : <Navigate to="/login" />} />
      </Route>

      {/* Full Screen Immersive Routes */}
      <Route path="/chat" element={user ? <AITutorChat /> : <Navigate to="/login" />} />
      <Route path="/text-to-speech" element={user ? <TextToSpeech /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
