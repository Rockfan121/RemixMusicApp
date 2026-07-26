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
		<div className="grid">
			<div className="col-1 row-1 h-screen animate-home-bg bg-linear-to-tl from-primary/70 from-5% via-background via-50% to-primary/70 to-95%" />
			<main className="col-1 row-1 flex h-screen items-center justify-center z-30">
				<div className="flex flex-col items-center gap-3">
					<div className="flex flex-row gap-0.5">
						<h4>Welcome to</h4>
						<h1 className="shadow-2xl sm:shadow-3xl shadow-primary bg-primary/81 rounded-md text-2xl sm:text-3xl font-bold">
							RemixMusicApp!
						</h1>
					</div>

					<search>
						<form action={search}>
							<div className="flex py-6 max-w-2xs sm:max-w-xs md:max-w-sm items-center space-x-1">
								<Input
									id="query"
									name="query"
									placeholder="Search tracks, playlists or users"
									type="text"
									pattern="\w+"
									className="h-11 w-2xs sm:w-xs md:w-sm bg-accent"
								/>
								<Button type="submit" size="icon-lg">
									<PaperPlaneIcon />
								</Button>
							</div>
						</form>
					</search>
				</div>
			</main>
		</div>
	);
}
