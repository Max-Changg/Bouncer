'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/database.types';
import { EyeIcon } from '@heroicons/react/24/outline';

export const createColumns = (
  onVerificationChange?: (id: string, verified: boolean) => void,
  onViewPaymentProof?: (imageUrl: string, guestName: string) => void
): ColumnDef<Database['public']['Tables']['rsvps']['Row']>[] => [
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
  {
    id: 'payment_proof',
    header: 'Payment Proof',
    cell: ({ row }) => {
      if (!row.original.payment_proof_url) {
        return <span className="text-gray-500 text-sm">No proof</span>;
      }
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (onViewPaymentProof) {
              onViewPaymentProof(row.original.payment_proof_url!, row.original.name);
            }
          }}
          className="bg-blue-800/20 border-blue-500/50 text-blue-300 hover:bg-blue-800/40 hover:text-white flex items-center space-x-1"
        >
          <EyeIcon className="w-4 h-4" />
          <span>View</span>
        </Button>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'verified',
    header: () => (
      <div className="flex items-center space-x-2">
        <span>Verified?</span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.original.is_approved}
          onCheckedChange={(value) => {
            if (onVerificationChange) {
              onVerificationChange(row.original.id, !!value);
            }
          }}
          aria-label={`Verify RSVP for ${row.original.name}`}
          className="w-5 h-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 hover:border-green-500 transition-colors"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
