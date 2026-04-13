import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../auth.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      setError("");
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
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

    loadProperties();
  }, [auth.token]);

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
        {loading ? <p className="muted">Loading properties...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
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
