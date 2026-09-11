/**
 * The guided tour.
 *
 * The narration is written here rather than generated per stop, and that is a
 * deliberate trade. Asking the model for a line at every screen would mean a
 * dozen round trips for one tour — on an account capped at 8,000 tokens a
 * minute that rate-limits itself halfway through, and every stop would sit in
 * silence for a second first. Fixed lines start speaking the instant the screen
 * changes, cannot drift from what is on the screen, and cost nothing.
 *
 * The facts are the same ones in knowledge.ts, which came out of the app's own
 * rendered text. If a screen changes, change the line with it.
 *
 * Order is a sales narrative, not the router's: what the project is, where it
 * is, what it feels like to walk in, then the detail a tenant asks for.
 */
export interface TourStop {
  path: string;
  /** Spoken and shown. Two sentences at most — it is read aloud. */
  line: string;
}

export const TOUR: TourStop[] = [
  {
    path: '/overview',
    line: 'Let me show you around. Commerzone Baner is a Grade A commercial development in the business hub of Baner, in west Pune.',
  },
  {
    path: '/projectinfo',
    line: 'It sits on about nine acres with roughly 2.7 million square feet of leasable area, and it is LEED Gold certified for core and shell.',
  },
  {
    path: '/location',
    line: 'The location is one of Pune’s fastest growing corridors. Manipal Hospital is six minutes away, Orchid International School eight, and the airport is seventeen kilometres.',
  },
  {
    path: '/concept_summary',
    line: 'The building itself holds eight levels of parking, an amenity floor, and offices from the first to the seventeenth floor across two towers.',
  },
  {
    path: '/vr',
    line: 'This is the virtual tour. You can start at the entry gate and walk through the campus yourself whenever you like.',
  },
  {
    path: '/lobby-reception',
    line: 'Each tower has its own lobby — reception, the lift lobby and a cafeteria.',
  },
  {
    path: '/ground-level',
    line: 'At ground level you have the entry gate, the drop-off and the retail zone.',
  },
  {
    path: '/podium-level',
    line: 'The podium is the heart of the campus — a forty thousand square foot food court opening onto a landscaped garden, with walking paths and sit-out zones.',
  },
  {
    path: '/terrace-level',
    line: 'Up on the terrace there are more amenities, a second food court, a multi-purpose court and a sports area.',
  },
  {
    path: '/project_details',
    line: 'Here is the floor-by-floor carpet area for both towers. The refuge floors are marked R — the first, fifth, ninth and thirteenth.',
  },
  {
    path: '/fitout-plan',
    line: 'And this is a sample fit-out at one to sixty, with workstations, meeting rooms from four to sixteen seats, and a board room.',
  },
  {
    path: '/sustainability',
    line: 'Sustainability runs through the whole campus — rainwater harvesting, high efficiency chillers, a double glazed envelope and CO sensors in the parking.',
  },
  {
    path: '/gallery',
    line: 'That is the tour. The gallery has the full set of images, and you can ask me to take you back to any screen at any time.',
  },
];

/**
 * How long to hold a screen once the line has been spoken.
 *
 * Long enough to actually look at what was just described, short enough that a
 * visitor does not walk away. When the voice is muted there is no speech to wait
 * on, so the whole stop gets the longer beat instead.
 */
export const DWELL_AFTER_SPEECH_MS = 1800;
export const DWELL_WHEN_MUTED_MS = 5200;
