const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    const cmd = `PGPASSWORD=n11_pass123 psql -U n11_db -d ahmedalyamicompany_db -h localhost -t -c "SELECT zatca_xml FROM sales_invoices WHERE id=16;" | grep -oP 'X509IssuerName[^<]*<[^<]*|X509SerialNumber[^<]*<[^<]*'`;
    c.exec(cmd, (e,s) => {
        if(e){console.error(e);c.end();return;}
        let d='';
        s.on('data', x => d += x.toString());
        s.on('close', () => { console.log(d.trim()); c.end(); });
    });
});
c.on('error', e => console.error('ERR:', e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
