import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const token = jwt.sign(
    { 
      id: 1, 
      username: 'admin', 
      tenantId: 'ahmedalyamicompany',
      role: 'admin',
      active: true
    }, 
    process.env.JWT_SECRET || 'fallback-secret', 
    { expiresIn: '1h' }
);
console.log(token);
