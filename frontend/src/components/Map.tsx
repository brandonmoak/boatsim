import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Socket } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  socket: Socket;
}

const Map: React.FC<MapProps> = ({ socket }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const arrowRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([44.6476, -63.5728], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Handle position updates from socket
    socket.on('position_update', (data) => {
      if (!mapRef.current) return;

      const { lat, lon, heading, arrow_end } = data;
      console.log('Received position update:', { lat, lon, heading, arrow_end });

      // Update or create circle marker
      if (!markerRef.current) {
        console.log('Creating new marker at:', lat, lon);
        markerRef.current = L.circleMarker([lat, lon], {
          radius: 8,  // Made slightly larger
          color: '#0000FF',
          fillColor: '#0000FF',
          fillOpacity: 1,
          weight: 2,
          pane: 'overlayPane'  // Ensure it's on the correct pane
        }).addTo(mapRef.current);
      } else {
        console.log('Updating marker position to:', lat, lon);
        markerRef.current.setLatLng([lat, lon]);
      }

      // Update or create direction arrow
      if (arrow_end) {
        const arrowCoords = [
          [lat, lon],
          [arrow_end.lat, arrow_end.lon]
        ];

        if (!arrowRef.current) {
          arrowRef.current = L.polyline(arrowCoords, {
            color: 'red',
            weight: 2
          }).addTo(mapRef.current);
        } else {
          arrowRef.current.setLatLngs(arrowCoords);
        }
      }

      // Center map on boat position
      mapRef.current.panTo([lat, lon]);
    });

    // Add cleanup for marker
    return () => {
      socket.off('position_update');
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
  }, [socket]);

  return <div id="map" style={{ height: '100vh', width: '100%' }} />;
};

export default Map;