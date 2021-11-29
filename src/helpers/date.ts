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
  let today = date ? new Date(date * 1000) : new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(today).getTime() / 1000;
}

export function getPreviousMonthOfDate(date = null, numPrevious = 1) {
  let today = date ? new Date(date * 1000) : new Date();
  today.setUTCMonth(today.getUTCMonth() - numPrevious);
  console.log(today);
  today.setUTCHours(0, 0, 0, 0);
  return new Date(today).getTime() / 1000;
}

export function checkValidDate(dateObject) {
  return new Date(dateObject).toString() !== 'Invalid Date';
}
export function timeConverter(UNIX_timestamp, withTime = true){
  let a = new Date(UNIX_timestamp * 1000);
  let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let year = a.getFullYear();
  let month = months[a.getMonth()];
  let date = a.getDate();
  let hour = a.getHours();
  let min = a.getMinutes();
  let sec = a.getSeconds();
  let time = date + ' ' + month + ' ' + year +(withTime ?  ' ' + hour + ':' + min + ':' + sec : '') ;
  return time;
}
