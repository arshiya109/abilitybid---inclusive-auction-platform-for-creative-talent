import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/getImageUrl';
import './ArtworkCard.css';

export default function ArtworkCard({ artwork }) {
  const imageUrl = getImageUrl(artwork.image);

  const endDate = new Date(artwork.auctionEnd);
  const isEnded = endDate < new Date();
  const currentPrice = artwork.currentBid > 0 ? artwork.currentBid : artwork.startingPrice;

  return (
    <article className="artwork-card">
      <Link to={`/artworks/${artwork._id}`} className="artwork-card-link">
        <div className="artwork-card-image">
          <img src={imageUrl} alt={artwork.title} />
          {isEnded && <span className="badge ended">Ended</span>}
          {artwork.verificationStatus === 'pending' && <span className="badge pending">Pending</span>}
          {artwork.verificationStatus === 'rejected' && <span className="badge rejected">Rejected</span>}
          {artwork.status === 'active' && !isEnded && artwork.verificationStatus === 'approved' && (
            <span className="badge active">Live</span>
          )}
        </div>
        <div className="artwork-card-body">
          <h3>{artwork.title}</h3>
          <p className="artwork-category">{artwork.category}</p>
          <p className="artwork-price">{formatCurrency(currentPrice)}</p>
          {artwork.artistId && (
            <p className="artwork-artist">by {artwork.artistId.name}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
