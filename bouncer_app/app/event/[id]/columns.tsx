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
        className="h-8 w-24 font-mono text-sm"
        autoFocus
      />
    );
  }

  return (
    <span
      className="cursor-pointer font-mono text-sm text-foreground underline decoration-border decoration-dotted underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
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
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: 'ticket_name',
    header: 'Ticket Type',
    cell: ({ row }) => {
      const ticketName = row.original.ticket_name;
      return (
        <span className="text-sm text-foreground">
          {ticketName || 'Unknown'}
        </span>
      );
    },
  },
  {
    accessorKey: 'ticket_price',
    header: 'Amount Owed',
    cell: ({ row }) => {
      const ticketPrice = row.original.ticket_price;
      return (
        <span className="font-mono text-sm text-foreground">
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
        initialValue={row.original.amount_paid ?? null}
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
        return (
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground">
            NO PROOF
          </span>
        );
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
          className="gap-1.5"
        >
          <EyeIcon className="h-4 w-4" />
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
      <div className="flex items-center gap-2">
        <span>Verified</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#067a53]"></span>
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
          className="h-5 w-5 data-[state=checked]:border-[#067a53] data-[state=checked]:bg-[#067a53]"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
