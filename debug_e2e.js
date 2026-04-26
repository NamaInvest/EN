const {Client}=require('ssh2');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR');return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
c.on('ready',async()=>{
    let r = await ex(c, "PGPASSWORD=n11_pass123 psql -h localhost -U n11_db -d n11_db -t -c \"SELECT id, invoice_no, zatca_status, length(zatca_qr) as qr_len FROM sales_invoices ORDER BY id DESC LIMIT 5\"");
    console.log('Last 5 invoices QR:\n'+r);
    c.end();
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
