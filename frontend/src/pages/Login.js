import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../services/firebase';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isFirebaseConfigured() && firebaseAuth) {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await cred.user.getIdToken();
        ({ data } = await authAPI.firebaseAuth({ idToken }));
      } else {
        ({ data } = await authAPI.login({ email, password }));
      }
      login(data.token, data.user);
      if (data.user.role === 'artist') navigate('/artist/dashboard');
      else if (data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/buyer/dashboard');
    } catch (err) {
      // Fallback to local auth for existing non-Firebase users.
      try {
        const { data } = await authAPI.login({ email, password });
        login(data.token, data.user);
        if (data.user.role === 'artist') navigate('/artist/dashboard');
        else if (data.user.role === 'admin') navigate('/admin/dashboard');
        else navigate('/buyer/dashboard');
      } catch (localErr) {
        setError(localErr.response?.data?.message || err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
