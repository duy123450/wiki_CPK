const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect(url) {
        if (this.connection) return this.connection;
        
        try {
            this.connection = await mongoose.connect(url);
            return this.connection;
        } catch (error) {
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.disconnect();
            this.connection = null;
        }
    }
}

const db = new Database();

module.exports = (url) => db.connect(url);
module.exports.db = db;