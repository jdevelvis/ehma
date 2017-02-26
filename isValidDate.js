_ = require('underscore');
module.exports = function (d) {
  if ( _.isDate(d) ) {
    console.log("isDate Object");
    //It is a date object, is it a valid date?
    //Check the month
    console.log("Month",d.getMonth());
    if (d.getMonth() > 0 && d.getMonth() <= 12) {
      console.log("Month is fine", d.getMonth());
      //Month checks out, check the day
      //Assume not leap year by default (note that Month is 0 based, so
      //January = index 0)
      var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

      // If year is evenly divisible by 4 and not evenly divisible by 100,
      // or is evenly divisible by 400, then a leap year
      //Logic found here: http://stackoverflow.com/questions/5812220/how-to-validate-a-date
      var y = d.getFullYear();
      if ((!(y % 4) && y % 100) || !(y % 400)) {
        daysInMonth[1] = 29;
      }

      //Check if the day is valid
      console.log("Day:", d.getDate())
      if (d.getDate() <= daysInMonth[d.getMonth()]) {
        //Cannot test time inside the date object, except checking
        //if it's a number, because the date object parses any
        //number as the time with reckless abandon
        return !isNaN(d.getTime());
      }
    }
  }
  //If we get here, it's not a valid date, return false
  return false;
}
