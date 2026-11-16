import React, { useState } from 'react';
import { Cpu } from 'lucide-react';

interface ConceptImageFrameProps {
  src: string;
  alt: string;
  caption?: string;
  kicker?: string;
  invariant?: string;
  heightClass?: string;
  compact?: boolean;
}

export const ConceptImageFrame: React.FC<ConceptImageFrameProps> = ({
  src,
  alt,
  caption,
  kicker,
  invariant,
  heightClass = 'h-56 sm:h-64',
  compact = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 ${heightClass}`}>
      {!imgFailed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-4 text-slate-300">
          <Cpu className="h-8 w-8 text-sky-400" aria-hidden="true" />
          <span className="mt-2 text-xs font-medium text-slate-300">{caption || alt}</span>
        </div>
      )}

      {(caption || kicker || invariant) && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent"
          />
          <div className={`absolute inset-x-0 bottom-0 text-white ${compact ? 'p-3.5' : 'p-5'}`}>
            {kicker && (
              <div className="text-xs font-medium text-sky-200">{kicker}</div>
            )}
            {caption && (
              <div className={`font-display font-bold tracking-wide text-white ${compact ? 'text-sm mt-0.5' : 'text-lg mt-1'}`}>
                {caption}
              </div>
            )}
            {invariant && !compact && (
              <div className="mt-1.5 font-mono text-xs text-slate-200">
                Invariant: {invariant}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
