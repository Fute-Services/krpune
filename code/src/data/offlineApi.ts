// Offline data layer — replaces the former backend API.
// Each function returns the EXACT same shape the components already expect from
// axios/fetch, so call sites change by only swapping the call. All media URLs in
// these JSON files were rewritten to local `media/...` paths by scripts/download-media.mjs.

import floorsBody from './offline/floors.json';
import amenitiesBody from './offline/amenities.json';
import mobilityBody from './offline/mobility.json';
import transportBody from './offline/transport.json';
import galleryBody from './offline/gallery.json';
import vrTour from './offline/vrTour.json';

// Mimic an axios response: { data: <responseBody> }
const asAxios = <T>(body: T) => Promise.resolve({ data: body });

// GET /floors  -> res.data.data : Floor[]
export const getFloors = () => asAxios(floorsBody as any);

// GET /amenities -> res.data[0].categories
export const getAmenities = () => asAxios(amenitiesBody as any);

// GET /mobility -> res.data.data : {title,url}[]
export const getMobility = () => asAxios(mobilityBody as any);

// GET /transport -> res.data.data : {_id,label,video}[]
export const getTransport = () => asAxios(transportBody as any);

// GET /gallery -> res.data : {category,images}[]
export const getGallery = () => asAxios(galleryBody as any);

// GET /vr-tour -> parsed body { default, scenes } (VRPage used raw fetch().json())
export const getVrTour = () => Promise.resolve(vrTour as any);
