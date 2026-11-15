export function bearerToken(header: string | null): string | null {
  return /^Bearer ([^\s]+)$/i.exec(header || "")?.[1] || null;
}

