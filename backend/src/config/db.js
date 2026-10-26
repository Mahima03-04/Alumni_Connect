
'use strict';

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const env = require('./env');

if (env.isTest) {
  mongoose.set('debug', false);
}

async function connectDatabase(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);

  const certificatePath = path.resolve(
    __dirname,
    '../../certs/X509-cert-2995215390516706944.pem'
  );

  if (!fs.existsSync(certificatePath)) {
    throw new Error(
      `MongoDB certificate not found: ${certificatePath}`
    );
  }

  const options = {
    serverSelectionTimeoutMS: 15000,
    autoIndex: !env.isProduction,
    tls: true,
    tlsCertificateKeyFile: certificatePath,
  };

  try {
    console.log('[db] URI scheme:', uri?.split(':')[0]);
console.log('[db] URI is valid type:', typeof uri === 'string');

    await mongoose.connect(uri, options);

    const { host, port, name } = mongoose.connection;
    console.log(`[db] Connected to MongoDB at ${host}:${port}/${name}`);

    return mongoose.connection;
  } catch (error) {
    console.error('[db] MongoDB connection failed:', error.message);
    throw error;
  }
}

async function disconnectDatabase() {
  await mongoose.connection.close();
}

module.exports = { connectDatabase, disconnectDatabase };
