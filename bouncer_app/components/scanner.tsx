'use client';

import { Scanner as QRScanner } from '@yudiel/react-qr-scanner';

interface ScannerProps {
  onScan: (result: string) => void;
  onError: (error: any) => void;
}

const Scanner = ({ onScan, onError }: ScannerProps) => {
  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      onScan(detectedCodes[0].rawValue);
    }
  };

  return (
    <div className="rounded-2xl bg-muted p-3">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <QRScanner onScan={handleScan} onError={onError} />
        {/* Viewfinder corner brackets */}
        <span className="pointer-events-none absolute left-3 top-3 z-10 h-5 w-5 rounded-tl border-l-2 border-t-2 border-white/85" />
        <span className="pointer-events-none absolute right-3 top-3 z-10 h-5 w-5 rounded-tr border-r-2 border-t-2 border-white/85" />
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 h-5 w-5 rounded-bl border-b-2 border-l-2 border-white/85" />
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 h-5 w-5 rounded-br border-b-2 border-r-2 border-white/85" />
      </div>
    </div>
  );
};

export default Scanner;
