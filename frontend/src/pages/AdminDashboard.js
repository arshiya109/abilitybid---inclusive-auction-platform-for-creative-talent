import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/getImageUrl';
import './Dashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [pending, setPending] = useState({ pendingArtworks: [], unverifiedArtists: [], unverifiedBuyers: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('verification');

  const loadData = () => {
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getUsers(),
      adminAPI.getAuctions(),
      adminAPI.getPendingVerifications()
    ])
      .then(([s, u, a, p]) => {
        setStats(s.data.data);
        setUsers(u.data.data);
        setAuctions(a.data.data);
        setPending(p.data.data || { pendingArtworks: [], unverifiedArtists: [], unverifiedBuyers: [] });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => loadData(), []);

  const verifyArtist = async (id) => {
    try {
      await adminAPI.verifyArtist(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, verified: true } : u)));
      setPending((prev) => ({ ...prev, unverifiedArtists: prev.unverifiedArtists.filter((u) => u._id !== id) }));
    } catch (e) {}
  };

  const verifyBuyer = async (id) => {
    try {
      await adminAPI.verifyBuyer(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, verified: true } : u)));
      setPending((prev) => ({ ...prev, unverifiedBuyers: prev.unverifiedBuyers.filter((u) => u._id !== id) }));
    } catch (e) {}
  };

  const verifyArtwork = async (id) => {
    try {
      await adminAPI.verifyArtwork(id);
      setAuctions((prev) => prev.map((a) => (a._id === id ? { ...a, verificationStatus: 'approved' } : a)));
      setPending((prev) => ({ ...prev, pendingArtworks: prev.pendingArtworks.filter((a) => a._id !== id) }));
    } catch (e) {}
  };

  const rejectArtwork = async (id) => {
    const reason = window.prompt('Rejection reason (optional):') || 'Rejected by admin';
    try {
      await adminAPI.rejectArtwork(id, reason);
      setPending((prev) => ({ ...prev, pendingArtworks: prev.pendingArtworks.filter((a) => a._id !== id) }));
    } catch (e) {}
  };

  const removeArtwork = async (id) => {
    if (!window.confirm('Remove this artwork permanently?')) return;
    try {
      await adminAPI.removeArtwork(id);
      setAuctions((prev) => prev.filter((a) => a._id !== id));
      setPending((prev) => ({ ...prev, pendingArtworks: prev.pendingArtworks.filter((a) => a._id !== id) }));
    } catch (e) {}
  };

  if (loading) return <div className="loading">Loading...</div>;

  const hasPending = (pending.pendingArtworks?.length || 0) + (pending.unverifiedArtists?.length || 0) + (pending.unverifiedBuyers?.length || 0) > 0;

  return (
    <div className="dashboard admin-dashboard">
      <h1>Admin Dashboard</h1>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card card">
            <strong>{stats.totalUsers}</strong>
            <span>Total Users</span>
          </div>
          <div className="stat-card card">
            <strong>{stats.totalArtists}</strong>
            <span>Artists</span>
          </div>
          <div className="stat-card card">
            <strong>{stats.totalArtworks}</strong>
            <span>Artworks</span>
          </div>
          <div className="stat-card card">
            <strong>{stats.activeAuctions}</strong>
            <span>Active Auctions</span>
          </div>
          <div className="stat-card card highlight" onClick={() => setActiveTab('verification')}>
            <strong>{stats.pendingArtworks || 0}</strong>
            <span>Pending Artworks</span>
          </div>
          <div className="stat-card card highlight" onClick={() => setActiveTab('verification')}>
            <strong>{(stats.unverifiedArtists || 0) + (stats.unverifiedBuyers || 0)}</strong>
            <span>Unverified Users</span>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button className={activeTab === 'verification' ? 'active' : ''} onClick={() => setActiveTab('verification')}>
          Verification {hasPending && <span className="badge-count">{(stats?.pendingArtworks || 0) + (stats?.unverifiedArtists || 0) + (stats?.unverifiedBuyers || 0)}</span>}
        </button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
        <button className={activeTab === 'auctions' ? 'active' : ''} onClick={() => setActiveTab('auctions')}>Auctions</button>
      </div>

      {activeTab === 'verification' && (
        <section className="admin-section verification-section">
          <h2>Verification Center</h2>
          <p className="section-desc">Verify artist and buyer identity, and approve artwork/auction listings before they go live.</p>

          <div className="verification-grid">
            <div className="verify-card card">
              <h3>Pending Artworks / Auctions</h3>
              <p className="muted">Review and approve artwork details before they appear in the marketplace.</p>
              {pending.pendingArtworks?.length > 0 ? (
                <ul className="pending-list">
                  {pending.pendingArtworks.map((a) => (
                    <li key={a._id} className="pending-item">
                      <div className="pending-info">
                        <img src={getImageUrl(a.image)} alt="" className="pending-thumb" />
                        <div>
                          <strong>{a.title}</strong>
                          <span>by {a.artistId?.name} · {formatCurrency(a.startingPrice)}</span>
                        </div>
                      </div>
                      <div className="pending-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => verifyArtwork(a._id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => rejectArtwork(a._id)}>Reject</button>
                        <Link to={`/artworks/${a._id}`} className="btn btn-outline btn-sm">View</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No pending artworks.</p>
              )}
            </div>

            <div className="verify-card card">
              <h3>Unverified Artists (Sellers)</h3>
              <p className="muted">Verify artist identity before they can sell on the platform.</p>
              {pending.unverifiedArtists?.length > 0 ? (
                <ul className="pending-list">
                  {pending.unverifiedArtists.map((u) => (
                    <li key={u._id} className="pending-item">
                      <div>
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => verifyArtist(u._id)}>Verify</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No unverified artists.</p>
              )}
            </div>

            <div className="verify-card card">
              <h3>Unverified Buyers</h3>
              <p className="muted">Verify buyer identity for trusted bidding.</p>
              {pending.unverifiedBuyers?.length > 0 ? (
                <ul className="pending-list">
                  {pending.unverifiedBuyers.map((u) => (
                    <li key={u._id} className="pending-item">
                      <div>
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => verifyBuyer(u._id)}>Verify</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No unverified buyers.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section className="admin-section">
          <h2>All Users</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.verified ? 'Yes' : 'No'}</td>
                    <td>
                      {!u.verified && (
                        <button className="btn btn-primary btn-sm" onClick={() => u.role === 'artist' ? verifyArtist(u._id) : verifyBuyer(u._id)}>
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'auctions' && (
        <section className="admin-section">
          <h2>All Auctions</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Current Bid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((a) => (
                  <tr key={a._id}>
                    <td>{a.title}</td>
                    <td>{a.artistId?.name} {a.artistId?.verified && <span className="badge-verified">✓</span>}</td>
                    <td>{a.status}</td>
                    <td>
                      <span className={`verification-badge ${a.verificationStatus || 'pending'}`}>
                        {a.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td>{formatCurrency(a.currentBid || a.startingPrice)}</td>
                    <td>
                      <Link to={`/artworks/${a._id}`} className="btn btn-outline btn-sm">View</Link>
                      <button className="btn btn-danger btn-sm" onClick={() => removeArtwork(a._id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
