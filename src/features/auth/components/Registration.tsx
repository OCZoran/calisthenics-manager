"use client";

import React, { useState } from "react";
import {
	TextField,
	Button,
	Typography,
	Box,
	Alert,
	InputAdornment,
} from "@mui/material";
import Link from "next/link";
import axios from "axios";
import { validateFieldRegistration } from "../utils/validation";
import {
	RegistrationErrorsInterface,
	RegistrationFormDataInterface,
} from "../interfaces/validation.interface";
import { LockOutline } from "@mui/icons-material";
import { EmailOutlined, PersonOutline } from "@mui/icons-material";
import theme from "@/theme";
import axiosInstance from "@/services/axios-public.instance";
import { useRouter } from "next/navigation";

const Registration = () => {
	const [formData, setFormData] = useState<RegistrationFormDataInterface>({
		name: "",
		email: "",
		password: "",
	});

	const [errors, setErrors] = useState<RegistrationErrorsInterface>({});
	const [isSubmitted, setIsSubmitted] = useState(false);
	const router = useRouter();

	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const validateForm = (): boolean => {
		const newErrors: RegistrationErrorsInterface = {};

		Object.entries(formData).forEach(([field, value]) => {
			const error = validateFieldRegistration(field, value);
			if (error) {
				newErrors[field as keyof RegistrationErrorsInterface] = error;
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (
		e:
			| React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
			| React.ChangeEvent<{ name?: string; value: unknown }>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name!]: value }));

		if (isSubmitted) {
			const errorMessage = validateFieldRegistration(
				name as string,
				value as string
			);
			setErrors((prev) => ({
				...prev,
				[name!]: errorMessage,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSuccessMessage(null);
		setErrorMessage(null);
		setIsSubmitted(true);

		const isValid = validateForm();
		if (!isValid) {
			return;
		}

		const submitData: Record<string, string> = {
			name: formData.name,
			email: formData.email,
			password: formData.password,
		};

		try {
			await axiosInstance.post("/api/auth/register", submitData);
			setSuccessMessage("Account created successfully. Please log in.");
			router.push("/login");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 409) {
					setErrorMessage("user_already_exists");
				} else {
					setErrorMessage(
						error.response?.data?.message || "unable_to_create_account"
					);
				}
			} else {
				setErrorMessage("unable_to_create_account");
			}
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
			{/* <Image
				src={OfficeLogLogo}
				alt="Office Log Logo"
				style={{ maxWidth: "150px", height: "auto" }}
			/> */}
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
					Registration
				</Typography>

				<form onSubmit={handleSubmit} noValidate>
					<TextField
						label="Full name"
						name="name"
						value={formData.name}
						onChange={handleChange}
						fullWidth
						sx={{ marginBottom: 2 }}
						required
						error={Boolean(errors.name)}
						helperText={errors.name}
						size="medium"
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<PersonOutline />
									</InputAdornment>
								),
							},
						}}
					/>

					<TextField
						label="Email"
						name="email"
						type="email"
						value={formData.email}
						onChange={handleChange}
						fullWidth
						sx={{ marginBottom: 2 }}
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
						type="submit"
						variant="contained"
						color="primary"
						fullWidth
						sx={{ mt: 2 }}
						disabled={Object.values(errors).some((error) => Boolean(error))}
					>
						Create Account
					</Button>
				</form>

				{successMessage && (
					<Alert severity="success" sx={{ mt: 1 }}>
						{successMessage}
					</Alert>
				)}
				{errorMessage && (
					<Alert severity="error" sx={{ mt: 1 }}>
						{errorMessage}
					</Alert>
				)}

				<Typography variant="body2" sx={{ mt: 2 }}>
					Already have an account?{" "}
					<Link
						href="/login"
						style={{
							color: theme.palette.primary.main,
							textDecoration: "underline",
							fontWeight: "bold",
						}}
					>
						{" "}
						Login
					</Link>
				</Typography>
			</Box>
		</Box>
	);
};

export default Registration;
