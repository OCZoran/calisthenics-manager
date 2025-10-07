import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "@/global/mongodb";

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ message: "email_or_password_wrong" },
				{ status: 401 }
			);
		}

		const { db } = await getDatabase();
		const user = await db.collection("users").findOne({ email });

		if (!user) {
			return NextResponse.json({ message: "user_not_found" }, { status: 401 });
		}

		const isValid = await bcrypt.compare(password, user.password);
		if (!isValid) {
			return NextResponse.json(
				{ message: "email_or_password_wrong" },
				{ status: 401 }
			);
		}

		// ✅ Dodaj expiration time - 30 dana
		const token = jwt.sign(
			{ id: user._id, email: user.email },
			process.env.JWT_SECRET as string,
			{ expiresIn: "30d" } // Token važi 30 dana
		);

		const response = NextResponse.json({
			message: "login_successful",
			user: {
				id: user._id,
				email: user.email,
				name: user.name,
			},
		});

		const isProd = process.env.NODE_ENV === "production";

		// ✅ Dodaj Max-Age na cookie - 30 dana (u sekundama)
		const maxAge = 30 * 24 * 60 * 60; // 30 dana

		response.headers.set(
			"Set-Cookie",
			`token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
				isProd ? "; Secure" : ""
			}`
		);

		return response;
	} catch (error) {
		console.error("Error during login:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
