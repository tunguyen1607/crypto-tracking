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
export function getBeginningOfDate(date = null) {
  var today = date ? new Date(date * 1000) : new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(today).getTime() / 1000;
}

export function getPreviousMonthOfDate(date = null, numPrevious = 1) {
  var today = date ? new Date(date * 1000) : new Date();
  today.setUTCMonth(today.getUTCMonth() - numPrevious);
  console.log(today);
  today.setUTCHours(0, 0, 0, 0);
  return new Date(today).getTime() / 1000;
}
