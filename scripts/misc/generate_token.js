const jwt = require('jsonwebtoken');
const token = jwt.sign(
    { userId: 1, username: 'admin', role: 'admin' }, 
    'namainvest-secret', 
    { expiresIn: '24h' }
);
console.log('TOKEN=', token);
