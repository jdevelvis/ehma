var isValidDate = require('./isValidDate.js');
console.log(isValidDate(new Date(2017,1,15)));
console.log(isValidDate(new Date(2017,1,15,12,00,00)));
console.log(isValidDate(new Date(2017,0,30)));
console.log(isValidDate(new Date(2017,0,-1,00,00,00)));
console.log(isValidDate(new Date(2017,1,30)));
console.log((new Date(2017,01,30)).toString());
