import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
export const sidebarUserData = [
	{
		id: 1,
		text: "Dashboard",
		icon: DashboardOutlinedIcon,
		path: "/",
	},
	{
		id: 2,
		text: "Workouts",
		icon: FitnessCenterOutlinedIcon,
		path: "/workouts",
	},
	{
		id: 3,
		text: "Workouts analysis",
		icon: BarChartOutlinedIcon,
		path: "/workouts-analysis",
	},
];
