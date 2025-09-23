import { parseISO, format, isToday, isYesterday } from "date-fns";

export const formatDate = (dateString: string): string => {
	try {
		const date = parseISO(dateString);

		if (isToday(date)) return "Today";
		if (isYesterday(date)) return "Yesterday";

		return format(date, "dd.MM.yyyy"); // Engleski, samo numerički format
	} catch {
		return dateString; // Ako nije validan datum, vrati originalni string
	}
};

// export const formatDate = (dateString: string): string => {
// 	try {
// 		return format(parseISO(dateString), "dd.MM.yyyy");
// 	} catch {
// 		return dateString;
// 	}
// };
