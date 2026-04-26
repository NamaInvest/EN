const {Client}=require('ssh2');const fs=require('fs');const path=require('path');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR:'+e.message);return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
function up(cn,l,r){return new Promise((res,rej)=>{cn.sftp((e,sf)=>{if(e)return rej(e);sf.fastPut(l,r,e=>{if(e)return rej(e);res()})})});}

const FILES_TO_DEPLOY = [
    'src/app/api/units/route.ts',
    'src/app/api/accounting/accounts/route.ts',
    'src/app/api/batches/route.ts',
    'src/app/api/bookings/route.ts',
    'src/app/api/coupons/route.ts',
    'src/app/api/fixed-assets/route.ts',
    'src/app/api/gift-cards/route.ts',
    'src/app/api/installments/route.ts',
    'src/app/api/loyalty/route.ts',
    'src/app/api/maintenance/route.ts',
    'src/app/api/price-quotes/route.ts',
    'src/app/api/promotions/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/stock-transfers/route.ts',
    'src/app/api/stocktake/route.ts',
];

c.on('ready',async()=>{
const local=path.join('d:\\namasoft9-3-main');
const remote='/www/wwwroot/n11.namainvist.com';
console.log('📦 Deploying '+FILES_TO_DEPLOY.length+' fixed files...');
for(const f of FILES_TO_DEPLOY){
    try{
        await up(c,path.join(local,f),remote+'/'+f);
        console.log('✅ '+f.split('/').pop());
    }catch(e){console.log('❌ '+f+': '+e.message)}
}
console.log('\n🔨 Rebuilding...');
await ex(c,'pm2 stop saas-app');
await ex(c,'rm -rf '+remote+'/.next');
let r=await ex(c,'cd '+remote+' && npm run build 2>&1 | tail -5');
console.log('Build:',r);
await ex(c,'pm2 start saas-app');
await new Promise(r=>setTimeout(r,5000));
console.log('✅ DEPLOYED AND REBUILT');
c.end();
});
c.on('error',e=>console.error(e.message));
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b',readyTimeout:15000});
