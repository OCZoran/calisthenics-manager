import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";

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
	{
		id: 4,
		text: "Status",
		icon: TimelineIcon,
		path: "/status",
	},
	{
		id: 5,
		text: "Journal",
		icon: BookOutlinedIcon,
		path: "/journal",
	},
	{
		id: 6,
		text: "Food Log",
		icon: RestaurantIcon,
		path: "/food-log",
	},
	{
		id: 7,
		text: "Knowledge Hub",
		icon: LibraryBooksOutlinedIcon,
		path: "/knowledge-hub",
	},
	{
		id: 8,
		text: "User Profile",
		icon: PersonOutlineIcon,
		path: "/user-profile",
	},
];
