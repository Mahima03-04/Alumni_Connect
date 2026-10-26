import { TableSkeleton } from './LoadingState';
import EmptyState from './EmptyState';

/**
 * Generic data table driven by a column definition array.
 *
 * columns: [{ key, header, render?(row), className?, headerClassName? }]
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  rowKey = (row, index) => row?.id || row?._id || index,
  emptyTitle = 'Nothing to show',
  emptyDescription = '',
  emptyAction = null,
  onRowClick = null,
  className = '',
}) {
  if (loading) return <TableSkeleton cols={Math.min(columns.length || 5, 6)} />;

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className={`table-wrap ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.headerClassName || ''}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.className || ''}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
