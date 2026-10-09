export type ResizeSlide = { src: string; alt: string };

type ResizeElements = {
  host: HTMLDivElement;
  frame: HTMLDivElement;
  underlay: HTMLDivElement;
  cursor: SVGSVGElement;
  anchor: HTMLDivElement;
  images: (HTMLImageElement | null)[];
  underlayImages: (HTMLImageElement | null)[];
  visibilityTarget?: Element;
};

export type ResizePlayer = ReturnType<typeof createResizePlayer>;

/** Image motion, pointer motion and typing share a pausable timeline. */
export function createResizePlayer(elements: ResizeElements, signal: AbortSignal, reducedMotion: boolean) {
  const { host, frame, underlay, cursor, anchor, images, underlayImages } = elements;
  const active = new Set<Animation>();
  let frameAnimation: Animation | undefined;
  let anchorAnimation: Animation | undefined;
  let cursorAnimation: Animation | undefined;
  let clockAnimation: Animation | undefined;
  let index = 0;
  let expanded = true;
  let resting = false;
  let paused = false;
  const visibilityTarget = elements.visibilityTarget ?? host;
  const bounds = visibilityTarget.getBoundingClientRect();
  let onScreen = bounds.bottom > 0 && bounds.top < window.innerHeight;
  const easing = "cubic-bezier(0.3, 0, 0.7, 1)";

  const syncPlayback = () => {
    const shouldPause = paused || document.hidden || !onScreen;
    host.dataset.paused = String(shouldPause);
    for (const animation of active) {
      if (animation.playState === "finished" || animation.playState === "idle") continue;
      if (shouldPause) animation.pause();
      else animation.play();
    }
  };
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    syncPlayback();
  });
  observer.observe(visibilityTarget);
  document.addEventListener("visibilitychange", syncPlayback);

  const animate = (element: Element, frames: Keyframe[], duration: number, curve = "linear", fill: FillMode = "forwards") => {
    signal.throwIfAborted();
    const animation = element.animate(frames, { duration, easing: curve, fill });
    active.add(animation);
    syncPlayback();
    return animation;
  };
  const finished = async (animation: Animation) => {
    try { await animation.finished; signal.throwIfAborted(); }
    finally { active.delete(animation); }
  };
  const show = (next: number, layer = images) => {
    layer.forEach((image, position) => { if (image) image.hidden = position !== next; });
  };
  const ready = async (next: number, includeUnderlay = false) => {
    signal.throwIfAborted();
    const loading = Promise.all([
      images[next]!.decode(),
      ...(includeUnderlay ? [underlayImages[next]!.decode()] : []),
    ]);
    let abort!: () => void;
    try {
      await Promise.race([loading, new Promise<never>((_, reject) => {
        abort = () => reject(signal.reason);
        signal.addEventListener("abort", abort, { once: true });
      })]);
      signal.throwIfAborted();
      return true;
    } catch {
      signal.throwIfAborted();
      return false;
    } finally { signal.removeEventListener("abort", abort); }
  };
  const play = async (frames: Keyframe[], duration: number, curve = easing) => {
    const previous = frameAnimation;
    const previousAnchor = anchorAnimation;
    frameAnimation = animate(frame, frames, duration, curve);
    anchorAnimation = animate(anchor, frames.map(({ width, height, offset }) => ({ width, height, offset })), duration, curve);
    previous?.cancel();
    previousAnchor?.cancel();
    await Promise.all([finished(frameAnimation), finished(anchorAnimation)]);
  };
  const fly = async (from: string, to: string) => {
    const previous = cursorAnimation;
    cursorAnimation = animate(cursor, [{ transform: from }, { transform: to }], 600, "cubic-bezier(0.4, 0, 0.2, 1)");
    previous?.cancel();
    await finished(cursorAnimation);
  };
  const stop = () => {
    frameAnimation?.cancel();
    anchorAnimation?.cancel();
    cursorAnimation?.cancel();
    delete host.dataset.running;
    delete host.dataset.duplicateHandle;
    host.dataset.phase = "static";
    underlay.hidden = true;
    show(index);
    expanded = true;
    resting = false;
  };
  const rest = async () => {
    host.dataset.phase = "hold";
    if (reducedMotion || resting) return;
    await fly("translate(0, 0)", expanded ? "translate(-24px, -24px)" : "translate(24px, 24px)");
    resting = true;
  };
  const grow = async (onReveal?: () => Promise<void>) => {
    expanded = true;
    host.dataset.phase = "expand";
    const motion = play([
      { width: "0%", height: "0%", opacity: 0 },
      { width: "2%", height: "2%", opacity: 1, offset: 0.02 },
      { width: "100%", height: "100%", opacity: 1 },
    ], 1400);
    await Promise.all([motion.then(() => { if (onReveal) return rest(); }), onReveal?.()]);
    host.dataset.phase = "hold";
  };
  const start = async (onReveal?: () => Promise<void>) => {
    if (reducedMotion) return true;
    if (!(await ready(index))) { stop(); return false; }
    host.dataset.running = "true";
    await grow(onReveal);
    return true;
  };
  // Portfolio replaces through a blank frame; hero keeps its layered alternation.
  const replace = async (next: number, onReveal: () => Promise<void>) => {
    if (!(await ready(next))) { stop(); return false; }
    if (reducedMotion) {
      index = next;
      stop();
      host.dataset.current = String(index);
      await onReveal();
      return true;
    }
    host.dataset.running = "true";
    underlay.hidden = true;
    delete host.dataset.duplicateHandle;
    await fly(resting ? "translate(-24px, -24px)" : "translate(0, 0)", "translate(0, 0)");
    resting = false;
    host.dataset.phase = "collapse";
    await play([
      { width: "100%", height: "100%", opacity: 1 },
      { width: "2%", height: "2%", opacity: 1, offset: 0.98 },
      { width: "0%", height: "0%", opacity: 0 },
    ], 1200);
    index = next;
    show(index);
    host.dataset.current = String(index);
    await grow(onReveal);
    return true;
  };
  const transition = async (next: number) => {
    if (next === index) return true;
    if (!(await ready(next, !reducedMotion))) { stop(); return false; }
    if (reducedMotion) {
      index = next;
      stop();
      host.dataset.current = String(index);
      return true;
    }
    host.dataset.running = "true";
    await fly(resting ? (expanded ? "translate(-24px, -24px)" : "translate(24px, 24px)") : "translate(0, 0)", "translate(0, 0)");
    resting = false;
    if (expanded) {
      show(next, underlayImages);
      underlay.hidden = false;
      host.dataset.duplicateHandle = "true";
      host.dataset.phase = "collapse";
      await play([
        { width: "100%", height: "100%", opacity: 1 },
        { width: "2%", height: "2%", opacity: 1, offset: 0.98 },
        { width: "0%", height: "0%", opacity: 0 },
      ], 1200);
    } else {
      show(next);
      host.dataset.phase = "expand";
      await play([
        { width: "0%", height: "0%", opacity: 0 },
        { width: "2%", height: "2%", opacity: 1, offset: 0.02 },
        { width: "100%", height: "100%", opacity: 1 },
      ], 1400);
    }
    expanded = !expanded;
    index = next;
    show(index);
    host.dataset.current = String(index);
    host.dataset.phase = "hold";
    return true;
  };
  const wait = async (duration: number, progress?: (elapsed: number) => void) => {
    clockAnimation = animate(host, [{}, {}], duration, "linear", "none");
    const clock = clockAnimation;
    let raf = 0;
    const tick = () => {
      progress?.(Number(clock.currentTime ?? 0));
      raf = window.requestAnimationFrame(tick);
    };
    if (progress) tick();
    try { await finished(clock); progress?.(duration); }
    finally {
      window.cancelAnimationFrame(raf);
      if (clockAnimation === clock) clockAnimation = undefined;
      clock.cancel();
    }
  };
  const dispose = () => {
    for (const animation of active) animation.cancel();
    active.clear();
    clockAnimation?.cancel();
    stop();
    observer.disconnect();
    document.removeEventListener("visibilitychange", syncPlayback);
    signal.removeEventListener("abort", dispose);
  };
  const hold = (duration: number) => {
    const size = expanded ? "100%" : "0%";
    const endpoint = { width: size, height: size, opacity: expanded ? 1 : 0 };
    return play([endpoint, endpoint], duration, "linear");
  };
  signal.addEventListener("abort", dispose, { once: true });
  host.dataset.current = "0";
  host.dataset.phase = "static";
  // A restarted reduced-motion preference must also reset both layers.
  show(0);
  underlay.hidden = true;

  return {
    signal, reducedMotion, start, transition, replace, rest, wait, hold, stop, dispose,
    get current() { return index; },
    selectStatic(next: number) { index = next; stop(); host.dataset.current = String(index); },
    setPaused(value: boolean) { paused = value; syncPlayback(); },
    skipWait() { clockAnimation?.finish(); },
  };
}
