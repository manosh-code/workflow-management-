import { Link, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import BoardView from "./pages/BoardView";
import Boards from "./pages/Boards";
import Login from "./pages/Login";
import Members from "./pages/Members";
import Organizations from "./pages/Organizations";
import Profile from "./pages/Profile";

function Shell({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/organizations" className="wordmark">
          Workflow
        </Link>
        <nav>
          <Link to="/organizations">Organizations</Link>
          <Link to="/profile">Profile</Link>
          <span className="who">{user?.name}</span>
          <button type="button" onClick={logout}>
            Sign out
          </button>
        </nav>
      </header>
      <main className="canvas">{children}</main>
    </div>
  );
}

function Private({ children }) {
  return (
    <ProtectedRoute>
      <Shell>{children}</Shell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/organizations" replace />} />
      <Route
        path="/organizations"
        element={
          <Private>
            <Organizations />
          </Private>
        }
      />
      <Route
        path="/organizations/:orgId/members"
        element={
          <Private>
            <Members />
          </Private>
        }
      />
      <Route
        path="/organizations/:orgId/boards"
        element={
          <Private>
            <Boards />
          </Private>
        }
      />
      <Route
        path="/boards/:boardId"
        element={
          <Private>
            <BoardView />
          </Private>
        }
      />
      <Route
        path="/profile"
        element={
          <Private>
            <Profile />
          </Private>
        }
      />
      <Route path="*" element={<Navigate to="/organizations" replace />} />
    </Routes>
  );
}
