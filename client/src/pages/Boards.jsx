import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Boards() {
  const { orgId } = useParams();
  const { token } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [boards, setBoards] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState("");

  const canManage = organization?.role === "admin" || organization?.role === "member";

  async function load(archived = showArchived) {
    const [orgData, boardData] = await Promise.all([
      api(`/api/organizations/${orgId}`, { token }),
      api(`/api/organizations/${orgId}/boards?includeArchived=${archived}`, { token }),
    ]);
    setOrganization(orgData);
    setBoards(boardData.boards);
  }

  useEffect(() => {
    let cancelled = false;
    load(showArchived).catch((err) => {
      if (!cancelled) setError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, token, showArchived]);

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/organizations/${orgId}/boards`, {
        method: "POST",
        token,
        body: { name: name.trim(), description: description.trim() },
      });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleArchive(board) {
    setError("");
    try {
      await api(`/api/boards/${board._id}/${board.archivedAt ? "restore" : "archive"}`, {
        method: "POST",
        token,
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Organization</p>
          <h1>{organization?.organization.name || "Boards"}</h1>
        </div>
        <Link to={`/organizations/${orgId}/members`}>Members</Link>
      </header>
      {canManage ? (
        <form className="inline-form" onSubmit={create}>
          <label htmlFor="board-name">New board</label>
          <input
            id="board-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
            placeholder="Board name"
          />
          <label className="sr-only" htmlFor="board-description">
            Description
          </label>
          <input
            id="board-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            placeholder="Short description"
          />
          <button className="primary" type="submit">
            Create board
          </button>
        </form>
      ) : null}
      <label className="check lone">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
        />
        Show archived boards
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {boards.length === 0 ? <p className="empty">No boards to show.</p> : null}
      <div className="card-grid">
        {boards.map((board) => (
          <article key={board._id} className="panel">
            {board.archivedAt ? <p className="role-pill">Archived</p> : <p className="role-pill">Active</p>}
            <h2>{board.name}</h2>
            <p>{board.description || "No description yet."}</p>
            <div className="panel-links">
              <Link to={`/boards/${board._id}`}>Open</Link>
              {canManage ? (
                <button type="button" onClick={() => toggleArchive(board)}>
                  {board.archivedAt ? "Restore" : "Archive"}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
