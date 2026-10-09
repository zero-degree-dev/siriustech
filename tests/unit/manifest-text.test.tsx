import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ManifestText } from "@/widgets/landing-content/manifest-text";

const quote = "Надёжный софт — как точный инженерный расчёт: ни единой лишней строки, безупречная работа десятилетиями.";
let reduced = false;
let motionListeners: Set<() => void>;
let intersection: IntersectionObserverCallback;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  reduced = false;
  motionListeners = new Set();
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: (_event: string, callback: () => void) => motionListeners.add(callback),
    removeEventListener: (_event: string, callback: () => void) => motionListeners.delete(callback),
  }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; }
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
  act(() => intersection([{ isIntersecting: onScreen } as IntersectionObserverEntry], {} as IntersectionObserver));
}

function mount() {
  const result = render(<ManifestText />);
  const paragraph = result.container.querySelector("p")!;
  const text = () => Array.from(paragraph.querySelectorAll('[data-visible="true"]'))
    .map((element) => element.textContent).join("");
  advance(0);
  return { ...result, paragraph, text };
}

it("types on first appearance, keeps the layout text and does not restart on return", () => {
  const { paragraph, text } = mount();
  expect(text()).toBe("");
  expect(paragraph.querySelectorAll("br")).toHaveLength(2);
  advance(5000);
  expect(text()).toBe("");
  visible(true);
  advance(35);
  expect(text()).toBe("Н");
  advance(10000);
  expect(text()).toBe(quote);
  expect(vi.getTimerCount()).toBe(0);
  visible(false);
  visible(true);
  advance(5000);
  expect(text()).toBe(quote);
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps the complete quote accessible and highlights exactly the requested phrase", () => {
  const { getByText, paragraph } = mount();
  expect(getByText(quote)).toBeInTheDocument();
  expect(paragraph).toHaveAttribute("aria-hidden", "true");
  const highlighted = Array.from(paragraph.querySelectorAll('[class*="manifest-text__accent"]'))
    .map((element) => element.textContent).join("");
  expect(highlighted).toBe("безупречная работа");
});

it("pauses while offscreen or hidden and cancels timers on unmount", () => {
  const { text, unmount } = mount();
  visible(true);
  advance(35);
  visible(false);
  advance(5000);
  expect(text()).toBe("Н");
  visible(true);
  advance(35);
  expect(text()).toBe("На");
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  advance(5000);
  expect(text()).toBe("На");
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  advance(35);
  expect(text()).toBe("Над");
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("shows the complete highlighted quote when reduced motion is enabled", () => {
  reduced = true;
  const { container } = render(<ManifestText />);
  const text = () => Array.from(container.querySelectorAll('[data-visible="true"]'))
    .map((element) => element.textContent).join("");
  expect(text()).toBe(quote);
  expect(vi.getTimerCount()).toBe(0);
  act(() => { reduced = false; motionListeners.forEach((callback) => callback()); });
  advance(0);
  visible(true);
  advance(35);
  expect(text()).toBe("Н");
  act(() => { reduced = true; motionListeners.forEach((callback) => callback()); });
  expect(text()).toBe(quote);
  expect(vi.getTimerCount()).toBe(0);
});
