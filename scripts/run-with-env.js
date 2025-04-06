#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  // Execute the load-env.js script and capture its output (env variables)
  const loadEnvPath = path.join(__dirname, 'load-env.js');
  const envOutput = execSync(`node ${loadEnvPath}`).toString().trim();
  
  // Parse the environment variables
  const envVars = {};
  
  // Split by spaces that aren't within quotes
  const envPairs = envOutput.match(/(?:[^\s"']+|["'][^"']*["'])+/g) || [];
  
  for (const pair of envPairs) {
    const match = pair.match(/^(?:export\s+)?([A-Za-z0-9_]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      const cleanValue = value.replace(/^['"]|['"]$/g, '');
      envVars[key] = cleanValue;
    }
  }
  
  // Print the environment variables being set
  console.log('Setting environment variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}=${value}`);
  });
  
  // Get the command to run from command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Please provide a command to run');
    process.exit(1);
  }
  
  // Create a new environment with the parsed variables
  const env = { ...process.env, ...envVars };
  
  // Log the command being executed
  console.log(`\nExecuting: ${args.join(' ')}`);
  
  // Spawn the process with the combined environment
  const child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    env: env,
    shell: true
  });
  
  // Handle the exit of the child process
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
  
} catch (error) {
  console.error('Error running the environment loader:', error);
  console.error(error.stack);
  process.exit(1);
} 