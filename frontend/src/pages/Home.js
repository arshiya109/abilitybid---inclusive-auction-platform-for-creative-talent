import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { artworkAPI } from '../services/api';
import ArtworkCard from '../components/ArtworkCard';
import './Home.css';

export default function Home() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    artworkAPI.getAll({ limit: 8, status: 'active' })
      .then((res) => setArtworks(res.data.data))
      .catch(() => setArtworks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1>AbilityBid</h1>
        <p className="hero-subtitle">Inclusive Auction Platform for Creative Talent</p>
        <p className="hero-desc">
          Support artists with disabilities by bidding on their handmade art, crafts, and creative products.
        </p>
        <div className="hero-actions">
          <Link to="/artworks" className="btn btn-accent">Browse Artworks</Link>
          <Link to="/register" className="btn btn-outline-dark">Join as Artist</Link>
        </div>
      </section>

      <section className="featured">
        <h2>Featured Artworks</h2>
        {loading ? (
          <p>Loading...</p>
        ) : artworks.length > 0 ? (
          <div className="artwork-grid">
            {artworks.map((a) => (
              <ArtworkCard key={a._id} artwork={a} />
            ))}
          </div>
        ) : (
          <p className="muted">No artworks yet. Be the first to list!</p>
        )}
        <Link to="/artworks" className="view-all">View all artworks →</Link>
      </section>
    </div>
  );
}
