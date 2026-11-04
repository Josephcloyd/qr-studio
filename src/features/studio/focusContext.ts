/**
 * Where keyboard focus is, so global editor shortcuts never steal keys from
 * fields, buttons, menus, sliders or radio groups.
 */

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "email",
  "tel",
  "password",
  "number",
  "date",
  "datetime-local",
  "time",
  "month",
  "week",
]);

/** True when the user is typing into a text field (native editing keys must win). */
export function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
    return true;
  return target instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(target.type);
}

const INTERACTIVE =
  'button, a[href], summary, input, select, textarea, [role="radio"], [role="tab"], [role="menuitem"], [role="menu"], [role="slider"], [role="switch"], [role="option"], [role="listbox"], [role="dialog"], [data-radix-popper-content-wrapper]';

/** True when focus is on a control that activates with Enter/Space. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null;
}

/** Widgets that use arrow keys / Delete / Escape themselves (plain buttons don't). */
const COMPOSITE =
  'input, select, textarea, [role="radio"], [role="radiogroup"], [role="tab"], [role="tablist"], [role="menuitem"], [role="menu"], [role="slider"], [role="option"], [role="listbox"], [role="dialog"], [data-radix-popper-content-wrapper], .react-colorful';

export function isCompositeWidget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(COMPOSITE) !== null;
}
