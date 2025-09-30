import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getUserIdFromToken from "@/global/utils/get-user-id";
import { getDatabase } from "@/global/mongodb";

export async function GET() {
	try {
		const userId = await getUserIdFromToken();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { db } = await getDatabase();
		const user = await db
			.collection("users")
			.findOne({ _id: new ObjectId(userId) });

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		delete user.password;

		return NextResponse.json(user, { status: 200 });
	} catch (error) {
		console.error("Greška u /api/users/current:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
