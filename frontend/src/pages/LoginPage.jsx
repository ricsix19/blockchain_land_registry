import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }

      setAuth(data.token, data.role, data.walletAddress ?? "", data.fullName ?? "");
      navigate("/dashboard");
      window.location.reload();
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        {/* <p className="eyebrow">Thesis prototype</p> */}
        <h1>Land Registry</h1>
        <p className="muted">Sign in to view and manage registered properties.</p>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="link-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
