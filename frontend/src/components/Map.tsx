import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { BoatState, Waypoint } from '../types';
import { createBoatMarker, createBoatIcon } from './Boat';
import NavigationDisplay from './NavigationDisplay';
import Controls from './Controls';

interface MapProps {
  boatState: BoatState;
  waypoints: Waypoint[];
  onStart: () => void;
  onStop: () => void;
  isSimulating: boolean;
}

const Map: React.FC<MapProps> = ({ 
  boatState, 
  waypoints,
  onStart,
  onStop,
  isSimulating
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const waypointLayerRef = useRef<L.LayerGroup | null>(null);

  // Add public method to refresh map
  const refreshMap = () => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  };

  // Expose the refresh method to parent components
  useEffect(() => {
    if (window) {
      // @ts-ignore - Adding to window for global access
      window.refreshMap = refreshMap;
    }
    return () => {
      // @ts-ignore - Cleanup
      delete window.refreshMap;
    };
  }, []);

  useEffect(() => {
    mapRef.current = L.map('map').setView([0, 0], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Create boat marker
    markerRef.current = createBoatMarker({ lat: 0, lon: 0, heading: 0, speed_mps: 0}).addTo(mapRef.current);
    
    // Create waypoint layer group
    waypointLayerRef.current = L.layerGroup().addTo(mapRef.current);

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
      if (waypointLayerRef.current) {
        waypointLayerRef.current.clearLayers();
      }
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const newPos: L.LatLngExpression = [boatState.lat, boatState.lon];
      markerRef.current.setLatLng(newPos);
      markerRef.current.setIcon(createBoatIcon(boatState.heading));
      mapRef.current.panTo(newPos);
    }
  }, [boatState]);

  useEffect(() => {
    if (waypointLayerRef.current && mapRef.current) {
      waypointLayerRef.current.clearLayers();

      // Draw lines between waypoints
      if (waypoints.length > 1) {
        L.polyline(
          waypoints.map(wp => [wp.lat, wp.lon]),
          { color: 'rgba(100, 100, 100, 0.5)', weight: 2, dashArray: '5, 10' }
        ).addTo(waypointLayerRef.current);
      }

      // Add waypoint markers
      waypoints.forEach((waypoint, index) => {
        L.circleMarker([waypoint.lat, waypoint.lon], {
          radius: 6,
          fillColor: '#ff4444',
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        })
        .bindTooltip(`Waypoint ${index + 1}`)
        .addTo(waypointLayerRef.current!);
      });
    }
  }, [waypoints]);

  return (
    <div id="map">
      <div className="floating-nav-container">
        <NavigationDisplay boatState={boatState} />
      </div>
    </div>
  );
};

export default Map;