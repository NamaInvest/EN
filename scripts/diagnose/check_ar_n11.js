const text = require('fs').readFileSync('ar_n11.json', 'utf8');
console.log('Occurrences of 4390:', text.split('"sys.str_4390"').length - 1);
