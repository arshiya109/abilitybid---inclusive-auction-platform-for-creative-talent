import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteSplash.css';

export default function RouteSplash() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 450);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="route-splash" aria-hidden="true">
      <div className="route-splash-card">
        <h4>Loading AbilityBid</h4>
        <div className="route-bars">
          <span style={{ '--h': '28%' }} />
          <span style={{ '--h': '55%' }} />
          <span style={{ '--h': '72%' }} />
          <span style={{ '--h': '44%' }} />
          <span style={{ '--h': '88%' }} />
        </div>
      </div>
    </div>
  );
}
