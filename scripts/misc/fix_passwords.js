const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const h1 = bcrypt.hashSync('admin', 10);
  await p.user.update({ where: { id: 1 }, data: { passwordHash: h1 } });
  console.log('admin password reset to: admin');

  const h2 = bcrypt.hashSync('1', 10);
  await p.user.update({ where: { id: 2 }, data: { passwordHash: h2 } });
  console.log('user 1 password reset to: 1');

  const h3 = bcrypt.hashSync('2', 10);
  await p.user.update({ where: { id: 3 }, data: { passwordHash: h3 } });
  console.log('user 2 password reset to: 2');

  await p.$disconnect();
  console.log('Done!');
})();
