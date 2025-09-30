import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Samo ove rute su dostupne bez tokena
const publicRoutes = [
	"/login",
	"/registration",
	// Dodaj ostale ako su potrebne
	// "/reset-password",
	// "/terms-of-service",
	// "/privacy-policy",
];

const checkUserExists = async (userId: string): Promise<boolean> => {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_BASE_URL}/api/users?id=${userId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			return false;
		}

		const user = await response.json();
		return !!user;
	} catch (error) {
		console.error("Error checking user existence:", error);
		return false;
	}
};

const getCorsHeaders = (origin: string): Record<string, string> => {
	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
		o.trim()
	) || ["http://localhost:3001"];
	const isAllowed = allowedOrigins.some((allowed) =>
		origin.startsWith(allowed)
	);
	return {
		"Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, x-api-key",
		"Access-Control-Allow-Credentials": "true",
	};
};

const getToken = (request: NextRequest): string | null => {
	const cookieToken = request.cookies.get("token")?.value;
	const headerToken = request.headers.get("Authorization")?.split(" ")[1];
	return cookieToken || headerToken || null;
};

const verifyToken = async (token: string) => {
	try {
		return await jwtVerify(token, secret);
	} catch (err) {
		console.error("❌ JWT VERIFY FAILED:", err);
		return null;
	}
};

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export default async function middleware(request: NextRequest) {
	const response = NextResponse.next();

	const { pathname } = request.nextUrl;
	const origin = request.headers.get("origin") || request.nextUrl.origin;

	const headers = new Headers(response.headers);
	headers.set("x-current-path", pathname);

	if (response.cookies.get("NEXT_LOCALE")) {
		response.cookies.delete("NEXT_LOCALE");
	}

	if (request.method === "OPTIONS") {
		return new NextResponse(null, {
			status: 204,
			headers: getCorsHeaders(origin),
		});
	}

	headers.set(
		"x-forwarded-host",
		request.headers.get("origin")?.replace(/(http|https):\/\//, "") || "*"
	);

	// Provjeri da li je ruta javna (dostupna bez tokena)
	const isPublicRoute = publicRoutes.some((route) => {
		return pathname === route || pathname.startsWith(`${route}/`);
	});

	// Ako je javna ruta, propusti je bez provjere tokena
	if (isPublicRoute) {
		// Provjeri da li korisnik ima token i da li je valjan
		const token = getToken(request);

		if (token) {
			const result = await verifyToken(token);
			if (result) {
				// Korisnik je već prijavljen - preusmjeri ga sa public rute
				const dashboardUrl = new URL("/workouts", request.url); // ili "/" ili bilo koja glavna stranica
				return NextResponse.redirect(dashboardUrl);
			} else {
				// Token postoji ali nije valjan - obriši ga
				const response = NextResponse.next();
				response.cookies.delete("token");
				Object.entries(Object.fromEntries(headers)).forEach(([key, value]) => {
					response.headers.set(key, value);
				});
				return response;
			}
		}

		// Korisnik nema token ili token nije valjan - dozvoli pristup public ruti
		Object.entries(Object.fromEntries(headers)).forEach(([key, value]) => {
			response.headers.set(key, value);
		});
		return response;
	}

	// Za sve ostale rute MORA postojati token
	const token = getToken(request);

	if (!token) {
		// Nema tokena - redirect na login
		const loginUrl = new URL("/login", request.url);
		return NextResponse.redirect(loginUrl);
	}

	// Ima token - provjeri da li je valjan
	const result = await verifyToken(token);
	if (!result) {
		// Token nije valjan
		const loginUrl = new URL("/login", request.url);
		const redirectResponse = NextResponse.redirect(loginUrl);
		redirectResponse.cookies.delete("token");
		return redirectResponse;
	}

	// Token je valjan - provjeri da li korisnik postoji
	const { payload } = result;
	const userExists = await checkUserExists(payload.id as string);
	if (!userExists) {
		const loginUrl = new URL("/login", request.url);
		const redirectResponse = NextResponse.redirect(loginUrl);
		redirectResponse.cookies.delete("token");
		return redirectResponse;
	}

	// Sve je OK, nastavi dalje
	Object.entries(Object.fromEntries(headers)).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}
