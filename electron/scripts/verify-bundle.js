import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function listDirectoryContents(dir, indent = '') {
    console.log(`${indent}📁 ${path.basename(dir)}/`);
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            listDirectoryContents(fullPath, indent + '  ');
        } else {
            console.log(`${indent}  📄 ${item} (${stats.size} bytes) [${stats.mode.toString(8)}]`);
        }
    });
}

console.log('\nVerifying bundle structure...');

// Check bundled directory
const bundledDir = path.join(__dirname, '..', 'bundled');
if (fs.existsSync(bundledDir)) {
    console.log('\nBundled directory contents:');
    listDirectoryContents(bundledDir);
} else {
    console.log('\n❌ Bundled directory not found at:', bundledDir);
}

// Check dist directory if it exists
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
    console.log('\nDist directory contents:');
    listDirectoryContents(distDir);
} else {
    console.log('\n❌ Dist directory not found at:', distDir);
}

console.log('\nBundle verification complete!'); 