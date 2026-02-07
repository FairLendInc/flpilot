import { describe, expect, test } from "vitest";
import { getBrokerOfRecord } from "../lib/broker";

describe("getBrokerOfRecord", () => {
	test("returns static broker details for pilot", () => {
		const broker = getBrokerOfRecord();
		expect(broker).toEqual({
			brokerId: undefined,
			brokerName: "FairLend Broker",
			brokerEmail: "connor@fairlend.ca",
		});
	});
});


