import { describe, expect, it } from "vitest";

import {
  getGamePauseSnapshot,
  syncGamePause,
} from "./gamePause";

describe("syncGamePause", () => {
  it("idle when nothing open", () => {
    syncGamePause({ interactModalOpen: false });
    const s = getGamePauseSnapshot();
    expect(s.reason).toBe("none");
    expect(s.simulationPaused).toBe(false);
    expect(s.presentationPaused).toBe(false);
  });

  it("pauses sim and presentation for interact modal", () => {
    syncGamePause({ interactModalOpen: true });
    const s = getGamePauseSnapshot();
    expect(s.reason).toBe("interaction_ui");
    expect(s.simulationPaused).toBe(true);
    expect(s.presentationPaused).toBe(true);
  });

  it("pause menu wins over interact", () => {
    syncGamePause({ interactModalOpen: true, pauseMenuOpen: true });
    const s = getGamePauseSnapshot();
    expect(s.reason).toBe("pause_menu");
  });
});
