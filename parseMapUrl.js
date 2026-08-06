function parseGoogleMapsLink(url) {
  let lat = undefined;
  let lng = undefined;
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = url.match(regex);
  if (match) {
    lat = parseFloat(match[1]);
    lng = parseFloat(match[2]);
  }
  return { lat, lng };
}
console.log(parseGoogleMapsLink('https://www.google.com/maps/place/SomePlace/@17.9757,102.6331,15z'));
