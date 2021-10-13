export function dateSecondNow(secondMode = false) {
  if (secondMode) {
    return Math.floor(Date.now());
  } else {
    return Math.floor(Date.now() / 1000);
  }
}

export function addMinutes(date, minutes) {
  return date + minutes * 60;
}

export function minusMinutes(date, minutes) {
  return date - minutes * 60;
}
