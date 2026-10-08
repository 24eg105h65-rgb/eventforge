export function Card({ children, className = '', ...props }) {
  return (
    <article className={`eventforge-card ${className}`.trim()} {...props}>
      {children}
    </article>
  );
}
