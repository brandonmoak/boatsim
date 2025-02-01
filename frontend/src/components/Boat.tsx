import L from 'leaflet';
import { BoatState } from '../types';

// Add this type declaration
declare module 'leaflet' {
  interface MarkerOptions {
    rotationAngle?: number;
    rotationOrigin?: string;
  }
}

interface BoatMarkerOptions extends BoatState {
  iconSize?: [number, number];
}

export const createBoatIcon = (rotation: number, size: [number, number] = [32, 32]) => {
  return L.divIcon({
    html: `<div style="transform: rotate(${rotation}deg);">
            <img 
              src="/boat_favicon.png" 
              alt="boat" 
              style="width: ${size[0]}px; height: ${size[1]}px; display: block; 
                     filter: contrast(120%) brightness(90%);
                     -webkit-filter: contrast(120%) brightness(90%);"
            />
          </div>`,
    className: 'boat-icon',
    iconSize: size,
    iconAnchor: [size[0]/2, size[1]/2],
  });
};

export const createBoatMarker = (options: BoatMarkerOptions) => {
  const size = options.iconSize || [16, 16];
  
  return L.marker([options.lat, options.lon], {
    icon: createBoatIcon(options.heading, size),
    rotationAngle: options.heading,
    rotationOrigin: 'center center'
  });
}; 