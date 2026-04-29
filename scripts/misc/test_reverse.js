const iconv = require('iconv-lite');
const str = "ظˆطط¯ط§طھ ط§ظ„طھط¹ط¨ط¦ط©";
const buf = iconv.encode(str, 'cp1256');
const decoded = iconv.decode(buf, 'utf8');
console.log('CP1256:', decoded);

const buf1252 = iconv.encode(str, 'cp1252');
const decoded1252 = iconv.decode(buf1252, 'utf8');
console.log('CP1252:', decoded1252);
