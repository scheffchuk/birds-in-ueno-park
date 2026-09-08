// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AtlasAudioControl,
  type AtlasAudioLabels,
} from "./AtlasAudioControl";

const labels: AtlasAudioLabels = {
  play: "Play audio",
  pause: "Pause audio",
  loading: "Loading audio",
  retry: "Retry audio",
  unavailable: "Audio unavailable",
};

let play: ReturnType<typeof vi.fn>;
let pause: ReturnType<typeof vi.fn>;
let roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function renderControl(
  props: Partial<React.ComponentProps<typeof AtlasAudioControl>> = {},
) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(
      <AtlasAudioControl
        audioUrl="https://audio.example/bird.mp3"
        available
        labels={labels}
        {...props}
      />,
    );
  });
  return container;
}

beforeEach(() => {
  play = vi.fn(function (this: HTMLAudioElement) {
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  });
  pause = vi.fn();
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: play,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: pause,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  for (const { root, container } of roots) {
    act(() => root.unmount());
    container.remove();
  }
  roots = [];
  vi.restoreAllMocks();
});

describe("AtlasAudioControl", () => {
  it("loads only after the first click, then pauses and resumes", async () => {
    const container = renderControl();
    const button = () => container.querySelector("button") as HTMLButtonElement;
    const audio = () => container.querySelector("audio") as HTMLAudioElement;

    expect(audio().getAttribute("src")).toBeNull();
    expect(audio().getAttribute("preload")).toBe("none");
    expect(button().getAttribute("aria-label")).toBe("Play audio");
    expect(button().textContent).toBe("");
    expect(button().querySelector("svg")).not.toBeNull();

    await act(async () => {
      button().click();
    });
    expect(audio().getAttribute("src")).toBe("https://audio.example/bird.mp3");
    expect(play).toHaveBeenCalledTimes(1);
    expect(button().getAttribute("aria-label")).toBe("Pause audio");

    await act(async () => {
      button().click();
    });
    expect(pause).toHaveBeenCalledTimes(1);
    expect(button().getAttribute("aria-label")).toBe("Play audio");

    await act(async () => {
      button().click();
    });
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("returns to Play after completion and exposes Retry after a failed play", async () => {
    const firstPlay = play.mockImplementationOnce(() => Promise.reject(new Error("network")));
    const container = renderControl();
    const button = () => container.querySelector("button") as HTMLButtonElement;
    const audio = () => container.querySelector("audio") as HTMLAudioElement;

    await act(async () => {
      button().click();
    });
    expect(firstPlay).toHaveBeenCalledTimes(1);
    expect(button().getAttribute("aria-label")).toBe("Retry audio");

    await act(async () => {
      button().click();
    });
    expect(play).toHaveBeenCalledTimes(2);

    await act(async () => {
      audio().dispatchEvent(new Event("ended"));
    });
    expect(button().getAttribute("aria-label")).toBe("Play audio");
    expect(audio().getAttribute("src")).toBeNull();
  });

  it("renders a disabled localized control when audio is unavailable", () => {
    const container = renderControl({ available: false });
    const button = container.querySelector("button") as HTMLButtonElement;
    const audio = container.querySelector("audio") as HTMLAudioElement;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Audio unavailable");
    expect(audio.getAttribute("src")).toBeNull();
  });

  it("keeps the labeled audio action keyboard reachable", () => {
    const container = renderControl();
    const button = container.querySelector("button") as HTMLButtonElement;

    button.focus();

    expect(document.activeElement).toBe(button);
    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("Play audio");
  });
});
