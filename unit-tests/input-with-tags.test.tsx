import {
	render,
	screen,
	waitForElementToBeRemoved,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InputWithTags } from "@/components/ui/input-with-tags";

describe("InputWithTags", () => {
	it("clears internal tags when value becomes undefined", async () => {
		const { rerender } = render(<InputWithTags value={["Alpha"]} />);

		expect(screen.getByText("Alpha")).toBeInTheDocument();

		rerender(<InputWithTags />);

		await waitForElementToBeRemoved(() => screen.queryByText("Alpha"));
	});
});
