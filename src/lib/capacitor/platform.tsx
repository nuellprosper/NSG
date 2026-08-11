import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network, ConnectionStatus } from '@capacitor/network';

export type PlatformType = 'web' | 'android' | 'ios';

export interface DevicePlatformState {
  platform: PlatformType;
  isNative: boolean;
  isOnline: boolean;
  connectionType: string;
}

export const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
};

export const getDevicePlatform = (): PlatformType => {
  try {
    const p = Capacitor.getPlatform();
    if (p === 'android' || p === 'ios') return p;
    return 'web';
  } catch (e) {
    return 'web';
  }
};

export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch (e) {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
};

const defaultPlatformState: DevicePlatformState = {
  platform: getDevicePlatform(),
  isNative: isNativePlatform(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionType: 'unknown'
};

const DevicePlatformContext = createContext<DevicePlatformState>(defaultPlatformState);

export const DevicePlatformProvider = ({ children }: { children: ReactNode }) => {
  const [platformState, setPlatformState] = useState<DevicePlatformState>(defaultPlatformState);

  useEffect(() => {
    let isMounted = true;

    const updateStatus = (status: ConnectionStatus) => {
      if (!isMounted) return;
      setPlatformState(prev => ({
        ...prev,
        isOnline: status.connected,
        connectionType: status.connectionType
      }));
    };

    // Initial check with Network plugin
    Network.getStatus().then(status => {
      updateStatus(status);
    }).catch(() => {
      if (isMounted) {
        setPlatformState(prev => ({
          ...prev,
          isOnline: navigator.onLine
        }));
      }
    });

    // Listen to network changes
    const networkListenerPromise = Network.addListener('networkStatusChange', updateStatus);

    const handleWebOnline = () => updateStatus({ connected: true, connectionType: 'wifi' });
    const handleWebOffline = () => updateStatus({ connected: false, connectionType: 'none' });

    window.addEventListener('online', handleWebOnline);
    window.addEventListener('offline', handleWebOffline);

    return () => {
      isMounted = false;
      networkListenerPromise.then(l => l.remove()).catch(() => {});
      window.removeEventListener('online', handleWebOnline);
      window.removeEventListener('offline', handleWebOffline);
    };
  }, []);

  return (
    <DevicePlatformContext.Provider value={platformState}>
      {children}
    </DevicePlatformContext.Provider>
  );
};

export const useDevicePlatform = (): DevicePlatformState => {
  return useContext(DevicePlatformContext);
};
