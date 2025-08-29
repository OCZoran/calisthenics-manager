// app/api/workouts/route.ts
import { NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

interface WorkoutData {
	userId: string;
	date: string;
	type: string;
	notes?: string;
	synced: boolean;
	exercises: {
		name: string;
		sets: {
			reps: number;
			rest: number;
		}[];
	}[];
}

// Helper function to get user from token
async function getUserFromToken(request: Request) {
	const cookieHeader = request.headers.get("cookie");
	if (!cookieHeader) {
		throw new Error("No authentication token");
	}

	const tokenMatch = cookieHeader.match(/token=([^;]+)/);
	if (!tokenMatch) {
		throw new Error("No authentication token");
	}

	const token = tokenMatch[1];
	const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
		id: string;
		email: string;
	};
	return decoded;
}

// GET - Fetch all workouts for user
export async function GET(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const { db } = await getDatabase();

		const workouts = await db
			.collection("workouts")
			.find({ userId: user.id })
			.sort({ date: -1, createdAt: -1 })
			.toArray();

		return NextResponse.json({ workouts });
	} catch (error) {
		console.error("Error fetching workouts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch workouts" },
			{ status: 500 }
		);
	}
}

// POST - Create new workout
export async function POST(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const workoutData: Omit<WorkoutData, "userId"> = await request.json();

		// Validation
		if (!workoutData.date || !workoutData.type || !workoutData.exercises) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		if (workoutData.exercises.length === 0) {
			return NextResponse.json(
				{ error: "At least one exercise is required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		const workout = {
			...workoutData,
			userId: user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await db.collection("workouts").insertOne(workout);

		return NextResponse.json({
			message: "Workout created successfully",
			workoutId: result.insertedId,
		});
	} catch (error) {
		console.error("Error creating workout:", error);
		return NextResponse.json(
			{ error: "Failed to create workout" },
			{ status: 500 }
		);
	}
}

// PUT - Update workout
export async function PUT(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const { workoutId, ...updateData } = await request.json();

		if (!workoutId) {
			return NextResponse.json(
				{ error: "Workout ID is required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		const result = await db.collection("workouts").updateOne(
			{
				_id: new ObjectId(workoutId),
				userId: user.id, // Ensure user can only update their own workouts
			},
			{
				$set: {
					...updateData,
					updatedAt: new Date(),
				},
			}
		);

		if (result.matchedCount === 0) {
			return NextResponse.json({ error: "Workout not found" }, { status: 404 });
		}

		return NextResponse.json({
			message: "Workout updated successfully",
		});
	} catch (error) {
		console.error("Error updating workout:", error);
		return NextResponse.json(
			{ error: "Failed to update workout" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete workout
export async function DELETE(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const url = new URL(request.url);
		const workoutId = url.searchParams.get("id");

		if (!workoutId) {
			return NextResponse.json(
				{ error: "Workout ID is required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		const result = await db.collection("workouts").deleteOne({
			_id: new ObjectId(workoutId),
			userId: user.id, // Ensure user can only delete their own workouts
		});

		if (result.deletedCount === 0) {
			return NextResponse.json({ error: "Workout not found" }, { status: 404 });
		}

		return NextResponse.json({
			message: "Workout deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting workout:", error);
		return NextResponse.json(
			{ error: "Failed to delete workout" },
			{ status: 500 }
		);
	}
}
