import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { userAPI } from '../services/api';
import { API_BASE } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      Promise.all([userAPI.getProfile(), userAPI.getStats()])
        .then(([p, s]) => {
          setProfile(p.data.data);
          setStats(s.data.data);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const avatarUrl = profile?.avatar ? `${API_BASE}/${profile.avatar}` : null;

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/" className="navbar-brand">AbilityBid</Link>
      <button
        className="navbar-toggler"
        onClick={toggleMenu}
        aria-expanded={menuOpen}
        aria-label="Toggle menu"
      >
        <span></span><span></span><span></span>
      </button>
      <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
        <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
        <li><Link to="/artworks" onClick={() => setMenuOpen(false)}>Artworks</Link></li>
        {user ? (
          <>
            {user.role === 'artist' && (
              <li><Link to="/artist/dashboard" onClick={() => setMenuOpen(false)}>My Artworks</Link></li>
            )}
            {(user.role === 'buyer' || user.role === 'admin') && (
              <li><Link to="/buyer/dashboard" onClick={() => setMenuOpen(false)}>My Bids</Link></li>
            )}
            <li><Link to="/notifications" onClick={() => setMenuOpen(false)}>Notifications</Link></li>
            {user.role === 'admin' && (
              <li><Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Admin</Link></li>
            )}
            <li className="profile-trigger-wrap" ref={dropdownRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
              >
                <div className="profile-avatar-sm" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}>
                  {!avatarUrl && user.name?.[0]?.toUpperCase()}
                </div>
                <span className="user-name">{user.name}</span>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                <span className="dropdown-arrow">▼</span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-avatar-md" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}>
                      {!avatarUrl && user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <strong>{profile?.name || user.name}</strong>
                      <span>{profile?.email || user.email}</span>
                    </div>
                  </div>
                  {(stats?.wonBids !== undefined || stats?.totalArtworks !== undefined) && (
                    <div className="profile-dropdown-stats">
                      {stats?.wonBids !== undefined && (
                        <>
                          <span>Won: <strong>{stats.wonBids}</strong></span>
                          <span>Lost: <strong>{stats.lostBids}</strong></span>
                        </>
                      )}
                      {stats?.totalArtworks !== undefined && (
                        <>
                          <span>Artworks: <strong>{stats.totalArtworks}</strong></span>
                          <span>Bids received: <strong>{stats.totalBidsReceived}</strong></span>
                        </>
                      )}
                    </div>
                  )}
                  <Link to="/profile" className="dropdown-link" onClick={() => { setProfileOpen(false); setMenuOpen(false); }}>
                    Edit Profile
                  </Link>
                  <Link to="/notifications" className="dropdown-link" onClick={() => { setProfileOpen(false); setMenuOpen(false); }}>
                    Open Notifications
                  </Link>
                  <button className="dropdown-link" onClick={() => markAllRead()}>
                    Mark notifications read {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </button>
                  <button className="dropdown-link btn-logout" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link></li>
            <li><Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-primary">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}
