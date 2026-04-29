const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}
const { Client } = require('ssh2'); const c = new Client();
c.on('ready', () => {
  c.exec("node -e \"const fs=require('fs'); const path=require('path'); function walk(d){let r=[];try{fs.readdirSync(d).forEach(f=>{f=path.join(d,f);const s=fs.statSync(f);if(s&&s.isDirectory())r=r.concat(walk(f));else r.push(f);});}catch(e){}return r;} const files=walk('/www/wwwroot/n11.namainvist.com/.next/'); let found=false; for(let f of files){try{const c=fs.readFileSync(f,'utf8');if(c.includes('ط§ظ„')||c.includes('ط·')){console.log('GARBAGE:',f);found=true;} if(c.includes('الرئيسية')){console.log('CLEAN:',f);found=true;}}catch(e){}} if(!found)console.log('NOTHING FOUND');\"", (err, stream) => {
    let out=''; stream.on('close',()=>{console.log(out);c.end();}).on('data',d=>out+=d.toString());
  });
}).connect({host:'46.4.188.170',port: 22,username: 'root',password: '_ee4SWbxLVfH9b'});
