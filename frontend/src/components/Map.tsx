import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import './Map.css';
import { BoatState, Waypoint } from '../types';
import { createBoatMarker, createBoatIcon } from './Boat';
import NavigationDisplay from './NavigationDisplay';

interface MapProps {
  boatState: BoatState;
  waypoints: Waypoint[];
  onStart: () => void;
  onStop: () => void;
  isSimulating: boolean;
}

// Update the interface definition
declare module 'leaflet' {
  interface MapOptions {
    rotate?: boolean;
    rotateControl?: boolean | {
      closeOnZeroBearing: boolean;
      position: string;
      buttonOptions?: {
        states: { stateName: string; icon: string; title: string }[];
      };
    };
  }

  interface Map {
    setBearing(bearing: number): void;
    getBearing(): number;
  }
}

interface RotationControlType extends L.Control {
  _updateInterval?: ReturnType<typeof setInterval>;
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
  const [isHeadsUp, setIsHeadsUp] = useState(false);

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

  // Initialize map with rotation support
  useEffect(() => {
    mapRef.current = L.map('map', {
      rotate: true,
      rotateControl: false
    }).setView([0, 0], 12);

    // Create custom rotation control
    const RotationControl = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-rotation', container);
        button.innerHTML = '⇧';
        button.href = '#';
        button.title = 'Toggle Heads Up/North Up';
        
        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          setIsHeadsUp(prev => {
            button.innerHTML = !prev ? 'N' : '⇧';
            button.classList.toggle('heads-up', !prev);
            return !prev;
          });
        });
        
        return container;
      }
    });

    new RotationControl({ position: 'topleft' }).addTo(mapRef.current);

    // Add rotation event handler
    mapRef.current.on('rotate', () => {
      setIsHeadsUp(mapRef.current?.getBearing() !== 0);
    });

    // Base map layer (OpenStreetMap)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // OpenSeaMap layer
    const seamapLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      attribution: '© OpenSeaMap contributors'
    }).addTo(mapRef.current);

    // Add layer control
    const baseLayers = {
      "OpenStreetMap": osmLayer
    };
    
    const overlays = {
      "Sea Marks": seamapLayer
    };

    L.control.layers(baseLayers, overlays).addTo(mapRef.current);

    // Create boat marker
    markerRef.current = createBoatMarker({ 
      lat: 0, 
      lon: 0, 
      heading: 0, 
      speed_mps: 0,
      iconSize: [24, 24],  // Increased from default size
    }).addTo(mapRef.current);
    
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

  // Update boat position and rotation
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const newPos: L.LatLngExpression = [boatState.lat, boatState.lon];
      markerRef.current.setLatLng(newPos);
      
      if (isHeadsUp) {
        mapRef.current.setBearing(-boatState.heading);
        markerRef.current.setIcon(createBoatIcon(0));
      } else {
        mapRef.current.setBearing(0);
        markerRef.current.setIcon(createBoatIcon(boatState.heading));
      }
      
      mapRef.current.panTo(newPos);
    }
  }, [boatState, isHeadsUp]);

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