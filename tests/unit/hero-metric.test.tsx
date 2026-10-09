import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HeroMetric } from "@/widgets/landing-content/hero-metric";

let reduced = false;
let motionListeners: Set<() => void>;
let intersections: IntersectionObserverCallback[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  reduced = false;
  motionListeners = new Set();
  intersections = [];
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: (_event: string, callback: () => void) => motionListeners.add(callback),
    removeEventListener: (_event: string, callback: () => void) => motionListeners.delete(callback),
  }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersections.push(callback); }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function advance(ms: number) {
  act(() => { vi.advanceTimersByTime(ms); });
}

function visible(onScreen: boolean) {
  act(() => {
    intersections.at(-1)!([{ isIntersecting: onScreen } as IntersectionObserverEntry], {} as IntersectionObserver);
  });
}

function setReduced(value: boolean) {
  act(() => {
    reduced = value;
    motionListeners.forEach((callback) => callback());
  });
}

function mount() {
  const result = render(<HeroMetric />);
  const line = result.container.querySelector('[aria-hidden="true"]')!;
  const text = () => Array.from(line.children)
    .map((element) => element.textContent!.replaceAll("\u00a0", "").trim())
    .filter(Boolean)
    .join(" ");
  visible(true);
  advance(0);
  return { ...result, text };
}

function waitForPhrase(text: () => string, phrase: string) {
  for (let elapsed = 0; elapsed < 15000 && text() !== phrase; elapsed += 20) advance(20);
  expect(text()).toBe(phrase);
}

it("types, holds, erases and cycles through all three phrases", () => {
  const { text } = mount();
  expect(text()).toBe("");
  advance(80);
  expect(text()).toBe("2");
  waitForPhrase(text, "20+ лет");
  advance(2100);
  expect(text()).toBe("20+ лет");
  advance(100);
  expect(text().length).toBeLessThan("20+ лет".length);
  waitForPhrase(text, "16 специалистов");
  waitForPhrase(text, "35+ кейсов");
  waitForPhrase(text, "20+ лет");
});

it("preserves progress while offscreen or in a hidden tab", () => {
  const { text } = mount();
  advance(80);
  visible(false);
  advance(5000);
  expect(text()).toBe("2");
  visible(true);
  advance(80);
  expect(text()).toBe("20");

  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  advance(5000);
  expect(text()).toBe("20");
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  advance(80);
  expect(text()).toBe("20+");
});

it("renders the first phrase statically and responds to reduced-motion changes", () => {
  reduced = true;
  const result = render(<HeroMetric />);
  const line = result.container.querySelector('[aria-hidden="true"]')!;
  expect(line.textContent).toBe("20+лет");
  expect(vi.getTimerCount()).toBe(0);
  setReduced(false);
  visible(true);
  advance(160);
  expect(line.textContent).toBe("20");
  setReduced(true);
  expect(line.textContent).toBe("20+лет");
  expect(vi.getTimerCount()).toBe(0);
});

it("provides all metrics as stable accessible text and clears timers on unmount", () => {
  const { getByText, unmount, text } = mount();
  expect(getByText("20+ лет, 16 специалистов, 35+ кейсов.")).toBeInTheDocument();
  advance(160);
  expect(text()).toBe("20");
  expect(getByText("20+ лет, 16 специалистов, 35+ кейсов.")).toBeInTheDocument();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
