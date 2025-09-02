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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative z-10 bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div>
            <h3 className="text-xl font-bold text-white">Payment Proof</h3>
            <p className="text-gray-300 text-sm mt-1">Submitted by: {guestName}</p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Image content */}
        <div className="p-6">
          {imageLoadError ? (
            <div className="flex items-center justify-center h-64 bg-gray-700/30 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XMarkIcon className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-300 font-medium">Failed to load image</p>
                <p className="text-gray-400 text-sm mt-1">The payment proof image could not be loaded</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={fullImageUrl}
                alt={`Payment proof from ${guestName}`}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                onError={() => setImageLoadError(true)}
                onLoad={() => setImageLoadError(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700/50">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
