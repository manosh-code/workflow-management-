import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import CardModal from "../components/CardModal";
import ListColumn from "../components/List";
import { useAuth } from "../context/AuthContext";

function describeBoard(entry) {
  const labels = {
    "board.created": "created this board",
    "board.updated": "updated the board",
    "board.archived": "archived the board",
    "board.restored": "restored the board",
    "list.created": "added a list",
    "list.renamed": "renamed a list",
    "list.reordered": "reordered the lists",
    "list.deleted": "deleted a list",
    "card.created": "created a card",
    "card.updated": "updated a card",
    "card.moved": "moved a card",
    "card.archived": "archived a card",
    "card.restored": "restored a card",
    "card.assigned": "updated assignees",
    "comment.added": "commented on a card",
  };
  const detail = entry.metadata?.name || entry.metadata?.title;
  return `${entry.actorName} ${labels[entry.action] || entry.action}${detail ? `: ${detail}` : ""}`;
}

export default function BoardView() {
  const { boardId } = useParams();
  const { token } = useAuth();
  const draggingId = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [listName, setListName] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [query, setQuery] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [labelId, setLabelId] = useState("");
  const [due, setDue] = useState("all");
  const [matchedIds, setMatchedIds] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [activity, setActivity] = useState(null);
  const [boardName, setBoardName] = useState("");

  async function load() {
    const view = await api(`/api/boards/${boardId}?includeArchived=${includeArchived}`, { token });
    setData(view);
    setBoardName(view.board.name);
    return view;
  }

  useEffect(() => {
    let cancelled = false;
    setError("");
    load().catch((err) => {
      if (!cancelled) setError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [boardId, token, includeArchived]);

  useEffect(() => {
    const filtering = query.trim() || assigneeId || labelId || due !== "all";
    if (!filtering) {
      setMatchedIds(null);
      return undefined;
    }
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ boardId });
      if (query.trim()) params.set("q", query.trim());
      if (assigneeId) params.set("assigneeId", assigneeId);
      if (labelId) params.set("labelId", labelId);
      if (due !== "all") params.set("due", due);
      api(`/api/search?${params.toString()}`, { token })
        .then((result) => setMatchedIds(new Set(result.cards.map((card) => card._id))))
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, assigneeId, labelId, due, boardId, token]);

  const canWrite = Boolean(data && (data.role === "admin" || data.role === "member") && !data.board.archivedAt);
  const dragEnabled = canWrite && matchedIds === null;

  function cardsFor(listId) {
    return (data?.cards || []).filter((card) => {
      if (card.listId !== listId) return false;
      if (matchedIds && !matchedIds.has(card._id)) return false;
      return true;
    });
  }

  async function run(action) {
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function dropIndex(listId, beforeCardId) {
    const siblings = (data?.cards || []).filter(
      (card) => card.listId === listId && !card.archivedAt && card._id !== draggingId.current,
    );
    if (!beforeCardId) return siblings.length;
    const index = siblings.findIndex((card) => card._id === beforeCardId);
    return index < 0 ? siblings.length : index;
  }

  async function showActivity() {
    setError("");
    try {
      const result = await api(`/api/boards/${boardId}/activity`, { token });
      setActivity(result.activities);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data && !error) return <p className="status">Loading board…</p>;

  return (
    <section className="board-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">
            <Link to={data ? `/organizations/${data.board.organizationId}/boards` : "/organizations"}>Boards</Link>
          </p>
          {canWrite ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                run(() =>
                  api(`/api/boards/${boardId}`, {
                    method: "PATCH",
                    token,
                    body: { name: boardName.trim() },
                  }),
                );
              }}
            >
              <label className="sr-only" htmlFor="board-title">
                Board name
              </label>
              <input
                id="board-title"
                className="title-input"
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
              />
            </form>
          ) : (
            <h1>{data?.board.name || "Board"}</h1>
          )}
          <p>{data?.board.description}</p>
        </div>
        <div className="head-actions">
          <button type="button" onClick={showActivity}>
            Activity
          </button>
          {canWrite ? (
            <button
              type="button"
              onClick={() =>
                run(() => api(`/api/boards/${boardId}/archive`, { method: "POST", token }))
              }
            >
              Archive board
            </button>
          ) : null}
          {data?.board.archivedAt && (data.role === "admin" || data.role === "member") ? (
            <button
              type="button"
              onClick={() =>
                run(() => api(`/api/boards/${boardId}/restore`, { method: "POST", token }))
              }
            >
              Restore board
            </button>
          ) : null}
        </div>
      </header>
      {data?.board.archivedAt ? <p className="banner">This board is archived. Restore it to make changes.</p> : null}
      {data?.role === "viewer" ? <p className="banner">You have view-only access to this board.</p> : null}
      <form className="filters">
        <label htmlFor="card-search">Search titles</label>
        <input id="card-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cards" />
        <label className="sr-only" htmlFor="assignee-filter">
          Assignee
        </label>
        <select id="assignee-filter" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
          <option value="">All assignees</option>
          {data?.members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="label-filter">
          Label
        </label>
        <select id="label-filter" value={labelId} onChange={(event) => setLabelId(event.target.value)}>
          <option value="">All labels</option>
          {data?.labels.map((label) => (
            <option key={label._id} value={label._id}>
              {label.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="due-filter">
          Due date
        </label>
        <select id="due-filter" value={due} onChange={(event) => setDue(event.target.value)}>
          <option value="all">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
          <option value="none">No due date</option>
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Archived cards
        </label>
      </form>
      {matchedIds ? <p className="status">Drag is paused while filters are active.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="board-scroll">
        {data?.lists.map((list) => (
          <ListColumn
            key={list._id}
            list={list}
            cards={cardsFor(list._id)}
            labels={data.labels}
            members={data.members}
            canWrite={canWrite}
            dragEnabled={dragEnabled}
            onOpen={setActiveCard}
            onCreate={(listId, title) =>
              run(() => api(`/api/lists/${listId}/cards`, { method: "POST", token, body: { title } }))
            }
            onRename={(listId, name) =>
              run(() => api(`/api/lists/${listId}`, { method: "PATCH", token, body: { name } }))
            }
            onDelete={(list) =>
              run(() => api(`/api/lists/${list._id}`, { method: "DELETE", token }))
            }
            onDragCard={(cardId) => {
              draggingId.current = cardId;
            }}
            onDropOnList={(listId) => {
              const cardId = draggingId.current;
              if (!cardId) return;
              run(() =>
                api(`/api/cards/${cardId}/move`, {
                  method: "POST",
                  token,
                  body: { listId, index: dropIndex(listId, null) },
                }),
              );
            }}
            onDropOnCard={(listId, beforeCardId) => {
              const cardId = draggingId.current;
              if (!cardId || cardId === beforeCardId) return;
              run(() =>
                api(`/api/cards/${cardId}/move`, {
                  method: "POST",
                  token,
                  body: { listId, index: dropIndex(listId, beforeCardId) },
                }),
              );
            }}
            onShift={(listId, direction) => {
              const ids = data.lists.map((item) => item._id);
              const index = ids.indexOf(listId);
              const next = index + direction;
              if (next < 0 || next >= ids.length) return;
              const reordered = [...ids];
              const [moved] = reordered.splice(index, 1);
              reordered.splice(next, 0, moved);
              run(() =>
                api(`/api/boards/${boardId}/lists/reorder`, {
                  method: "POST",
                  token,
                  body: { listIds: reordered },
                }),
              );
            }}
          />
        ))}
        {canWrite ? (
          <form
            className="new-list"
            onSubmit={(event) => {
              event.preventDefault();
              const name = listName.trim();
              if (!name) return;
              setListName("");
              run(() => api(`/api/boards/${boardId}/lists`, { method: "POST", token, body: { name } }));
            }}
          >
            <label htmlFor="new-list">New list</label>
            <input
              id="new-list"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              maxLength={80}
              placeholder="List name"
            />
            <button className="primary" type="submit" disabled={!listName.trim()}>
              Add list
            </button>
          </form>
        ) : null}
      </div>
      {activity ? (
        <aside className="activity-panel">
          <div className="modal-head">
            <h2>Board activity</h2>
            <button type="button" className="text-button" onClick={() => setActivity(null)}>
              Close
            </button>
          </div>
          <ul className="activity-list">
            {activity.length === 0 ? <li>No activity yet.</li> : null}
            {activity.map((entry) => (
              <li key={entry._id}>
                <p>{describeBoard(entry)}</p>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
      {activeCard && data ? (
        <CardModal
          card={data.cards.find((card) => card._id === activeCard._id) || activeCard}
          boardId={boardId}
          lists={data.lists}
          labels={data.labels}
          members={data.members}
          canWrite={canWrite}
          token={token}
          onClose={() => setActiveCard(null)}
          onChanged={load}
        />
      ) : null}
    </section>
  );
}
