const fs = require('fs');
const content = fs.readFileSync('src/app/sso-callback/page.tsx', 'utf8');
const d = new TextDecoder('windows-1256');
const bytes = new Uint8Array(256);
for(let i=0; i<256; i++) bytes[i] = i;
const str = d.decode(bytes);
let win1256HighChars = '';
for(let i=128; i<256; i++) win1256HighChars += str[i];
win1256HighChars = win1256HighChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
const regex = new RegExp('[' + win1256HighChars + ']+[a-zA-Z0-9\\s\\.,;:\\-_\\\'\\"' + win1256HighChars + ']*', 'g');
let match;
while ((match = regex.exec(content)) !== null) {
    console.log('MATCH:', match[0]);
}
