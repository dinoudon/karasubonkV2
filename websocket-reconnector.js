/**
 * WebSocketReconnector - Manages WebSocket connections with exponential backoff
 *
 * Provides automatic reconnection with increasing delays to prevent overwhelming
 * the server during network issues or service downtime.
 */

class WebSocketReconnector {
    /**
     * Connection state enumeration
     * @readonly
     * @enum {string}
     */
    static ConnectionState = {
        DISCONNECTED: 'DISCONNECTED',
        CONNECTING: 'CONNECTING',
        CONNECTED: 'CONNECTED',
        ERROR: 'ERROR'
    };

    /**
     * Creates a WebSocketReconnector instance
     *
     * @param {string} name - Name of the connection (e.g., "VTube Studio", "Karasubot")
     * @param {function} connectFunction - Function to call to establish connection
     * @param {object} options - Configuration options
     * @param {number[]} options.delays - Array of delay values in seconds (default: [1, 2, 4, 8, 16])
     * @param {number} options.maxQueueSize - Maximum number of messages to queue (default: 100)
     */
    constructor(name, connectFunction, options = {}) {
        this.name = name;
        this.connectFunction = connectFunction;
        this.delays = options.delays || [1, 2, 4, 8, 16];
        this.currentDelayIndex = 0;
        this.retryTimer = null;
        this.messageQueue = [];
        this.maxQueueSize = options.maxQueueSize || 100;
    }

    /**
     * Gets the next delay in milliseconds for exponential backoff
     * Advances to the next delay level, capping at the maximum configured delay
     *
     * @returns {number} Delay in milliseconds
     */
    getNextDelay() {
        // Get the delay at current index
        const delaySeconds = this.delays[this.currentDelayIndex];
        const delayMs = delaySeconds * 1000;

        // Advance to next delay, but don't go beyond the last delay
        if (this.currentDelayIndex < this.delays.length - 1) {
            this.currentDelayIndex++;
        }

        return delayMs;
    }

    /**
     * Resets the delay index back to the beginning
     * Call this when a successful connection is established
     */
    resetDelay() {
        this.currentDelayIndex = 0;
    }

    /**
     * Starts the reconnection process with exponential backoff
     */
    startReconnecting() {
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
        }

        const delay = this.getNextDelay();
        this.retryTimer = setTimeout(() => {
            this.connectFunction();
        }, delay);
    }

    /**
     * Stops any ongoing reconnection attempts
     */
    stopReconnecting() {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
        this.resetDelay();
    }

    /**
     * Schedules a connection check at regular intervals
     *
     * @param {function} checkFunction - Function to call to check connection state
     * @param {number} interval - Check interval in milliseconds
     * @returns {number} Interval ID
     */
    scheduleConnectionCheck(checkFunction, interval) {
        return setInterval(checkFunction, interval);
    }

    /**
     * Adds a message to the queue for later sending
     * Respects the maximum queue size limit
     *
     * @param {object} message - The message to queue
     */
    queueMessage(message) {
        if (this.messageQueue.length < this.maxQueueSize) {
            this.messageQueue.push(message);
        }
    }

    /**
     * Gets the current number of messages in the queue
     *
     * @returns {number} Number of queued messages
     */
    getQueueSize() {
        return this.messageQueue.length;
    }

    /**
     * Sends a message through the socket if connected, otherwise queues it
     *
     * @param {WebSocket} socket - The WebSocket instance to send through
     * @param {object|string} message - The message to send (will be stringified if object)
     */
    sendOrQueue(socket, message) {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

        // Check if socket is connected (readyState === 1 means OPEN)
        if (socket && socket.readyState === 1) {
            socket.send(messageStr);
        } else {
            // Queue the message for later
            this.queueMessage(messageStr);
        }
    }

    /**
     * Flushes all queued messages through the socket
     * Clears the queue after sending
     *
     * @param {WebSocket} socket - The WebSocket instance to send through
     */
    flushQueue(socket) {
        if (!socket || socket.readyState !== 1) {
            return; // Don't flush if not connected
        }

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            socket.send(message);
        }
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketReconnector;
}
