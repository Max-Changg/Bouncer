'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FlipCardProps {
  stepNumber: number;
  title: string;
  description: string;
  features: string[];
  color: 'purple' | 'orange';
  isFlipped?: boolean;
  onFlip?: () => void;
}

export default function FlipCard({
  stepNumber,
  title,
  description,
  features,
  color,
  isFlipped = false,
  onFlip,
}: FlipCardProps) {
  const [isFlippedInternal, setIsFlippedInternal] = useState(false);

  const isCardFlipped = onFlip ? isFlipped : isFlippedInternal;
  const handleFlip = onFlip
    ? onFlip
    : () => setIsFlippedInternal(!isFlippedInternal);

  const colorClasses = {
    purple: {
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      number: 'text-purple-400',
    },
    orange: {
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      number: 'text-orange-400',
    },
  };

  const currentColor = colorClasses[color];

  return (
    <div
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          isCardFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of card */}
        <div
          className={`absolute w-full h-full bg-black/30 backdrop-blur-sm rounded-lg p-6 border ${currentColor.border} backface-hidden`}
        >
          <div
            className={`w-12 h-12 ${currentColor.bg} rounded-lg flex items-center justify-center mb-4`}
          >
            <span className={`text-2xl font-bold ${currentColor.number}`}>
              {stepNumber}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
          <p className="text-gray-300 mb-4">{description}</p>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-400">Click to learn more</span>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={`absolute w-full h-full bg-black/30 backdrop-blur-sm rounded-lg p-6 border ${currentColor.border} backface-hidden rotate-y-180`}
        >
          <div className="h-full flex flex-col">
            <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
            <ul className="text-sm text-gray-400 space-y-2 flex-grow">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className={`mr-2 mt-1 ${currentColor.text}`}>•</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="text-center mt-4">
              <span className="text-sm text-gray-400">Click to go back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
