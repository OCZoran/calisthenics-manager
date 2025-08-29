import axios from "axios";
import { cookies } from "next/headers";

export async function getServerAxiosInstance() {
	const cookieStore = await cookies();
	const cookieHeader = cookieStore.toString();

	return axios.create({
		baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
		headers: {
			"Content-Type": "application/json",
			cookie: cookieHeader,
		},
	});
}
