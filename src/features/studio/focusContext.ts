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

/** True when focus is on a control that uses Enter/Space/arrows itself. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null;
}
