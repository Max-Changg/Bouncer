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
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                className="border-gray-700/50 bg-gray-800/50"
              >
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-gray-300 font-semibold"
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
                  className="border-gray-700/30 hover:bg-gray-800/40 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="text-gray-200">
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
                  className="h-24 text-center text-gray-400"
                >
                  No RSVPs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Click checkboxes to verify RSVPs, then save changes to update the
          database.
        </div>
        <div className="flex items-center gap-3">
          {onSendEmails && (
            <Button
              onClick={onSendEmails}
              variant="outline"
              className="bg-purple-800/20 border-purple-500/50 text-purple-300 hover:bg-purple-800/40 hover:text-white shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
            >
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Send Email to Guests
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 shadow-lg hover:shadow-green-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
