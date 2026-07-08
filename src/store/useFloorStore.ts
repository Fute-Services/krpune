import { create } from 'zustand';
import { floorData } from '../data/FloorData';

import type { Floor, FloorStore } from '../types/uniTypes';

export const useFloorStore = create<FloorStore>((set, get) => ({
  floors: floorData as Floor[],
  selectedUnitId: null,
  hoveredUnitId: null,
  


  setSelectedUnit: (id) => set({ selectedUnitId: id }),
  setHoveredUnit: (id) => set({ hoveredUnitId: id }),
  getFloorById: (id) => get().floors.find((f) => f.id === Number(id)),
  // New Helper: Finds a unit by its ID regardless of which floor it's on
  // getUnitById: (id) => {
  //   return get().floors
  //     .flatMap(f => f.units)
  //     .find(u => String(u.id) === String(id));
  // }

  // Ensure this is inside the return object of the store!
  // getUnitById: (id: string | number) => {
  //   return get().floors
  //     .flatMap(f => f.units)
  //     .find(u => String(u.id) === String(id));
  // }

  // ADD THIS FUNCTION
  getUnitById: (combinedId: any) => {
    // combinedId is "1-1" (FloorID-UnitID)
    const [fId, uId] = combinedId.split("-");
    
    const floor = get().floors.find(f => String(f.id) === fId);
    if (!floor) return undefined;

    return floor.units.find(u => String(u.id) === uId);
  }
}));