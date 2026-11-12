import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Members() {
  const { orgId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  async function load() {
    const next = await api(`/api/organizations/${orgId}`, { token });
    setData(next);
  }

  useEffect(() => {
    let cancelled = false;
    load().catch((err) => {
      if (!cancelled) setError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, token]);

  async function addMember(event) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/organizations/${orgId}/members`, {
        method: "POST",
        token,
        body: { email: email.trim(), role },
      });
      setEmail("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeRole(userId, nextRole) {
    setError("");
    try {
      await api(`/api/organizations/${orgId}/members/${userId}`, {
        method: "PATCH",
        token,
        body: { role: nextRole },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(userId) {
    setError("");
    try {
      await api(`/api/organizations/${orgId}/members/${userId}`, { method: "DELETE", token });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const isAdmin = data?.role === "admin";

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Organization</p>
          <h1>{data?.organization.name || "Members"}</h1>
        </div>
        <Link to={`/organizations/${orgId}/boards`}>View boards</Link>
      </header>
      {error ? <p className="form-error">{error}</p> : null}
      {isAdmin ? (
        <form className="inline-form" onSubmit={addMember}>
          <label htmlFor="member-email">Add member by email</label>
          <input
            id="member-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="name@studio.com"
          />
          <label className="sr-only" htmlFor="member-role">
            Role
          </label>
          <select id="member-role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="primary" type="submit">
            Add
          </button>
        </form>
      ) : (
        <p className="status">Only an organization admin can change membership.</p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.members.map((member) => (
              <tr key={member.userId}>
                <td>{member.name}</td>
                <td>{member.email}</td>
                <td>
                  {isAdmin ? (
                    <select
                      aria-label={`Role for ${member.name}`}
                      value={member.role}
                      onChange={(event) => changeRole(member.userId, event.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    member.role
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <button type="button" onClick={() => remove(member.userId)}>
                      Remove
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
