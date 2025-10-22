import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

async function getUserFromToken(req: NextRequest) {
	const token = req.cookies.get("token")?.value;
	if (!token) {
		throw new Error("No authentication token");
	}

	const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
		id: string;
		email: string;
	};
	return decoded;
}

// POST - dodaj update na goal
export async function POST(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { goalId, notes, status, images, feeling } = await req.json();

		if (!goalId || !status) {
			return NextResponse.json(
				{ error: "Goal ID and status are required" },
				{ status: 400 }
			);
		}

		if (!["progress", "neutral", "regress"].includes(status)) {
			return NextResponse.json({ error: "Invalid status" }, { status: 400 });
		}

		// Provjeri da li goal postoji i pripada korisniku
		const goal = await db.collection("goals").findOne({
			_id: new ObjectId(goalId),
			userId: user.id,
		});

		if (!goal) {
			return NextResponse.json({ error: "Goal not found" }, { status: 404 });
		}

		const now = new Date().toISOString();
		const newUpdate = {
			id: new ObjectId().toString(),
			date: now.split("T")[0],
			notes: notes || "",
			status,
			images: images || [],
			feeling: feeling || 3,
			createdAt: now,
		};

		// Dodaj update u goal
		await db.collection("goals").updateOne(
			{ _id: new ObjectId(goalId as string) },
			{
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				$push: { updates: newUpdate as any },
				$set: { updatedAt: now },
			}
		);

		return NextResponse.json(newUpdate);
	} catch (error) {
		console.error("Error adding update:", error);
		return NextResponse.json(
			{ error: "Failed to add update" },
			{ status: 500 }
		);
	}
}

// DELETE - obriši update
export async function DELETE(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const goalId = searchParams.get("goalId");
		const updateId = searchParams.get("updateId");

		if (!goalId || !updateId) {
			return NextResponse.json(
				{ error: "Goal ID and Update ID are required" },
				{ status: 400 }
			);
		}

		const result = await db.collection("goals").updateOne(
			{ _id: new ObjectId(goalId), userId: user.id },
			{
				// cast $pull value to any to satisfy mongodb types for conditional pull
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				$pull: { updates: { id: updateId } as any },
				$set: { updatedAt: new Date().toISOString() },
			}
		);

		if (result.matchedCount === 0) {
			return NextResponse.json({ error: "Goal not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Update deleted successfully" });
	} catch (error) {
		console.error("Error deleting update:", error);
		return NextResponse.json(
			{ error: "Failed to delete update" },
			{ status: 500 }
		);
	}
}
