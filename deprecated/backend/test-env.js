import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Loading .env from:', join(__dirname, '.env'));

dotenv.config();

console.log('\n=== Environment Variables ===');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET');
console.log('SUI_NETWORK:', process.env.SUI_NETWORK || 'NOT SET');
console.log('SUI_PACKAGE_ID:', process.env.SUI_PACKAGE_ID || 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('\n=== All env vars starting with SUI or PORT ===');
Object.keys(process.env)
  .filter(key => key.startsWith('SUI') || key.startsWith('PORT') || key.startsWith('NODE'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key]);
  });
