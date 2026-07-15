const http = require('http');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function test() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // create user
  const user = await prisma.user.create({
    data: {
      email: 'testadmin2@example.com',
      password: hashedPassword,
      name: 'Test Admin'
    }
  });

  // create community
  const comm = await prisma.community.create({
    data: {
      slug: 'test-comm-2',
      name: 'Test Community',
    }
  });

  // create membership
  await prisma.communityMember.create({
    data: {
      userId: user.id,
      communityId: comm.id,
      role: 'COMMUNITY_ADMIN',
      status: 'APPROVED'
    }
  });

  console.log('Created test admin and community');

  // now login
  const loginData = JSON.stringify({ email: 'testadmin2@example.com', password: 'password123' });
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      const token = JSON.parse(data).access_token;
      console.log('Token:', token ? 'exists' : 'null');
      
      const meOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/auth/me',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      };
      
      http.request(meOptions, (meRes) => {
        let meData = '';
        meRes.on('data', (c) => meData += c);
        meRes.on('end', () => {
           console.log('MeData:', meData);
           process.exit(0);
        });
      }).end();
    });
  });
  req.write(loginData);
  req.end();
}

test().catch(console.error);
