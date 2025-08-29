import { NextResponse } from "next/server";

export async function POST() {
	const response = NextResponse.json({ message: "Logout successful" });
	response.headers.set(
		"Set-Cookie",
		"token=; Path=/; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
	);
	return response;
}
