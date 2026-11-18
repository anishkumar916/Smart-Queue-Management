
import mongoose from 'mongoose';

export let isConnectedToMongo = false;

function maskMongoUri(uri: string): string {
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is missing.');
  }

  mongoose.connection.on('disconnected', () => {
    isConnectedToMongo = false;
    console.warn('[Database] MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnectedToMongo = true;
    console.log('[Database] MongoDB reconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB error:', err.message);
  });

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    isConnectedToMongo = true;

    console.log(
      `[Database] Connected successfully: ${maskMongoUri(mongoUri)}`
    );
  } catch (error: any) {
    isConnectedToMongo = false;
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
}
