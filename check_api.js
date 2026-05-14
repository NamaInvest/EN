const http = require('http'); 
http.get('http://localhost:3000/api/settings', { headers: { 'x-tenant': 'aljassim' } }, (res) => { 
    let data = ''; 
    res.on('data', c => data+=c); 
    res.on('end', () => console.log(res.statusCode, data)); 
}).on('error', console.error);
