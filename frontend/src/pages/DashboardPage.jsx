import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../auth.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [regError, setRegError] = useState("");
  const [buyError, setBuyError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [buyingId, setBuyingId] = useState("");
  const [buyOwnerById, setBuyOwnerById] = useState({});
  const [form, setForm] = useState({
    propertyId: "",
    location: "",
    priceWei: "",
    initialOwner: "",
  });

  async function loadProperties() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseUrl}/properties`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch properties");
      }
      setItems(Array.isArray(data.properties) ? data.properties : []);
    } catch (e) {
      setError(e.message || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, [auth.token]);

  async function onRegister(event) {
    event.preventDefault();
    setRegError("");
    setRegistering(true);
    try {
      const response = await fetch(`${baseUrl}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Registration failed");
      }
      setForm({ propertyId: "", location: "", priceWei: "", initialOwner: "" });
      await loadProperties();
    } catch (e) {
      setRegError(e.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  }

  async function onBuy(propertyId) {
    const newOwner = (buyOwnerById[propertyId] || "").trim();
    if (!newOwner) {
      setBuyError("New owner address is required.");
      return;
    }

    setBuyError("");
    setBuyingId(String(propertyId));
    try {
      const response = await fetch(`${baseUrl}/properties/${propertyId}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ newOwner }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Buy transfer failed");
      }
      setBuyOwnerById((prev) => ({ ...prev, [propertyId]: "" }));
      await loadProperties();
    } catch (e) {
      setBuyError(e.message || "Buy transfer failed");
    } finally {
      setBuyingId("");
    }
  }

  function logout() {
    clearAuth();
    navigate("/login");
    window.location.reload();
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Dashboard</h1>
        <p className="muted">Logged in role: {auth.role || "unknown"}</p>
        {auth.role === "admin" ? (
          <form className="form form-box" onSubmit={onRegister}>
            <h3>Register Property</h3>
            <label className="field">
              <span>Property ID</span>
              <input
                type="text"
                value={form.propertyId}
                onChange={(e) => setForm((s) => ({ ...s, propertyId: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Location</span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Price (wei)</span>
              <input
                type="text"
                value={form.priceWei}
                onChange={(e) => setForm((s) => ({ ...s, priceWei: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Initial owner</span>
              <input
                type="text"
                value={form.initialOwner}
                onChange={(e) => setForm((s) => ({ ...s, initialOwner: e.target.value }))}
                required
              />
            </label>
            {regError ? <p className="error-text">{regError}</p> : null}
            <button className="link-button" type="submit" disabled={registering}>
              {registering ? "Registering..." : "Register property"}
            </button>
          </form>
        ) : null}
        {loading ? <p className="muted">Loading properties...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {buyError ? <p className="error-text">{buyError}</p> : null}
        {!loading && !error ? (
          <div className="properties-list">
            {items.length === 0 ? (
              <div className="placeholder-box">No properties found yet.</div>
            ) : (
              items.map((p) => (
                <article className="property-card" key={p.property_id}>
                  <h3>Property #{p.property_id}</h3>
                  <p>{p.location}</p>
                  <p className="muted">Owner: {p.owner_address}</p>
                  <p className="muted">Price (wei): {p.price_wei}</p>
                  <div className="buy-row">
                    <input
                      type="text"
                      placeholder="New owner address"
                      value={buyOwnerById[p.property_id] || ""}
                      onChange={(e) =>
                        setBuyOwnerById((prev) => ({
                          ...prev,
                          [p.property_id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => onBuy(p.property_id)}
                      disabled={buyingId === String(p.property_id)}
                    >
                      {buyingId === String(p.property_id) ? "Processing..." : "Buy / Transfer"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
        <button className="link-button secondary" type="button" onClick={logout}>
          Logout
        </button>
      </section>
    </main>
  );
}
