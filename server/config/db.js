const mongoose = require('mongoose');
const dns = require('dns');

// Prefer IPv4 resolution to prevent DNS SRV issues on certain networks
dns.setDefaultResultOrder('ipv4first');

const cleanMongoUri = (uri) => {
    if (!uri) return uri;
    uri = uri.trim();
    // Fix accidental repeated database paths like /dbname/dbname
    const regex = /^(mongodb(?:\+srv)?:\/\/[^\/]+\/)([^\/?]+)(?:\/[^\/?]+)*(.*)$/;
    const match = uri.match(regex);
    if (match) {
        const base = match[1];
        const dbName = match[2];
        let query = match[3] || '';
        if (query && !query.startsWith('?')) {
            query = '?retryWrites=true&w=majority';
        }
        return base + dbName + query;
    }
    return uri;
};

const mongoDB = async () => {
    try {
        const rawUri = process.env.MONGO_URI;
        const uri = cleanMongoUri(rawUri);
        await mongoose.connect(uri);
        console.log("DB Connection Successful");
    } catch (error) {
        console.log("DB Connection Failed", error.message);
    }
};

module.exports = mongoDB;