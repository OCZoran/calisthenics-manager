export const validateFieldRegistration = (
	name: string,
	value: string
): string | undefined => {
	switch (name) {
		case "name":
			return !value.trim() ? "Personal name is required" : undefined;
		case "email":
			if (!value) return "Work email is required";
			if (!/\S+@\S+\.\S+/.test(value)) return "Email is invalid";
			return undefined;
		case "password":
			if (!value) return "Password is required";
			if (value.length < 6) return "Password must be at least 6 characters";
			return undefined;

		default:
			return undefined;
	}
};
