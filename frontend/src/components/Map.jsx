import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';


import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;


const createBrandIcon = (logoUrl) => L.divIcon({
  html: `<div class="h-10 w-10 bg-white rounded-xl p-1 shadow-lg border-2 border-indigo-500 flex items-center justify-center overflow-hidden">
          <img src="${logoUrl}" class="h-full w-full object-contain" />
         </div>`,
  className: 'custom-brand-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const carIcon = L.divIcon({
  html: `<div class="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
         </div>`,
  className: 'custom-car-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const Routing = ({ pickup, dropoff, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const onRouteFoundRef = useRef(onRouteFound);


  useEffect(() => {
    onRouteFoundRef.current = onRouteFound;
  }, [onRouteFound]);

  useEffect(() => {
    if (!map) return;

    let control;
    try {
      control = L.Routing.control({
        waypoints: [
          L.latLng(pickup[0], pickup[1]),
          L.latLng(dropoff[0], dropoff[1])
        ],
        lineOptions: {
          styles: [{ color: '#6366F1', weight: 6, opacity: 0.8 }]
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        createMarker: () => null
      }).addTo(map);

      control.on('routesfound', (e) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const summary = routes[0].summary;
          const coordinates = routes[0].coordinates;
          if (onRouteFoundRef.current) {
            onRouteFoundRef.current({
              distance: summary.totalDistance,
              duration: summary.totalTime,
              coordinates: coordinates
            });
          }
        }
      });

      control.on('routingerror', (e) => {

        console.debug('Routing error (expected during rapid updates):', e.error);
      });

      routingControlRef.current = control;
    } catch (err) {
      console.error('Error initializing routing control:', err);
    }

    return () => {
      const control = routingControlRef.current;
      if (control) {
        routingControlRef.current = null;
        try {

          control.setWaypoints([]);
          
          if (map && map.getContainer()) {

             try {
               map.removeControl(control);
             } catch (e) {

             }
          }
        } catch (e) {
          console.debug('Routing cleanup error:', e);
        }
      }
    };
  }, [map]);

  useEffect(() => {
    if (routingControlRef.current && pickup && dropoff) {
      try {

        if (routingControlRef.current.getPlan()) {
          routingControlRef.current.setWaypoints([
            L.latLng(pickup[0], pickup[1]),
            L.latLng(dropoff[0], dropoff[1])
          ]);
        }
      } catch (err) {
        console.warn('Error updating waypoints:', err);
      }
    }
  }, [pickup, dropoff]);

  return null;
};


  const RecenterMap = ({ pickup, dropoff, markers }) => {
    const map = useMap();

    useEffect(() => {
      if (!map) return;

      const bounds = L.latLngBounds([]);
      
      if (pickup && pickup[0] !== undefined && pickup[1] !== undefined) bounds.extend(pickup);
      if (dropoff && dropoff[0] !== undefined && dropoff[1] !== undefined) bounds.extend(dropoff);
      if (markers && markers.length > 0) {
        markers.forEach(m => {
          if (m.position && m.position[0] !== undefined && m.position[1] !== undefined) {
            bounds.extend(m.position);
          }
        });
      }

      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 1.5 });
      }
    }, [pickup, dropoff, markers, map]);

    return null;
  };

  const pickupIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });

  const dropoffIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
    className: 'hue-rotate-180'
  });

const Map = ({ center = [28.6139, 77.2090], zoom = 13, markers = [], pickup, dropoff, onRouteFound, children }) => {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} zoomControl={false} className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      
      <RecenterMap pickup={pickup} dropoff={dropoff} markers={markers} />
      
      {markers.map((marker, index) => {
        if (!marker.position || marker.position[0] === undefined || marker.position[1] === undefined) return null;
        
        let icon = DefaultIcon;
        if (marker.icon === 'car') icon = carIcon;
        if (marker.icon === 'brand') icon = createBrandIcon(marker.logo);

        return (
          <Marker key={index} position={marker.position} icon={icon}>
            <Popup>{marker.popup}</Popup>
          </Marker>
        );
      })}

      {pickup && pickup[0] !== undefined && pickup[1] !== undefined && !dropoff && (
        <Marker position={pickup} icon={pickupIcon}>
          <Popup>Pickup Location</Popup>
        </Marker>
      )}

      {pickup && pickup[0] !== undefined && pickup[1] !== undefined && 
       dropoff && dropoff[0] !== undefined && dropoff[1] !== undefined && (
        <>
          <Marker position={pickup} icon={pickupIcon}>
             <Popup>Pickup</Popup>
          </Marker>
          <Marker position={dropoff} icon={dropoffIcon}>
             <Popup>Dropoff</Popup>
          </Marker>
          <Routing pickup={pickup} dropoff={dropoff} onRouteFound={onRouteFound} />
        </>
      )}
      {children}
    </MapContainer>
  );
};

export default Map;
