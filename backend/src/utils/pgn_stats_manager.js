class PgnStatsManager {
    constructor({
        windowSeconds = 10,        // Default 1 minute window
        cleanupIntervalSeconds = 0.1 // Default cleanup every 1 second
    } = {}) {
        this.pgnStats = {};
        this.STATS_WINDOW_SECONDS = windowSeconds;
        this.CLEANUP_INTERVAL_SECONDS = cleanupIntervalSeconds;
        
        // Message count tracking
        this.messageCountLastSecond = {};
        this.lastCountTime = Date.now();

        // Change to 1 second interval for stats logging
        setInterval(() => this.logStats(), 1000);
        setInterval(() => this.cleanupOldStats(), this.CLEANUP_INTERVAL_SECONDS * 1000);

        // Add tracking for total counts and last message times
        this.pgnTotalCounts = {};
        this.pgnLastMessageTimes = {};
    }

    updateStats(pgn) {
        const now = Date.now();
        
        // Initialize stats if needed
        if (!this.pgnStats[pgn]) {
            this.pgnStats[pgn] = {
                messages: [],
                expectedRate: 0,
                missedMessages: 0,
                totalCount: 0,
                lastMessageTime: now
            };
        }
        
        // Track message for rate calculation
        this.pgnStats[pgn].messages.push(now);
        
        // Update total count to reflect only messages in the window
        this.pgnStats[pgn].totalCount = this.pgnStats[pgn].messages.length;
        this.pgnStats[pgn].lastMessageTime = now;

        // Update per-second counter
        if (!this.messageCountLastSecond[pgn]) {
            this.messageCountLastSecond[pgn] = 0;
        }
        this.messageCountLastSecond[pgn]++;
    }

    cleanupOldStats() {
        const now = Date.now();
        const windowMs = this.STATS_WINDOW_SECONDS * 1000;
        
        Object.keys(this.pgnStats).forEach(pgn => {
            const cutoff = now - windowMs;
            this.pgnStats[pgn].messages = this.pgnStats[pgn].messages.filter(time => time > cutoff);
        });
    }

    logStats() {
        const now = Date.now();
        
        const stats = Object.entries(this.pgnStats)
            .map(([pgn, stats]) => {
                // Calculate windowed rate using actual time span of messages
                let windowedRate = 0;
                if (stats.messages.length > 1) {
                    const timeSpanSeconds = (stats.messages[stats.messages.length - 1] - stats.messages[0]) / 1000;
                    windowedRate = timeSpanSeconds > 0 ? (stats.messages.length - 1) / timeSpanSeconds : 0;
                }
                
                return `PGN ${pgn.padEnd(4)}: ${windowedRate.toFixed(1).padStart(5)}/s`;
            })
            .join(' | ');
        
        if (stats) {
            console.log(`[PGN Stats] ${stats}`);
        }
        
        // Reset per-second counters
        this.messageCountLastSecond = {};
        this.lastCountTime = now;
    }
}

export { PgnStatsManager }; 