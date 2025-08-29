/* eslint-disable @typescript-eslint/no-explicit-any */

import { MongoClient, Db, ServerApiVersion } from "mongodb";

const uri = process.env.MONGO_DB_URL as string;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGO_DB_URL) {
	throw new Error("Please add your Mongo URI to .env.local");
}

const options = {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
};

if (process.env.NODE_ENV === "development") {
	if (!(global as any)._mongoClientPromise) {
		client = new MongoClient(uri, options);
		(global as any)._mongoClientPromise = client.connect();
	}
	clientPromise = (global as any)._mongoClientPromise;
} else {
	client = new MongoClient(uri, options);
	clientPromise = client.connect();
}

export async function getDatabase(): Promise<{ client: MongoClient; db: Db }> {
	const client = await clientPromise;
	const db = client.db("officelog");
	return { client, db };
}

export default clientPromise;
