import { saveDefaults, getDefaults, saveWaypoints, getWaypoints } from './storage.js';

export function configureRoutes(app, forwarder) {
    // Logging middleware
    app.use((req, res, next) => {
        console.log(`Incoming ${req.method} request for ${req.url}`);
        next();
    });

    // Defaults routes
    app.post('/api/defaults', async (req, res) => {
        try {
            const defaults = await saveDefaults(req.body);
            res.json(defaults);
        } catch (error) {
            console.error('Error saving defaults:', error);
            res.status(500).json({ error: 'Failed to save defaults' });
        }
    });

    app.get('/api/defaults', async (req, res) => {
        try {
            const defaults = await getDefaults();
            res.json(defaults);
        } catch (error) {
            console.error('Error reading defaults:', error);
            res.status(500).json({ error: 'Failed to read defaults' });
        }
    });

    // Waypoints routes
    app.post('/api/waypoints', async (req, res) => {
        try {
            const waypoints = await saveWaypoints(req.body);
            res.json(waypoints);
        } catch (error) {
            console.error('Error saving waypoints:', error);
            res.status(500).json({ error: 'Failed to save waypoints' });
        }
    });

    app.get('/api/waypoints', async (req, res) => {
        try {
            const waypoints = await getWaypoints();
            res.json(waypoints);
        } catch (error) {
            console.error('Error reading waypoints:', error);
            res.status(500).json({ error: 'Failed to read waypoints' });
        }
    });

    // Device management routes
    app.get('/api/device/status', async (req, res) => {
        const status = await forwarder.getEachDeviceStatus();
        res.json(status);
    });

    app.post('/api/device/connect', (req, res) => {
        console.log("Connection request for device", req.body);
        try {
            if (req.body.devicePath.startsWith("tcp://")) {
                return res.status(500).json({ error: "TCP devices not yet supported" });
            } else {
                forwarder.connectSerialDevice(req.body.devicePath);
                return res.json({ message: 'Connection initiated' });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/device/disconnect', (req, res) => {
        try {
            console.log("Disconnection request for device", req.body);
            forwarder.disconnectSerialDevice(req.body.devicePath);
            res.json({ message: 'Disconnection initiated' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
} 