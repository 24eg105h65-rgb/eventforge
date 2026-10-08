export function EmptyState({ eyebrow, title, description, action }) {
  return (
    <div className="eventforge-empty-state">
      <span className="eventforge-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="eventforge-empty-state__action">{action}</div> : null}
    </div>
  );
}
