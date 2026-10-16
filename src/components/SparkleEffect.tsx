import React from 'react';
import { Sparkles, Star } from 'lucide-react';

interface SparkleProps {
  className?: string;
  size?: number;
}

export const SparkleGlow: React.FC<SparkleProps> = ({ className = '', size = 16 }) => {
  return (
    <span className={`inline-flex items-center justify-center relative text-blue-400 ${className}`}>
      <Sparkles size={size} className="sparkle-twinkle filter drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
    </span>
  );
};

export const StarSparkle: React.FC<SparkleProps> = ({ className = '', size = 12 }) => {
  return (
    <span className={`inline-flex items-center justify-center relative text-blue-300 ${className}`}>
      <Star size={size} className="sparkle-twinkle-delayed fill-blue-300/40 filter drop-shadow-[0_0_5px_rgba(147,197,253,0.9)]" />
    </span>
  );
};
