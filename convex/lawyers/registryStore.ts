import registryData from "./lsoRegistry.json";

export type LawyerRegistryRecord = {
	lsoNumber: string;
	firstName: string;
	lastName: string;
	firmName?: string;
	jurisdiction?: string;
	status?: string;
};

export type LawyerRegistryStore = {
	findByLsoNumber: (lsoNumber: string) => Promise<LawyerRegistryRecord | null>;
};

class LocalJsonLawyerRegistryStore implements LawyerRegistryStore {
	private readonly records: LawyerRegistryRecord[];

	constructor(records: LawyerRegistryRecord[]) {
		this.records = records;
	}

	async findByLsoNumber(lsoNumber: string) {
		const normalized = lsoNumber.trim().toLowerCase();
		return (
			this.records.find(
				(record) => record.lsoNumber.trim().toLowerCase() === normalized
			) ?? null
		);
	}
}

let registryStore: LawyerRegistryStore | null = null;

export function getLawyerRegistryStore(): LawyerRegistryStore {
	if (!registryStore) {
		registryStore = new LocalJsonLawyerRegistryStore(
			registryData as LawyerRegistryRecord[]
		);
	}
	return registryStore;
}

export function resetLawyerRegistryStore() {
	registryStore = null;
}

export function normalizeRegistryRecord(
	record: LawyerRegistryRecord
): LawyerRegistryRecord {
	return {
		...record,
		lsoNumber: record.lsoNumber.trim(),
		firstName: record.firstName.trim(),
		lastName: record.lastName.trim(),
	};
}
