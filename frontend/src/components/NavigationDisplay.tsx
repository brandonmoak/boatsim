import React from 'react';
import { BoatState } from '../types';

interface NavigationDisplayProps {
  boatState: BoatState;
}

const NavigationDisplay: React.FC<NavigationDisplayProps> = ({ boatState }) => {
  return (
    <div className="navigation-display">
      <div className="nav-item">
        <label>Speed</label>
        <span>{(boatState.speed_mps / 0.514444).toFixed(1)} kts</span>
      </div>
      <div className="nav-item">
        <label>Heading</label>
        <span>{boatState.heading.toFixed(1)}°</span>
      </div>
      <div className="nav-item">
        <label>Lat</label>
        <span>{boatState.lat.toFixed(4)}°N</span>
      </div>
      <div className="nav-item">
        <label>Lon</label>
        <span>{boatState.lon.toFixed(4)}°W</span>
      </div>
    </div>
  );
};

export default NavigationDisplay; 