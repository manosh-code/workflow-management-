import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={location.state?.from || "/organizations"} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        await register({ name: name.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }
      navigate(location.state?.from || "/organizations", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-story" aria-hidden="true">
        <p className="eyebrow">Workflow</p>
        <h1>Keep the work moving, list by list.</h1>
        <div className="story-board">
          <div>
            <span>To do</span>
            <i />
            <i />
          </div>
          <div>
            <span>In progress</span>
            <i />
          </div>
          <div>
            <span>Done</span>
            <i />
            <i />
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <p className="eyebrow">Accounts</p>
        <h2>{mode === "register" ? "Create an account" : "Sign in"}</h2>
        <div className="segmented" role="tablist" aria-label="Account action">
          <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => setMode("register")}>
            Register
          </button>
        </div>
        <form onSubmit={submit} className="stack-form">
          {mode === "register" ? (
            <>
              <label htmlFor="name">Name</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
            </>
          ) : null}
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={mode === "register" ? 8 : 1}
          />
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary" type="submit" disabled={busy}>
            {mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
