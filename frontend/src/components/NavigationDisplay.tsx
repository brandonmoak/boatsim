import React from 'react';
import { BoatState } from '../types';

interface NavigationDisplayProps {
  boatState: BoatState;
}

const NavigationDisplay: React.FC<NavigationDisplayProps> = ({ boatState }) => {
  const formatLatLon = (decimal: number, isLat: boolean) => {
    const direction = isLat ? (decimal >= 0 ? 'N' : 'S') : (decimal >= 0 ? 'E' : 'W');
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutes = (absolute - degrees) * 60;
    return `${degrees}°${minutes.toFixed(2)}'${direction}`;
  };

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
        <span>{formatLatLon(boatState.lat, true)}</span>
      </div>
      <div className="nav-item">
        <label>Lon</label>
        <span>{formatLatLon(boatState.lon, false)}</span>
      </div>
    </div>
  );
};

export default NavigationDisplay; 