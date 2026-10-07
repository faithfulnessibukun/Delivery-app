import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
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

const emojiIcon = (emoji) =>
  L.divIcon({
    html: `<div style="font-size:28px;line-height:1;text-align:center">${emoji}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });

const riderIcon = emojiIcon("🏍️");
const customerIcon = emojiIcon("🏠");

// Keeps both the rider and the customer in view as the rider moves.
function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);

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
  const hasRider = !!(riderLatitude && riderLongitude);
  const hasCustomer = !!(customerLatitude && customerLongitude);
  const riderPoint = hasRider ? [riderLatitude, riderLongitude] : null;
  const customerPoint = hasCustomer ? [customerLatitude, customerLongitude] : null;
  const points = [riderPoint, customerPoint].filter(Boolean);
  const center = points[0] || [6.5244, 3.3792]; // Lagos fallback

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

        {customerPoint && (
          <Marker position={customerPoint} icon={customerIcon}>
            <Popup>
              <strong>Customer</strong>
              <br />
              Delivery destination
            </Popup>
          </Marker>
        )}

        {riderPoint && (
          <Marker position={riderPoint} icon={riderIcon}>
            <Popup>
              <strong>Rider</strong>
              <br />
              Live location
            </Popup>
          </Marker>
        )}

        {riderPoint && customerPoint && (
          <Polyline
            positions={[riderPoint, customerPoint]}
            pathOptions={{ color: "#E8491D", weight: 3, dashArray: "6 8" }}
          />
        )}

        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}

export default LiveDeliveryMap;