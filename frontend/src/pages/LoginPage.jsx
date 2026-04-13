import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <main className="page">
      <section className="card">
        <h1>Blockchain Land Registry</h1>
        <p className="muted">Login page placeholder</p>
        <div className="placeholder-box">Email/password form will be added in Step 2.</div>
        <Link className="link-button" to="/dashboard">
          Go to dashboard placeholder
        </Link>
      </section>
    </main>
  );
}
