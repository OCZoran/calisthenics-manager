import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

async function getUserFromToken(req: NextRequest) {
	const token = req.cookies.get("token")?.value;
	if (!token) {
		throw new Error("No authentication token");
	}

	const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
		id: string;
		email: string;
	};
	return decoded;
}

// GET - dohvati sve journal entries za korisnika
export async function GET(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();

		const journalEntries = await db
			.collection("journalEntries")
			.find({ userId: user.id })
			.sort({ date: -1 })
			.toArray();

		return NextResponse.json(
			journalEntries.map((entry) => ({
				...entry,
				_id: entry._id.toString(),
			}))
		);
	} catch (error) {
		console.error("Error fetching journal entries:", error);
		return NextResponse.json(
			{ error: "Failed to fetch journal entries" },
			{ status: 500 }
		);
	}
}

// POST - kreiraj novi journal entry
export async function POST(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { date, title, content } = await req.json();

		if (!date || !title || !content) {
			return NextResponse.json(
				{ error: "Date, title and content are required" },
				{ status: 400 }
			);
		}

		// Provjeri da li već postoji entry za taj datum
		const existingEntry = await db
			.collection("journalEntries")
			.findOne({ userId: user.id, date });

		if (existingEntry) {
			return NextResponse.json(
				{ error: "Journal entry for this date already exists" },
				{ status: 400 }
			);
		}

		const now = new Date().toISOString();
		const newEntry = {
			userId: user.id,
			date,
			title,
			content,
			createdAt: now,
			updatedAt: now,
		};

		const result = await db.collection("journalEntries").insertOne(newEntry);

		return NextResponse.json({
			...newEntry,
			_id: result.insertedId.toString(),
		});
	} catch (error) {
		console.error("Error creating journal entry:", error);
		return NextResponse.json(
			{ error: "Failed to create journal entry" },
			{ status: 500 }
		);
	}
}

// PUT - ažuriraj postojeći journal entry
export async function PUT(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const entryId = searchParams.get("id");
		const { title, content } = await req.json();

		if (!entryId) {
			return NextResponse.json(
				{ error: "Entry ID is required" },
				{ status: 400 }
			);
		}

		if (!title || !content) {
			return NextResponse.json(
				{ error: "Title and content are required" },
				{ status: 400 }
			);
		}

		const updateData = {
			title,
			content,
			updatedAt: new Date().toISOString(),
		};

		const result = await db
			.collection("journalEntries")
			.updateOne(
				{ _id: new ObjectId(entryId), userId: user.id },
				{ $set: updateData }
			);

		if (result.matchedCount === 0) {
			return NextResponse.json(
				{ error: "Journal entry not found" },
				{ status: 404 }
			);
		}

		const updatedEntry = await db
			.collection("journalEntries")
			.findOne({ _id: new ObjectId(entryId) });

		return NextResponse.json({
			...updatedEntry,
			_id: updatedEntry?._id.toString(),
		});
	} catch (error) {
		console.error("Error updating journal entry:", error);
		return NextResponse.json(
			{ error: "Failed to update journal entry" },
			{ status: 500 }
		);
	}
}

// DELETE - obriši journal entry
export async function DELETE(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const entryId = searchParams.get("id");

		if (!entryId) {
			return NextResponse.json(
				{ error: "Entry ID is required" },
				{ status: 400 }
			);
		}

		const result = await db
			.collection("journalEntries")
			.deleteOne({ _id: new ObjectId(entryId), userId: user.id });

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ error: "Journal entry not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ message: "Journal entry deleted successfully" });
	} catch (error) {
		console.error("Error deleting journal entry:", error);
		return NextResponse.json(
			{ error: "Failed to delete journal entry" },
			{ status: 500 }
		);
	}
}
