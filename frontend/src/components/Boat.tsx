import L from 'leaflet';
import { BoatState } from '../types';

export const createBoatIcon = (heading: number): L.DivIcon => {
  return L.divIcon({
    html: `<div style="transform: rotate(${heading}deg);">
            <img 
              src="/boat_favicon.png" 
              alt="boat" 
              style="width: 24px; height: 24px; display: block;"
            />
          </div>`,
    className: 'boat-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const createBoatMarker = (position: BoatState): L.Marker => {
  return L.marker([position.lat, position.lon], {
    icon: createBoatIcon(position.heading),
  });
}; 