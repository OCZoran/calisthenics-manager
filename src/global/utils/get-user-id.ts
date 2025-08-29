import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface DecodedToken {
	id: string;
	email: string;
	role: string;
}

const getUserIdFromToken = async (): Promise<string | null> => {
	const token = (await cookies()).get("token")?.value;

	if (!token) return null;

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET as string
		) as DecodedToken;
		return decoded.id;
	} catch (error) {
		console.error("Invalid token:", error);
		return null;
	}
};
export default getUserIdFromToken;
