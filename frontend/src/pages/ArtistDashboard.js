import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { artworkAPI, userAPI } from '../services/api';
import ArtworkCard from '../components/ArtworkCard';
import { formatCurrency } from '../utils/formatCurrency';
import SimpleBarChart from '../components/SimpleBarChart';
import './Dashboard.css';

export default function ArtistDashboard() {
  const [artworks, setArtworks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'painting',
    startingPrice: '',
    auctionStart: '',
    auctionEnd: '',
    image: null
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([artworkAPI.getArtistArtworks(), userAPI.getStats()])
      .then(([a, s]) => {
        setArtworks(a.data.data);
        setStats(s.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => loadData(), []);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      setForm({ ...form, image: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('category', form.category);
    fd.append('startingPrice', form.startingPrice);
    if (form.auctionStart) fd.append('auctionStart', form.auctionStart);
    fd.append('auctionEnd', form.auctionEnd);
    if (form.image) fd.append('image', form.image);
    try {
      await artworkAPI.create(fd);
      setForm({ title: '', description: '', category: 'painting', startingPrice: '', auctionStart: '', auctionEnd: '', image: null });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create artwork');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = stats
    ? [
        { label: 'Total', value: stats.totalArtworks || 0, color: 'var(--primary)' },
        { label: 'Active', value: stats.activeArtworks || 0, color: 'var(--success)' },
        { label: 'Ended', value: stats.endedArtworks || 0, color: 'var(--text-muted)' },
        { label: 'Bids Received', value: Math.min(stats.totalBidsReceived || 0, 50), color: 'var(--accent)' }
      ]
    : [];

  return (
    <div className="dashboard">
      <h1>My Artworks</h1>

      {stats && (
        <div className="dashboard-stats-section card">
          <h3>Overview</h3>
          <div className="stats-row">
            <div className="stat-card card">
              <strong>{stats.totalArtworks || 0}</strong>
              <span>Total Artworks</span>
            </div>
            <div className="stat-card card">
              <strong>{stats.activeArtworks || 0}</strong>
              <span>Active Auctions</span>
            </div>
            <div className="stat-card card">
              <strong>{stats.endedArtworks || 0}</strong>
              <span>Ended</span>
            </div>
            <div className="stat-card card">
              <strong>{stats.totalBidsReceived || 0}</strong>
              <span>Bids Received</span>
            </div>
          </div>
          {chartData.some((d) => d.value > 0) && (
            <div className="chart-section">
              <h4>Artwork & Bids Summary (Graphical)</h4>
              <SimpleBarChart data={chartData} />
            </div>
          )}
        </div>
      )}

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add Artwork'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card form-card">
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="painting">Painting</option>
              <option value="sculpture">Sculpture</option>
              <option value="pottery">Pottery</option>
              <option value="textile">Textile</option>
              <option value="jewelry">Jewelry</option>
              <option value="handicraft">Handicraft</option>
              <option value="digital-art">Digital Art</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Starting Price (₹)</label>
              <input name="startingPrice" type="number" min="0" value={form.startingPrice} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Auction Start</label>
              <input name="auctionStart" type="datetime-local" value={form.auctionStart} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Auction End</label>
              <input
                name="auctionEnd"
                type="datetime-local"
                value={form.auctionEnd}
                min={form.auctionStart || undefined}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Image</label>
            <input name="image" type="file" accept="image/*" onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Artwork'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : artworks.length > 0 ? (
        <div className="artwork-grid">
          {artworks.map((a) => (
            <div key={a._id}>
              <ArtworkCard artwork={a} />
              <Link to={`/artworks/${a._id}`} className="link-small">View & Edit</Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No artworks yet. Add your first artwork above!</p>
      )}
    </div>
  );
}
