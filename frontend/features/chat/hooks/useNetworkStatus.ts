import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [networkOnline, setNetworkOnline] = useState(true);

  useEffect(() => {
    setNetworkOnline(window.navigator.onLine);
    const onOnline = () => setNetworkOnline(true);
    const onOffline = () => setNetworkOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return networkOnline;
}
