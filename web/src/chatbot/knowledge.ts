/**
 * What the guide is allowed to say.
 *
 * Every line below was taken from what the app actually renders — the route
 * text was dumped from the built app and condensed here, not written from
 * memory. That matters more than usual: this is a sales-floor kiosk, and a
 * chatbot that invents a floor count or a distance to the airport is worse than
 * no chatbot at all. If a page changes, change it here too; the model is told
 * explicitly that anything absent from this file is something it does not know.
 *
 * Floor areas are NOT duplicated here — they are read straight out of
 * floorData at runtime by projectFacts(), so the table on /project_details and
 * the guide can never drift apart.
 */
import { floorData } from '@/data/FloorData';

export interface PageEntry {
  /** Hash route, exactly as the router defines it. */
  path: string;
  /** What a host would call this screen. */
  title: string;
  /** Said out loud when the visitor lands here or asks "what is this". */
  summary: string;
  /** Extra detail the guide may draw on when asked follow-ups. */
  detail?: string;
}

export const PROJECT_NAME = 'Commerzone Baner';

export const PAGES: PageEntry[] = [
  {
    path: '/',
    title: 'Home',
    summary:
      'The main menu of the experience centre. From here you can open Project Overview, Location, Amenities, Inventory, VR, Project Info, Corporate Profile, Construction Progress, Walkthrough and Gallery.',
  },
  {
    path: '/overview',
    title: 'Project Overview',
    summary:
      'Commerzone Baner is a premier Grade A commercial development in the business hub of Baner, West Pune. It sits across key commercial markets with strong connectivity to business districts, residential zones and social infrastructure.',
    detail:
      'The IT park is designed for modern enterprises and aims at a community-driven ecosystem supporting innovation and collaboration — pitched at multinational corporations and homegrown "new age businesses" alike. This screen links onward to Sustainability and Concept Summary.',
  },
  {
    path: '/projectinfo',
    title: 'Project Info',
    summary:
      'The numbers page: about 9 acres, roughly 2.7 million sq. ft. of leasable area, built for IT and ITES enterprises, and LEED Gold certified for Core & Shell.',
    detail:
      'Strategic location — one of Pune\'s fastest-growing IT and automobile corridors, with direct access via a service road off the Mumbai-Pune Highway, additional access from a wide parallel road, and prominent highway frontage. Connectivity — Pune Airport 17 km, about 40 minutes; Pune Railway Station 11 km, about 30 minutes. Design excellence — optimised core design, efficient vertical transportation, maximised usable office area, integrated recreational and office spaces, and optimised floor plates for flexibility.',
  },
  {
    path: '/concept_summary',
    title: 'Concept Summary',
    summary:
      'How the building is put together — superstructure, tenant offices, refuge areas, lobbies, amenities, food and beverage, and parking.',
    detail:
      'Superstructure: built on graded land with roughly an 8 m gradient west to east; it holds 8 levels of parking, an amenity floor, and offices on the 1st to 17th floors, with a terrace above carrying mechanical areas and lift access to rooftop recreation. Tenant offices sit on the 1st to 17th floors in both towers, T1 and T2. Refuge areas are on the 1st, 5th, 9th and 13th levels per the Indian national code, reachable from the road on the south side. Lobbies: a public entrance hall on Lower Ground for T1 and on Upper Ground for T2, through a drop-off on the south side — each tower has its own lobby. Amenities: a 40,000 sq ft food court opening onto a large landscaped open-to-sky podium garden. F&B and retail sit on the east under T1 at Lower Ground and to the south-west under T2 at Upper Ground. Parking: 8 levels from Lower Ground up to the 6th parking podium, which is primarily mechanical parking.',
  },
  {
    path: '/sustainability',
    title: 'Sustainability',
    summary:
      'The green building initiatives — water conservation, energy conservation, and envelope and systems measures.',
    detail:
      'Water: recycling and reuse of water, storage, recharge and use of rainwater, and low-flow water-efficient fixtures. Energy: high-efficiency LED fixtures in common areas, energy-efficient motors on mechanical equipment, high-COP chillers, low global warming potential refrigerant, and variable frequency drives on motors. Other: a high-efficiency double-glazed envelope, energy recovery systems, and below-grade parking with CO sensors.',
  },
  {
    path: '/gallery',
    title: 'Gallery',
    summary:
      'Project imagery, filtered by Elevation Shot, Interior and Exterior.',
    detail:
      'Includes elevation shots by day and night, aerial and facade shots, the main entrance gate and drop-off, the ground floor amenity plan, the MLCP, the podium landscape amenity, the central courtyard at night, the swimming pool, the landscape pavilion, the terrace amenity plan, the tennis court and the sports area.',
  },
  {
    path: '/walkthrough',
    title: 'Walkthrough',
    summary: 'The full project walkthrough video.',
  },
  {
    path: '/construction',
    title: 'Construction Progress',
    summary: 'Video of how construction is progressing on site.',
  },
  {
    path: '/location',
    title: 'Location',
    summary:
      'An interactive map of the site with Social Infrastructure and Transport Infrastructure layers, each pin showing the drive time.',
    detail:
      'Drive times shown on the map: Puraniks Aldea Espanola 5 minutes, Manipal Hospital 6 minutes, Tip Top Hotel 7 minutes, Orchid International School 8 minutes, Westend Mall 17 minutes, Radisson Blu 18 minutes, and MIT World Peace University 25 minutes.',
  },
  {
    path: '/vr',
    title: 'VR Tour',
    summary:
      'A 360-degree virtual tour. It starts at the Entry Gate and you can walk through to Ground Level and onward.',
  },
  {
    path: '/amenities',
    title: 'Amenities',
    summary:
      'The amenities menu — it opens onto four levels: Terrace Level, Podium Level, Lobby Reception and Ground Level.',
  },
  {
    path: '/ground-level',
    title: 'Ground Level',
    summary:
      'The ground level plan with the Entry Gate, the Drop-off and the Retail Zone marked on it.',
  },
  {
    path: '/podium-level',
    title: 'Podium Level',
    summary:
      'The podium plan — the Food Court, landscaped walking paths and sit-out zones.',
  },
  {
    path: '/terrace-level',
    title: 'Terrace Level',
    summary:
      'The terrace plan — terrace amenities, the terrace food court, a multi-purpose court and the sports area.',
  },
  {
    path: '/lobby-reception',
    title: 'Lobby Reception',
    summary:
      'The lobby plan — the reception lobby, the lift lobby and the cafeteria.',
  },
  {
    path: '/project_details',
    title: 'Inventory / Project Details',
    summary:
      'The floor-by-floor carpet area table for Tower 1 and Tower 2, with links onward to the Floor Plan, Mobility, Vertical Transport and Circulation views.',
    detail:
      'Refuge floors are marked R in the table — the 1st, 5th, 9th and 13th. Tapping a floor opens its unit plan. The table also lists Lower Ground, Upper Ground, Podium and the two Amenity levels.',
  },
  {
    path: '/fitout-plan',
    title: 'Fit-out Plan',
    summary:
      'A sample office fit-out drawn at 1:60, with a legend for every space type.',
    detail:
      'The legend covers linear workstations, 4, 8, 10 and 16 seater meeting rooms, a board room, the fire escape staircase, ladies and gents rest rooms, and the AHU room.',
  },
  {
    path: '/circulation-plan',
    title: 'Circulation Plan',
    summary: 'How people and vehicles move through the site.',
  },
  {
    path: '/mobility',
    title: 'Mobility',
    summary:
      'Mobility planning for the site — Lower Ground mobility, Upper Ground mobility, and the zoning considerations behind them.',
  },
  {
    path: '/vertical-transport',
    title: 'Vertical Transport',
    summary:
      'The lift and vertical transport strategy for Tower 1 and Tower 2, shown across two sections.',
  },
  {
    path: '/aboutus',
    title: 'Corporate Profile',
    summary:
      'K Raheja Corp and the project overview, with links onward to the Walkthrough and the Gallery.',
  },
];

/**
 * The floor table, read from the same source the Inventory page renders, so the
 * guide quotes the numbers on screen rather than a copy of them.
 */
function floorAreaLines(): string {
  const lines: string[] = [];
  for (const floor of floorData) {
    // Not every entry in floorData carries areas — some units are plan-only —
    // and the ones that do are typed loosely, hence the widening rather than an
    // assertion that would happily read a field that is not there.
    const info = floor.units?.[0]?.unitInformation as
      | { T1?: string; T2?: string }
      | undefined;
    if (!info?.T1 && !info?.T2) continue;
    const refuge = /refuge/i.test(floor.tool3 ?? '') ? ' (refuge floor)' : '';
    lines.push(`${floor.name}${refuge}: Tower 1 ${info.T1} sq ft, Tower 2 ${info.T2} sq ft carpet`);
  }
  return lines.join('\n');
}

/**
 * The brief is assembled per turn rather than sent whole, and the reason is a
 * hard number: this Groq account allows 8,000 tokens per minute. Sending every
 * page's full detail plus the 22-row floor table came to roughly 3,000 tokens,
 * and a question that triggers a navigation makes two requests — so a single
 * visitor asking two questions in a minute was enough to earn a 429 and be told
 * to wait. A guide that rate-limits itself mid-conversation is worse than a
 * shorter brief.
 *
 * So: every screen's one-line summary always (it has to be able to navigate
 * anywhere and say what anything is), and the long detail only for the screen
 * the visitor is actually standing on.
 */
export function knowledgeBase(pathname: string): string {
  const index = PAGES.map((p) => `${p.title} (${p.path}) — ${p.summary}`).join('\n');

  const here = pageFor(pathname);
  const detail = here?.detail ? `\n\n## About the screen they are on now: ${here.title}\n\n${here.detail}` : '';

  // The floor table is 22 lines of numbers. It is the whole point of the
  // Inventory and floor-plan screens and noise everywhere else.
  const floors =
    pathname === '/project_details' || pathname.startsWith('/unitplan/')
      ? `\n\n## Floor carpet areas (the table on screen)\n\n${floorAreaLines()}`
      : '';

  return `## Every screen in this app\n\n${index}${detail}${floors}`;
}

export function pageFor(pathname: string): PageEntry | undefined {
  if (pathname.startsWith('/unitplan/')) {
    return {
      path: pathname,
      title: 'Floor Plan',
      summary:
        'The plan for one floor, switchable between the 3D and 2D view, with the carpet area for Tower 1 and Tower 2 and a numbered key to the services on that floor — lift lobbies, AHU room, fire tower, server room, toilets and the fire and service staircases.',
    };
  }
  return PAGES.find((p) => p.path === pathname);
}
