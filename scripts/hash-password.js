/**
 * Generate bcrypt hash for ADMIN_PASSWORD_HASH
 * Usage: node scripts/hash-password.js "your-password"
 */
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "your-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('ADMIN_PASSWORD_HASH=' + hash);
