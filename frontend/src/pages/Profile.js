import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../services/api';
import SimpleBarChart from '../components/SimpleBarChart';
import { getSocket } from '../services/socket';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([userAPI.getProfile(), userAPI.getStats()])
      .then(([p, s]) => {
        setProfile(p.data.data);
        setStats(s.data.data);
        setForm({
          name: p.data.data.name || '',
          phone: p.data.data.phone || '',
          address: p.data.data.address || ''
        });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const socket = getSocket();
    const refresh = () => {
      userAPI.getStats().then((s) => setStats(s.data.data)).catch(() => {});
    };
    socket.on('notification:new', refresh);
    socket.on('auction:ended', refresh);
    socket.on('bid:new', refresh);
    return () => {
      socket.off('notification:new', refresh);
      socket.off('auction:ended', refresh);
      socket.off('bid:new', refresh);
    };
  }, [user?.id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await userAPI.updateProfile(form);
      setProfile(data.data);
      updateUser({ name: data.data.name });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await userAPI.uploadAvatar(fd);
      setProfile(data.data);
      updateUser({ avatar: data.data.avatar });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const avatarUrl = profile?.avatar
    ? `${API_BASE}/${profile.avatar}`
    : null;

  const buyerChartData = stats
    ? [
        { label: 'Won', value: stats.wonBids || 0, color: 'var(--success)' },
        { label: 'Lost', value: stats.lostBids || 0, color: 'var(--danger)' },
        { label: 'Active', value: stats.activeBids || 0, color: 'var(--primary)' }
      ]
    : [];
  const artistChartData = stats
    ? [
        { label: 'Artworks', value: stats.totalArtworks || 0, color: 'var(--primary)' },
        { label: 'Active', value: stats.activeArtworks || 0, color: 'var(--success)' },
        { label: 'Ended', value: stats.endedArtworks || 0, color: 'var(--text-muted)' }
      ]
    : [];

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <div className="profile-card card">
        <div className="profile-header">
          <div className="avatar-wrap">
            <div className="avatar" style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}>
              {!avatarUrl && <span>{profile?.name?.[0]?.toUpperCase() || '?'}</span>}
            </div>
            <label className="avatar-upload-btn">
              <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} hidden />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </label>
          </div>
          <div className="profile-info">
            <h2>{profile?.name}</h2>
            <p>{profile?.email}</p>
            {profile?.verified && <span className="verified-badge">Verified</span>}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {editing ? (
          <form onSubmit={handleSave} className="profile-form">
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} type="tel" />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows="2" />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <p><strong>Phone:</strong> {profile?.phone || 'Not set'}</p>
            <p><strong>Address:</strong> {profile?.address || 'Not set'}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          </div>
        )}
      </div>

      {stats && (stats.wonBids !== undefined || stats.totalArtworks !== undefined) && (
        <div className="profile-stats card">
          <h3>Overview</h3>
          <div className="stats-grid-inline">
            {stats.wonBids !== undefined && (
              <>
                <div className="stat-item"><strong>{stats.wonBids}</strong><span>Won Bids</span></div>
                <div className="stat-item"><strong>{stats.lostBids}</strong><span>Lost Bids</span></div>
                <div className="stat-item"><strong>{stats.activeBids}</strong><span>Active Bids</span></div>
              </>
            )}
            {stats.totalArtworks !== undefined && (
              <>
                <div className="stat-item"><strong>{stats.totalArtworks}</strong><span>Total Artworks</span></div>
                <div className="stat-item"><strong>{stats.activeArtworks}</strong><span>Active Auctions</span></div>
                <div className="stat-item"><strong>{stats.totalBidsReceived}</strong><span>Bids Received</span></div>
              </>
            )}
          </div>
          {stats.wonBids !== undefined && buyerChartData.some((x) => x.value > 0) && (
            <div className="profile-chart">
              <SimpleBarChart data={buyerChartData} />
            </div>
          )}
          {stats.totalArtworks !== undefined && artistChartData.some((x) => x.value > 0) && (
            <div className="profile-chart">
              <SimpleBarChart data={artistChartData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
