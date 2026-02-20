import useMeasure from 'react-use-measure';

export interface AuraMeasureResult<T extends Element = HTMLDivElement> {
  ref: (element: T | null) => void;
  width: number;
  height: number;
}

export function useAuraMeasure<T extends Element = HTMLDivElement>(): AuraMeasureResult<T> {
  const [ref, bounds] = useMeasure<T>({
    debounce: { resize: 120, scroll: 0 },
  });

  return {
    ref,
    width: Math.max(1, bounds.width || 0),
    height: Math.max(1, bounds.height || 0),
  };
}

