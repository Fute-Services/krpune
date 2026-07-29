import { useSyncExternalStore } from 'react';
import {
  getOfflineProgress,
  onOfflineProgress,
  startOfflineDownload,
  clearOfflineData,
  type OfflineProgress,
} from '@/offline/offlineDownload';
import { getSwState, onSwState, applyUpdate, type SwState } from '@/offline/registerServiceWorker';

export function useOfflineDownload(): {
  progress: OfflineProgress;
  sw: SwState;
  retry: () => void;
  clear: () => Promise<void>;
  applyUpdate: () => Promise<void>;
} {
  const progress = useSyncExternalStore(onOfflineProgress, getOfflineProgress, getOfflineProgress);
  const sw = useSyncExternalStore(onSwState, getSwState, getSwState);

  return {
    progress,
    sw,
    retry: () => void startOfflineDownload(),
    clear: clearOfflineData,
    applyUpdate,
  };
}
