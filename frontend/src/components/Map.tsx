import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { BoatPosition } from '../types';

interface MapProps {
  boatPosition: BoatPosition;
}

const Map: React.FC<MapProps> = ({ boatPosition }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const arrowRef = useRef<L.Polyline | null>(null);

  // Helper function to calculate arrow endpoint
  const calculateArrowEndpoint = (position: BoatPosition, length: number = 0.0005): L.LatLngExpression => {
    const headingRad = (position.heading * Math.PI) / 180;
    const endLat = position.lat + length * Math.cos(headingRad);
    const endLon = position.lon + length * Math.sin(headingRad);
    return [endLat, endLon] as L.LatLngExpression;
  };

  // Separate initialization effect
  useEffect(() => {
    // Initialize map only once
    mapRef.current = L.map('map').setView([boatPosition.lat, boatPosition.lon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Create marker only once
    markerRef.current = L.circleMarker([boatPosition.lat, boatPosition.lon], {
      radius: 8,
      className: 'boat-marker',
    }).addTo(mapRef.current);

    // Create direction arrow
    const startPoint: L.LatLngExpression = [boatPosition.lat, boatPosition.lon];
    const endPoint = calculateArrowEndpoint(boatPosition);
    arrowRef.current = L.polyline(
      [startPoint, endPoint],
      { className: 'direction-arrow' }
    ).addTo(mapRef.current);

    // Cleanup
    return () => {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (arrowRef.current && mapRef.current) {
        mapRef.current.removeLayer(arrowRef.current);
        arrowRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Separate effect for position updates
  useEffect(() => {
    if (markerRef.current && mapRef.current && arrowRef.current) {
      const newPos: L.LatLngExpression = [boatPosition.lat, boatPosition.lon];
      const arrowEnd = calculateArrowEndpoint(boatPosition);
      
      markerRef.current.setLatLng(newPos);
      arrowRef.current.setLatLngs([newPos, arrowEnd]);
      mapRef.current.panTo(newPos as L.LatLngExpression);
    }
  }, [boatPosition]); // Only run when boatPosition changes

  return <div id="map" />;
};

export default Map;