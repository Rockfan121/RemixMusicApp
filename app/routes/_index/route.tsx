import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { type MetaFunction, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { title } from "@/config.shared";

export const meta: MetaFunction = () => {
	return [{ title: title() }];
};

export default function Index() {
	const navigate = useNavigate();

	function search(formData: FormData) {
		const query = formData.get("query");
		navigate(`/exploring/${query}`);
	}

	return (
		<main className="flex h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-8 text-xl">
				<h1>Welcome to</h1>
				<h1 className="shadow-3xl shadow-primary bg-primary/81 rounded-md text-3xl font-bold">
					RemixMusicApp!
				</h1>

				<search>
					<form action={search}>
						<div className="flex mx-6 mb-10 max-w-sm items-center space-x-1">
							<Input
								id="query"
								name="query"
								placeholder="Search tracks, playlists or users"
								type="text"
								pattern="\w+"
								className="h-11 w-sm bg-accent"
							/>
							<Button type="submit" size="icon-lg">
								<PaperPlaneIcon />
							</Button>
						</div>
					</form>
				</search>
			</div>
		</main>
	);
}
