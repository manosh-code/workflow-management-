import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await updateProfile(name.trim());
      setMessage("Profile saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="narrow">
      <header className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </div>
      </header>
      <form className="stack-form" onSubmit={save}>
        <label htmlFor="profile-name">Name</label>
        <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
        <label htmlFor="profile-email">Email</label>
        <input id="profile-email" value={user?.email || ""} readOnly />
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-ok">{message}</p> : null}
        <button className="primary" type="submit">
          Save profile
        </button>
      </form>
      <button type="button" onClick={logout}>
        Sign out
      </button>
    </section>
  );
}
