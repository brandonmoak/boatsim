import React from 'react';
import { BoatState } from '../types';

interface NavigationDisplayProps {
  boatPosition: BoatState;
}

const NavigationDisplay: React.FC<NavigationDisplayProps> = ({ boatPosition }) => {
  return (
    <div className="navigation-display">
      <div className="nav-item">
        <label>Speed</label>
        <span>{boatPosition.speed.toFixed(1)} kts</span>
      </div>
      <div className="nav-item">
        <label>Heading</label>
        <span>{boatPosition.heading.toFixed(1)}°</span>
      </div>
      <div className="nav-item">
        <label>Lat</label>
        <span>{boatPosition.lat.toFixed(4)}°N</span>
      </div>
      <div className="nav-item">
        <label>Lon</label>
        <span>{boatPosition.lon.toFixed(4)}°W</span>
      </div>
    </div>
  );
};

export default NavigationDisplay; 