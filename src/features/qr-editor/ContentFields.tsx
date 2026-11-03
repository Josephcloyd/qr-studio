"use client";

import { useState } from "react";
import { SelectField, Segmented, SwitchField, TextArea, TextField } from "@/components/ui/Field";
import type {
  ContentOf,
  EmailContent,
  EventContent,
  LocationContent,
  PhoneContent,
  QrContent,
  QrType,
  SmsContent,
  TextContent,
  UrlContent,
  VCardContent,
  WhatsAppContent,
  WifiContent,
} from "@/lib/qr/content";
import type { FieldErrors } from "@/lib/qr/payloads";

interface FormProps<T extends QrType> {
  value: ContentOf<T>;
  onChange: (next: ContentOf<T>) => void;
  errors: FieldErrors;
}

/** Shows a field's error only after the user has interacted with it. */
function useTouched() {
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const touch = (field: string) => setTouched((t) => (t.has(field) ? t : new Set(t).add(field)));
  const show = (errors: FieldErrors, field: string, value: string) =>
    touched.has(field) || value.length > 0 ? (errors[field] ?? null) : null;
  return { touch, show };
}

function UrlForm({ value, onChange, errors }: FormProps<"url">) {
  const t = useTouched();
  return (
    <TextField
      label="Website address"
      type="url"
      inputMode="url"
      autoComplete="url"
      placeholder="yourbusiness.com"
      value={value.url}
      onValueChange={(url) => onChange({ ...value, url } as UrlContent)}
      onBlur={() => t.touch("url")}
      error={t.show(errors, "url", value.url)}
      hint="We add https:// if you leave it out. The link is stored directly in the code."
    />
  );
}

function TextForm({ value, onChange, errors }: FormProps<"text">) {
  const t = useTouched();
  return (
    <TextArea
      label="Text"
      rows={5}
      placeholder="Anything you like — any language works."
      value={value.text}
      onValueChange={(text) => onChange({ ...value, text } as TextContent)}
      onBlur={() => t.touch("text")}
      error={t.show(errors, "text", value.text)}
      trailing={
        <span className="text-ink-3 font-mono text-[11px]">{[...value.text].length} chars</span>
      }
    />
  );
}

function WifiForm({ value, onChange, errors }: FormProps<"wifi">) {
  const t = useTouched();
  const set = (patch: Partial<WifiContent>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4">
      <TextField
        label="Network name (SSID)"
        autoComplete="off"
        placeholder="Cafe Guest"
        value={value.ssid}
        onValueChange={(ssid) => set({ ssid })}
        onBlur={() => t.touch("ssid")}
        error={t.show(errors, "ssid", value.ssid)}
      />
      <Segmented
        label="Security"
        value={value.encryption}
        onValueChange={(encryption) => set({ encryption })}
        options={[
          { value: "WPA", label: "WPA / WPA2 / WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None" },
        ]}
      />
      {value.encryption !== "nopass" && (
        <TextField
          label="Password"
          autoComplete="off"
          spellCheck={false}
          value={value.password}
          onValueChange={(password) => set({ password })}
          onBlur={() => t.touch("password")}
          error={t.show(errors, "password", value.password)}
          hint="Stored inside the QR code itself — anyone who scans it can see the password."
        />
      )}
      <SwitchField
        label="Hidden network"
        hint="Turn on if the network doesn't broadcast its name."
        checked={value.hidden}
        onCheckedChange={(hidden) => set({ hidden })}
      />
    </div>
  );
}

function VCardForm({ value, onChange, errors }: FormProps<"vcard">) {
  const t = useTouched();
  const field = (
    key: keyof Omit<VCardContent, "type">,
    label: string,
    extra: Record<string, unknown> = {},
  ) => (
    <TextField
      label={label}
      value={value[key]}
      onValueChange={(v) => onChange({ ...value, [key]: v })}
      onBlur={() => t.touch(key)}
      error={t.show(errors, key, value[key])}
      {...extra}
    />
  );
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("firstName", "First name", { autoComplete: "given-name" })}
        {field("lastName", "Last name", { autoComplete: "family-name" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("organization", "Company", { autoComplete: "organization" })}
        {field("title", "Job title", { autoComplete: "organization-title" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("mobile", "Mobile", {
          type: "tel",
          inputMode: "tel",
          placeholder: "+63 917 123 4567",
        })}
        {field("phone", "Work phone", { type: "tel", inputMode: "tel" })}
      </div>
      {field("email", "Email", { type: "email", inputMode: "email", autoComplete: "email" })}
      {field("website", "Website", { inputMode: "url", placeholder: "yourbusiness.com" })}
      {field("street", "Street address", { autoComplete: "street-address" })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("city", "City")}
        {field("region", "Province / state")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("postalCode", "Postal code")}
        {field("country", "Country")}
      </div>
      <TextArea
        label="Note"
        rows={2}
        value={value.note}
        onValueChange={(note) => onChange({ ...value, note })}
      />
    </div>
  );
}

function EmailForm({ value, onChange, errors }: FormProps<"email">) {
  const t = useTouched();
  const set = (patch: Partial<EmailContent>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4">
      <TextField
        label="Send to"
        type="email"
        inputMode="email"
        placeholder="hello@yourbusiness.com"
        value={value.to}
        onValueChange={(to) => set({ to })}
        onBlur={() => t.touch("to")}
        error={t.show(errors, "to", value.to)}
      />
      <TextField
        label="Subject"
        value={value.subject}
        onValueChange={(subject) => set({ subject })}
      />
      <TextArea
        label="Message"
        rows={4}
        value={value.body}
        onValueChange={(body) => set({ body })}
      />
    </div>
  );
}

function PhoneForm({ value, onChange, errors }: FormProps<"phone">) {
  const t = useTouched();
  return (
    <TextField
      label="Phone number"
      type="tel"
      inputMode="tel"
      placeholder="+63 2 8123 4567"
      value={value.number}
      onValueChange={(number) => onChange({ ...value, number } as PhoneContent)}
      onBlur={() => t.touch("number")}
      error={t.show(errors, "number", value.number)}
      hint="Include the country code so it works anywhere."
    />
  );
}

function SmsForm({ value, onChange, errors }: FormProps<"sms">) {
  const t = useTouched();
  const set = (patch: Partial<SmsContent>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4">
      <TextField
        label="Phone number"
        type="tel"
        inputMode="tel"
        value={value.number}
        onValueChange={(number) => set({ number })}
        onBlur={() => t.touch("number")}
        error={t.show(errors, "number", value.number)}
      />
      <TextArea
        label="Message"
        rows={4}
        value={value.message}
        onValueChange={(message) => set({ message })}
        hint="Pre-filled — people can edit it before sending."
      />
    </div>
  );
}

function WhatsAppForm({ value, onChange, errors }: FormProps<"whatsapp">) {
  const t = useTouched();
  const set = (patch: Partial<WhatsAppContent>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4">
      <TextField
        label="WhatsApp number"
        type="tel"
        inputMode="tel"
        placeholder="63 917 123 4567"
        value={value.number}
        onValueChange={(number) => set({ number })}
        onBlur={() => t.touch("number")}
        error={t.show(errors, "number", value.number)}
        hint="International format with country code, no leading 0."
      />
      <TextArea
        label="Pre-filled message"
        rows={3}
        value={value.message}
        onValueChange={(message) => set({ message })}
      />
    </div>
  );
}

function LocationForm({ value, onChange, errors }: FormProps<"location">) {
  const t = useTouched();
  const set = (patch: Partial<LocationContent>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4">
      <Segmented
        label="Find the place by"
        value={value.mode}
        onValueChange={(mode) => set({ mode })}
        options={[
          { value: "coordinates", label: "Coordinates" },
          { value: "address", label: "Address or name" },
        ]}
      />
      {value.mode === "coordinates" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Latitude"
            inputMode="decimal"
            placeholder="14.5547"
            value={value.latitude}
            onValueChange={(latitude) => set({ latitude })}
            onBlur={() => t.touch("latitude")}
            error={t.show(errors, "latitude", value.latitude)}
          />
          <TextField
            label="Longitude"
            inputMode="decimal"
            placeholder="121.0244"
            value={value.longitude}
            onValueChange={(longitude) => set({ longitude })}
            onBlur={() => t.touch("longitude")}
            error={t.show(errors, "longitude", value.longitude)}
          />
        </div>
      ) : (
        <TextField
          label="Address or place"
          placeholder="Rizal Park, Manila"
          value={value.address}
          onValueChange={(address) => set({ address })}
          onBlur={() => t.touch("address")}
          error={t.show(errors, "address", value.address)}
          hint="We don't look this up — the map app does when someone scans."
        />
      )}
      <SelectField
        label="Open in"
        value={value.provider}
        onValueChange={(provider) => set({ provider })}
        options={[
          { value: "google", label: "Google Maps link" },
          { value: "apple", label: "Apple Maps link" },
          { value: "osm", label: "OpenStreetMap link" },
          { value: "geo", label: "Device default (geo: URI)" },
        ]}
      />
    </div>
  );
}

function EventForm({ value, onChange, errors }: FormProps<"event">) {
  const t = useTouched();
  const set = (patch: Partial<EventContent>) => onChange({ ...value, ...patch });
  const type = value.allDay ? "date" : "datetime-local";
  return (
    <div className="grid gap-4">
      <TextField
        label="Event name"
        value={value.title}
        onValueChange={(title) => set({ title })}
        onBlur={() => t.touch("title")}
        error={t.show(errors, "title", value.title)}
      />
      <SwitchField
        label="All-day event"
        checked={value.allDay}
        onCheckedChange={(allDay) =>
          set({
            allDay,
            start: value.start.slice(0, allDay ? 10 : 16),
            end: value.end.slice(0, allDay ? 10 : 16),
          })
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Starts"
          type={type}
          value={value.start}
          onValueChange={(start) => set({ start })}
          onBlur={() => t.touch("start")}
          error={t.show(errors, "start", value.start)}
        />
        <TextField
          label="Ends"
          type={type}
          value={value.end}
          onValueChange={(end) => set({ end })}
          error={t.show(errors, "end", value.end)}
        />
      </div>
      <TextField
        label="Location"
        value={value.location}
        onValueChange={(location) => set({ location })}
      />
      <TextArea
        label="Details"
        rows={3}
        value={value.description}
        onValueChange={(description) => set({ description })}
      />
    </div>
  );
}

export function ContentFields({
  content,
  onChange,
  errors,
}: {
  content: QrContent;
  onChange: (c: QrContent) => void;
  errors: FieldErrors;
}) {
  // Keyed by type so each form's "touched" state resets when switching types.
  switch (content.type) {
    case "url":
      return <UrlForm key="url" value={content} onChange={onChange} errors={errors} />;
    case "text":
      return <TextForm key="text" value={content} onChange={onChange} errors={errors} />;
    case "wifi":
      return <WifiForm key="wifi" value={content} onChange={onChange} errors={errors} />;
    case "vcard":
      return <VCardForm key="vcard" value={content} onChange={onChange} errors={errors} />;
    case "email":
      return <EmailForm key="email" value={content} onChange={onChange} errors={errors} />;
    case "phone":
      return <PhoneForm key="phone" value={content} onChange={onChange} errors={errors} />;
    case "sms":
      return <SmsForm key="sms" value={content} onChange={onChange} errors={errors} />;
    case "whatsapp":
      return <WhatsAppForm key="whatsapp" value={content} onChange={onChange} errors={errors} />;
    case "location":
      return <LocationForm key="location" value={content} onChange={onChange} errors={errors} />;
    case "event":
      return <EventForm key="event" value={content} onChange={onChange} errors={errors} />;
  }
}
