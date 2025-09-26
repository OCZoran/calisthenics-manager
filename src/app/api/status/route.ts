import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { StatusEntry } from "@/features/status/interfaces/status.interface";

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

// GET - dohvati sve status entries za korisnika
export async function GET(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();

		// Aggregate da dobijemo najnoviji entry za svaki exerciseName
		const statusEntries = await db
			.collection("statusEntries")
			.aggregate([
				{ $match: { userId: user.id } },
				{ $sort: { exerciseName: 1, createdAt: -1 } },
				{
					$group: {
						_id: "$exerciseName",
						latestEntry: { $first: "$$ROOT" },
						history: { $push: "$$ROOT" },
					},
				},
				{
					$project: {
						_id: "$latestEntry._id",
						userId: "$latestEntry.userId",
						exerciseName: "$latestEntry.exerciseName",
						repetitions: "$latestEntry.repetitions",
						weight: "$latestEntry.weight",
						holdTime: "$latestEntry.holdTime",
						unit: "$latestEntry.unit",
						createdAt: "$latestEntry.createdAt",
						updatedAt: "$latestEntry.updatedAt",
						history: "$history",
					},
				},
				{ $sort: { exerciseName: 1 } },
			])
			.toArray();

		return NextResponse.json(
			statusEntries.map((entry) => ({
				...entry,
				_id: entry._id.toString(),
				history: entry.history.map((h: StatusEntry) => ({
					...h,
					_id: h._id.toString(),
				})),
			}))
		);
	} catch (error) {
		console.error("Error fetching status entries:", error);
		return NextResponse.json(
			{ error: "Failed to fetch status entries" },
			{ status: 500 }
		);
	}
}

// POST - kreiraj novi status entry
export async function POST(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { exerciseName, repetitions, weight, holdTime, unit } =
			await req.json();

		if (!exerciseName || !unit) {
			return NextResponse.json(
				{ error: "Exercise name and unit are required" },
				{ status: 400 }
			);
		}

		// Validacija da bar jedan od ovih treba postojati
		if (!repetitions && !weight && !holdTime) {
			return NextResponse.json(
				{
					error:
						"At least one of repetitions, weight, or hold time must be provided",
				},
				{ status: 400 }
			);
		}

		const now = new Date().toISOString();
		const newEntry = {
			userId: user.id,
			exerciseName: exerciseName.trim(),
			repetitions: repetitions || null,
			weight: weight || null,
			holdTime: holdTime || null,
			unit,
			createdAt: now,
			updatedAt: now,
		};

		const result = await db.collection("statusEntries").insertOne(newEntry);

		return NextResponse.json({
			...newEntry,
			_id: result.insertedId.toString(),
		});
	} catch (error) {
		console.error("Error creating status entry:", error);
		return NextResponse.json(
			{ error: "Failed to create status entry" },
			{ status: 500 }
		);
	}
}

// PUT - ažuriraj postojeći status entry (kreira novi entry za napredak)
export async function PUT(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const exerciseName = searchParams.get("exerciseName");
		const { repetitions, weight, holdTime, unit } = await req.json();

		if (!exerciseName) {
			return NextResponse.json(
				{ error: "Exercise name is required" },
				{ status: 400 }
			);
		}

		if (!repetitions && !weight && !holdTime) {
			return NextResponse.json(
				{
					error:
						"At least one of repetitions, weight, or hold time must be provided",
				},
				{ status: 400 }
			);
		}

		const now = new Date().toISOString();
		const newProgressEntry = {
			userId: user.id,
			exerciseName: exerciseName.trim(),
			repetitions: repetitions || null,
			weight: weight || null,
			holdTime: holdTime || null,
			unit: unit || "kg",
			createdAt: now,
			updatedAt: now,
		};

		const result = await db
			.collection("statusEntries")
			.insertOne(newProgressEntry);

		return NextResponse.json({
			...newProgressEntry,
			_id: result.insertedId.toString(),
		});
	} catch (error) {
		console.error("Error updating status entry:", error);
		return NextResponse.json(
			{ error: "Failed to update status entry" },
			{ status: 500 }
		);
	}
}

// DELETE - obriši sve entries za određenu vežbu
export async function DELETE(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const exerciseName = searchParams.get("exerciseName");

		if (!exerciseName) {
			return NextResponse.json(
				{ error: "Exercise name is required" },
				{ status: 400 }
			);
		}

		const result = await db
			.collection("statusEntries")
			.deleteMany({ exerciseName, userId: user.id });

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ error: "Status entries not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			message: "Status entries deleted successfully",
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		console.error("Error deleting status entries:", error);
		return NextResponse.json(
			{ error: "Failed to delete status entries" },
			{ status: 500 }
		);
	}
}
