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

  return <QRScanner onScan={handleScan} onError={onError} />;
};

export default Scanner;
