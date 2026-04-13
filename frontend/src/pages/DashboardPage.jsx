import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <main className="page">
      <section className="card">
        <h1>Dashboard</h1>
        <p className="muted">Properties list placeholder</p>
        <div className="placeholder-box">
          Property listing, registration, and buy actions will be added in next steps.
        </div>
        <Link className="link-button secondary" to="/login">
          Back to login placeholder
        </Link>
      </section>
    </main>
  );
}
