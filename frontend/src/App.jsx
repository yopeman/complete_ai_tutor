import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import CourseDetails from './pages/CourseDetails';
import LessonPlayer from './pages/LessonPlayer';
import AITutorChat from './pages/AITutorChat';
import Progress from './pages/Progress';
import AppLayout from './components/layout/AppLayout';
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

      {/* Authenticated Routes */}
      <Route element={user ? <AppLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Dashboard />} /> {/* Use Dashboard as the course list too */}
        <Route path="/courses/:courseId" element={<CourseDetails />} />
        <Route path="/lessons/:lessonId" element={<LessonPlayer />} />
        <Route path="/chat" element={<AITutorChat />} />
        <Route path="/flashcards" element={<div className="text-white p-10">Flashcards Deck Page (Phase 8)</div>} />
        <Route path="/progress" element={<Progress />} />
      </Route>
    </Routes>
  );
}

export default App;
