import { useState } from "react";
import CardItem from "./CardItem";

export default function ListColumn({
  list,
  cards,
  labels,
  members,
  canWrite,
  dragEnabled,
  onOpen,
  onCreate,
  onRename,
  onDelete,
  onDragCard,
  onDropOnList,
  onDropOnCard,
  onShift,
}) {
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [busy, setBusy] = useState(false);

  async function submitCard(event) {
    event.preventDefault();
    const next = title.trim();
    if (!next) return;
    setBusy(true);
    try {
      await onCreate(list._id, next);
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  async function saveName(event) {
    event.preventDefault();
    const next = name.trim();
    if (!next || next === list.name) {
      setEditing(false);
      setName(list.name);
      return;
    }
    await onRename(list._id, next);
    setEditing(false);
  }

  return (
    <section
      className="list-column"
      onDragOver={(event) => {
        if (dragEnabled) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!dragEnabled) return;
        event.preventDefault();
        onDropOnList(list._id);
      }}
    >
      <header className="list-head">
        {editing ? (
          <form onSubmit={saveName}>
            <label className="sr-only" htmlFor={`list-${list._id}`}>
              List name
            </label>
            <input
              id={`list-${list._id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </form>
        ) : (
          <h2>{list.name}</h2>
        )}
        <span className="count">{cards.length}</span>
      </header>
      {canWrite ? (
        <div className="list-tools">
          <button type="button" onClick={() => onShift(list._id, -1)} aria-label={`Move ${list.name} left`}>
            ←
          </button>
          <button type="button" onClick={() => onShift(list._id, 1)} aria-label={`Move ${list.name} right`}>
            →
          </button>
          <button type="button" onClick={() => setEditing(true)}>
            Rename
          </button>
          <button type="button" onClick={() => onDelete(list)}>
            Delete
          </button>
        </div>
      ) : null}
      <div className="card-stack">
        {cards.map((card) => (
          <CardItem
            key={card._id}
            card={card}
            labels={labels}
            members={members}
            draggable={dragEnabled && !card.archivedAt}
            onOpen={onOpen}
            onDragStart={() => onDragCard(card._id)}
            onDropBefore={() => onDropOnCard(list._id, card._id)}
          />
        ))}
        {cards.length === 0 ? <p className="empty-inline">No cards in this list.</p> : null}
      </div>
      {canWrite ? (
        <form className="add-card" onSubmit={submitCard}>
          <label className="sr-only" htmlFor={`card-${list._id}`}>
            New card in {list.name}
          </label>
          <input
            id={`card-${list._id}`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a card"
            maxLength={200}
          />
          <button type="submit" disabled={busy || !title.trim()}>
            Add
          </button>
        </form>
      ) : null}
    </section>
  );
}
