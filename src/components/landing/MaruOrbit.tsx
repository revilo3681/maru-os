import { MaruEnso } from '../brand/MaruEnso';

interface MaruOrbitProps {
  className?: string;
  /** Nominal desktop diameter in px (scales down via max-width). */
  size?: number;
}

/**
 * Orbit of AI-model badges around the MARU enso.
 * Kept as a thin wrapper for backwards compatibility — the orbit and the
 * enso center now live together in `brand/MaruEnso`.
 */
export function MaruOrbit({ className = '', size = 480 }: MaruOrbitProps) {
  return (
    <MaruEnso
      withOrbit
      size={size}
      showName
      namePlacement="inside"
      className={className}
    />
  );
}
