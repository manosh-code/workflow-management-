import { useEffect, useState } from "react";
import { api } from "../api/client";

const COLORS = ["coral", "teal", "navy", "gold", "olive", "plum"];

function dateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function toDue(value) {
  if (!value) return null;
  return `${value}T12:00:00.000Z`;
}

function describe(entry) {
  const labels = {
    "card.created": "created this card",
    "card.updated": "updated this card",
    "card.moved": "moved this card",
    "card.archived": "archived this card",
    "card.restored": "restored this card",
    "card.assigned": "updated assignees",
    "comment.added": "commented",
  };
  return `${entry.actorName} ${labels[entry.action] || entry.action}`;
}

export default function CardModal({ card, boardId, lists, labels, members, canWrite, token, onClose, onChanged }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(dateInput(card.dueDate));
  const [assigneeIds, setAssigneeIds] = useState(card.assigneeIds || []);
  const [labelIds, setLabelIds] = useState(card.labelIds || []);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [comment, setComment] = useState("");
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState("teal");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api(`/api/cards/${card._id}/comments`, { token }),
      api(`/api/cards/${card._id}/activity`, { token }),
    ])
      .then(([commentData, activityData]) => {
        if (cancelled) return;
        setComments(commentData.comments);
        setActivity(activityData.activities);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [card._id, token]);

  function toggle(list, id, setter) {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/api/cards/${card._id}`, {
        method: "PATCH",
        token,
        body: {
          title: title.trim(),
          description: description.trim(),
          dueDate: toDue(dueDate),
          assigneeIds,
          labelIds,
        },
      });
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function moveTo(listId) {
    if (listId === card.listId) return;
    setError("");
    try {
      await api(`/api/cards/${card._id}/move`, {
        method: "POST",
        token,
        body: { listId, index: 0 },
      });
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleArchive() {
    setError("");
    try {
      await api(`/api/cards/${card._id}/${card.archivedAt ? "restore" : "archive"}`, {
        method: "POST",
        token,
      });
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    const body = comment.trim();
    if (!body) return;
    setError("");
    try {
      const data = await api(`/api/cards/${card._id}/comments`, {
        method: "POST",
        token,
        body: { body },
      });
      setComments((current) => [...current, data.comment]);
      setComment("");
      const activityData = await api(`/api/cards/${card._id}/activity`, { token });
      setActivity(activityData.activities);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createLabel(event) {
    event.preventDefault();
    const name = labelName.trim();
    if (!name) return;
    setError("");
    try {
      const data = await api(`/api/boards/${boardId}/labels`, {
        method: "POST",
        token,
        body: { name, color: labelColor },
      });
      setLabelName("");
      setLabelIds((current) => [...current, data.label._id]);
      await onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <p className="eyebrow">Card</p>
          <button type="button" className="text-button" onClick={onClose}>
            Close
          </button>
        </header>
        {error ? <p className="form-error">{error}</p> : null}
        <form onSubmit={save} className="modal-grid">
          <div>
            <label htmlFor="card-title">Title</label>
            <input
              id="card-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canWrite}
              required
              maxLength={200}
            />
            <label htmlFor="card-description">Description</label>
            <textarea
              id="card-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!canWrite}
              rows={6}
              maxLength={5000}
            />
            <h3 id="card-dialog-title" className="sr-only">
              {title || "Card details"}
            </h3>
            <section className="thread">
              <h3>Comments</h3>
              {comments.length === 0 ? <p className="empty-inline">No comments yet.</p> : null}
              <ul className="comment-list">
                {comments.map((item) => (
                  <li key={item._id}>
                    <strong>{item.author?.name || "Member"}</strong>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <p>{item.body}</p>
                  </li>
                ))}
              </ul>
              {canWrite ? (
                <div className="comment-form">
                  <label htmlFor="comment-body">Add a comment</label>
                  <textarea
                    id="comment-body"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                    maxLength={2000}
                  />
                  <button type="button" onClick={submitComment} disabled={!comment.trim()}>
                    Comment
                  </button>
                </div>
              ) : null}
            </section>
          </div>
          <aside>
            <label htmlFor="move-list">Move to</label>
            <select
              id="move-list"
              value={card.listId}
              disabled={!canWrite}
              onChange={(event) => moveTo(event.target.value)}
            >
              {lists.map((list) => (
                <option key={list._id} value={list._id}>
                  {list.name}
                </option>
              ))}
            </select>
            <label htmlFor="due-date">Due date</label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={!canWrite}
            />
            <fieldset disabled={!canWrite}>
              <legend>Assignees</legend>
              {members.map((member) => (
                <label key={member.userId} className="check">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(member.userId)}
                    onChange={() => toggle(assigneeIds, member.userId, setAssigneeIds)}
                  />
                  {member.name}
                </label>
              ))}
            </fieldset>
            <fieldset disabled={!canWrite}>
              <legend>Labels</legend>
              {labels.map((label) => (
                <label key={label._id} className="check">
                  <input
                    type="checkbox"
                    checked={labelIds.includes(label._id)}
                    onChange={() => toggle(labelIds, label._id, setLabelIds)}
                  />
                  <span className={`chip chip-${label.color}`}>{label.name}</span>
                </label>
              ))}
            </fieldset>
            {canWrite ? (
              <div className="label-create">
                <label htmlFor="new-label">New label</label>
                <input
                  id="new-label"
                  value={labelName}
                  onChange={(event) => setLabelName(event.target.value)}
                  maxLength={40}
                />
                <label className="sr-only" htmlFor="label-color">
                  Label color
                </label>
                <select id="label-color" value={labelColor} onChange={(event) => setLabelColor(event.target.value)}>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={createLabel} disabled={!labelName.trim()}>
                  Add label
                </button>
              </div>
            ) : null}
            <div className="modal-actions">
              {canWrite ? (
                <button type="submit" className="primary" disabled={saving || !title.trim()}>
                  Save card
                </button>
              ) : null}
              {canWrite ? (
                <button type="button" onClick={toggleArchive}>
                  {card.archivedAt ? "Restore card" : "Archive card"}
                </button>
              ) : null}
            </div>
            <section className="thread">
              <h3>Activity</h3>
              <ul className="activity-list">
                {activity.map((entry) => (
                  <li key={entry._id}>
                    <p>{describe(entry)}</p>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}
