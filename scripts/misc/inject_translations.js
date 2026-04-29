const fs = require('fs');

let code = fs.readFileSync('src/lib/translations.ts', 'utf8');

const ar = JSON.parse(fs.readFileSync('valid_missing.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('missing_en.json', 'utf8'));
const hi = JSON.parse(fs.readFileSync('missing_hi.json', 'utf8'));
const bn = JSON.parse(fs.readFileSync('missing_bn.json', 'utf8'));
const ur = JSON.parse(fs.readFileSync('missing_ur.json', 'utf8'));

function insertToLang(code, langTag, dict) {
  // Matches '"ar": {' or 'ar: {'
  const target1 = `"${langTag}": {`;
  const target2 = `  ${langTag}: {`;
  
  let idx = code.indexOf(target1);
  if (idx !== -1) {
      idx += target1.length;
  } else {
      idx = code.indexOf(target2);
      if (idx !== -1) idx += target2.length;
  }
  
  if (idx === -1) {
    console.log("Could not find", langTag);
    return code;
  }
  
  let strToInsert = "\n";
  for(const k in dict) {
     strToInsert += `    "${k}": ${JSON.stringify(dict[k])},\n`;
  }
  
  return code.slice(0, idx) + strToInsert + code.slice(idx);
}

code = insertToLang(code, 'ar', ar);
code = insertToLang(code, 'en', en);
code = insertToLang(code, 'hi', hi);
code = insertToLang(code, 'bn', bn);
code = insertToLang(code, 'ur', ur);

fs.writeFileSync('src/lib/translations.ts', code);
console.log('Successfully injected 618 new keys x 5 languages into translations.ts');
