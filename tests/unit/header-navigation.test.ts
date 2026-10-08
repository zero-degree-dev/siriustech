import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveSection } from "@/widgets/site-header/use-active-section";

const hrefs = ["#top", "#services", "#portfolio", "#contacts"];
const positions: Record<string, number> = { top: 0, services: 500, portfolio: 1400, contacts: 3700 };
let frames: Map<number, FrameRequestCallback>;
let frameId: number;
let fixture: HTMLDivElement;
function flushFrames() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(0));
  });
}
function scrollTo(y: number) {
  vi.stubGlobal("scrollY", y);
  act(() => window.dispatchEvent(new Event("scroll")));
  flushFrames();
}
function mount() {
  const hook = renderHook(() => useActiveSection(hrefs));
  hook.result.current.header.current = fixture.querySelector("header");
  flushFrames();
  return hook;
}

beforeEach(() => {
  frames = new Map();
  frameId = 0;
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
  });
  fixture = document.createElement("div");
  fixture.innerHTML = '<header></header><div id="top"></div><section id="services"></section><section id="portfolio"></section><footer id="contacts"></footer>';
  document.body.appendChild(fixture);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4200);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const top = this.tagName === "HEADER" ? 32 : (positions[this.id] ?? 0) - window.scrollY;
    const height = this.tagName === "HEADER" ? 82 : 400;
    return { top, bottom: top + height, left: 0, right: 100, width: 100, height, x: 0, y: top, toJSON() {} };
  });
});
afterEach(() => {
  fixture.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("header navigation", () => {
  it("follows scrolling in both directions and accounts for the fixed header", () => {
    const { result } = mount();
    expect(result.current.activeHref).toBe("#top");
    expect(document.documentElement.style.getPropertyValue("--header-scroll-offset")).toBe("138px");
    scrollTo(400);
    expect(result.current.activeHref).toBe("#services");
    scrollTo(1300);
    expect(result.current.activeHref).toBe("#portfolio");
    scrollTo(0);
    expect(result.current.activeHref).toBe("#top");
  });
  it("selects the clicked destination immediately without flashing intervening sections", () => {
    const { result } = mount();
    act(() => result.current.selectSection("#portfolio"));
    expect(result.current.activeHref).toBe("#portfolio");
    scrollTo(400);
    expect(result.current.activeHref).toBe("#portfolio");
    scrollTo(1300);
    expect(result.current.activeHref).toBe("#portfolio");
    scrollTo(400);
    expect(result.current.activeHref).toBe("#services");
  });
  it("returns to scroll tracking when the user interrupts smooth scrolling", () => {
    const { result } = mount();
    act(() => result.current.selectSection("#portfolio"));
    scrollTo(400);
    act(() => window.dispatchEvent(new WheelEvent("wheel")));
    flushFrames();
    expect(result.current.activeHref).toBe("#services");
  });
  it("keeps the collapsed header offset while the mobile menu is open", () => {
    const { result } = mount();
    const header = result.current.header.current!;
    header.innerHTML = '<button aria-expanded="true">Меню</button>';
    vi.spyOn(header, "getBoundingClientRect").mockReturnValue({
      top: 32, bottom: 500, left: 0, right: 100, width: 100,
      height: 468, x: 0, y: 32, toJSON() {},
    });
    act(() => window.dispatchEvent(new Event("resize")));
    flushFrames();
    expect(document.documentElement.style.getPropertyValue("--header-scroll-offset")).toBe("138px");
  });
  it("selects contacts at the bottom even when a short footer cannot reach the header", () => {
    const { result, unmount } = mount();
    scrollTo(4200 - window.innerHeight);
    expect(result.current.activeHref).toBe("#contacts");
    unmount();
    expect(document.documentElement.style.getPropertyValue("--header-scroll-offset")).toBe("");
  });
});
