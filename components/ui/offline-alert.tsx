'use client';

import { useEffect, useState } from 'react';
import { WifiOffIcon, DatabaseIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isOffline } from '@/lib/firebase';

export function OfflineAlert() {
  const [offline, setOffline] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  
  useEffect(() => {
    // Set initial offline status
    setOffline(isOffline());
    
    // Listen for online/offline events
    const handleOnline = () => {
      setOffline(false);
      setOfflineDismissed(false);
    };
    
    const handleOffline = () => {
      setOffline(true);
      setOfflineDismissed(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!offline || offlineDismissed) {
    return null;
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOffIcon className="h-4 w-4 mr-2" />
      <AlertTitle>You are offline</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Some features may be limited or unavailable. Cached content is still accessible.</span>
        <button 
          onClick={() => setOfflineDismissed(true)}
          className="text-xs underline hover:no-underline ml-2"
        >
          Dismiss
        </button>
      </AlertDescription>
    </Alert>
  );
}

export function CachedDataAlert() {
  return (
    <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
      <DatabaseIcon className="h-4 w-4 mr-2" />
      <AlertTitle>Viewing cached data</AlertTitle>
      <AlertDescription>
        You're currently viewing cached data which may be outdated. 
        Some content might be unavailable until you're back online.
      </AlertDescription>
    </Alert>
  );
} 