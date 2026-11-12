function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function dueLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function CardItem({ card, labels, members, draggable, onOpen, onDragStart, onDropBefore }) {
  const cardLabels = labels.filter((label) => card.labelIds?.includes(label._id));
  const assignees = members.filter((member) => card.assigneeIds?.includes(member.userId));
  const overdue = card.dueDate && new Date(card.dueDate).getTime() < Date.now();

  return (
    <article
      className={`card-item${card.archivedAt ? " is-archived" : ""}`}
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", card._id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(event) => {
        if (draggable) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDropBefore();
      }}
    >
      <button type="button" className="card-open" onClick={() => onOpen(card)}>
        {cardLabels.length > 0 ? (
          <span className="label-row">
            {cardLabels.map((label) => (
              <span key={label._id} className={`chip chip-${label.color}`}>
                {label.name}
              </span>
            ))}
          </span>
        ) : null}
        <span className="card-title">{card.title}</span>
        <span className="card-meta">
          {card.dueDate ? <span className={overdue ? "due overdue" : "due"}>{dueLabel(card.dueDate)}</span> : <span />}
          <span className="avatars">
            {assignees.map((member) => (
              <span key={member.userId} className="avatar" title={member.name}>
                {initials(member.name)}
              </span>
            ))}
          </span>
        </span>
      </button>
    </article>
  );
}
