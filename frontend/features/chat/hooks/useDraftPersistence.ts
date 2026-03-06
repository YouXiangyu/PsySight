import { useEffect, useState } from 'react';

export function useDraftPersistence(key: string) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem(key);
    if (cached) {
      setValue(cached);
    }
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
