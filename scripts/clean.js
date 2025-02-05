import { rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function cleanDirectory(dirPath, name) {
    try {
        console.log(`🧹 Cleaning ${name}...`);
        rmSync(dirPath, { recursive: true, force: true });
        console.log(`✨ ${name} cleaned successfully`);
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore errors about directory not existing
            console.error(`Error cleaning ${name}:`, error);
        }
    }
}

// Clean frontend build
cleanDirectory(path.join(rootDir, 'frontend', 'build'), 'frontend build');

// Clean electron dist
cleanDirectory(path.join(rootDir, 'electron', 'dist'), 'electron dist');

console.log('\n✅ All build artifacts cleaned!'); 