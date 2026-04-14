import React, { useState, useEffect } from 'react';
import { artworkAPI } from '../services/api';
import ArtworkCard from '../components/ArtworkCard';
import './ArtworkList.css';

const CATEGORIES = ['painting', 'sculpture', 'pottery', 'textile', 'jewelry', 'handicraft', 'digital-art', 'other'];

export default function ArtworkList() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    artworkAPI.getAll(params)
      .then((res) => setArtworks(res.data.data))
      .catch(() => setArtworks([]))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div className="artwork-list-page">
      <h1>Browse Artworks</h1>
      <div className="filters">
        <input
          type="text"
          placeholder="Search artworks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          aria-label="Search artworks"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : artworks.length > 0 ? (
        <div className="artwork-grid">
          {artworks.map((a) => (
            <ArtworkCard key={a._id} artwork={a} />
          ))}
        </div>
      ) : (
        <p className="no-results">No artworks found.</p>
      )}
    </div>
  );
}
