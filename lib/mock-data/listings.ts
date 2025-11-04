/**
 * Mock data generators for listing detail pages
 * Provides procedurally generated test data without database dependencies
 */

export type MockListing = {
	_id: string;
	_creationTime: number;
	title: string;
	address: {
		street: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	};
	location: {
		lat: number;
		lng: number;
	};
	investorBrief?: string;
	images: Array<{
		url: string;
		alt?: string;
		order: number;
	}>;
	financials: {
		purchasePrice: number;
		currentValue: number;
		monthlyPayment: number;
		interestRate: number;
		loanTerm: number; // months
		maturityDate: string; // ISO date
		principalLoanAmount: number;
		priorEncumbrance?: {
			amount: number;
			lender: string;
		} | null;
		mortgageType?: string;
		propertyType?: string;
	};
	appraisal?: {
		value: number;
		date: string;
		appraiser: string;
		method: "comparative" | "income" | "cost";
	};
	documents: MockDocument[];
	status: "active" | "funded" | "closed";
	viewCount?: number;
	createdAt: string;
	updatedAt: string;
};

export type MockPayment = {
	_id: string;
	_creationTime: number;
	listingId: string;
	amount: number;
	date: string; // ISO date
	status: "paid" | "pending" | "late";
	type: "principal" | "interest" | "escrow";
};

export type AppraisalComparable = {
	_id: string;
	address: {
		street: string;
		city: string;
		state: string;
		zip: string;
	};
	saleAmount: number;
	saleDate: string; // ISO date
	distance: number; // in miles
	squareFeet?: number;
	bedrooms?: number;
	bathrooms?: number;
	propertyType?: string;
	imageUrl: string; // Placeholder image
};

export type MockDocument = {
	_id: string;
	name: string;
	type: "appraisal" | "title" | "inspection" | "loan";
	url: string;
	uploadDate: string; // ISO date
	fileSize?: number; // in bytes
};

// Seed data for consistent generation
const PROPERTY_TITLES = [
	"Luxury Oceanfront Villa",
	"Modern Downtown Loft",
	"Historic Victorian Mansion",
	"Beachside Bungalow",
	"Mountain View Estate",
	"Urban Penthouse Suite",
	"Coastal Retreat Home",
	"Suburban Family Residence",
	"Lakefront Cabin",
	"Contemporary City Apartment",
];

const CITIES = [
	// Toronto and surrounding areas
	{ name: "Downtown Toronto", state: "ON", lat: 43.6532, lng: -79.3832 },
	{ name: "North York", state: "ON", lat: 43.7615, lng: -79.4111 },
	{ name: "Scarborough", state: "ON", lat: 43.7731, lng: -79.2578 },
	{ name: "Etobicoke", state: "ON", lat: 43.6205, lng: -79.5132 },
	{ name: "Mississauga", state: "ON", lat: 43.589, lng: -79.6441 },
	{ name: "Markham", state: "ON", lat: 43.8561, lng: -79.337 },
	{ name: "Vaughan", state: "ON", lat: 43.8361, lng: -79.4983 },
	{ name: "Richmond Hill", state: "ON", lat: 43.8828, lng: -79.4403 },
	{ name: "Oakville", state: "ON", lat: 43.4675, lng: -79.6877 },
	{ name: "Burlington", state: "ON", lat: 43.3255, lng: -79.799 },
];

const STREETS = [
	"Yonge Street",
	"Bay Street",
	"King Street",
	"Queen Street",
	"Bloor Street",
	"Dundas Street",
	"College Street",
	"Spadina Avenue",
	"Avenue Road",
	"St. Clair Avenue",
];

const APPRAISER_NAMES = [
	"Smith & Associates Appraisals",
	"Premier Property Valuations",
	"Accurate Home Appraisers",
	"Coastal Property Assessment",
	"Metropolitan Valuation Group",
];

const INVESTOR_BRIEFS = [
	"Prime investment opportunity in a high-growth area. Property features excellent rental potential with strong historical appreciation rates. Located in a desirable neighborhood with proximity to schools, shopping, and transportation.",
	"Exceptional property with recent upgrades and modern amenities. Strong cash flow potential with established tenant base. Well-maintained building in an area experiencing significant development and infrastructure improvements.",
	"Strategically located in an emerging market with robust economic fundamentals. Property offers value-add opportunities through selective renovations. Excellent long-term hold for portfolio diversification.",
	"Premium location with consistent demand and limited supply. Property benefits from strong local employment growth and demographic trends. Ideal for investors seeking stable returns in a competitive market.",
];

const PROPERTY_TYPES = [
	"Residential - Single Family",
	"Residential - Condo",
	"Residential - Townhouse",
	"Residential - Multi-Family",
	"Commercial - Office",
	"Commercial - Retail",
	"Mixed-Use",
];

const MORTGAGE_TYPES = ["1st Position", "2nd Position", "3rd Position"];

const LENDERS = [
	"First National Bank",
	"Maple Leaf Financial",
	"Royal Trust Lending",
	"Scotia Capital",
	"TD Securities",
	"BMO Capital",
];

// Seeded random number generator for consistent results
function seededRandom(seed: string): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash &= hash;
	}
	const x = Math.sin(hash) * 10000;
	return x - Math.floor(x);
}

function randomChoice<T>(arr: T[], seed: string): T {
	const index = Math.floor(seededRandom(seed) * arr.length);
	return arr[index];
}

function randomInt(min: number, max: number, seed: string): number {
	return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

function randomFloat(
	min: number,
	max: number,
	seed: string,
	decimals = 2
): number {
	const value = seededRandom(seed) * (max - min) + min;
	return Number(value.toFixed(decimals));
}

/**
 * Generate a mock listing based on ID
 * Uses ID as seed for consistent generation
 */
export function generateListing(id: string): MockListing {
	const cityData = randomChoice(CITIES, id);
	const streetNumber = randomInt(100, 9999, `${id}-street`);
	const streetName = randomChoice(STREETS, `${id}-name`);
	const purchasePrice = randomInt(500000, 5000000, `${id}-purchase`);
	const appreciationRate = randomFloat(0.95, 1.15, `${id}-appreciation`);
	const currentValue = Math.round(purchasePrice * appreciationRate);
	const loanTermMonths = randomChoice([180, 240, 300, 360], `${id}-term`);
	const interestRate = randomFloat(4.5, 8.5, `${id}-rate`);
	const hasAppraisal = seededRandom(`${id}-appraisal`) > 0.3; // 70% have appraisal

	// Calculate principal loan amount (typically 70-85% of purchase price for LTV)
	const ltvRatio = randomFloat(0.7, 0.85, `${id}-ltv`);
	const principalLoanAmount = Math.round(purchasePrice * ltvRatio);

	// Determine mortgage type and property type
	const mortgageType = randomChoice(MORTGAGE_TYPES, `${id}-mortgage`);
	const propertyType = randomChoice(PROPERTY_TYPES, `${id}-proptype`);

	// 30% chance of having prior encumbrance (only for 2nd/3rd position mortgages)
	const hasPriorEncumbrance =
		mortgageType !== "1st Position" && seededRandom(`${id}-encumbrance`) > 0.7;

	let priorEncumbrance: { amount: number; lender: string } | null = null;
	if (hasPriorEncumbrance) {
		// Prior encumbrance should be less than the principal loan amount
		const priorAmount = Math.round(
			principalLoanAmount * randomFloat(0.4, 0.7, `${id}-prioramount`)
		);
		priorEncumbrance = {
			amount: priorAmount,
			lender: randomChoice(LENDERS, `${id}-lender`),
		};
	}

	// Calculate monthly payment using mortgage formula
	const monthlyRate = interestRate / 100 / 12;
	const monthlyPayment = Math.round(
		(principalLoanAmount * monthlyRate * (1 + monthlyRate) ** loanTermMonths) /
			((1 + monthlyRate) ** loanTermMonths - 1)
	);

	// Generate 3-7 images
	const imageCount = randomInt(3, 7, `${id}-imgcount`);
	const images = Array.from({ length: imageCount }, (_, i) => ({
		url: `https://picsum.photos/seed/${id}-${i}/800/600`,
		alt: `Property view ${i + 1}`,
		order: i,
	}));

	// Maturity date is loanTermMonths from now
	const maturityDate = new Date();
	maturityDate.setMonth(maturityDate.getMonth() + loanTermMonths);

	const listing: MockListing = {
		_id: id,
		_creationTime:
			Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000, `${id}-created`),
		title: randomChoice(PROPERTY_TITLES, id),
		address: {
			street: `${streetNumber} ${streetName}`,
			city: cityData.name,
			state: cityData.state,
			zip: `M${randomInt(1, 9, `${id}-zip1`)}${String.fromCharCode(65 + randomInt(0, 25, `${id}-zip2`))} ${randomInt(1, 9, `${id}-zip3`)}${String.fromCharCode(65 + randomInt(0, 25, `${id}-zip4`))}${randomInt(0, 9, `${id}-zip5`)}`,
			country: "Canada",
		},
		location: {
			// Add slight random offset to base coordinates
			lat: cityData.lat + randomFloat(-0.05, 0.05, `${id}-lat`, 4),
			lng: cityData.lng + randomFloat(-0.05, 0.05, `${id}-lng`, 4),
		},
		investorBrief: randomChoice(INVESTOR_BRIEFS, `${id}-brief`),
		images,
		financials: {
			purchasePrice,
			currentValue,
			monthlyPayment,
			interestRate,
			loanTerm: loanTermMonths,
			maturityDate: maturityDate.toISOString(),
			principalLoanAmount,
			priorEncumbrance,
			mortgageType,
			propertyType,
		},
		documents: [], // Will be populated below
		status: randomChoice(
			["active", "active", "funded", "closed"] as const,
			`${id}-status`
		), // More likely to be active
		viewCount: randomInt(0, 500, `${id}-views`),
		createdAt: new Date(
			Date.now() - randomInt(0, 365 * 24 * 60 * 60 * 1000, `${id}-created2`)
		).toISOString(),
		updatedAt: new Date().toISOString(),
	};

	// Add appraisal if applicable
	if (hasAppraisal) {
		const appraisalDate = new Date();
		appraisalDate.setMonth(
			appraisalDate.getMonth() - randomInt(1, 12, `${id}-appraisaldate`)
		);

		listing.appraisal = {
			value: Math.round(
				purchasePrice * randomFloat(0.98, 1.12, `${id}-appraisalval`)
			),
			date: appraisalDate.toISOString(),
			appraiser: randomChoice(APPRAISER_NAMES, `${id}-appraiser`),
			method: randomChoice(
				["comparative", "income", "cost"] as const,
				`${id}-method`
			),
		};
	}

	// Generate documents (3-5 standard real estate documents)
	const documentTypes: Array<"appraisal" | "title" | "inspection" | "loan"> = [
		"appraisal",
		"title",
		"inspection",
		"loan",
	];
	const documentNames = {
		appraisal: "Property Appraisal Report",
		title: "Title Report & Insurance",
		inspection: "Property Inspection Report",
		loan: "Loan Agreement Documents",
	};

	const documentCount = randomInt(3, 5, `${id}-doccount`);
	const selectedTypes = documentTypes
		.sort(() => seededRandom(`${id}-docsort`) - 0.5)
		.slice(0, documentCount);

	listing.documents = selectedTypes.map((type, index) => {
		const uploadDate = new Date();
		uploadDate.setDate(
			uploadDate.getDate() - randomInt(1, 180, `${id}-docdate-${index}`)
		);

		// TODO: In production, store file IDs in database and fetch signed URLs via ctx.storage.getUrl()
		// For now, use a test PDF URL that works with Adobe PDF Embed API
		// Note: Adobe PDF Embed API requires CORS-enabled URLs
		const pdfUrl =
			"https://documentservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf";

		return {
			_id: `doc_${id}_${type}_${index}`,
			name: documentNames[type],
			type,
			url: pdfUrl,
			uploadDate: uploadDate.toISOString(),
			fileSize: randomInt(500000, 5000000, `${id}-docsize-${index}`), // 500KB to 5MB
		};
	});

	return listing;
}

/**
 * Generate mock payment history for a listing
 * Creates a realistic payment timeline
 */
export function generatePayments(listingId: string, count = 12): MockPayment[] {
	const payments: MockPayment[] = [];
	const now = new Date();

	for (let i = 0; i < count; i += 1) {
		const paymentDate = new Date(now);
		paymentDate.setMonth(paymentDate.getMonth() - i);

		// Determine status (most are paid, some pending, few late)
		const statusRand = seededRandom(`${listingId}-status-${i}`);
		let status: "paid" | "pending" | "late";
		if (statusRand < 0.8) {
			status = "paid";
		} else if (statusRand < 0.95) {
			status = "pending";
		} else {
			status = "late";
		}

		// Payment types cycle through principal, interest, escrow
		const typeOptions: Array<"principal" | "interest" | "escrow"> = [
			"principal",
			"interest",
			"escrow",
		];
		const type = typeOptions[i % 3];

		// Amount varies by type
		let amount: number;
		if (type === "principal") {
			amount = randomInt(8000, 15000, `${listingId}-amt-${i}`);
		} else if (type === "interest") {
			amount = randomInt(3000, 8000, `${listingId}-amt-${i}`);
		} else {
			amount = randomInt(500, 2000, `${listingId}-amt-${i}`);
		}

		payments.push({
			_id: `payment_${listingId}_${i}`,
			_creationTime: paymentDate.getTime(),
			listingId,
			amount,
			date: paymentDate.toISOString(),
			status,
			type,
		});
	}

	return payments;
}

/**
 * Generate appraisal comparable properties based on a reference listing
 * Returns MLS data for properties used as comparables in the appraisal
 */
export function generateComparables(
	referenceId: string,
	limit = 6
): AppraisalComparable[] {
	const reference = generateListing(referenceId);
	const comparables: AppraisalComparable[] = [];

	// Generate comparable sales with sequential IDs
	for (let i = 1; i <= limit; i += 1) {
		const compId = `comp_${referenceId}_${i}`;

		// Generate address nearby
		const streetNumber = randomInt(100, 9999, `${compId}-street`);
		const streetName = randomChoice(STREETS, `${compId}-name`);

		// Sale price should be within 20% of reference current value
		const priceVariation = randomFloat(0.85, 1.15, `${compId}-pricevar`);
		const saleAmount = Math.round(
			reference.financials.currentValue * priceVariation
		);

		// Sale date should be within last 6 months (typical for appraisals)
		const monthsAgo = randomInt(1, 6, `${compId}-months`);
		const saleDate = new Date();
		saleDate.setMonth(saleDate.getMonth() - monthsAgo);

		// Generate location nearby (within ~5 miles)
		const latOffset = randomFloat(-0.05, 0.05, `${compId}-lat2`, 4);
		const lngOffset = randomFloat(-0.05, 0.05, `${compId}-lng2`, 4);

		// Calculate distance in miles
		const distance = Number(
			(Math.sqrt(latOffset * latOffset + lngOffset * lngOffset) * 69).toFixed(1)
		);

		// Property details
		const squareFeet = randomInt(1500, 4500, `${compId}-sqft`);
		const bedrooms = randomInt(2, 5, `${compId}-beds`);
		const bathrooms = randomInt(2, 4, `${compId}-baths`);
		const propertyType = randomChoice(PROPERTY_TYPES, `${compId}-type`);

		comparables.push({
			_id: compId,
			address: {
				street: `${streetNumber} ${streetName}`,
				city: reference.address.city,
				state: reference.address.state,
				zip: `M${randomInt(1, 9, `${compId}-zip1`)}${String.fromCharCode(65 + randomInt(0, 25, `${compId}-zip2`))} ${randomInt(1, 9, `${compId}-zip3`)}${String.fromCharCode(65 + randomInt(0, 25, `${compId}-zip4`))}${randomInt(0, 9, `${compId}-zip5`)}`,
			},
			saleAmount,
			saleDate: saleDate.toISOString(),
			distance,
			squareFeet,
			bedrooms,
			bathrooms,
			propertyType,
			imageUrl: `https://picsum.photos/seed/${compId}/800/600`,
		});
	}

	// Sort by distance (closest first)
	return comparables.sort((a, b) => a.distance - b.distance);
}
