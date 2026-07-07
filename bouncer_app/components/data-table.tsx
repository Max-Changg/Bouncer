'use client';

import { useState, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Database } from '@/lib/database.types';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

interface DataTableProps<TData, TValue> {
  columns:
    | ColumnDef<TData, TValue>[]
    | ((
        onVerificationChange: (id: string, verified: boolean) => void,
        onViewPaymentProof?: (imageUrl: string, guestName: string) => void,
        onAmountPaidChange?: (id: string, amount: number) => void
      ) => ColumnDef<TData, TValue>[]);
  data: TData[];
  onSave: (updatedData: TData[]) => Promise<void> | void;
  onViewPaymentProof?: (imageUrl: string, guestName: string) => void;
  onAmountPaidChange?: (id: string, amount: number) => void;
  onSendEmails?: () => void;
}

export function DataTable<
  TData extends {
    id: string;
    is_approved: boolean;
  },
  TValue,
>({
  columns,
  data,
  onSave,
  onViewPaymentProof,
  onAmountPaidChange,
  onSendEmails,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [tableData, setTableData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);

  // Update tableData when data prop changes
  useEffect(() => {
    setTableData(data);
  }, [data]);

  const handleVerificationChange = (id: string, verified: boolean) => {
    setTableData(prevData =>
      prevData.map(item =>
        item.id === id ? ({ ...item, is_approved: verified } as TData) : item
      )
    );
  };

  // Handle both static columns and column factory functions
  const resolvedColumns =
    typeof columns === 'function'
      ? columns(
          handleVerificationChange,
          onViewPaymentProof,
          onAmountPaidChange
        )
      : columns;

  const table = useReactTable({
    data: tableData,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use the current table data which includes any verification changes
      await onSave(tableData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                className="border-border bg-muted hover:bg-muted"
              >
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-border transition-colors hover:bg-muted/60"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 text-sm text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={resolvedColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No RSVPs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md text-sm text-muted-foreground">
          Click checkboxes to verify RSVPs, then save changes to update the
          database. Under &quot;Amount Paid&quot;, you can edit the value by the guest by clicking
          the amount.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onSendEmails && (
            <Button onClick={onSendEmails} variant="outline">
              <EnvelopeIcon className="mr-2 h-4 w-4" />
              Send Email to Guests
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
