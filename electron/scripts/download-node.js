import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import tar from 'tar';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE_VERSION = 'v18.19.0'; // LTS version

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading from ${url} to ${destPath}`);
        const file = createWriteStream(destPath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => {
                reject(err);
            });
        });
    });
}

async function downloadNodeBinary() {
    const platform = process.platform;
    const arch = process.arch;
    
    // Determine filename based on platform
    let filename;
    if (platform === 'win32') {
        filename = `node-${NODE_VERSION}-win-${arch}.zip`;
    } else if (platform === 'darwin') {
        filename = `node-${NODE_VERSION}-darwin-${arch}.tar.gz`;
    } else if (platform === 'linux') {
        filename = `node-${NODE_VERSION}-linux-${arch}.tar.gz`;
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    const url = `https://nodejs.org/dist/${NODE_VERSION}/${filename}`;
    const bundledDir = path.join(__dirname, '..', 'bundled');
    const downloadPath = path.join(bundledDir, filename);
    const extractPath = path.join(bundledDir, 'node');

    console.log('Setting up Node.js...');
    console.log('Platform:', platform);
    console.log('Architecture:', arch);
    console.log('URL:', url);
    console.log('Extract path:', extractPath);

    // Create directories
    fs.mkdirSync(bundledDir, { recursive: true });
    fs.mkdirSync(extractPath, { recursive: true });

    try {
        console.log('Downloading Node.js...');
        await downloadFile(url, downloadPath);

        console.log('Extracting Node.js...');
        if (platform === 'win32') {
            // Handle Windows zip files
            throw new Error('Windows support not implemented yet');
        } else {
            // Handle Unix tar.gz files
            await tar.x({
                file: downloadPath,
                cwd: extractPath,
                strip: 1
            });
        }

        // Set executable permissions on Unix systems
        if (platform !== 'win32') {
            const nodeBin = path.join(extractPath, 'bin', 'node');
            fs.chmodSync(nodeBin, '755');
            console.log('Set executable permissions on node binary');
        }

        // Clean up downloaded archive
        fs.unlinkSync(downloadPath);
        console.log('Cleaned up downloaded archive');

        // Verify the binary exists
        const nodePath = platform === 'win32' 
            ? path.join(extractPath, 'node.exe')
            : path.join(extractPath, 'bin', 'node');
            
        if (fs.existsSync(nodePath)) {
            console.log('Node.js binary found at:', nodePath);
        } else {
            throw new Error(`Node.js binary not found at ${nodePath}`);
        }

        console.log('Node.js binary setup complete!');
    } catch (error) {
        console.error('Error setting up Node.js:', error);
        throw error;
    }
}

downloadNodeBinary().catch(error => {
    console.error('Failed to download Node.js:', error);
    process.exit(1);
}); 