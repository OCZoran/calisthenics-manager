import StatusClient from "@/features/status/components/StatusClient";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Status | Fitness App",
	description: "Pratite svoj napredak u performansama",
};

export default function StatusPage() {
	return <StatusClient />;
}
