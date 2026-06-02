export function PaginationButton({ onClick, disabled, children, className = '', style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-sm py-1.5 px-3 rounded-lg font-medium motion-safe:transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`.trim()}
      style={style}
    >
      {children}
    </button>
  );
}
