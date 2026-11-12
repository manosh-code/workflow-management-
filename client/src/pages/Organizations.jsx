import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Organizations() {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api("/api/organizations", { token });
    setOrganizations(data.organizations);
  }

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/organizations", { method: "POST", token, body: { name: name.trim() } });
      setName("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Workspaces</p>
          <h1>Organizations</h1>
        </div>
      </header>
      <form className="inline-form" onSubmit={create}>
        <label htmlFor="org-name">New organization</label>
        <input
          id="org-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={80}
          required
          placeholder="Studio name"
        />
        <button className="primary" type="submit">
          Create
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="status">Loading organizations…</p> : null}
      {!loading && organizations.length === 0 ? (
        <p className="empty">You are not in an organization yet. Create one to open a board.</p>
      ) : null}
      <div className="card-grid">
        {organizations.map((organization) => (
          <article key={organization._id} className="panel">
            <p className="role-pill">{organization.role}</p>
            <h2>{organization.name}</h2>
            <div className="panel-links">
              <Link to={`/organizations/${organization._id}/boards`}>Boards</Link>
              <Link to={`/organizations/${organization._id}/members`}>Members</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
