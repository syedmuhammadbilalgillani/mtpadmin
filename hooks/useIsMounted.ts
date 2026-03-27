// hooks/useIsMounted.ts
import { useEffect, useState, startTransition } from "react";

export function useIsMounted() {
  const [isMounted, setIsMounted] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
  }, []);

  return isMounted;
}