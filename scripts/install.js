import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper function to run commands
function runCommand(command, cwd) {
    try {
        console.log(`Running "${command}" in ${cwd}`);
        execSync(command, {
            cwd,
            stdio: 'inherit',
            env: { ...process.env, FORCE_COLOR: true }
        });
    } catch (error) {
        console.error(`\n❌ Failed to execute "${command}" in ${cwd}`);
        console.error('Please check your package.json dependencies and ensure they are available.');
        console.error('You may need to check for:');
        console.error('1. Typos in package names');
        console.error('2. Invalid version numbers');
        console.error('3. Packages that have been deprecated or removed\n');
        process.exit(1);
    }
}

// Get root directory (different in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Install dependencies for each package
console.log('\n📦 Installing electron dependencies...');
runCommand('npm install', path.join(rootDir, 'electron'));

console.log('\n📦 Installing frontend dependencies...');
runCommand('npm install', path.join(rootDir, 'frontend'));

console.log('\n📦 Installing backend dependencies...');
runCommand('npm install', path.join(rootDir, 'backend'));

console.log('\n✅ All dependencies installed successfully!'); 