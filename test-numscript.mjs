import { SDK } from "@formance/formance-sdk";

const SERVER_URL = "https://aeqjzpikyllz-nkeg.eu.sandbox.formance.cloud";
const CLIENT_ID = "58117e46-ef2d-48c5-a3a9-424362ae367f";
const CLIENT_SECRET = "ec50454f-f001-4060-80cc-7368b941541e";
const TOKEN_URL = `${SERVER_URL}/api/auth/oauth/token`;

const sdk = new SDK({
	serverURL: SERVER_URL,
	security: {
		clientID: CLIENT_ID,
		clientSecret: CLIENT_SECRET,
		tokenURL: TOKEN_URL,
	},
});

async function testScript(name, scriptPlain, vars) {
	console.log(`\n--- Testing ${name} ---`);
	try {
		const result = await sdk.ledger.v2.createTransaction({
			ledger: "default",
			dryRun: true,
			v2PostTransaction: {
				script: {
					plain: scriptPlain,
					vars,
				},
				metadata: {},
			},
		});
		console.log(
			"Success! Result:",
			JSON.stringify(
				result,
				(_k, v) => (typeof v === "bigint" ? v.toString() : v),
				2
			)
		);
	} catch (error) {
		if (error.data$?.errorCode) {
			console.log("Error Code:", error.data$.errorCode);
			console.log("Error Message:", error.data$.errorMessage);
		} else {
			console.log("Error:", error.message);
		}
	}
}

async function run() {
	// Valid Test
	await testScript(
		"Valid CAD 10000",
		`
vars {
  monetary $amt
}
send $amt (
  source = @world
  destination = @test:account
)`,
		{ amt: "CAD 10000" }
	);
}

run();
