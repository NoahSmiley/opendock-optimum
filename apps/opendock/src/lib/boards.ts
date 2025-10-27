const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;

export function isBoardsUrlExternal(url: string): boolean {
  return HTTP_PROTOCOL_REGEX.test(url);
}

export function launchBoardsApp(url: string): void {
  if (isBoardsUrlExternal(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
}
