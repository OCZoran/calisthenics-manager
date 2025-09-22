import { NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import {
	Exercise,
	WorkoutFormData,
} from "@/global/interfaces/workout.interface";

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
// POST - Create new workout
export async function POST(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const workoutData: Omit<WorkoutFormData, "userId"> = await request.json();

		// Basic validation
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

		// Sanitization & validation of sets (convert strings to numbers, weight -> number | null)
		const sanitizeExercises = (exs: any[]) =>
			exs.map((ex) => ({
				name: ex.name,
				sets: (ex.sets || []).map((set: any) => {
					const reps =
						set.reps !== undefined && set.reps !== ""
							? parseInt(set.reps, 10)
							: 0;
					const rest =
						set.rest !== undefined && set.rest !== ""
							? parseInt(set.rest, 10)
							: 0;
					const weight =
						set.weight !== undefined && set.weight !== null && set.weight !== ""
							? parseFloat(set.weight)
							: null;

					// validate parsed numbers
					if (isNaN(reps) || reps < 0) {
						throw new Error(`Invalid reps value for exercise "${ex.name}"`);
					}
					if (isNaN(rest) || rest < 0) {
						throw new Error(`Invalid rest value for exercise "${ex.name}"`);
					}
					if (weight !== null && (isNaN(weight) || weight < 0)) {
						throw new Error(`Invalid weight value for exercise "${ex.name}"`);
					}

					return { reps, rest, weight };
				}),
			}));

		let sanitizedExercises;
		try {
			sanitizedExercises = sanitizeExercises(workoutData.exercises);
		} catch (err: unknown) {
			const errorMessage =
				typeof err === "object" && err !== null && "message" in err
					? (err as { message?: string }).message
					: "Invalid sets data";
			return NextResponse.json({ error: errorMessage }, { status: 400 });
		}

		const { db } = await getDatabase();

		const workout = {
			date: workoutData.date,
			type: workoutData.type,
			notes: workoutData.notes || "",
			synced: workoutData.synced ?? true,
			exercises: sanitizedExercises,
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

		if (updateData.exercises) {
			try {
				const sanitizeExercises = (exs: Exercise[]) =>
					exs.map((ex) => ({
						name: ex.name,
						sets: (ex.sets || []).map((set) => {
							const reps =
								set.reps !== undefined && set.reps !== ""
									? parseInt(set.reps, 10)
									: 0;
							const rest =
								set.rest !== undefined && set.rest !== ""
									? parseInt(set.rest, 10)
									: 0;
							const weight =
								set.weight !== undefined &&
								set.weight !== null &&
								set.weight !== ""
									? parseFloat(set.weight)
									: null;

							if (isNaN(reps) || reps < 0) {
								throw new Error(`Invalid reps value for exercise "${ex.name}"`);
							}
							if (isNaN(rest) || rest < 0) {
								throw new Error(`Invalid rest value for exercise "${ex.name}"`);
							}
							if (weight !== null && (isNaN(weight) || weight < 0)) {
								throw new Error(
									`Invalid weight value for exercise "${ex.name}"`
								);
							}

							return { reps, rest, weight };
						}),
					}));

				updateData.exercises = sanitizeExercises(updateData.exercises);
			} catch (err: unknown) {
				const errorMessage =
					typeof err === "object" && err !== null && "message" in err
						? (err as { message?: string }).message
						: "Invalid sets data";
				return NextResponse.json({ error: errorMessage }, { status: 400 });
			}
		}

		const { db } = await getDatabase();

		const result = await db.collection("workouts").updateOne(
			{
				_id: new ObjectId(workoutId),
				userId: user.id,
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
			userId: user.id,
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
