/**
 * Deciding, from two loudness readings, whether the visitor has started
 * talking over the guide.
 *
 * The microphone hears two things while the guide speaks: the visitor, and the
 * guide itself coming back out of the kiosk's speakers. Stopping on "the mic is
 * loud" would stop the guide on its own voice every time. So the playback
 * level is measured too, and the microphone only counts as the visitor when it
 * is clearly louder than the echo that playback would explain.
 *
 * Deliberately conservative. A missed interruption costs the visitor a tap on
 * the mic; a false one cuts the guide off mid-sentence and opens the mic on an
 * empty room. Where this errs, it errs towards carrying on.
 *
 * Pure and import-free, so it is tested on synthetic loudness traces.
 */

export const BARGE_IN = {
  /** Spent learning how loud this room's echo is before judging anything. */
  CALIBRATION_MS: 900,
  /** The visitor must stay above the bar this long — a cough or a door is shorter. */
  SUSTAIN_MS: 300,
  /** Quieter than this is never an interruption, however quiet the room. */
  MIN_LEVEL: 0.03,
  /** How far above the expected echo the microphone has to be. */
  ECHO_MARGIN: 2,
  /** How far above the room's own level the microphone has to be. */
  FLOOR_MARGIN: 3,
  /** Playback below this is treated as the guide pausing. */
  PLAYING: 0.01,
  /**
   * Echo lags the sound that caused it and rings on after it, so the expected
   * echo follows the loudest playback of this recent window, not the instant.
   */
  ECHO_HOLD_MS: 250,
  /** How slowly the room level follows what is heard in the guide's pauses. */
  FLOOR_SETTLE_MS: 3000,
} as const;

export interface BargeInDetector {
  /**
   * One reading: microphone RMS, playback RMS, and the time since the last
   * reading. Returns true exactly once, when the visitor is judged to be talking.
   */
  push(mic: number, playback: number, dtMs: number): boolean;
}

function percentile(values: number[], p: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

export function createBargeInDetector(config: typeof BARGE_IN = BARGE_IN): BargeInDetector {
  let elapsed = 0;
  let calibrated = false;
  let fired = false;
  let sustained = 0;
  /** Microphone level per unit of playback level: how loud the echo is here. */
  let echoRatio = 1;
  /** The room without the guide in it. */
  let floor = 0;
  const calibration: { mic: number; held: number }[] = [];
  const recent: { at: number; level: number }[] = [];

  return {
    push(mic, playback, dtMs) {
      if (fired) return false;
      elapsed += dtMs;

      recent.push({ at: elapsed, level: playback });
      while (recent.length > 1 && elapsed - recent[0].at > config.ECHO_HOLD_MS) recent.shift();
      const held = recent.reduce((loudest, r) => Math.max(loudest, r.level), 0);

      if (!calibrated) {
        calibration.push({ mic, held });
        if (elapsed < config.CALIBRATION_MS) return false;

        const ratios = calibration.filter((s) => s.held > config.PLAYING).map((s) => s.mic / s.held);
        const quiet = calibration.filter((s) => s.held <= config.PLAYING).map((s) => s.mic);
        // The loud end of what was heard: anyone already talking inflates this,
        // which only makes the detector harder to trigger — the safe direction.
        echoRatio = percentile(ratios, 0.8) ?? 1;
        if (quiet.length >= 3) {
          floor = percentile(quiet, 0.5) ?? 0;
        } else {
          // The guide never paused while this was measured, so the room is read
          // from the quietest moments instead — the starts of words, before
          // their echo has arrived. Someone talking nearby throughout is in
          // those moments too and raises the bar, as it should.
          //
          // Not "the microphone minus the least echo": the least echo is also
          // measured at word starts, where it is near zero, so nothing was
          // taken off, the echo itself was read as the room, and a visitor
          // talking at a normal level could never clear three times it.
          floor = percentile(calibration.map((s) => s.mic), 0.1) ?? 0;
        }
        calibrated = true;
        return false;
      }

      const bar = Math.max(
        config.MIN_LEVEL,
        held * echoRatio * config.ECHO_MARGIN,
        floor * config.FLOOR_MARGIN,
      );

      if (mic > bar) {
        sustained += dtMs;
        if (sustained >= config.SUSTAIN_MS) {
          fired = true;
          return true;
        }
      } else {
        sustained = 0;
      }

      // In the guide's pauses the microphone hears only the room. Following it
      // slowly keeps a steady murmur nearby from ever counting, while a visitor
      // who starts speaking has triggered long before it catches up.
      if (held <= config.PLAYING) {
        floor += (mic - floor) * Math.min(1, dtMs / config.FLOOR_SETTLE_MS);
      }
      return false;
    },
  };
}
