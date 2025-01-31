import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { BoatPosition, Waypoint } from '../types';
import { createBoatMarker, createBoatIcon } from './Boat';

interface MapProps {
  boatPosition: BoatPosition;
  waypoints: Waypoint[];
}

const Map: React.FC<MapProps> = ({ boatPosition, waypoints }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const waypointLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    mapRef.current = L.map('map').setView([0, 0], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Create boat marker
    markerRef.current = createBoatMarker({ lat: 0, lon: 0, heading: 0 }).addTo(mapRef.current);
    
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
      const newPos: L.LatLngExpression = [boatPosition.lat, boatPosition.lon];
      markerRef.current.setLatLng(newPos);
      markerRef.current.setIcon(createBoatIcon(boatPosition.heading));
      mapRef.current.panTo(newPos);
    }
  }, [boatPosition]);

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

  return <div id="map" />;
};

export default Map;