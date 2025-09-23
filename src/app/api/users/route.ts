/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getUserIdFromToken from "@/global/utils/get-user-id";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/global/mongodb";

export async function GET(request: Request) {
	try {
		const { db } = await getDatabase();
		const url = new URL(request.url);

		const singleUserId = url.searchParams.get("id");

		if (singleUserId) {
			if (!ObjectId.isValid(singleUserId)) {
				return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
			}

			const user = await db
				.collection("users")
				.findOne({ _id: new ObjectId(singleUserId) });

			if (!user) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			return NextResponse.json(user, { status: 200 });
		}

		const currentUserId = await getUserIdFromToken();
		if (!currentUserId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const currentUser = await db
			.collection("users")
			.findOne({ _id: new ObjectId(currentUserId) });
		if (!currentUser || !currentUser.organizationId) {
			return NextResponse.json(
				{ error: "User not found or not associated with organization" },
				{ status: 404 }
			);
		}

		const query: Record<string, unknown> = {};

		const users = await db
			.collection("users")
			.find(query)
			.sort({ createdAt: -1 })
			.toArray();

		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const body = await request.json();
		const { userId, ...fieldsToUpdate } = body;

		if (!userId || !ObjectId.isValid(userId)) {
			return NextResponse.json(
				{ error: "Invalid or missing user ID" },
				{ status: 400 }
			);
		}

		if (Object.keys(fieldsToUpdate).length === 0) {
			return NextResponse.json(
				{ error: "No fields provided for update" },
				{ status: 400 }
			);
		}

		const requesterId = await getUserIdFromToken();
		if (!requesterId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { db } = await getDatabase();
		const requester = await db
			.collection("users")
			.findOne({ _id: new ObjectId(requesterId) });
		const targetUser = await db
			.collection("users")
			.findOne({ _id: new ObjectId(userId as string) });

		if (!requester || !targetUser) {
			return NextResponse.json(
				{ error: "Requester or target user not found" },
				{ status: 404 }
			);
		}

		const isSelfUpdate = requesterId === userId;

		if (!isSelfUpdate) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const userEditableFields = ["name", "email", "password"];

		const allowedFields = userEditableFields;

		for (const key of Object.keys(fieldsToUpdate)) {
			if (!allowedFields.includes(key)) {
				delete fieldsToUpdate[key];
			}
		}

		if (fieldsToUpdate.password) {
			const saltRounds = 12;
			fieldsToUpdate.password = await bcrypt.hash(
				fieldsToUpdate.password,
				saltRounds
			);
		}

		const updateObj = Object.fromEntries(
			Object.entries(fieldsToUpdate).filter(([_, v]) => v !== undefined)
		);

		if (Object.keys(updateObj).length > 0) {
			updateObj.updatedAt = new Date();

			const result = await db
				.collection("users")
				.updateOne(
					{ _id: new ObjectId(userId as string) },
					{ $set: updateObj }
				);

			if (result.matchedCount === 0) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}
		}

		const updatedUser = await db
			.collection("users")
			.findOne({ _id: new ObjectId(userId as string) });
		const userWithoutPassword = { ...updatedUser };
		if (userWithoutPassword && "password" in userWithoutPassword) {
			delete userWithoutPassword.password;
		}

		return NextResponse.json(
			{
				message: "User updated successfully",
				user: userWithoutPassword,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error updating user:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { userId } = await request.json();

		if (!userId || !ObjectId.isValid(userId)) {
			return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
		}

		const requesterId = await getUserIdFromToken();
		if (!requesterId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { db } = await getDatabase();

		const requester = await db
			.collection("users")
			.findOne({ _id: new ObjectId(requesterId) });
		if (!requester || !requester.organizationId) {
			return NextResponse.json(
				{ error: "Requester not found or not associated with organization" },
				{ status: 404 }
			);
		}

		if (requester.role !== "admin") {
			return NextResponse.json(
				{ error: "You are not authorized to perform this action" },
				{ status: 403 }
			);
		}

		const targetUser = await db
			.collection("users")
			.findOne({ _id: new ObjectId(userId as string) });
		if (!targetUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		await db.collection("users").deleteOne({ _id: new ObjectId(userId) });

		return NextResponse.json(
			{ message: "User deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting user:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
