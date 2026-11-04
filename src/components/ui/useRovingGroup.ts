"use client";

import { useCallback, type KeyboardEvent } from "react";

type Kind = "radio" | "tab";

const STATE_ATTR: Record<Kind, string> = { radio: "aria-checked", tab: "aria-selected" };
const KEYS: Record<string, number | "first" | "last"> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
  Home: "first",
  End: "last",
};

function items(container: HTMLElement, kind: Kind): HTMLElement[] {
  const groupRole = kind === "radio" ? "radiogroup" : "tablist";
  return [...container.querySelectorAll<HTMLElement>(`[role="${kind}"]`)].filter(
    (el) => el.closest(`[role="${groupRole}"]`) === container,
  );
}

const isEnabled = (el: HTMLElement) =>
  !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true";

/** One Tab stop per group: the selected item, or the first enabled one. */
function syncTabStops(container: HTMLElement, kind: Kind): void {
  const all = items(container, kind);
  const enabled = all.filter(isEnabled);
  const current = enabled.find((i) => i.getAttribute(STATE_ATTR[kind]) === "true") ?? enabled[0];
  for (const i of all) {
    const want = i === current ? 0 : -1;
    if (i.tabIndex !== want) i.tabIndex = want;
  }
}

/**
 * WAI-ARIA roving focus for radio groups and tab lists. Spread onto the group
 * element: `<div ref={g.attach} onKeyDown={g.onKeyDown} role="radiogroup">`.
 * Arrow keys / Home / End move focus *and* selection; Tab enters and leaves
 * the group in one stop. Works with role="radio"+aria-checked or
 * role="tab"+aria-selected items. Uses no React refs — the group element is
 * observed directly, so selection/disabled changes keep tab stops correct.
 */
export function useRovingGroup<T extends HTMLElement>(kind: Kind = "radio") {
  const attach = useCallback(
    (el: T | null) => {
      if (!el) return;
      syncTabStops(el, kind);
      const observer = new MutationObserver(() => syncTabStops(el, kind));
      observer.observe(el, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [STATE_ATTR[kind], "disabled", "aria-disabled"],
      });
      return () => observer.disconnect();
    },
    [kind],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<T>) => {
      const step = KEYS[e.key];
      if (step === undefined) return;
      const enabled = items(e.currentTarget, kind).filter(isEnabled);
      if (!enabled.length) return;
      const index = enabled.indexOf(document.activeElement as HTMLElement);
      let next: HTMLElement;
      if (step === "first") next = enabled[0];
      else if (step === "last") next = enabled[enabled.length - 1];
      else next = enabled[(Math.max(index, 0) + step + enabled.length) % enabled.length];
      e.preventDefault();
      e.stopPropagation();
      next.focus();
      next.click();
    },
    [kind],
  );

  return { attach, onKeyDown };
}
