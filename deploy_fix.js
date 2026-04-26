const {Client}=require('ssh2');const fs=require('fs');const path=require('path');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR:'+e.message);return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
function up(cn,l,r){return new Promise((res,rej)=>{cn.sftp((e,sf)=>{if(e)return rej(e);sf.fastPut(l,r,e=>{if(e)return rej(e);res()})})});}
c.on('ready',async()=>{
console.log('Deploying units fix...');
await up(c,path.join('d:\\namasoft9-3-main','src/app/api/units/route.ts'),'/www/wwwroot/n11.namainvist.com/src/app/api/units/route.ts');
console.log('✅ units/route.ts uploaded');
await ex(c,'pm2 stop saas-app');
await ex(c,'rm -rf /www/wwwroot/n11.namainvist.com/.next');
let r=await ex(c,'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -3');
console.log('Build:',r);
await ex(c,'pm2 start saas-app');
await new Promise(r=>setTimeout(r,5000));
console.log('✅ DEPLOYED');
c.end();
});
c.on('error',e=>console.error(e.message));
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b',readyTimeout:15000});
