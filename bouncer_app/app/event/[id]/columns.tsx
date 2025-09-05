'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database } from '@/lib/database.types';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

// Component for editable amount input
const EditableAmountInput = ({
  initialValue,
  onAmountChange,
  rsvpId,
}: {
  initialValue: number | null;
  onAmountChange?: (id: string, amount: number) => void;
  rsvpId: string;
}) => {
  const [value, setValue] = useState(initialValue?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    const numericValue = parseFloat(value) || 0;
    if (onAmountChange) {
      onAmountChange(rsvpId, numericValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setValue(initialValue?.toString() || '');
      setIsEditing(false);
    }
  };

  const formatDisplayValue = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-20 h-8 text-sm bg-gray-700 border-gray-600 text-white"
        autoFocus
      />
    );
  }

  return (
    <span
      className="text-green-400 font-medium cursor-pointer hover:text-green-300 transition-colors"
      onClick={() => setIsEditing(true)}
    >
      {formatDisplayValue(value)}
    </span>
  );
};

export const createColumns = (
  onVerificationChange?: (id: string, verified: boolean) => void,
  onViewPaymentProof?: (imageUrl: string, guestName: string) => void,
  onAmountPaidChange?: (id: string, amount: number) => void
): ColumnDef<
  Database['public']['Tables']['rsvps']['Row'] & {
    ticket_name?: string;
    ticket_price?: number;
  }
>[] => [
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
    accessorKey: 'ticket_name',
    header: 'Ticket Type',
    cell: ({ row }) => {
      const ticketName = row.original.ticket_name;
      return <span className="text-gray-300">{ticketName || 'Unknown'}</span>;
    },
  },
  {
    accessorKey: 'ticket_price',
    header: 'Amount Owed',
    cell: ({ row }) => {
      const ticketPrice = row.original.ticket_price;
      return (
        <span className="text-green-400 font-medium">
          {ticketPrice != null ? `$${ticketPrice.toFixed(2)}` : '$0.00'}
        </span>
      );
    },
  },

  {
    accessorKey: 'amount_paid',
    header: 'Amount Paid',
    cell: ({ row }) => (
      <EditableAmountInput
        initialValue={row.original.amount_paid}
        onAmountChange={onAmountPaidChange}
        rsvpId={row.original.id}
      />
    ),
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
              onViewPaymentProof(
                row.original.payment_proof_url!,
                row.original.name
              );
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
          onCheckedChange={value => {
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
