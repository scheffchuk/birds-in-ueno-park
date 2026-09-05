// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { AudioPlaybackCoordinator } from "./playback";

describe("AudioPlaybackCoordinator", () => {
  it("stops and resets the previous card before starting another", () => {
    const first = document.createElement("audio");
    const second = document.createElement("audio");
    const firstPause = vi.spyOn(first, "pause").mockImplementation(() => undefined);
    const firstLoad = vi.spyOn(first, "load").mockImplementation(() => undefined);
    vi.spyOn(second, "pause").mockImplementation(() => undefined);
    vi.spyOn(second, "load").mockImplementation(() => undefined);
    first.src = "https://audio.example/first.mp3";
    first.currentTime = 12;

    const coordinator = new AudioPlaybackCoordinator();
    coordinator.register("first", first);
    coordinator.register("second", second);
    coordinator.requestPlay("first");
    coordinator.requestPlay("second");

    expect(firstPause).toHaveBeenCalledOnce();
    expect(firstLoad).toHaveBeenCalledOnce();
    expect(first.currentTime).toBe(0);
    expect(first.getAttribute("src")).toBeNull();
  });

  it("stops active audio when its card is removed or the list is disposed", () => {
    const audio = document.createElement("audio");
    const pause = vi.spyOn(audio, "pause").mockImplementation(() => undefined);
    vi.spyOn(audio, "load").mockImplementation(() => undefined);
    const coordinator = new AudioPlaybackCoordinator();
    coordinator.register("bird", audio);
    coordinator.requestPlay("bird");
    coordinator.register("bird", null);
    coordinator.dispose();

    expect(pause).toHaveBeenCalledOnce();
  });
});
