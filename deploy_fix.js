const {Client}=require('ssh2');const fs=require('fs');const path=require('path');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR:'+e.message);return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
function up(cn,l,rm){return new Promise((res,rej)=>{cn.sftp((e,sf)=>{if(e)return rej(e);sf.fastPut(l,rm,e=>{sf.end();if(e)return rej(e);res()})})});}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}

const FILES = [
    'src/app/api/price-quotes/route.ts',
    'src/app/api/promotions/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/stock-transfers/route.ts',
    'src/app/api/stocktake/route.ts',
];

c.on('ready',async()=>{
const local='d:\\namasoft9-3-main';
const remote='/www/wwwroot/n11.namainvist.com';
for(const f of FILES){
    try{
        await up(c,path.join(local,f),remote+'/'+f);
        console.log('✅ '+f);
        await wait(500);
    }catch(e){console.log('❌ '+f+': '+e.message)}
}
console.log('\n🔨 Rebuilding...');
await ex(c,'pm2 stop saas-app');
await wait(1000);
await ex(c,'rm -rf '+remote+'/.next');
await wait(1000);
let r=await ex(c,'cd '+remote+' && npm run build 2>&1 | tail -5');
console.log('Build:',r);
await wait(2000);
r=await ex(c,'pm2 start saas-app');
console.log('PM2:',r);
await wait(5000);
console.log('✅ DEPLOYED');
c.end();
});
c.on('error',e=>console.error(e.message));
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b',readyTimeout:15000});
