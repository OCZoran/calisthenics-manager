/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";

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

// GET - Fetch progress data for a training plan
export async function GET(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const { db } = await getDatabase();

		const url = new URL(request.url);
		const planId = url.searchParams.get("planId");
		const exerciseName = url.searchParams.get("exercise");

		if (!planId) {
			return NextResponse.json(
				{ error: "Plan ID is required" },
				{ status: 400 }
			);
		}

		// Fetch workout statistics for the plan
		const query: any = { userId: user.id, planId: planId };

		if (exerciseName) {
			// Specific exercise progress
			query["exerciseStats.exerciseName"] = exerciseName;

			const workoutStats = await db
				.collection("workoutStatistics")
				.find(query)
				.sort({ workoutDate: 1 })
				.toArray();

			const exerciseProgress = workoutStats
				.map((stat) =>
					stat.exerciseStats.find((ex: any) => ex.exerciseName === exerciseName)
				)
				.filter(Boolean)
				.map((exercise: any) => ({
					date: exercise.workoutDate,
					totalReps: exercise.totalReps,
					totalVolume: exercise.totalVolume,
					averageRest: exercise.averageRest,
					maxWeight: exercise.maxWeight,
					metric: exercise.exerciseType === "bodyweight" ? "reps" : "volume",
				}));

			return NextResponse.json({ exerciseProgress, exerciseName });
		} else {
			// Overall plan progress
			const workoutStats = await db
				.collection("workoutStatistics")
				.find(query)
				.sort({ workoutDate: 1 })
				.toArray();

			const planProgress = workoutStats.map((stat: any) => ({
				date: stat.workoutDate,
				workoutType: stat.workoutType,
				totalReps: stat.totalReps,
				totalVolume: stat.totalVolume,
				mixedMetric: stat.mixedMetric,
				totalExercises: stat.totalExercises,
				totalSets: stat.totalSets,
			}));

			// Get unique exercises for this plan
			const uniqueExercises = [
				...new Set(
					workoutStats.flatMap((stat: any) =>
						stat.exerciseStats.map((ex: any) => ex.exerciseName)
					)
				),
			];

			return NextResponse.json({ planProgress, exercises: uniqueExercises });
		}
	} catch (error) {
		console.error("Error fetching progress:", error);
		return NextResponse.json(
			{ error: "Failed to fetch progress data" },
			{ status: 500 }
		);
	}
}

// /utils/statistics-calculator.ts
import { Exercise, WorkoutSet } from "@/global/interfaces/workout.interface";
import {
	ExerciseStatistics,
	WorkoutStatistics,
	SetStatistics,
} from "@/global/interfaces/training-plan.interface";

export class StatisticsCalculator {
	static determineExerciseType(sets: WorkoutSet[]): "bodyweight" | "weighted" {
		// If any set has weight, consider it weighted exercise
		return sets.some((set) => set.weight && parseFloat(set.weight) > 0)
			? "weighted"
			: "bodyweight";
	}

	static calculateSetStats(set: WorkoutSet): SetStatistics {
		const reps = parseInt(set.reps) || 0;
		const weight = set.weight ? parseFloat(set.weight) : 0;
		const rest = parseInt(set.rest) || 0;

		return {
			reps,
			weight: weight > 0 ? weight : undefined,
			rest,
			volume: weight > 0 ? reps * weight : undefined,
		};
	}

	static calculateExerciseStats(
		exercise: Exercise,
		planId: string,
		workoutId: string,
		workoutDate: string
	): ExerciseStatistics {
		const exerciseType = this.determineExerciseType(exercise.sets);
		const setStas: SetStatistics[] = exercise.sets.map((set) =>
			this.calculateSetStats(set)
		);

		const totalReps = setStas.reduce((sum, set) => sum + set.reps, 0);
		const totalVolume =
			exerciseType === "weighted"
				? setStas.reduce((sum, set) => sum + (set.volume || 0), 0)
				: totalReps; // For bodyweight, volume = total reps

		const averageRest =
			setStas.length > 0
				? setStas.reduce((sum, set) => sum + set.rest, 0) / setStas.length
				: 0;

		const maxWeight =
			exerciseType === "weighted"
				? Math.max(...setStas.map((set) => set.weight || 0))
				: undefined;

		return {
			exerciseName: exercise.name,
			exerciseType,
			planId,
			workoutId,
			workoutDate,
			sets: setStas,
			totalReps,
			totalVolume,
			averageRest: Math.round(averageRest),
			maxWeight,
		};
	}

	static calculateWorkoutStats(
		workout: any, // Your existing workout object
		planId?: string
	): WorkoutStatistics {
		if (!planId) {
			throw new Error("Plan ID is required for statistics calculation");
		}

		const exerciseStats = workout.exercises.map((exercise: Exercise) =>
			this.calculateExerciseStats(exercise, planId, workout._id, workout.date)
		);

		const totalExercises = exerciseStats.length;
		const totalSets: number = exerciseStats.reduce(
			(sum: number, ex: ExerciseStatistics) => sum + ex.sets.length,
			0
		);

		// Separate BW and weighted exercises for mixed calculation
		const bwExercises: ExerciseStatistics[] = exerciseStats.filter(
			(ex: ExerciseStatistics) => ex.exerciseType === "bodyweight"
		);
		const weightedExercises: ExerciseStatistics[] = exerciseStats.filter(
			(ex: ExerciseStatistics) => ex.exerciseType === "weighted"
		);

		const totalReps: number = bwExercises.reduce(
			(sum: number, ex: ExerciseStatistics) => sum + ex.totalReps,
			0
		);
		const totalVolume = weightedExercises.reduce(
			(sum, ex) => sum + ex.totalVolume,
			0
		);

		// Mixed metric: combines BW reps and weighted volume
		// You can adjust this formula based on your preference
		let mixedMetric = 0;
		if (bwExercises.length > 0 && weightedExercises.length > 0) {
			// Simple approach: normalize and sum (reps + volume/10)
			mixedMetric = totalReps + totalVolume / 10;
		}

		const averageRestTime: number =
			exerciseStats.length > 0
				? Math.round(
						exerciseStats.reduce(
							(sum: number, ex: ExerciseStatistics) => sum + ex.averageRest,
							0
						) / exerciseStats.length
				  )
				: 0;

		return {
			userId: workout.userId,
			planId,
			workoutId: workout._id,
			workoutDate: workout.date,
			workoutType: workout.type,
			totalExercises,
			totalSets,
			totalReps: totalReps || 0,
			totalVolume: totalVolume || 0,
			mixedMetric: mixedMetric > 0 ? Math.round(mixedMetric) : undefined,
			averageRestTime,
			exerciseStats,
			createdAt: new Date(),
		};
	}

	static async saveWorkoutStatistics(db: any, workoutStats: WorkoutStatistics) {
		try {
			// Check if statistics already exist for this workout
			const existing = await db.collection("workoutStatistics").findOne({
				workoutId: workoutStats.workoutId,
				userId: workoutStats.userId,
			});

			if (existing) {
				// Update existing
				await db
					.collection("workoutStatistics")
					.updateOne(
						{ _id: existing._id },
						{ $set: { ...workoutStats, updatedAt: new Date() } }
					);
			} else {
				// Insert new
				await db.collection("workoutStatistics").insertOne(workoutStats);
			}

			console.log("Workout statistics saved successfully");
		} catch (error) {
			console.error("Error saving workout statistics:", error);
			throw error;
		}
	}
}
