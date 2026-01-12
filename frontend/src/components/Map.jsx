import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default marker icon missing in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Routing = ({ pickup, dropoff, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !pickup || !dropoff) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickup[0], pickup[1]),
        L.latLng(dropoff[0], dropoff[1])
      ],
      lineOptions: {
        styles: [{ color: '#000', weight: 4 }]
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null
    });

    routingControl.on('routesfound', (e) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const summary = routes[0].summary;
        const coordinates = routes[0].coordinates;
        if (onRouteFound) {
          onRouteFound({
            distance: summary.totalDistance, // in meters
            duration: summary.totalTime,     // in seconds
            coordinates: coordinates         // array of {lat, lng}
          });
        }
      }
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, pickup, dropoff, onRouteFound]);

  return null;
};

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const Map = ({ center = [28.6139, 77.2090], zoom = 13, markers = [], pickup, dropoff, onRouteFound, children }) => {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!pickup && <RecenterAutomatically lat={center[0]} lng={center[1]} />}
      
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position}>
          <Popup>{marker.popup}</Popup>
        </Marker>
      ))}

      {pickup && dropoff && <Routing pickup={pickup} dropoff={dropoff} onRouteFound={onRouteFound} />}
      {children}
    </MapContainer>
  );
};

export default Map;
