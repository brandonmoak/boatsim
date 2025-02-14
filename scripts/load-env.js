import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import path from 'path';
import os from 'os';

const env = dotenv.config({ path: path.join(os.homedir(), '.boatsim', '.env') });
dotenvExpand.expand(env);

// Print environment variables in cross-env format
Object.keys(process.env).forEach(key => {
  if (key.startsWith('PORT') || key.startsWith('REACT_APP_')) {
    process.stdout.write(`${key}=${process.env[key]} `);
  }
}); 