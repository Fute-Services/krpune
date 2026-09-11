/**
 * The guided tour.
 *
 * Paced like a host walking someone round, not like a slideshow. Each stop gets
 * a real explanation — three or four sentences with the numbers in them — and
 * then a beat of silence afterwards so the visitor can actually look at what was
 * just described. A stop that speaks for four seconds and moves on teaches
 * nobody anything; it just proves the app can navigate.
 *
 * The narration is written here rather than generated per stop, and that is a
 * deliberate trade. Asking the model for a line at every screen would mean
 * nineteen round trips for one tour — on an account capped at 8,000 tokens a
 * minute that rate-limits itself halfway through, and every screen would sit in
 * silence for a second first. Fixed text starts speaking the instant the screen
 * changes, cannot drift from what is on the screen, and costs nothing.
 *
 * Every fact below is from knowledge.ts, which came out of the app's own
 * rendered text. If a screen changes, change its line with it.
 *
 * Order is a sales narrative, not the router's: what the project is, where it
 * is, how the building works, what it feels like to walk through, then the
 * detail a tenant's own team asks for, and the film to finish on.
 */
export interface TourStop {
  path: string;
  /** Spoken and shown. Written for the ear — no lists, no abbreviations. */
  line: string;
}

export const TOUR: TourStop[] = [
  {
    path: '/overview',
    line: "Let me take you through the whole project, properly. This is Commerzone Baner — a Grade A commercial development in the business hub of Baner, in west Pune. It sits across the key commercial markets, with easy access to the main business districts, the residential areas around them, and the social infrastructure people actually use day to day. It is built for modern enterprises, from multinationals to homegrown companies.",
  },
  {
    path: '/projectinfo',
    line: 'Now the numbers. The campus is spread across about nine acres, and offers roughly two point seven million square feet of leasable area, planned for I T and I T E S companies. It is a green building campus, LEED Gold certified for core and shell. The design work went into the things a tenant feels every day — an optimised core so more of each floor is usable, efficient vertical transportation, and floor plates shaped for flexible layouts.',
  },
  {
    path: '/location',
    line: 'This is the location, and you can see how well connected it is. There is direct access from a service road off the Mumbai-Pune Highway, another access from a wide parallel road, and the site has prominent highway frontage. Manipal Hospital is six minutes away, Orchid International School eight, Westend Mall seventeen. Pune Airport is seventeen kilometres, about forty minutes, and Pune Railway Station eleven kilometres, around thirty.',
  },
  {
    path: '/concept_summary',
    line: 'Here is how the building itself is put together. The land has roughly an eight metre gradient running west to east, and the structure holds eight levels of parking, an amenity floor, and then offices from the first to the seventeenth floor across two towers, T one and T two. Above that the terrace carries the mechanical areas, with lift access up to the rooftop recreation. Refuge areas are on the first, fifth, ninth and thirteenth levels, in line with the Indian national code, and they are reachable from the road on the south side.',
  },
  {
    path: '/vr',
    line: 'This is the virtual tour. It starts at the entry gate, and from here you can walk right through the campus yourself — turn around, look up, move from one point to the next. Take your time with it whenever you like; it will still be here after we finish.',
  },
  {
    path: '/lobby-reception',
    line: 'Each tower has its own lobby, so the two never share an entrance. The public entrance hall for T one is on the lower ground level and for T two on the upper ground, both reached through the drop-off on the south side of the site. Inside you have the reception, the lift lobby, and a cafeteria.',
  },
  {
    path: '/ground-level',
    line: 'At ground level this is what a visitor meets first — the entry gate, the drop-off, and the retail zone. The food and beverage and retail spaces sit on the east side under T one at lower ground, and to the south-west under T two at upper ground.',
  },
  {
    path: '/podium-level',
    line: 'The podium is really the heart of the campus. There is a forty thousand square foot food court here, and it opens straight onto a large landscaped garden that is open to the sky. Around it you have walking paths and sit-out zones, so people can step out of the office without leaving the building.',
  },
  {
    path: '/terrace-level',
    line: 'Up on the terrace there is a second set of amenities — another food court, a multi-purpose court, and a sports area. This is the rooftop recreation the lifts run up to, and it is a large part of what makes the campus liveable through a long working day.',
  },
  {
    path: '/project_details',
    line: 'Now the detail your own team will ask for. This is the carpet area floor by floor, for both towers side by side. A typical upper floor is around seventy nine thousand square feet in Tower one and thirty four thousand in Tower two, going up to about eighty one thousand and thirty five thousand on the higher floors. The floors marked R are the refuge floors — the first, fifth, ninth and thirteenth. Tap any floor and it opens that floor plan.',
  },
  {
    path: '/fitout-plan',
    line: 'This is a sample fit-out, drawn at one to sixty, so you can see how a floor actually works once it is occupied. There are linear workstations through the open area, meeting rooms in four, eight, ten and sixteen seater sizes, and a board room. Around the edges you have the services — the fire escape staircase, the rest rooms, and the air handling unit room.',
  },
  {
    path: '/mobility',
    line: 'Mobility is planned separately for the two arrival levels — lower ground and upper ground each have their own movement pattern. This screen also shows the zoning considerations behind it, which is what keeps vehicles, deliveries and people on foot from ending up in the same place at the same time.',
  },
  {
    path: '/circulation-plan',
    line: 'The circulation plan is the same idea drawn out across the whole site: how people and vehicles move through the campus, from the gate to the drop-off to the parking and up into the towers.',
  },
  {
    path: '/vertical-transport',
    line: 'Vertical transport is the lift strategy, and on a seventeen storey building with two towers it matters more than almost anything else. It is worked out separately for Tower one and Tower two, and shown here across two sections of the building.',
  },
  {
    path: '/sustainability',
    line: 'Sustainability runs through the whole campus, and this is what the LEED Gold certification is built on. For water there is recycling and reuse, rainwater storage and recharge, and low flow fixtures throughout. For energy there are L E D fixtures in the common areas, high efficiency chillers, variable frequency drives on the motors, and a low global warming potential refrigerant. The envelope is high efficiency double glazing, and the below grade parking runs on carbon monoxide sensors.',
  },
  {
    path: '/gallery',
    line: 'This is the gallery, filtered by elevation, interior and exterior. You will find the elevation shots by day and by night, the aerial and facade views, the main entrance gate and drop-off, the podium landscape, the central courtyard at night, the swimming pool, and the terrace amenities.',
  },
  {
    path: '/aboutus',
    line: 'And this is the corporate profile — K Raheja Corp, the developer behind the project, along with the project overview.',
  },
  {
    path: '/walkthrough',
    line: 'That is the full tour. I will leave you with the walkthrough film — it runs through the whole project end to end. Whenever you want, just ask me to take you back to any screen, or ask me anything about what you have seen.',
  },
];

/**
 * The pause after a line has been spoken, before the next screen.
 *
 * This is the difference between a tour and a slideshow. The first version held
 * for under two seconds, which meant the screen changed while the visitor was
 * still looking at the last one — it read as the app rushing them along. Four
 * and a half seconds is roughly how long a person takes to look at a plan after
 * being told what it is.
 */
export const DWELL_AFTER_SPEECH_MS = 4500;

/** Words a minute, spoken. Also about the speed someone reads a caption. */
const PACE_WPM = 150;

/**
 * The floor under every stop, whether or not anything was actually said.
 *
 * The tour advances when the spoken line finishes — but "finishes" arrives
 * instantly when the voice is muted, when ElevenLabs is down, or when the device
 * has no audio output at all. Without a floor those cases collapse the tour into
 * a slideshow flicking through nineteen screens in ninety seconds, which is
 * exactly the complaint this pacing was meant to fix. So each stop is held for
 * at least as long as its line takes to say, and the beat afterwards is on top
 * of that.
 */
export function minimumStopMs(line: string): number {
  const words = line.split(/\s+/).length;
  return (words / PACE_WPM) * 60_000 + DWELL_AFTER_SPEECH_MS;
}

/**
 * Roughly how long the whole tour takes, so the offer can say so.
 *
 * Someone deciding whether to start a nineteen-screen walkthrough deserves to
 * know it is ten minutes and not one. Measured from the narration itself at a
 * spoken pace of about one hundred and fifty words a minute, plus the dwell, so
 * it cannot go stale when a stop is added or a line is rewritten.
 */
export function tourMinutes(): number {
  const words = TOUR.reduce((total, stop) => total + stop.line.split(/\s+/).length, 0);
  // 120 rather than the 150 used for the floor below, plus a second and a half
  // per stop for the voice to be generated: timed against the running tour, the
  // arithmetic pace under-read it by about two minutes, and an offer that says
  // eight minutes and takes ten is worse than one that says nothing.
  const seconds = (words / 120) * 60 + TOUR.length * (DWELL_AFTER_SPEECH_MS / 1000 + 1.5);
  return Math.max(1, Math.round(seconds / 60));
}
