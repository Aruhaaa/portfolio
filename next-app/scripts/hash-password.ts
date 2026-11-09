// Makes the two values the sign-in needs: ADMIN_PASSWORD_HASH_B64 and a random AUTH_SECRET.
//   npm run hash -- "my password"
// The hash is stored as base64 because a raw bcrypt hash contains "$" characters, which some env editors mangle.
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import bcrypt from 'bcryptjs';

async function main() {
  let password = process.argv[2];
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question('Admin password (it will be visible here): ');
    rl.close();
  }
  if (!password || password.length < 8) {
    console.error('Use a password of at least 8 characters.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  console.log('\nAdd these to your environment (Vercel: Settings > Environment Variables, or .env.local):\n');
  console.log(`ADMIN_PASSWORD_HASH_B64=${Buffer.from(hash).toString('base64')}`);
  console.log(`AUTH_SECRET=${randomBytes(32).toString('base64url')}`);
  console.log('ADMIN_EMAIL=<the email you will sign in with>\n');
}

main();
