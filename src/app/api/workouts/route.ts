/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import {
	Exercise,
	WorkoutFormData,
} from "@/global/interfaces/workout.interface";
import { StatisticsCalculator } from "../progress/route";

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

async function getActiveTrainingPlan(db: any, userId: string) {
	return await db.collection("trainingPlans").findOne({
		userId: userId,
		status: "active",
	});
}

export async function GET(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const { db } = await getDatabase();

		const url = new URL(request.url);
		const planId = url.searchParams.get("planId");

		let query: any = { userId: user.id };
		if (planId) {
			query.planId = planId;
		}

		const workouts = await db
			.collection("workouts")
			.find(query)
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
		const workoutData: Omit<WorkoutFormData, "userId"> & { planId?: string } =
			await request.json();

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

		const { db } = await getDatabase();

		// Ako planId nije proslijeđen, pokušaj pronaći aktivni plan
		let planId = workoutData.planId;
		if (!planId) {
			const activePlan = await getActiveTrainingPlan(db, user.id);
			if (activePlan) {
				planId = activePlan._id.toString();
			}
		}

		const sanitizeExercises = (exs: any[]) =>
			exs.map((ex) => ({
				name: ex.name,
				sets: (ex.sets || []).map((set: any) => {
					// Parsiranje osnovnih vrijednosti
					const rest =
						set.rest !== undefined && set.rest !== ""
							? parseInt(set.rest, 10)
							: 0;
					const weight =
						set.weight !== undefined && set.weight !== null && set.weight !== ""
							? parseFloat(set.weight)
							: null;
					const hold =
						set.hold !== undefined && set.hold !== ""
							? parseInt(set.hold, 10)
							: null;
					const band =
						set.band !== undefined && set.band !== "" ? set.band : "";

					// NOVO: Parsiranje isMax flaga
					const isMax = set.isMax === true;

					// Logika za reps ovisno o tome da li je hold postavljen
					let reps: number;
					if (hold !== null && hold > 0) {
						// Ako je hold postavljen, reps postavljamo na 0
						reps = 0;
					} else {
						// Inače koristimo normalan reps
						reps =
							set.reps !== undefined && set.reps !== ""
								? parseInt(set.reps, 10)
								: 0;
					}

					// Validacija - za max setove možemo imati 0 reps/hold jer je "do otkaza"
					if (!isMax && hold === null && (isNaN(reps) || reps < 0)) {
						throw new Error(`Invalid reps value for exercise "${ex.name}"`);
					}
					if (isNaN(rest) || rest < 0) {
						throw new Error(`Invalid rest value for exercise "${ex.name}"`);
					}
					if (weight !== null && (isNaN(weight) || weight < 0)) {
						throw new Error(`Invalid weight value for exercise "${ex.name}"`);
					}
					if (hold !== null && (isNaN(hold) || hold < 0)) {
						throw new Error(`Invalid hold value for exercise "${ex.name}"`);
					}

					// Validacija band vrijednosti
					const validBands = ["", "green", "red", "black"];
					if (band && !validBands.includes(band)) {
						throw new Error(`Invalid band value for exercise "${ex.name}"`);
					}

					// Vraćamo set sa svim vrijednostima
					const sanitizedSet: any = { reps, rest };

					if (weight !== null) {
						sanitizedSet.weight = weight;
					}

					if (hold !== null) {
						sanitizedSet.hold = hold;
					}

					if (band && band !== "") {
						sanitizedSet.band = band;
					}

					// NOVO: Dodaj isMax ako je true
					if (isMax) {
						sanitizedSet.isMax = true;
					}

					return sanitizedSet;
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

		const workout = {
			date: workoutData.date,
			type: workoutData.type,
			notes: workoutData.notes || "",
			synced: workoutData.synced ?? true,
			exercises: sanitizedExercises,
			userId: user.id,
			planId: planId || null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await db.collection("workouts").insertOne(workout);
		const insertedWorkout = { ...workout, _id: result.insertedId };

		if (planId) {
			try {
				const workoutStats = StatisticsCalculator.calculateWorkoutStats(
					insertedWorkout,
					planId
				);
				await StatisticsCalculator.saveWorkoutStatistics(db, workoutStats);
			} catch (statsError) {
				console.error("Error creating workout statistics:", statsError);
			}
		}

		return NextResponse.json({
			message: "Workout created successfully",
			workoutId: result.insertedId,
			planId: planId,
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

		// Pronađi postojeći workout da bismo dobili planId
		const existingWorkout = await db.collection("workouts").findOne({
			_id: new ObjectId(workoutId),
			userId: user.id,
		});

		if (!existingWorkout) {
			return NextResponse.json({ error: "Workout not found" }, { status: 404 });
		}

		if (updateData.exercises) {
			try {
				const sanitizeExercises = (exs: Exercise[]) =>
					exs.map((ex) => ({
						name: ex.name,
						sets: (ex.sets || []).map((set) => {
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
							const hold =
								(set as any).hold !== undefined && (set as any).hold !== ""
									? parseInt((set as any).hold, 10)
									: null;

							// NOVO: Parsiranje band vrijednosti
							const band =
								(set as any).band !== undefined && (set as any).band !== ""
									? (set as any).band
									: "";

							// Logika za reps
							let reps: number;
							if (hold !== null && hold > 0) {
								reps = 0;
							} else {
								reps =
									set.reps !== undefined && set.reps !== ""
										? parseInt(set.reps, 10)
										: 0;
							}

							// Validacija
							if (hold === null && (isNaN(reps) || reps < 0)) {
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
							if (hold !== null && (isNaN(hold) || hold < 0)) {
								throw new Error(`Invalid hold value for exercise "${ex.name}"`);
							}

							// NOVO: Validacija band vrijednosti
							const validBands = ["", "green", "red", "black"];
							if (band && !validBands.includes(band)) {
								throw new Error(`Invalid band value for exercise "${ex.name}"`);
							}

							const sanitizedSet: any = { reps, rest };

							if (weight !== null) {
								sanitizedSet.weight = weight;
							}

							if (hold !== null) {
								sanitizedSet.hold = hold;
							}

							// NOVO: Dodaj band ako postoji
							if (band && band !== "") {
								sanitizedSet.band = band;
							}

							return sanitizedSet;
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

		// Ažuriraj statistike ako je workout dio plana i ako su vježbe ažurirane
		if (existingWorkout.planId && (updateData.exercises || updateData.date)) {
			try {
				// Dobij ažurirani workout
				const updatedWorkout = await db.collection("workouts").findOne({
					_id: new ObjectId(workoutId),
					userId: user.id,
				});

				if (updatedWorkout) {
					const workoutStats = StatisticsCalculator.calculateWorkoutStats(
						updatedWorkout,
						existingWorkout.planId
					);
					await StatisticsCalculator.saveWorkoutStatistics(db, workoutStats);
				}
			} catch (statsError) {
				console.error("Error updating workout statistics:", statsError);
			}
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

		// Prvo obriši povezane statistike
		await db.collection("workoutStatistics").deleteMany({
			workoutId: workoutId,
			userId: user.id,
		});

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
