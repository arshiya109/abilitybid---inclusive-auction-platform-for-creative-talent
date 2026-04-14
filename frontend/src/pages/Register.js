import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../services/firebase';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    disabilityCertificate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isFirebaseConfigured() && firebaseAuth) {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        const idToken = await cred.user.getIdToken();
        const payload = {
          idToken,
          name: form.name,
          role: form.role,
          disabilityCertificate: form.role === 'artist' ? form.disabilityCertificate : undefined
        };
        ({ data } = await authAPI.firebaseAuth(payload));
      } else {
        const payload = { ...form };
        if (form.role !== 'artist') delete payload.disabilityCertificate;
        ({ data } = await authAPI.register(payload));
      }
      login(data.token, data.user);
      if (data.user.role === 'artist') navigate('/artist/dashboard');
      else if (data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/buyer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password (min 6 characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">I am a</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="buyer">Buyer / Supporter</option>
              <option value="artist">Artist (Creator)</option>
            </select>
          </div>
          {form.role === 'artist' && (
            <div className="form-group">
              <label htmlFor="disabilityCertificate">Disability Certificate (optional)</label>
              <input
                id="disabilityCertificate"
                name="disabilityCertificate"
                type="text"
                value={form.disabilityCertificate}
                onChange={handleChange}
                placeholder="Certificate number or description"
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
