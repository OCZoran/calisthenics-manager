import JournalClient from "@/features/journal/components/JournalClient";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dnevnik | Fitness App",
	description: "Vaš lični trening dnevnik",
};

export default function JournalPage() {
	return <JournalClient />;
}
