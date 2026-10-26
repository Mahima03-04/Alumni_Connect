import { STATUS_STYLES } from '../utils/constants';
import { titleCase } from '../utils/format';

/** Small coloured pill used for every status in the app. */
export default function StatusBadge({ status, label, className = '' }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] || 'bg-navy-100 text-navy-600';
  return (
    <span className={`badge ${style} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label || titleCase(status)}
    </span>
  );
}
