import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { BoatPosition } from '../types';
import { createBoatMarker, createBoatIcon } from './Boat';

interface MapProps {
  boatPosition: BoatPosition;
}

const Map: React.FC<MapProps> = ({ boatPosition }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    mapRef.current = L.map('map').setView([0, 0], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Create boat marker
    markerRef.current = createBoatMarker({ lat: 0, lon: 0, heading: 0 }).addTo(mapRef.current);

    // Cleanup
    return () => {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const newPos: L.LatLngExpression = [boatPosition.lat, boatPosition.lon];
      markerRef.current.setLatLng(newPos);
      markerRef.current.setIcon(createBoatIcon(boatPosition.heading));
      mapRef.current.panTo(newPos);
    }
  }, [boatPosition]);

  return <div id="map" />;
};

export default Map;