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

export const createBoatIcon = (heading: number, size: [number, number] = [32, 32]) => {
  return L.divIcon({
    className: 'boat-icon',
    html: `<img src="/boat_favicon.png" style="width: ${size[0]}px; height: ${size[1]}px; transform: rotate(${heading}deg);" />`,
    iconSize: size,
    iconAnchor: [size[0]/2, size[1]/2]
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