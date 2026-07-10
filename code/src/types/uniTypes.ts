export interface Room {
  id: number | string;
  name: string;
  size: string;
  polygon: string;
}

export interface RoomStatic {
  id: number | string;
  name: string;
  size: string;
  polygon: string;

}


export interface Unit {
  id: number | string;
  name: string;
  type: string;
  image2D:string;
  image3D:string;
  image2Dstatic:string;
  imageUnit:string;
  polygonPoints: string;
  hoverColor: string;
  rooms: Room[];
  roomstatic: RoomStatic[];
  overlayImage?: string;


}
export interface UnitInformations{
  title:string;
  T1:string;
  T2:string;
}

export interface Floor {
  id: number | string;
  name:string;
  image2D:string;
  image2Dstatic:string;
  image3D: string;
  features: string[];
  unitInformation:UnitInformations[];
  units: Unit[];
  imageSettings: {
    svgSize: string | undefined;
    imageWidth: number | string;
    imageHeight: number |string;
  };
  buttonSettings: Record<string, { text: string; bgColor: string }>;
}

export interface FloorStore {
  floors: Floor[];
  selectedUnitId: string | null;
  hoveredUnitId: string | null;
  setSelectedUnit: (id: string | null) => void;
  setHoveredUnit: (id: string | null) => void;
  getFloorById: (id: string | number) => Floor | undefined;
  getUnitById: (id: string | number) => Unit | undefined; // Add this!
}