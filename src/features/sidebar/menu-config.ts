import React from "react";
import {
	BarChartOutlined,
	DashboardOutlined,
	FitnessCenterOutlined,
} from "@mui/icons-material";

export interface MenuItem {
	text: string;
	path: string;
	icon: React.ReactNode;
	match: (pathname: string) => boolean;
	section?: "main" | "admin";
	order?: number;
}

export const menuConfig: MenuItem[] = [
	{
		text: "Dashboard",
		icon: React.createElement(DashboardOutlined),
		path: "/",
		match: (p) => p === "/",
		section: "main",
		order: 1,
	},
	{
		text: "Workouts",
		icon: React.createElement(FitnessCenterOutlined),
		path: "/workouts",
		match: (p) => p.startsWith("/workouts"),
		section: "main",
		order: 2,
	},
	{
		text: "Workouts analysis",
		icon: React.createElement(BarChartOutlined),
		path: "/workouts-analysis",
		match: (p) => p.startsWith("/workouts-analysis"),
		section: "main",
		order: 3,
	},
];
