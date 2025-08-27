import { useEffect, useState } from 'react';

export interface NetworkState {
  isConnected: boolean;
  lastConnectedAt: Date | null;
}

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true, // Default to connected
    lastConnectedAt: new Date(),
  });

  useEffect(() => {
    // Simple network monitoring via API calls
    const checkConnection = async () => {
      try {
        // Ping our own API health endpoint
        const response = await fetch('http://192.168.1.117:13350/health', {
          method: 'GET',
          cache: 'no-cache',
        });
        
        if (response.ok) {
          setNetworkState(prev => ({
            isConnected: true,
            lastConnectedAt: new Date(),
          }));
        } else {
          setNetworkState(prev => ({
            ...prev,
            isConnected: false,
          }));
        }
      } catch (error) {
        setNetworkState(prev => ({
          ...prev,
          isConnected: false,
        }));
      }
    };

    checkConnection();

    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return networkState;
};
