import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageNews from './pages/ManageNews';
import ManageTeachers from './pages/ManageTeachers';
import ManageStaff from './pages/ManageStaff';
import ManageMajors from './pages/ManageMajors';
import ManageGallery from './pages/ManageGallery';
import ManagePartners from './pages/ManagePartners';
import ManageContributors from './pages/ManageContributors';
import ManageTestimonials from './pages/ManageTestimonials';
import ManageAgenda from './pages/ManageAgenda';
import Home from './pages/Home';
import MajorsPage from './pages/MajorsPage';
import MajorDetail from './pages/MajorDetail';
import Profile from './pages/Profile';
import ManageWA from './pages/ManageWA';
import ManageAIBot from './pages/ManageAIBot';
import { Toaster } from 'react-hot-toast';
import NewsDetail from './pages/NewsDetail';
import NewsPage from './pages/NewsPage';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/majors" element={<MajorsPage />} />
        <Route path="/majors/:slug" element={<MajorDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/news" element={<ManageNews />} />
          <Route path="/teachers" element={<ManageTeachers />} />
          <Route path="/staff" element={<ManageStaff />} />
          <Route path="/majors" element={<ManageMajors />} />
          <Route path="/gallery" element={<ManageGallery />} />
          <Route path="/partners" element={<ManagePartners />} />
          <Route path="/contributors" element={<ManageContributors />} />
          <Route path="/testimonials" element={<ManageTestimonials />} />
          <Route path="/wa" element={<ManageWA />} />
          <Route path="/contributors" element={<ManageContributors />} />
          <Route path="/agenda" element={<ManageAgenda />} />
          <Route path="/ai-bot" element={<ManageAIBot />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
