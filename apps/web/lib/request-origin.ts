export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? url.protocol.replace(":", "");

  if (!host) {
    return url.origin;
  }

  return `${protocol}://${host}`;
}
