class PgnStatsManager {
    constructor({
        windowSeconds = 60,        // Default 1 minute window
        logIntervalSeconds = 5,    // Default log every 5 seconds
        cleanupIntervalSeconds = 1 // Default cleanup every 1 second
    } = {}) {
        this.pgnStats = {};
        this.STATS_WINDOW_SECONDS = windowSeconds;
        this.LOG_INTERVAL_SECONDS = logIntervalSeconds;
        this.CLEANUP_INTERVAL_SECONDS = cleanupIntervalSeconds;

        setInterval(() => this.logStats(), this.LOG_INTERVAL_SECONDS * 1000);
        setInterval(() => this.cleanupOldStats(), this.CLEANUP_INTERVAL_SECONDS * 1000);
    }

    updateStats(pgn) {
        const now = Date.now();
        if (!this.pgnStats[pgn]) {
            this.pgnStats[pgn] = {
                messages: [],
                startTime: now
            };
        }
        this.pgnStats[pgn].messages.push(now);
    }

    cleanupOldStats() {
        const now = Date.now();
        const windowMs = this.STATS_WINDOW_SECONDS * 1000;
        
        Object.keys(this.pgnStats).forEach(pgn => {
            this.pgnStats[pgn].messages = this.pgnStats[pgn].messages.filter(
                timestamp => (now - timestamp) < windowMs
            );
        });
    }

    logStats() {
        const now = Date.now();
        console.log('\n=== PGN Statistics (Last ' + this.STATS_WINDOW_SECONDS + ' seconds) ===');
        Object.entries(this.pgnStats).forEach(([pgn, stats]) => {
            const messageCount = stats.messages.length;
            const rate = messageCount / this.STATS_WINDOW_SECONDS;
            console.log(`PGN ${pgn}: ${messageCount} messages (${rate.toFixed(2)} msg/s)`);
        });
    }
}

export { PgnStatsManager }; 