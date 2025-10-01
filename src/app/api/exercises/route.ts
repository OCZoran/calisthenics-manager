import { NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { ExerciseDefinition } from "@/global/interfaces/training-plan.interface";

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

// GET - Fetch all exercises (global for all users)
export async function GET(request: Request) {
	try {
		// Provjeri autentifikaciju ali ne filtriraj po userId
		await getUserFromToken(request);

		const { db } = await getDatabase();
		const url = new URL(request.url);
		const category = url.searchParams.get("category");
		const tag = url.searchParams.get("tag");

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const query: any = {}; // Uklonjen userId filter

		if (category) {
			query.category = category;
		}

		if (tag) {
			query.tags = tag;
		}

		const exercises = await db
			.collection("exercises")
			.find(query)
			.sort({ name: 1 })
			.toArray();

		return NextResponse.json({ exercises });
	} catch (error) {
		console.error("Error fetching exercises:", error);
		return NextResponse.json(
			{ error: "Failed to fetch exercises" },
			{ status: 500 }
		);
	}
}

// POST - Create new exercise (global, any user can add)
export async function POST(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const exerciseData: Omit<ExerciseDefinition, "userId" | "_id"> =
			await request.json();

		// Validation
		if (!exerciseData.name || !exerciseData.category) {
			return NextResponse.json(
				{ error: "Name and category are required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		// Check if exercise exists globally (not per user)
		const existing = await db.collection("exercises").findOne({
			name: { $regex: new RegExp(`^${exerciseData.name}$`, "i") },
		});

		if (existing) {
			return NextResponse.json(
				{ error: "Exercise with this name already exists" },
				{ status: 400 }
			);
		}

		const exercise: Omit<ExerciseDefinition, "_id"> = {
			...exerciseData,
			userId: user.id, // Čuva ko je kreirao, ali ne filtrira po ovome
			tags: exerciseData.tags || [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await db.collection("exercises").insertOne(exercise);

		return NextResponse.json({
			message: "Exercise created successfully",
			exerciseId: result.insertedId,
		});
	} catch (error) {
		console.error("Error creating exercise:", error);
		return NextResponse.json(
			{ error: "Failed to create exercise" },
			{ status: 500 }
		);
	}
}

// PUT - Update exercise (global, any user can edit)
export async function PUT(request: Request) {
	try {
		await getUserFromToken(request);
		const { exerciseId, ...updateData } = await request.json();

		if (!exerciseId) {
			return NextResponse.json(
				{ error: "Exercise ID is required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		// Check if trying to update name to existing name
		if (updateData.name) {
			const existing = await db.collection("exercises").findOne({
				name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
				_id: { $ne: new ObjectId(exerciseId) },
			});

			if (existing) {
				return NextResponse.json(
					{ error: "Exercise with this name already exists" },
					{ status: 400 }
				);
			}
		}

		// Uklonjen userId filter - bilo ko može editovati
		const result = await db.collection("exercises").updateOne(
			{
				_id: new ObjectId(exerciseId),
			},
			{
				$set: {
					...updateData,
					updatedAt: new Date(),
				},
			}
		);

		if (result.matchedCount === 0) {
			return NextResponse.json(
				{ error: "Exercise not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			message: "Exercise updated successfully",
		});
	} catch (error) {
		console.error("Error updating exercise:", error);
		return NextResponse.json(
			{ error: "Failed to update exercise" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete exercise (global, any user can delete)
export async function DELETE(request: Request) {
	try {
		await getUserFromToken(request);
		const url = new URL(request.url);
		const exerciseId = url.searchParams.get("id");

		if (!exerciseId) {
			return NextResponse.json(
				{ error: "Exercise ID is required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		// Provjera korištenja globalno (svi workouts)
		const exercise = await db.collection("exercises").findOne({
			_id: new ObjectId(exerciseId),
		});

		if (!exercise) {
			return NextResponse.json(
				{ error: "Exercise not found" },
				{ status: 404 }
			);
		}

		// Check usage across all users
		const usageCount = await db.collection("workouts").countDocuments({
			"exercises.name": exercise.name,
		});

		if (usageCount > 0) {
			return NextResponse.json(
				{
					error: `Cannot delete exercise. It is used in ${usageCount} workout(s).`,
				},
				{ status: 400 }
			);
		}

		// Uklonjen userId filter - bilo ko može brisati
		const result = await db.collection("exercises").deleteOne({
			_id: new ObjectId(exerciseId),
		});

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ error: "Exercise not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			message: "Exercise deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting exercise:", error);
		return NextResponse.json(
			{ error: "Failed to delete exercise" },
			{ status: 500 }
		);
	}
}
