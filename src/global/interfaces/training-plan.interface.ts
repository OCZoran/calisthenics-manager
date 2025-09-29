import {
	ExerciseTag,
	MovementCategory,
} from "@/features/workouts/exercise/exercise.interface";
import { Workout } from "./workout.interface";

export interface TrainingPlan {
	_id?: string;
	userId: string;
	name: string;
	description?: string;
	startDate: string;
	endDate?: string; // null = aktivni plan
	status: "active" | "completed" | "paused";
	goal?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ExerciseType {
	BODYWEIGHT: "bodyweight";
	WEIGHTED: "weighted";
}

export interface ExerciseDefinition {
	_id?: string;
	name: string;
	type: "bodyweight" | "weighted";
	isBodyweight: boolean;
	muscleGroups: string[];
	userId: string;
	tags: ExerciseTag[];

	category: MovementCategory;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface SetStatistics {
	reps: number;
	weight?: number;
	rest: number; // seconds
	volume?: number;
}

export interface ExerciseStatistics {
	exerciseName: string;
	exerciseType: "bodyweight" | "weighted";
	planId: string;
	workoutId: string;
	workoutDate: string;
	sets: SetStatistics[];
	totalReps: number;
	totalVolume: number;
	averageRest: number;
	maxWeight?: number;
}

export interface WorkoutStatistics {
	_id?: string;
	userId: string;
	planId: string;
	workoutId: string;
	workoutDate: string;
	workoutType: string;
	totalExercises: number;
	totalSets: number;
	totalReps: number;
	totalVolume: number;
	mixedMetric?: number;
	averageRestTime: number;
	exerciseStats: ExerciseStatistics[];
	createdAt?: Date;
}

export interface ProgressTrend {
	date: string;
	value: number;
	metric: "reps" | "volume" | "weight";
	exerciseName?: string;
}

export interface PlanProgress {
	planId: string;
	planName: string;
	exerciseProgress: {
		[exerciseName: string]: {
			type: "bodyweight" | "weighted";
			trend: ProgressTrend[];
			averageRest: number;
			bestSet?: SetStatistics;
		};
	};
	workoutProgress: {
		date: string;
		totalReps?: number;
		totalVolume?: number;
		mixedMetric?: number;
	}[];
}

export interface WorkoutExtended extends Workout {
	planId?: string;
}
