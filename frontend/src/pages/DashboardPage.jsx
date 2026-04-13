import { useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../auth.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const auth = getAuth();

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
        <div className="placeholder-box">
          Property listing, registration, and buy actions will be added in next steps.
        </div>
        <button className="link-button secondary" type="button" onClick={logout}>
          Logout
        </button>
      </section>
    </main>
  );
}
