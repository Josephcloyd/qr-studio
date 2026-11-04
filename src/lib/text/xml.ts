/**
 * Removes characters that are illegal in XML 1.0 (C0 controls except tab/LF/CR,
 * lone surrogates, U+FFFE/U+FFFF). React escapes markup characters but not
 * these, and a single one makes an exported SVG unparseable.
 */
// eslint-disable-next-line no-control-regex
const INVALID_XML =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

export function stripInvalidXml(value: string): string {
  return value.replace(INVALID_XML, "");
}
