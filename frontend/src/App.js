import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import NotificationCenter from './components/NotificationCenter';
import RouteSplash from './components/RouteSplash';
import './App.css';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ArtworkList from './pages/ArtworkList';
import ArtworkDetail from './pages/ArtworkDetail';
import ArtistDashboard from './pages/ArtistDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import NotificationsPage from './pages/NotificationsPage';
import { connectSocketForUser } from './services/socket';
import { useEffect } from 'react';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) connectSocketForUser(user.id);
  }, [user]);

  return (
    <>
      <Navbar />
      <RouteSplash />
      <main className="main-content">
        <div className="page-transition">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/artworks" element={<ArtworkList />} />
          <Route path="/artworks/:id" element={<ArtworkDetail />} />
          <Route path="/artist/dashboard" element={
            <PrivateRoute roles={['artist']}>
              <ArtistDashboard />
            </PrivateRoute>
          } />
          <Route path="/buyer/dashboard" element={
            <PrivateRoute roles={['buyer', 'artist', 'admin']}>
              <BuyerDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin/dashboard" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
        <NotificationCenter />
      </NotificationProvider>
    </AuthProvider>
  );
}
