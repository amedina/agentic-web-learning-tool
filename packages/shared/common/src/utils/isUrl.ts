function isUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (_error) {
    return false;
  }
}

export default isUrl;
