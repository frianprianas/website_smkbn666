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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/majors" element={<MajorsPage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/news" element={<ManageNews />} />
          <Route path="/teachers" element={<ManageTeachers />} />
          <Route path="/staff" element={<ManageStaff />} />
          <Route path="/majors" element={<ManageMajors />} />
          <Route path="/gallery" element={<ManageGallery />} />
          <Route path="/partners" element={<ManagePartners />} />
          <Route path="/contributors" element={<ManageContributors />} />
          <Route path="/testimonials" element={<ManageTestimonials />} />
          <Route path="/agenda" element={<ManageAgenda />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
