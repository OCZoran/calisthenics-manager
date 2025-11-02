import React from "react";
import { Metadata } from "next";
import GoalsClient from "@/features/goals/components/GoalClient";

export const metadata: Metadata = {
	title: "My goals | Fitness Tracker",
	description:
		"Track and achieve your fitness goals with our comprehensive goal management features.",
};

export default function GoalsPage() {
	return <GoalsClient />;
}
