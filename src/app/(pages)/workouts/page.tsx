export const dynamic = "force-dynamic"; // good

import React from "react";
import { Container } from "@mui/material";
import { getDatabase } from "@/global/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import WorkoutClient from "@/features/workouts/components/WorkoutClient";
import { Workout } from "@/global/interfaces/workout.interface";

async function getUserFromCookies() {
	const cookieStore = cookies(); // ❗ no await
	const token = (await cookieStore).get("token")?.value;

	if (!token) throw new Error("No authentication token");

	return jwt.verify(token, process.env.JWT_SECRET!) as {
		id: string;
		email: string;
	};
}

async function getWorkouts(userId: string): Promise<Workout[]> {
	const { db } = await getDatabase();
	const workouts = await db
		.collection("workouts")
		.find({ userId })
		.sort({ date: -1, createdAt: -1 })
		.toArray();

	return workouts.map((w) => ({
		...w,
		_id: w._id.toString(),
	})) as Workout[];
}

export default async function WorkoutsPage() {
	const user = await getUserFromCookies(); // ✔ inside request
	const workouts = await getWorkouts(user.id); // ✔ inside request

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<WorkoutClient initialWorkouts={workouts} userEmail={user.email} />
		</Container>
	);
}
