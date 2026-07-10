import { getFloors as getFloorsOffline } from '@/data/offlineApi';

// Offline: returns the same { data: { data: Floor[] } } shape the old API did.
export const getFloors = () => getFloorsOffline();
