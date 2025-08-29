import axios from "axios";

const apiBaseUrl =
	typeof window !== "undefined"
		? window.location.origin
		: "http://localhost:3000";

const axiosInstance = axios.create({
	baseURL: apiBaseUrl,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});
axiosInstance.interceptors.request.use(
	function (config) {
		const apiKey = process.env.API_KEY;
		if (apiKey) {
			config.headers["x-api-key"] = apiKey;
		}
		return config;
	},
	function (error) {
		return Promise.reject(error);
	}
);

export default axiosInstance;
