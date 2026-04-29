const {Client}=require('ssh2');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR');return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
c.on('ready',async()=>{
    let r = await ex(c, "curl -s -m 5 -H 'Host: brightstartradingco.namainvist.com' -H 'Content-Type: application/json' -X POST -d '{\"username\":\"admin\",\"password\":\"admin7773\"}' 'http://localhost:3500/api/auth/login'");
    const tk = JSON.parse(r).token;
    const h = "-H 'Host: brightstartradingco.namainvist.com' -H 'Content-Type: application/json' -H 'Authorization: Bearer "+tk+"' -b 'token="+tk+"'";
    
    // Close existing shift
    r = await ex(c, "curl -s -m 5 "+h+" -X PUT -d '{\"id\":1,\"status\":\"closed\",\"endCash\":2000}' 'http://localhost:3500/api/shifts'");
    console.log('Close shift:', r.substring(0,200));
    
    // Try a sale with valid product
    r = await ex(c, "curl -s -m 5 "+h+" -X POST -d '{\"items\":[{\"productId\":1,\"productName\":\"Test\",\"quantity\":1,\"price\":100}],\"paymentType\":\"cash\",\"taxRate\":15}' 'http://localhost:3500/api/sales'");
    console.log('Sale test:', r.substring(0,300));
    
    c.end();
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
