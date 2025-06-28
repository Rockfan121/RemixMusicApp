import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Component for displaying info for nonexistent or empty playlist
 * @param isDeleted - status of the playlist - true if deleted, false if just empty
 */
export default function TableReplacement({
	isDeleted,
}: {
	isDeleted: boolean;
}) {
	return (
		<Alert className="mx-10 w-auto">
			<InfoCircledIcon className="h-4 w-4" />
			<AlertDescription className="p-1 font-semibold">
				{isDeleted ? "This playlist doesn't exist" : "This playlist is empty"}
			</AlertDescription>
		</Alert>
	);
}
