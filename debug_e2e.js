const {Client}=require('ssh2');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR');return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
c.on('ready',async()=>{
    // Get DB URL from .env
    let r = await ex(c, "grep DATABASE_URL /www/wwwroot/n11.namainvist.com/.env | head -1");
    console.log('DB:', r.substring(0,60)+'...');
    
    // Check QR in DB using psql
    r = await ex(c, "cd /www/wwwroot/n11.namainvist.com && source .env 2>/dev/null; psql \"$DATABASE_URL\" -t -c \"SELECT id, invoice_no, zatca_status, length(zatca_qr) as qr_len FROM sales_invoices ORDER BY id DESC LIMIT 5\" 2>&1 || echo 'psql failed'");
    console.log('Last 5 invoices QR status:');
    console.log(r);
    
    // Alternative: check via the env file
    r = await ex(c, "cat /www/wwwroot/n11.namainvist.com/.env 2>/dev/null | grep -i 'DATABASE\\|zatca' | head -5");
    console.log('\nEnv vars:', r);
    
    c.end();
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
