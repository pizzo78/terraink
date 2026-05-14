import type { SharedPosterPayload } from "@/features/share/domain/types";

const SHARE_PARAM = "poster";

function encodeUtf8Base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeUtf8Base64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function isSharedPosterPayload(value: unknown): value is SharedPosterPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { version?: unknown }).version === 1
  );
}

export function createPosterShareUrl(
  payload: SharedPosterPayload,
  href?: string,
): string {
  const currentHref =
    href ??
    (typeof window === "undefined" ? "http://localhost/" : window.location.href);
  const url = new URL(currentHref);
  const encoded = encodeUtf8Base64Url(JSON.stringify(payload));

  url.searchParams.set(SHARE_PARAM, encoded);
  return url.toString();
}

export function readPosterSharePayload(href?: string): SharedPosterPayload | null {
  const currentHref =
    href ?? (typeof window === "undefined" ? "" : window.location.href);
  if (!currentHref) {
    return null;
  }

  try {
    const url = new URL(currentHref);
    const encoded = url.searchParams.get(SHARE_PARAM);
    if (!encoded) {
      return null;
    }

    const payload = JSON.parse(decodeUtf8Base64Url(encoded)) as unknown;
    return isSharedPosterPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-10000px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const didCopy = document.execCommand("copy");
    if (!didCopy) {
      throw new Error("Copy command failed.");
    }
  } finally {
    textarea.remove();
  }
}
