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
  const [usersError, setUsersError] = useState("");
  const [users, setUsers] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [buyingId, setBuyingId] = useState("");
  const [form, setForm] = useState({
    propertyId: "",
    location: "",
    priceWei: "",
    initialOwnerUserId: "",
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

  useEffect(() => {
    async function loadUsers() {
      if (auth.role !== "admin") return;
      setUsersError("");
      try {
        const response = await fetch(`${baseUrl}/users`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load users");
        }
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (e) {
        setUsersError(e.message || "Failed to load users");
      }
    }
    loadUsers();
  }, [auth.token, auth.role]);

  function shortenAddress(addr) {
    if (!addr || typeof addr !== "string") return "—";
    const a = addr.trim();
    if (a.length < 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }

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
        body: JSON.stringify({
          propertyId: form.propertyId,
          location: form.location,
          priceWei: form.priceWei,
          initialOwnerUserId: parseInt(form.initialOwnerUserId, 10),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Registration failed");
      }
      setForm({
        propertyId: "",
        location: "",
        priceWei: "",
        initialOwnerUserId: "",
      });
      await loadProperties();
    } catch (e) {
      setRegError(e.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  }

  async function onBuy(propertyId) {
    setBuyError("");
    setBuyingId(String(propertyId));
    try {
      const response = await fetch(`${baseUrl}/properties/${propertyId}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Buy transfer failed");
      }
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
      <section className="card card--wide">
        <header className="dash-header">
          <div>
            <h1>Dashboard</h1>
            <p className="muted">
              Properties synced from your backend and chain. Buying assigns the listing to your
              saved wallet (no address typing).
            </p>
          </div>
          <div className="dash-header__actions">
            <span
              className={`role-badge ${auth.role === "admin" ? "role-badge--admin" : ""}`}
            >
              {auth.role || "unknown"}
            </span>
            <button className="link-button secondary" type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
        {auth.role === "admin" ? (
          <form className="form form-box" onSubmit={onRegister}>
            <h3>Register property</h3>
            <p className="form-hint">Choose an existing user as the first on-chain owner.</p>
            {usersError ? <p className="error-text">{usersError}</p> : null}
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
              <span>Initial owner (user)</span>
              <select
                value={form.initialOwnerUserId}
                onChange={(e) =>
                  setForm((s) => ({ ...s, initialOwnerUserId: e.target.value }))
                }
                required
              >
                <option value="">Select a user…</option>
                {users
                  .filter((u) => u.wallet_address)
                  .map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.email} · {u.role}
                    </option>
                  ))}
              </select>
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
          <>
            <h2 className="section-title">Registered properties</h2>
            <div className="properties-list">
            {items.length === 0 ? (
              <div className="placeholder-box">No properties found yet.</div>
            ) : (
              items.map((p) => (
                <article className="property-card" key={p.property_id}>
                  <h3>Property #{p.property_id}</h3>
                  <p>{p.location}</p>
                  <p className="muted">Owner: {shortenAddress(p.owner_address)}</p>
                  <p className="muted">Price (wei): {p.price_wei}</p>
                  <div className="buy-actions">
                    <p className="buy-hint">
                      Transfer to your account wallet (server signs the chain transaction).
                    </p>
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => onBuy(p.property_id)}
                      disabled={buyingId === String(p.property_id)}
                    >
                      {buyingId === String(p.property_id) ? "Processing..." : "Buy (assign to me)"}
                    </button>
                  </div>
                </article>
              ))
            )}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
