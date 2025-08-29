import React from "react";
import { Container } from "@mui/material";
import { getDatabase } from "@/global/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import WorkoutClient from "@/features/workouts/WorkoutClient";
import { Workout } from "@/global/interfaces/workout.interface";

async function getUserFromCookies() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token");

	if (!token?.value) {
		throw new Error("No authentication token");
	}

	const decoded = jwt.verify(token.value, process.env.JWT_SECRET as string) as {
		id: string;
		email: string;
	};
	return decoded;
}

// Server-side function to fetch workouts
async function getWorkouts(): Promise<Workout[]> {
	try {
		const user = await getUserFromCookies();
		const { db } = await getDatabase();

		const workouts = await db
			.collection("workouts")
			.find({ userId: user.id })
			.sort({ date: -1, createdAt: -1 })
			.toArray();

		// Convert ObjectId to string for serialization
		return workouts.map((workout) => ({
			...workout,
			_id: workout._id.toString(),
		})) as Workout[];
	} catch (error) {
		console.error("Error fetching workouts:", error);
		return [];
	}
}

const WorkoutsPage = async () => {
	const workouts = await getWorkouts();

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<WorkoutClient initialWorkouts={workouts} />
		</Container>
	);
};

export default WorkoutsPage;
