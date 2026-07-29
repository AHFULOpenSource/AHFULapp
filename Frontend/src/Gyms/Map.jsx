import { useEffect, useState } from "react";
import "./Map.css";
import "../siteStyles.css";

// Leaflet styles are required for tiles/controls to render correctly
import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { reverseGeocode, forwardGeocode, fetchAllGyms, createGym, deleteGym } from "./QueryFunctionsGym";

// Fix marker icon paths for bundlers (Vite/webpack). Importing the images returns
// a resolved URL which Leaflet can use when creating the default icon.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Merge options so the default icon uses the imported URLs.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export function Map() {
  const position = [44.8697, -91.9278];
  // State for the mock form & saved gyms (frontend-only)
  const [form, setForm] = useState({ name: "", address: "", cost: "", link: "", lat: position[0], lng: position[1], notes: "", type: "other" });
  const [savedGyms, setSavedGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Geocoding state
  const [addressInput, setAddressInput] = useState("");
  const [geoError, setGeoError] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressLocked, setAddressLocked] = useState(false);

  const fetchGyms = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAllGyms();
      setSavedGyms(list);
    } catch (err) {
      console.error("Failed to fetch gyms:", err);
      setError(err.message || "Unknown error");
      setSavedGyms([]);
    } finally {
      setLoading(false);
    }
  };


//Load gyms from backend on mount
  useEffect(() => {
    fetchGyms();
  }, []);

  function onMapClick(mapinput) {
    setForm((f) => ({ ...f, lat: mapinput.lat, lng: mapinput.lng }));
    // Unlock address when user clicks map so reverse geocode can fill it
    setAddressLocked(false);
  }

  // Reverse geocode lat/lng to address when they change (debounced 1 second)
  useEffect(() => {
    if (addressLocked) return;
    
    const timer = setTimeout(async () => {
      if (!form.lat || !form.lng) return;
      
      setIsGeocoding(true);
      try {
        const address = await reverseGeocode(form.lat, form.lng);
        if (address) {
          setForm((f) => ({ ...f, address }));
        }
      } catch (e) {
        // Silent fail
      } finally {
        setIsGeocoding(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [form.lat, form.lng, addressLocked]);

  // Forward geocode address to lat/lng
  async function handleAddressSearch(e) {
    e.preventDefault();
    if (!addressInput.trim()) return;
    
    setIsGeocoding(true);
    setGeoError(null);
    setAddressLocked(true);
    
    try {
      const result = await forwardGeocode(addressInput);
      if (result) {
        setForm((f) => ({ 
          ...f, 
          lat: result.lat, 
          lng: result.lng,
          address: result.displayName || addressInput
        }));
        setAddressInput("");
      } else {
        setGeoError("Address not found. Try a more specific location.");
      }
    } catch (e) {
      setGeoError("Failed to search address. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  }

  async function saveGym(e) {
    e.preventDefault();

    if (form.cost && !/^[0-9.]+$/.test(form.cost)) {
      alert('Cost must be a valid number');
      return;
    }

    const gymData = {
      name: form.name,
      address: form.address,
      type: form.type,
      cost: form.cost,
      link: form.link,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      notes: form.notes,
    };

    try {
      const result = await createGym(gymData);
      if (result.success) {
        fetchGyms();
      } else {
        console.error("Error saving gym:", result.error);
      }
    } catch (error) {
      console.error("Error saving gym:", error);
    }
  }

  async function removeGym(_id) {
    try {
      const result = await deleteGym(_id);
      if (result.success) {
        fetchGyms();
      } else {
        console.error("Failed to delete gym:", result.error);
      }
    } catch (error) {
      console.error("Error deleting gym:", error);
    }
  }

  // Component to capture map clicks and report coordinates
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        onMapClick(e.latlng);
      },
    });
    return null;
  }

  // Note: gyms are identified by their `_id`. Locally-created gyms are prefixed with `local-`.

  return (
    <div className="Map page-layout">
      <header className="workout-title">
        <h1>Map</h1>
      </header>

      <div className="map-and-form">
        <div className="map-container">
          {/* Address search box */}
          <p className="search-hint">Search for an address to update lat/long, or click the map to fill in all fields.</p>
          <form onSubmit={handleAddressSearch} className="address-search">
            <input
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Search for an address..."
              disabled={isGeocoding}
            />
            <button type="submit" disabled={isGeocoding}>
              {isGeocoding ? "..." : "Go"}
            </button>
          </form>
          {geoError && <p className="geo-error">{geoError}</p>}

          {/* MapContainer needs an explicit height (or a parent with height) to display tiles */}
          <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: "60vh", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler />

            {/* Default center marker */}
            <Marker position={position}>
              <Popup>
                Default center. Click the map to populate the form coordinates.
              </Popup>
            </Marker>

            {/* Markers for saved gyms */}
            {savedGyms.map((gym) => (
              <Marker key={gym._id} position={[gym.lat, gym.lng]}>
                <Popup>
                  <strong>{gym.name}</strong>
                  <br />
                  {gym.address}
                  {gym.notes ? (
                    <>
                      <br />
                      <em>{gym.notes}</em>
                    </>
                  ) : null}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside className="gym-form-wrapper">
          <form className="gym-form" onSubmit={saveGym}>
            <h2>Save Gym</h2>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Gym name"
                required
              />
            </label>

            <label>
              Address
              <input
                value={form.address}
                onChange={(e) => {
                  setForm((f) => ({ ...f, address: e.target.value }));
                  setAddressLocked(true);
                }}
                placeholder="Street, city"
              />
            </label>

            <label>
              Cost
              <input
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                placeholder="Cost"
              />
            </label>

            <label>
              Website
              <input
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="link"
              />
            </label>

            <fieldset className="gym-type">
              <legend>Type</legend>
              <label>
                <input
                  type="radio"
                  name="gymType"
                  value="other"
                  checked={form.type === "other"}
                  onChange={() => setForm((f) => ({ ...f, type: "other" }))}
                />
                Other
              </label>
              <label>
                <input
                  type="radio"
                  name="gymType"
                  value="home"
                  checked={form.type === "home"}
                  onChange={() => setForm((f) => ({ ...f, type: "home" }))}
                />
                Home gym
              </label>
            </fieldset>

            <div className="coords-row">
              <label>
                Latitude
                <input
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  type="number"
                  step="any"
                />
              </label>
              <label>
                Longitude
                <input
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  type="number"
                  step="any"
                />
              </label>
            </div>

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary">Save</button>
            </div>

            <p className="hint">Tip: click anywhere on the map to fill latitude/longitude and address.</p>
          </form>

          <div className="saved-list">
            <h3>Saved gyms</h3>
            <div>
              <button onClick={fetchGyms} disabled={loading} className="refresh-btn">
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {savedGyms.length === 0 ? (
              <p className="muted">No saved gyms yet.</p>
            ) : (
              <ul>
                {savedGyms.map((gym) => (
                  <li key={gym._id}>
                    <div className="saved-item">
                      <div>
                                <strong>{gym.name} <span className="type-pill">{gym.type === 'home' ? 'Home' : 'Other'}</span></strong>
                                  <div className="muted small">{gym.address}</div>
                                  <div className="muted small">{gym.lat.toFixed ? gym.lat.toFixed(5) : gym.lat}, {gym.lng.toFixed ? gym.lng.toFixed(5) : gym.lng}</div>
                      </div>
                      <div className="saved-actions">
                        <button onClick={() => removeGym(gym._id)} aria-label={`Remove ${gym.name}`}>Remove</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
