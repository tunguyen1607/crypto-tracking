export function checkDataNull(data) {
  return typeof data == 'undefined' || !data;
}
export function isStringJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
