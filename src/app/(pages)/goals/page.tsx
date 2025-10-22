import React from "react";
import { Metadata } from "next";
import GoalsClient from "@/features/goals/components/GoalClient";

export const metadata: Metadata = {
	title: "Moji Ciljevi | Fitness Tracker",
	description: "Pratite i postižite svoje fitnes ciljeve",
};

export default function GoalsPage() {
	return <GoalsClient />;
}
