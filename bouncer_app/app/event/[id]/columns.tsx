'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Database } from '@/lib/database.types';

export const columns: ColumnDef<
  Database['public']['Tables']['rsvps']['Row']
>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'payment_status',
    header: 'Payment Status',
  },
  {
    accessorKey: 'amount_paid',
    header: 'Amount Paid',
    cell: ({ row }) => row.original.amount_paid != null ? `$${row.original.amount_paid.toFixed(2)}` : '-',
  },
];
