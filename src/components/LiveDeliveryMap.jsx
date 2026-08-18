import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix the default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Automatically move the map when the location changes
function MapCenter({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, map]);

  return null;
}

function LiveDeliveryMap({
  customerLatitude,
  customerLongitude,
  riderLatitude,
  riderLongitude,
}) {
  // Use rider location first.
  // If rider location doesn't exist yet, use customer location.
  const center =
    riderLatitude && riderLongitude
      ? [riderLatitude, riderLongitude]
      : customerLatitude && customerLongitude
      ? [customerLatitude, customerLongitude]
      : [6.5244, 3.3792]; // Lagos fallback

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer location */}
        {customerLatitude && customerLongitude && (
          <Marker
            position={[
              customerLatitude,
              customerLongitude,
            ]}
          >
            <Popup>
              🏠 <strong>Customer Location</strong>
              <br />
              Delivery destination
            </Popup>
          </Marker>
        )}

        {/* Rider location */}
        {riderLatitude && riderLongitude && (
          <Marker
            position={[
              riderLatitude,
              riderLongitude,
            ]}
          >
            <Popup>
              🏍️ <strong>Rider Location</strong>
              <br />
              Rider is here
            </Popup>
          </Marker>
        )}

        {/* Keep map centered on rider */}
        <MapCenter
          latitude={riderLatitude || customerLatitude}
          longitude={riderLongitude || customerLongitude}
        />
      </MapContainer>
    </div>
  );
}

export default LiveDeliveryMap;