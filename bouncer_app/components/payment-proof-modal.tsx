'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  guestName: string;
}

export default function PaymentProofModal({ isOpen, onClose, imageUrl, guestName }: PaymentProofModalProps) {
  const [imageLoadError, setImageLoadError] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string>('');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen && imageUrl) {
      // Get the public URL for the image
      const { data } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(imageUrl);
      
      setFullImageUrl(data.publicUrl);
      setImageLoadError(false);
    }
  }, [isOpen, imageUrl, supabase]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim page overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_48px_-20px_rgba(20,19,24,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Payment Proof
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              Submitted by: {guestName}
            </h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Image content */}
        <div className="p-6">
          {imageLoadError ? (
            <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <XMarkIcon className="h-8 w-8 text-red-600" />
                </div>
                <p className="font-medium text-red-600">Failed to load image</p>
                <p className="mt-1 text-sm text-muted-foreground">The payment proof image could not be loaded</p>
              </div>
            </div>
          ) : fullImageUrl ? (
            <div className="flex justify-center">
              <img
                src={fullImageUrl}
                alt={`Payment proof from ${guestName}`}
                className="max-h-[60vh] max-w-full rounded-lg border border-border object-contain shadow-sm"
                onError={() => setImageLoadError(true)}
                onLoad={() => setImageLoadError(false)}
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"></div>
                </div>
                <p className="font-medium text-muted-foreground">Loading image...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border p-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
