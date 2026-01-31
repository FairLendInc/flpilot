import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingCard } from "./OnboardingCard";

export type PersonaOption = {
	id: "investor" | "broker" | "lawyer";
	title: string;
	description: string;
};

type PersonaSelectorProps = {
	options: PersonaOption[];
	onSelect: (persona: PersonaOption["id"]) => Promise<void>;
	pending: string | null;
};

export function PersonaSelector({
	options,
	onSelect,
	pending,
}: PersonaSelectorProps) {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			{options.map((persona) => (
				<OnboardingCard className="group border-dashed" key={persona.id}>
					<CardHeader>
						<CardTitle>{persona.title}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground text-sm">
							{persona.description}
						</p>
						<Button
							disabled={Boolean(pending) && pending !== persona.id}
							onClick={() => onSelect(persona.id)}
							variant="secondary"
						>
							{pending === persona.id ? "Selecting..." : "Select"}
						</Button>
					</CardContent>
				</OnboardingCard>
			))}
		</div>
	);
}
