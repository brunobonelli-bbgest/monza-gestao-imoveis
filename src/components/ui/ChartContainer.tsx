import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '../../utils/cn';

interface ChartContainerProps {
  children: React.ReactElement;
  height?: number | string;
  className?: string;
  minHeight?: number | string;
  fallback?: React.ReactNode;
}

/**
 * Global Standard Wrapper for Recharts components.
 * 
 * Solves the "The width(-1) and height(-1) of chart should be greater than 0" warning
 * by ensuring the chart only renders after mounting and within a container with 
 * explicit dimensions.
 */
export const ChartContainer = ({ 
  children, 
  height = 300, 
  minHeight = 300,
  className,
  fallback
}: ChartContainerProps) => {
  const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use a small delay to let the layout settle before observing
    const initTimer = setTimeout(() => {
      if (!containerRef.current) return;
      
      const observer = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" errors
        // and ensure we are in sync with the browser's paint cycle
        window.requestAnimationFrame(() => {
          if (!entries.length) return;
          const entry = entries[0];
          const { width, height } = entry.contentRect;
          
          // Only update if we have valid dimensions
          if (width > 0 && height > 0) {
            setDimensions({ width, height });
          }
        });
      });

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
      };
    }, 100);

    return () => clearTimeout(initTimer);
  }, []);

  // Determine height class for Tailwind
  const heightClass = typeof height === 'number' ? `h-[${height}px]` : '';
  const minHeightClass = typeof minHeight === 'number' ? `min-h-[${minHeight}px]` : '';

  return (
    <div 
      ref={containerRef}
      className={cn(
        "w-full min-w-0 relative overflow-hidden", 
        heightClass,
        minHeightClass,
        className
      )} 
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight
      }}
    >
      {dimensions ? (
        <ResponsiveContainer 
          width={dimensions.width} 
          height={dimensions.height}
          key={`${dimensions.width}-${dimensions.height}`}
        >
          {children}
        </ResponsiveContainer>
      ) : (
        fallback || (
          <div className="w-full h-full bg-slate-50/50 animate-pulse rounded-lg flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-petrol-200 border-t-petrol-600 rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Preparando Gráfico...
            </span>
          </div>
        )
      )}
    </div>
  );
};
