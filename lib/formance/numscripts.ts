/**
 * Base Numscript templates for the Ledger Demo
 */

export type NumscriptVariable = {
	name: string;
	type: string;
	example?: string;
};

export type NumscriptTemplate = {
	id: string;
	name: string;
	description: string;
	script: string;
	variables: NumscriptVariable[];
};

export const NUMSCRIPT_TEMPLATES: NumscriptTemplate[] = [
	{
		id: "simple-transfer",
		name: "Simple Transfer",
		description: "Move funds from one account to another.",
		script: `vars {
  account $source
  account $destination
  monetary $amount
}

send $amount (
  source = $source
  destination = $destination
)`,
		variables: [
			{ name: "source", type: "account", example: "world" },
			{ name: "destination", type: "account", example: "users:123" },
			{ name: "amount", type: "monetary", example: "USD/2 10000" },
		],
	},
	{
		id: "multi-destination",
		name: "Multi-Destination",
		description: "Split an amount across multiple destinations.",
		script: `vars {
  account $source
  account $dest1
  account $dest2
  monetary $amount
}

send $amount (
  source = $source
  destination = {
    50% to $dest1
    remaining to $dest2
  }
)`,
		variables: [
			{ name: "source", type: "account", example: "world" },
			{ name: "dest1", type: "account", example: "users:1" },
			{ name: "dest2", type: "account", example: "users:2" },
			{ name: "amount", type: "monetary", example: "USD/2 5000" },
		],
	},
	{
		id: "metadata-routing",
		name: "Metadata Routing",
		description: "Send funds based on account metadata (simulated).",
		script: `vars {
  account $source
  account $destination
  monetary $amount
}

// In true Formance, metadata can be used for complex routing
send $amount (
  source = $source
  destination = $destination
)`,
		variables: [
			{ name: "source", type: "account", example: "world" },
			{ name: "destination", type: "account", example: "merchant:99" },
			{ name: "amount", type: "monetary", example: "EUR/2 2500" },
		],
	},
];
