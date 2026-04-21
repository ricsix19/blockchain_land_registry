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
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [registering, setRegistering] = useState(false);
  const [submittingId, setSubmittingId] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const [myPendingPropertyIds, setMyPendingPropertyIds] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [simulatedPurchaseOk, setSimulatedPurchaseOk] = useState(false);
  const [locationDrafts, setLocationDrafts] = useState({});
  const [updatingLocationId, setUpdatingLocationId] = useState("");
  const [locationUpdateSuccess, setLocationUpdateSuccess] = useState("");
  const [locationUpdateError, setLocationUpdateError] = useState("");

  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerSuggestions, setOwnerSuggestions] = useState([]);
  const [ownerSearchLoading, setOwnerSearchLoading] = useState(false);
  const [ownerPick, setOwnerPick] = useState(null);

  const [form, setForm] = useState({
    propertyId: "",
    location: "",
    priceWei: "",
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

  async function loadMyPending() {
    try {
      const response = await fetch(`${baseUrl}/purchase-requests/my-pending`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load your pending requests");
      }
      setMyPendingPropertyIds(
        Array.isArray(data.propertyIds) ? data.propertyIds.map(String) : [],
      );
    } catch {
      setMyPendingPropertyIds([]);
    }
  }

  async function loadPendingRequests() {
    setPendingLoading(true);
    try {
      const response = await fetch(`${baseUrl}/purchase-requests/pending`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load pending requests");
      }
      setPendingRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch {
      setPendingRequests([]);
    } finally {
      setPendingLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
    loadMyPending();
  }, [auth.token]);

  useEffect(() => {
    if (auth.role !== "admin") {
      setPendingRequests([]);
      return;
    }
    loadPendingRequests();
  }, [auth.token, auth.role]);

  useEffect(() => {
    if (auth.role !== "admin") {
      setOwnerSuggestions([]);
      return;
    }
    const q = ownerQuery.trim();
    if (q.length < 2) {
      setOwnerSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setOwnerSearchLoading(true);
      try {
        const response = await fetch(
          `${baseUrl}/users/search?q=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${auth.token}` } },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Search failed");
        }
        setOwnerSuggestions(Array.isArray(data.users) ? data.users : []);
      } catch {
        setOwnerSuggestions([]);
      } finally {
        setOwnerSearchLoading(false);
      }
    }, 320);
    return () => clearTimeout(handle);
  }, [ownerQuery, auth.token, auth.role]);

  function shortenAddress(addr) {
    if (!addr || typeof addr !== "string") return "—";
    const a = addr.trim();
    if (a.length < 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }

  function normAddr(a) {
    return (a || "").trim().toLowerCase();
  }

  function isAlreadyOwner(property) {
    if (!auth.walletAddress || !property?.owner_address) return false;
    return normAddr(auth.walletAddress) === normAddr(property.owner_address);
  }

  function displayName(u) {
    if (!u) return "";
    if (u.full_name && String(u.full_name).trim()) return u.full_name.trim();
    return u.email;
  }

  /** Admin queue: property IDs with any pending request (from API). */
  const adminPendingPropertyIds =
    auth.role === "admin"
      ? new Set(pendingRequests.map((r) => String(r.property_id)))
      : null;

  async function onRegister(event) {
    event.preventDefault();
    setRegError("");
    if (!ownerPick) {
      setRegError("Choose a person from the search suggestions (type at least 2 letters).");
      return;
    }
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
          initialOwnerUserId: ownerPick.id,
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
      });
      setOwnerQuery("");
      setOwnerPick(null);
      setOwnerSuggestions([]);
      await loadProperties();
      if (auth.role === "admin") {
        await loadPendingRequests();
      }
    } catch (e) {
      setRegError(e.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  }

  async function onSubmitPurchaseRequest(propertyId) {
    setRequestError("");
    setRequestSuccess("");
    setSubmittingId(String(propertyId));
    try {
      const response = await fetch(`${baseUrl}/purchase-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ propertyId: String(propertyId), confirm: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not submit purchase request");
      }
      let msg =
        data?.message ||
        "Purchase request recorded. A registrar must approve it before ownership changes.";
      if (data?.requestTxHash && typeof data.requestTxHash === "string") {
        const h = data.requestTxHash;
        msg = `${msg} Request tx: ${h.length > 14 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h}.`;
      }
      setRequestSuccess(msg);
      await loadMyPending();
      if (auth.role === "admin") {
        await loadPendingRequests();
      }
    } catch (e) {
      setRequestError(e.message || "Could not submit purchase request");
    } finally {
      setSubmittingId("");
    }
  }

  async function onApproveRequest(requestId) {
    setRequestError("");
    setRequestSuccess("");
    setApprovingId(String(requestId));
    try {
      const response = await fetch(`${baseUrl}/purchase-requests/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Approval failed");
      }
      setRequestSuccess(
        data?.message ||
          "Purchase approved; ownership finalized",
      );
      await loadProperties();
      await loadPendingRequests();
      await loadMyPending();
    } catch (e) {
      setRequestError(e.message || "Approval failed");
    } finally {
      setApprovingId("");
    }
  }

  async function onAdminPatchLocation(propertyId, pidKey) {
    setLocationUpdateError("");
    setLocationUpdateSuccess("");
    const newLocation = String(locationDrafts[pidKey] ?? "").trim();
    if (!newLocation) {
      setLocationUpdateError("Enter a non-empty location.");
      return;
    }
    setUpdatingLocationId(pidKey);
    try {
      const response = await fetch(
        `${baseUrl}/properties/${encodeURIComponent(String(propertyId))}/location`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ location: newLocation }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Location update failed");
      }
      setLocationUpdateSuccess(
        data?.message || "Property location updated.",
      );
      setLocationDrafts((prev) => {
        const next = { ...prev };
        delete next[pidKey];
        return next;
      });
      await loadProperties();
      if (auth.role === "admin") {
        await loadPendingRequests();
      }
    } catch (e) {
      setLocationUpdateError(e.message || "Location update failed");
    } finally {
      setUpdatingLocationId("");
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
              Human-readable names, unique wallet addresses. To acquire a
              property, submit a purchase request, an administrator then
              approves it to finalize ownership (demo: no real payment made).
            </p>
            {auth.fullName ? (
              <p className="signed-in-as">
                Signed in as <strong>{auth.fullName}</strong>
              </p>
            ) : null}
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
            <p className="form-hint">
              Type a person&apos;s name (or email) to register a new property.
            </p>
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
              <span>Price (ETH)</span>
              <input
                type="text"
                value={form.priceWei}
                onChange={(e) => setForm((s) => ({ ...s, priceWei: e.target.value }))}
                required
              />
            </label>
            <div className="field autocomplete-field">
              <span>Initial owner (search by government name)</span>
              <input
                type="text"
                autoComplete="off"
                placeholder="e.g. Elena or Alex"
                value={ownerQuery}
                onChange={(e) => {
                  setOwnerQuery(e.target.value);
                  setOwnerPick(null);
                }}
              />
              {ownerSearchLoading ? (
                <p className="autocomplete-status">Searching…</p>
              ) : null}
              {ownerSuggestions.length > 0 ? (
                <ul className="autocomplete-list" role="listbox">
                  {ownerSuggestions.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="autocomplete-item"
                        onClick={() => {
                          setOwnerPick(u);
                          setOwnerQuery(displayName(u));
                          setOwnerSuggestions([]);
                        }}
                      >
                        <span className="autocomplete-name">{displayName(u)}</span>
                        <span className="autocomplete-meta">{u.role}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {ownerPick ? (
                <p className="owner-picked">
                  Selected: <strong>{ownerPick.wallet_address}</strong>.
                </p>
              ) : null}
            </div>
            {regError ? <p className="error-text">{regError}</p> : null}
            <button className="link-button" type="submit" disabled={registering}>
              {registering ? "Registering..." : "Register property"}
            </button>
          </form>
        ) : null}
        {auth.role === "admin" ? (
          <section className="pending-panel" aria-labelledby="pending-heading">
            <div className="pending-panel__head">
              <h3 id="pending-heading">Pending purchase requests</h3>
            </div>
            {pendingLoading ? (
              <p className="muted pending-panel__status">Loading queue…</p>
            ) : pendingRequests.length === 0 ? (
              <p className="muted pending-panel__status">No pending requests.</p>
            ) : (
              <ul className="pending-list">
                {pendingRequests.map((r) => (
                  <li className="pending-card" key={r.id}>
                    <div className="pending-card__body">
                      <p className="pending-card__title">
                        Property #{r.property_id}
                        <span className="pending-card__meta"> — {r.property_location}</span>
                      </p>
                      <p className="pending-card__buyer muted">
                        Buyer: <strong>{r.buyer_name || r.buyer_email}</strong>
                        {r.buyer_name ? <span> ({r.buyer_email})</span> : null}
                      </p>
                    </div>
                    <button
                      className="link-button pending-card__approve"
                      type="button"
                      onClick={() => onApproveRequest(r.id)}
                      disabled={approvingId === String(r.id)}
                    >
                      {approvingId === String(r.id) ? "Approving…" : "Approve request"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
        {loading ? <p className="muted">Loading properties...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {requestSuccess ? <p className="success-banner">{requestSuccess}</p> : null}
        {requestError ? <p className="error-text">{requestError}</p> : null}
        {locationUpdateSuccess ? (
          <p className="success-banner">{locationUpdateSuccess}</p>
        ) : null}
        {locationUpdateError ? <p className="error-text">{locationUpdateError}</p> : null}
        {!loading && !error ? (
          <>
            <h2 className="section-title">Registered properties</h2>
            <label className="confirm-demo">
              <input
                type="checkbox"
                checked={simulatedPurchaseOk}
                onChange={(e) => setSimulatedPurchaseOk(e.target.checked)}
              />
              <span>
                I confirm I am submitting a <strong>simulated</strong> purchase request.
                This does not transfer ownership until an administrator
                approves the request.
              </span>
            </label>
            <div className="properties-list">
              {items.length === 0 ? (
                <div className="placeholder-box">No properties found yet.</div>
              ) : (
                items.map((p) => {
                  const owned = isAlreadyOwner(p);
                  const pid = String(p.property_id);
                  const hasMyPendingRequest = myPendingPropertyIds.includes(pid);
                  const hasQueuedPending = adminPendingPropertyIds?.has(pid) ?? false;
                  const blockedByOtherRequest =
                    hasQueuedPending && !hasMyPendingRequest && auth.role === "admin";
                  const requestDisabled =
                    !simulatedPurchaseOk ||
                    owned ||
                    !auth.walletAddress ||
                    hasMyPendingRequest ||
                    blockedByOtherRequest ||
                    submittingId === pid;
                  const showPendingBadge = hasMyPendingRequest || hasQueuedPending;
                  return (
                    <article className="property-card" key={p.property_id}>
                      <h3 className="property-card__title-row">
                        <span>Property #{p.property_id}</span>
                        {showPendingBadge ? (
                          <span className="property-badge" title="A purchase request is pending">
                            Pending request
                          </span>
                        ) : null}
                      </h3>
                      <p>{p.location}</p>
                      <p className="muted">Current owner: {p.owner_address}</p>
                      <p className="muted">Price: {p.price_wei} ETH</p>
                      {auth.role === "admin" ? (
                        <div className="admin-location-update field">
                          <span>Registrar: set new location</span>
                          <input
                            type="text"
                            autoComplete="off"
                            value={locationDrafts[pid] ?? ""}
                            onChange={(e) =>
                              setLocationDrafts((prev) => ({
                                ...prev,
                                [pid]: e.target.value,
                              }))
                            }
                            placeholder={p.location}
                          />
                          <button
                            className="link-button secondary"
                            type="button"
                            disabled={
                              updatingLocationId === pid ||
                              !String(locationDrafts[pid] ?? "").trim() ||
                              String(locationDrafts[pid] ?? "").trim() ===
                                String(p.location ?? "").trim()
                            }
                            onClick={() => onAdminPatchLocation(p.property_id, pid)}
                          >
                            {updatingLocationId === pid
                              ? "Updating…"
                              : "Save location"}
                          </button>
                        </div>
                      ) : null}
                      <div className="buy-actions">
                        {owned ? (
                          <p className="buy-blocked">You already own this property.</p>
                        ) : !auth.walletAddress ? (
                          <p className="buy-blocked">
                            No wallet on file for your account.
                          </p>
                        ) : blockedByOtherRequest ? (
                          <p className="buy-pending">
                            Another party already has a pending purchase request for this property.
                            Approve or wait in the queue above.
                          </p>
                        ) : hasMyPendingRequest ? (
                          <p className="buy-pending">
                            Your request is pending, ownership changes only after administrator
                            approval.
                          </p>
                        ) : !simulatedPurchaseOk ? (
                          <p className="buy-hint">
                            Check the confirmation box above to enable submitting a purchase request.
                          </p>
                        ) : (
                          <p className="buy-hint">
                            Submits a pending request for{" "}
                            <strong>{auth.fullName || "your account"}</strong> (
                            {auth.walletAddress}). No ownership change until approved.
                          </p>
                        )}
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => onSubmitPurchaseRequest(p.property_id)}
                          disabled={requestDisabled}
                        >
                          {submittingId === pid
                            ? "Submitting..."
                            : hasMyPendingRequest
                              ? "Request pending"
                              : blockedByOtherRequest
                                ? "Queue busy"
                                : "Request purchase"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
