'use client';

import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  empty,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (data.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-premium">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={getRowKey(row)}
                className={onRowClick ? 'cursor-pointer' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
