import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RowsIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";

export function PlaylistScrollArea({
	children,
	title,
	link,
}: {
	children: Array<string>;
	title: string;
	link: string;
}) {
	return (
		<div className="aside-container w-full rounded-md border bg-card">
			<h4 className="m-3 mb-1 text-lg font-semibold leading-none text-ring">
				<Link to={link}>{title}</Link>
			</h4>
			<ScrollArea className="scroll-container w-full">
				<div className="p-2.5">
					{children.map((tag) => (
						<span key={tag}>
							<div className="text-sm/4 py-2 hover:bg-accent">
								<span className="inline-block w-64 pl-2 truncate font-semibold text-foreground">
									<RowsIcon className="inline" />{" "}
									{` ${tag}-abcdefghijkabcdefghijkabcdefghijkabcdefghijk`}
								</span>
								<br />
								<span className="inline-block w-64 pl-7 truncate text-muted-foreground">
									username
								</span>
							</div>
							<Separator />
						</span>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
