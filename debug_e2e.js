const {Client}=require('ssh2');const c=new Client();
function ex(cn,cmd){return new Promise(r=>{cn.exec(cmd,(e,s)=>{if(e){r('ERR');return}let o='';s.on('data',d=>o+=d.toString());s.stderr.on('data',d=>o+=d.toString());s.on('close',()=>r(o.trim()))})});}
c.on('ready',async()=>{
    let r = await ex(c, "curl -s -m 5 -H 'Host: brightstartradingco.namainvist.com' -H 'Content-Type: application/json' -X POST -d '{\"username\":\"admin\",\"password\":\"admin7773\"}' 'http://localhost:3500/api/auth/login'");
    const tk = JSON.parse(r).token;
    const h = "-H 'Host: brightstartradingco.namainvist.com' -H 'Authorization: Bearer "+tk+"' -b 'token="+tk+"'";
    
    r = await ex(c, "curl -s -w '\\nHTTP_CODE:%{http_code}\\nSIZE:%{size_download}' "+h+" 'http://localhost:3500/api/loyalty/29'");
    console.log('loyalty/29 raw response:');
    console.log('>>>'+r+'<<<');
    console.log('length:', r.length);
    console.log('typeof:', typeof r);
    
    c.end();
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
