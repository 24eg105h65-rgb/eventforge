export function Input({ label, id, className = '', ...props }) {
  return (
    <label className="eventforge-field" htmlFor={id}>
      {label ? <span>{label}</span> : null}
      <input id={id} className={`eventforge-input ${className}`.trim()} {...props} />
    </label>
  );
}
