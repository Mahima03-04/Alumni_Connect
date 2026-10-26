/** Labelled select control used by filter bars and forms. */
export default function FilterSelect({ label, value, onChange, options = [], allLabel = 'All', name, className = '' }) {
  const id = name || `filter-${String(label).replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={className}>
      {label ? (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select id={id} name={id} className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {allLabel ? <option value="">{allLabel}</option> : null}
        {options.map((option) => {
          const val = typeof option === 'string' ? option : option.value;
          const text = typeof option === 'string' ? option : option.label;
          return (
            <option key={val} value={val}>
              {text}
            </option>
          );
        })}
      </select>
    </div>
  );
}
