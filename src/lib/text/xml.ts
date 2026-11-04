/**
 * Removes characters that are illegal in XML 1.0 (C0 controls except tab/LF/CR,
 * lone surrogates, U+FFFE/U+FFFF). React escapes markup characters but not
 * these, and a single one makes an exported SVG unparseable.
 * Built from an escaped string so formatters can't turn the escapes into
 * invisible literal characters.
 */
const INVALID_XML = new RegExp(
  [
    "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]",
    "[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])",
    "(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]",
  ].join("|"),
  "g",
);

export function stripInvalidXml(value: string): string {
  return value.replace(INVALID_XML, "");
}
