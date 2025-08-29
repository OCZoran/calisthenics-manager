"use client";

import React, { useState } from "react";
import {
	Box,
	Button,
	TextField,
	Typography,
	Alert,
	InputAdornment,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmailOutlined, LockOutline } from "@mui/icons-material";
import theme from "@/theme";
import { getOfflineUser, saveUserOffline } from "@/features/OfflineManager";
import axiosInstance from "@/services/axios-public.instance";

export interface ValidationErrors {
	email?: string;
	password?: string;
}

export const validateField = (
	name: string,
	value: string
): string | undefined => {
	switch (name) {
		case "email":
			if (!value) return "email_required";
			if (!/\S+@\S+\.\S+/.test(value)) return "email_invalid";
			return undefined;
		case "password":
			if (!value) return "password_required";
			if (value.length < 6) return "password_too_short";
			return undefined;
		default:
			return undefined;
	}
};

export const validateForm = (
	formData: ValidationErrors,
	setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>
): boolean => {
	const newErrors: ValidationErrors = {};

	Object.entries(formData).forEach(([field, value]) => {
		const error = validateField(field, value);
		if (error) {
			newErrors[field as keyof ValidationErrors] = error;
		}
	});

	setErrors(newErrors);
	return Object.keys(newErrors).length === 0;
};

const Login = () => {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const [errors, setErrors] = useState<ValidationErrors>({});
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [disableSubmit, setDisableSubmit] = useState(false);

	const [successMessage, setSuccessMessage] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));

		if (disableSubmit) {
			setDisableSubmit(false);
		}

		if (isSubmitted) {
			const errorMessage = validateField(name, value);
			setErrors((prev) => ({
				...prev,
				[name]: errorMessage,
			}));
		}
	};

	const handleLogin = async (email: string, password: string) => {
		try {
			// Pokušaj online login preko axios instance
			const response = await axiosInstance.post("/api/auth/login", {
				email,
				password,
			});

			if (response.status === 200) {
				const userData = response.data;
				// Sačuvaj i offline za budući pristup
				saveUserOffline(userData.user);
				return userData;
			} else {
				throw new Error("Server error");
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.log("Offline mode - checking local credentials");

			// Ako nema neta ili server vrati grešku -> probaj offline
			const offlineUser = getOfflineUser();
			if (offlineUser && offlineUser.email === email) {
				return { user: offlineUser, offline: true };
			}

			// Ako ni offline nema
			if (error.response) {
				// Server error (npr. 401)
				throw new Error(error.response.data?.message || "Login failed");
			} else if (error.request) {
				// Network error
				throw new Error("Network error - check connection");
			} else {
				throw new Error(error.message || "Login failed");
			}
		}
	};

	// Ispravljen onSubmit handler
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitted(true);

		// Validacija forme
		if (!validateForm(formData, setErrors)) {
			return;
		}

		setDisableSubmit(true);
		setErrorMessage("");
		setSuccessMessage("");

		try {
			const result = await handleLogin(formData.email, formData.password);

			if (result.offline) {
				setSuccessMessage("Logged in offline mode");
			} else {
				setSuccessMessage("Login successful");
			}

			// Redirect nakon uspešnog logina
			setTimeout(() => {
				router.push("/workouts"); // ili gde god treba da redirects
			}, 1500);
		} catch (error) {
			console.error("Login error:", error);
			setErrorMessage(error instanceof Error ? error.message : "Login failed");
		} finally {
			setDisableSubmit(false);
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				gap: 2,
				p: 2,
			}}
		>
			<Box
				sx={{
					maxWidth: 400,
					width: "100%",
					padding: 3,
					boxShadow: "2px 0px 12px 0px #e4e4e4, 2px 2px 4px 0px #e4e4e4",
					borderRadius: 2,
					textAlign: "center",
				}}
			>
				<Typography
					variant="h6"
					sx={{ textTransform: "uppercase", marginBottom: 2 }}
					gutterBottom
				>
					Login
				</Typography>

				<form onSubmit={handleSubmit} noValidate>
					<TextField
						label="Email"
						name="email"
						type="email"
						value={formData.email}
						onChange={handleChange}
						fullWidth
						sx={{ marginBottom: 3 }}
						required
						error={Boolean(errors.email)}
						helperText={errors.email}
						size="medium"
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<EmailOutlined />
									</InputAdornment>
								),
							},
						}}
					/>

					<TextField
						label="Password"
						name="password"
						type="password"
						value={formData.password}
						onChange={handleChange}
						fullWidth
						required
						error={Boolean(errors.password)}
						helperText={errors.password}
						size="medium"
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<LockOutline />
									</InputAdornment>
								),
							},
						}}
					/>

					<Button
						disabled={
							disableSubmit ||
							Object.values(errors).some((error) => Boolean(error))
						}
						type="submit"
						variant="contained"
						color="primary"
						fullWidth
						sx={{ mt: 2 }}
					>
						{disableSubmit ? "Logging in..." : "Login"}
					</Button>
				</form>

				{successMessage && (
					<Alert severity="success" sx={{ mt: 1, textAlign: "left" }}>
						{successMessage}
					</Alert>
				)}

				{errorMessage && (
					<Alert severity="error" sx={{ mt: 1, textAlign: "left" }}>
						{errorMessage}
					</Alert>
				)}

				<Typography variant="body2" sx={{ mt: 1 }}>
					Don&apos;t have an account?{" "}
					<Link
						href="/registration"
						style={{
							color: theme.palette.primary.main,
							textDecoration: "underline",
							fontWeight: "bold",
						}}
					>
						Sign up
					</Link>
				</Typography>
			</Box>
		</Box>
	);
};

export default Login;
