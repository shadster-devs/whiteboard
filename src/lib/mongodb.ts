import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://shakthisagarm5918:dF7vsk6mviGr5u1j@mongo-cluster.y4pkgdd.mongodb.net/?retryWrites=true&w=majority&appName=mongo-cluster"
const MONGODB_DB = 'whiteboard';

let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
    if (cachedClient) {
        return { client: cachedClient, db: cachedClient.db(MONGODB_DB) };
    }

    const client = new MongoClient(MONGODB_URI);

    await client.connect();
    cachedClient = client;
    return { client, db: client.db(MONGODB_DB) };
}
