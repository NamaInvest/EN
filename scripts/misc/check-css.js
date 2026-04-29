const https = require('https');
https.get('https://mgmg.namainvist.com/login', (res) => {
  let out = '';
  res.on('data', d => out += d);
  res.on('end', () => {
    const m = out.match(/href="(\/_next\/static\/css\/[^"]+\.css)"/);
    if(m) {
      https.get('https://mgmg.namainvist.com' + m[1], (res2) => {
        let css = '';
        res2.on('data', d => css += d);
        res2.on('end', () => {
          console.log('CSS URL:', m[1]);
          console.log('Found background-repeat:', css.includes('background-repeat:no-repeat!important'));
        });
      });
    } else {
      console.log('No CSS found');
    }
  });
});
