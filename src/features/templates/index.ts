import type { DesignDocument } from "@/lib/model/types";
import { BUSINESS_TEMPLATES } from "./business";
import { EVENT_TEMPLATES } from "./events";
import type { TemplateCategory, TemplateDef } from "./kit";
import { MARKETING_TEMPLATES } from "./marketing";
import { PERSONAL_TEMPLATES } from "./personal";
import { RESTAURANT_TEMPLATES } from "./restaurant";

export const TEMPLATES: TemplateDef[] = [
  ...BUSINESS_TEMPLATES,
  ...RESTAURANT_TEMPLATES,
  ...EVENT_TEMPLATES,
  ...MARKETING_TEMPLATES,
  ...PERSONAL_TEMPLATES,
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ["Business", "Restaurant", "Events", "Marketing", "Personal"];

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** A fresh, editable copy of the template (new ids every time). */
export function instantiateTemplate(id: string): DesignDocument | null {
  return getTemplate(id)?.build() ?? null;
}

export type { TemplateCategory, TemplateDef };
