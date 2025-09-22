// /app/api/training-plans/route.ts
import { NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";

async function getUserFromToken(request: Request) {
	const cookieHeader = request.headers.get("cookie");
	if (!cookieHeader) {
		throw new Error("No authentication token");
	}

	const tokenMatch = cookieHeader.match(/token=([^;]+)/);
	if (!tokenMatch) {
		throw new Error("No authentication token");
	}

	const token = tokenMatch[1];
	const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
		id: string;
		email: string;
	};
	return decoded;
}

// GET - Fetch all training plans for user
export async function GET(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const { db } = await getDatabase();

		const url = new URL(request.url);
		const includeActive = url.searchParams.get("active") === "true";

		const query: Record<string, unknown> = { userId: user.id };
		if (includeActive) {
			query.status = "active";
		}

		const plans = await db
			.collection("trainingPlans")
			.find(query)
			.sort({ createdAt: -1 })
			.toArray();

		return NextResponse.json({ plans });
	} catch (error) {
		console.error("Error fetching training plans:", error);
		return NextResponse.json(
			{ error: "Failed to fetch training plans" },
			{ status: 500 }
		);
	}
}

// POST - Create new training plan
export async function POST(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const planData: Omit<TrainingPlan, "userId" | "_id"> = await request.json();

		// Validation
		if (!planData.name || !planData.startDate) {
			return NextResponse.json(
				{ error: "Name and start date are required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		// Deactivate current active plan if creating new active plan
		if (planData.status === "active") {
			await db
				.collection("trainingPlans")
				.updateMany(
					{ userId: user.id, status: "active" },
					{ $set: { status: "completed", endDate: new Date().toISOString() } }
				);
		}

		const plan: Omit<TrainingPlan, "_id"> = {
			...planData,
			userId: user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await db.collection("trainingPlans").insertOne(plan);

		return NextResponse.json({
			message: "Training plan created successfully",
			planId: result.insertedId,
		});
	} catch (error) {
		console.error("Error creating training plan:", error);
		return NextResponse.json(
			{ error: "Failed to create training plan" },
			{ status: 500 }
		);
	}
}

// PUT - Update training plan
export async function PUT(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const { planId, ...updateData } = await request.json();

		if (!planId) {
			return NextResponse.json(
				{ error: "Plan ID is required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		// If activating this plan, deactivate others
		if (updateData.status === "active") {
			await db.collection("trainingPlans").updateMany(
				{
					userId: user.id,
					status: "active",
					_id: { $ne: new ObjectId(planId) },
				},
				{ $set: { status: "completed", endDate: new Date().toISOString() } }
			);
		}

		const result = await db.collection("trainingPlans").updateOne(
			{
				_id: new ObjectId(planId),
				userId: user.id,
			},
			{
				$set: {
					...updateData,
					updatedAt: new Date(),
				},
			}
		);

		if (result.matchedCount === 0) {
			return NextResponse.json({ error: "Plan not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Training plan updated successfully" });
	} catch (error) {
		console.error("Error updating training plan:", error);
		return NextResponse.json(
			{ error: "Failed to update training plan" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete training plan
export async function DELETE(request: Request) {
	try {
		const user = await getUserFromToken(request);
		const url = new URL(request.url);
		const planId = url.searchParams.get("id");

		if (!planId) {
			return NextResponse.json(
				{ error: "Plan ID is required" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		// Check if plan has associated workouts
		const workoutCount = await db
			.collection("workouts")
			.countDocuments({ userId: user.id, planId: planId });

		if (workoutCount > 0) {
			return NextResponse.json(
				{
					error:
						"Cannot delete plan with associated workouts. Complete the plan instead.",
				},
				{ status: 400 }
			);
		}

		const result = await db.collection("trainingPlans").deleteOne({
			_id: new ObjectId(planId),
			userId: user.id,
		});

		if (result.deletedCount === 0) {
			return NextResponse.json({ error: "Plan not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Training plan deleted successfully" });
	} catch (error) {
		console.error("Error deleting training plan:", error);
		return NextResponse.json(
			{ error: "Failed to delete training plan" },
			{ status: 500 }
		);
	}
}
