const fs = require('fs');

const str = "âڈ³ ط¬ط§ط±ظچ ط§ظ„حفظ...";
const buf = Buffer.from(str, 'utf8');

// The string was likely read as latin1 when it was actually utf8
try {
    // If it was read as latin1, each character in the string is a byte.
    // Let's get the char codes and put them into a buffer
    const bytes = Buffer.alloc(str.length);
    for(let i=0; i<str.length; i++) {
        bytes[i] = str.charCodeAt(i) & 0xFF; // truncate to 8-bit
    }
    console.log("Recovered:", bytes.toString('utf8'));
} catch(e) {}
