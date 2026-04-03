import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<div className="flex items-center justify-center min-h-screen text-white bg-slate-900">Login Page (Phase 2)</div>} />
      <Route path="/register" element={<div className="flex items-center justify-center min-h-screen text-white bg-slate-900">Register Page (Phase 2)</div>} />
    </Routes>
  );
}

export default App;
