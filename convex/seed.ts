/**
 * Seed script for populating database with test data
 * Generates realistic mortgage marketplace data
 *
 * To run: npx convex run seed:populateDatabase
 */

import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Constants from mock data
const CITIES = [
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

const PROPERTY_TYPES = [
	"Residential - Single Family",
	"Residential - Condo",
	"Residential - Townhouse",
	"Residential - Multi-Family",
];

const FIRST_NAMES = [
	"John", "Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Lisa",
	"James", "Jessica", "William", "Ashley", "Richard", "Amanda", "Joseph", "Melissa",
	"Thomas", "Nicole", "Christopher", "Stephanie", "Daniel", "Rebecca", "Matthew", "Laura",
	"Anthony", "Elizabeth", "Mark", "Michelle", "Donald", "Kimberly"
];

const LAST_NAMES = [
	"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
	"Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
	"Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
	"Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
];

// Seeded random number generator
function seededRandom(seed: string): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = ((hash << 5) - hash) + seed.charCodeAt(i);
		hash = hash & hash;
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

function randomFloat(min: number, max: number, seed: string, decimals = 2): number {
	const value = seededRandom(seed) * (max - min) + min;
	return Number(value.toFixed(decimals));
}

function generatePostalCode(seed: string): string {
	return `M${randomInt(1, 9, `${seed}-zip1`)}${String.fromCharCode(65 + randomInt(0, 25, `${seed}-zip2`))} ${randomInt(1, 9, `${seed}-zip3`)}${String.fromCharCode(65 + randomInt(0, 25, `${seed}-zip4`))}${randomInt(0, 9, `${seed}-zip5`)}`;
}

/**
 * Main seed function - populates entire database
 */
export const populateDatabase = mutation({
	args: {},
	handler: async (ctx) => {
		// Storage ID for all property images
		const PROPERTY_IMAGE_STORAGE_ID = "kg25zy583vde1xsem8q17sjf6x7szpf6";

		console.log("🌱 Starting database seed...");

		// Step 1: Create borrowers (25 borrowers)
		console.log("Creating borrowers...");
		const borrowerIds: Id<"borrowers">[] = [];
		for (let i = 0; i < 25; i++) {
			const firstName = randomChoice(FIRST_NAMES, `borrower-${i}-first`);
			const lastName = randomChoice(LAST_NAMES, `borrower-${i}-last`);
			const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
			const rotessaCustomerId = `ROTESSA_${String(10000 + i).padStart(6, '0')}`;

			const borrowerId = await ctx.db.insert("borrowers", {
				name: `${firstName} ${lastName}`,
				email,
				rotessaCustomerId,
			});

			borrowerIds.push(borrowerId);
		}
		console.log(`✅ Created ${borrowerIds.length} borrowers`);

		// Step 2: Create mortgages (60 mortgages)
		console.log("Creating mortgages...");
		const mortgageIds: Id<"mortgages">[] = [];
		for (let i = 0; i < 60; i++) {
			const borrowerId = randomChoice(borrowerIds, `mortgage-${i}-borrower`);
			const cityData = randomChoice(CITIES, `mortgage-${i}-city`);
			const streetNumber = randomInt(100, 9999, `mortgage-${i}-street`);
			const streetName = randomChoice(STREETS, `mortgage-${i}-name`);
			const propertyType = randomChoice(PROPERTY_TYPES, `mortgage-${i}-type`);

			// Financial details
			const loanAmount = randomInt(300000, 2000000, `mortgage-${i}-loan`);
			const interestRate = randomFloat(4.5, 8.5, `mortgage-${i}-rate`);

			// Dates
			const originationDate = new Date();
			originationDate.setMonth(originationDate.getMonth() - randomInt(1, 36, `mortgage-${i}-orig`));

			const maturityDate = new Date(originationDate);
			maturityDate.setMonth(maturityDate.getMonth() + randomChoice([12, 24, 36, 60], `mortgage-${i}-term`));

			// Property images (1-3 images all using same storage ID)
			const imageCount = randomInt(1, 3, `mortgage-${i}-imgcount`);
			const images = Array.from({ length: imageCount }, (_, imgIdx) => ({
				storageId: PROPERTY_IMAGE_STORAGE_ID,
				alt: `Property view ${imgIdx + 1}`,
				order: imgIdx,
			}));

			// Status distribution (mostly active)
			const statusRand = seededRandom(`mortgage-${i}-status`);
			let status: "active" | "renewed" | "closed" | "defaulted";
			if (statusRand < 0.75) status = "active";
			else if (statusRand < 0.90) status = "renewed";
			else if (statusRand < 0.97) status = "closed";
			else status = "defaulted";

			// Mortgage type distribution (70% first, 20% second, 10% other)
			const typeRand = seededRandom(`mortgage-${i}-type`);
			let mortgageType: "1st" | "2nd" | "other";
			if (typeRand < 0.70) mortgageType = "1st";
			else if (typeRand < 0.90) mortgageType = "2nd";
			else mortgageType = "other";

			// Appraisal data - ensure LTV is always < 80%
			// To get LTV < 80%, appraisal value must be > loanAmount / 0.8 = 1.25x loan amount
			// Set range to 1.3x - 1.8x to ensure LTV is 55%-77%
			const appraisalMarketValue = Math.round(loanAmount * randomFloat(1.30, 1.80, `mortgage-${i}-value`));
			const ltv = Number(((loanAmount / appraisalMarketValue) * 100).toFixed(1));

			const appraisalMethods = [
				"Full Interior & Exterior Appraisal",
				"Desktop Appraisal",
				"Hybrid Appraisal",
				"Automated Valuation Model (AVM)",
			];
			const appraisalMethod = randomChoice(appraisalMethods, `mortgage-${i}-method`);

			const appraisalCompanies = [
				"Canada Appraisal Services",
				"Royal LePage Appraisal Services",
				"First Canadian Appraisal Corp",
				"Marsh Appraisal & Consulting",
				"Apex Real Estate Appraisal",
				"Property Valuation Group",
			];
			const appraisalCompany = randomChoice(appraisalCompanies, `mortgage-${i}-company`);

			const appraisalDate = new Date(originationDate);
			appraisalDate.setDate(appraisalDate.getDate() - randomInt(1, 180, `mortgage-${i}-appdate`));
			const appraisalDateISO = appraisalDate.toISOString();

			const mortgageId = await ctx.db.insert("mortgages", {
				borrowerId,
				loanAmount,
				interestRate,
				originationDate: originationDate.toISOString(),
				maturityDate: maturityDate.toISOString(),
				status,
				mortgageType,
				address: {
					street: `${streetNumber} ${streetName}`,
					city: cityData.name,
					state: cityData.state,
					zip: generatePostalCode(`mortgage-${i}`),
					country: "Canada",
				},
				location: {
					lat: cityData.lat + randomFloat(-0.05, 0.05, `mortgage-${i}-lat`, 4),
					lng: cityData.lng + randomFloat(-0.05, 0.05, `mortgage-${i}-lng`, 4),
				},
				propertyType,
				appraisalMarketValue,
				appraisalMethod,
				appraisalCompany,
				appraisalDate: appraisalDateISO,
				ltv,
				images,
				documents: [
					{
						name: "Mortgage Agreement.pdf",
						type: "appraisal",
						storageId: "kg222733sz1pg4gp3qpy9ca5fd7tneqg",
						uploadDate: originationDate.toISOString(),
						fileSize: 250000,
					},
				],
			});

			mortgageIds.push(mortgageId);
		}
		console.log(`✅ Created ${mortgageIds.length} mortgages`);

		// Step 3: Create ownership records
		console.log("Creating ownership records...");
		let ownershipCount = 0;
		for (let i = 0; i < mortgageIds.length; i++) {
			const mortgageId = mortgageIds[i];

			// 70% owned by FairLend, 30% owned by users
			const isFairlendOwned = seededRandom(`ownership-${i}`) < 0.7;

			if (isFairlendOwned) {
				// FairLend owns 100%
				await ctx.db.insert("mortgage_ownership", {
					mortgageId,
					ownerId: "fairlend",
					ownershipPercentage: 100,
				});
				ownershipCount++;
			} else {
				// Random user owns 100%
				// In a real system, ownerId would reference users table
				// For now, we'll use placeholder user IDs
				const userId = `user_${randomInt(1, 20, `ownership-${i}-user`)}`;
				await ctx.db.insert("mortgage_ownership", {
					mortgageId,
					ownerId: userId,
					ownershipPercentage: 100,
				});
				ownershipCount++;
			}
		}
		console.log(`✅ Created ${ownershipCount} ownership records`);

		// Step 4: Create listings (only for active mortgages)
		console.log("Creating listings...");
		const listingIds: Id<"listings">[] = [];
		for (let i = 0; i < mortgageIds.length; i++) {
			const mortgageId = mortgageIds[i];

			// Get mortgage to check status
			const mortgage = await ctx.db.get(mortgageId);
			if (!mortgage) continue;

			// Only create listings for active mortgages (about 75% of total)
			if (mortgage.status === "active") {
				// 90% visible, 10% not visible
				const visible = seededRandom(`listing-${i}-visible`) < 0.9;

				const listingId = await ctx.db.insert("listings", {
					mortgageId,
					visible,
					locked: false,
				});

				listingIds.push(listingId);
			}
		}
		console.log(`✅ Created ${listingIds.length} listings`);

		// Step 5: Create payment history
		console.log("Creating payment records...");
		let paymentCount = 0;
		for (let i = 0; i < mortgageIds.length; i++) {
			const mortgageId = mortgageIds[i];
			const mortgage = await ctx.db.get(mortgageId);
			if (!mortgage) continue;

			// Calculate monthly interest payment
			const monthlyInterestRate = mortgage.interestRate / 100 / 12;
			const monthlyInterestPayment = Math.round(mortgage.loanAmount * monthlyInterestRate);

			// Generate 6-12 months of payment history
			const paymentMonths = randomInt(6, 12, `payments-${i}-count`);

			for (let month = 0; month < paymentMonths; month++) {
				const processDate = new Date();
				processDate.setMonth(processDate.getMonth() - month);

				// Status distribution (mostly cleared)
				const statusRand = seededRandom(`payment-${i}-${month}-status`);
				let status: "pending" | "cleared" | "failed";
				if (statusRand < 0.85) status = "cleared";
				else if (statusRand < 0.97) status = "pending";
				else status = "failed";

				await ctx.db.insert("payments", {
					mortgageId,
					amount: monthlyInterestPayment,
					processDate: processDate.toISOString(),
					status,
					paymentId: `PAY_${i}_${month}_${Date.now()}`,
					customerId: mortgage.borrowerId,
					transactionScheduleId: `SCHEDULE_${i}`,
				});

				paymentCount++;
			}
		}
		console.log(`✅ Created ${paymentCount} payment records`);

		// Step 6: Create appraisal comparables
		console.log("Creating appraisal comparables...");
		let comparableCount = 0;
		// Generate comparables for first 30 mortgages (not all need comparables)
		for (let i = 0; i < Math.min(30, mortgageIds.length); i++) {
			const mortgageId = mortgageIds[i];
			const mortgage = await ctx.db.get(mortgageId);
			if (!mortgage) continue;

			// Generate 3-6 comparables per mortgage
			const compCount = randomInt(3, 6, `comp-${i}-count`);

			for (let j = 0; j < compCount; j++) {
				const compSeed = `comp-${i}-${j}`;

				// Sale date within last 6 months
				const saleDate = new Date();
				saleDate.setMonth(saleDate.getMonth() - randomInt(1, 6, `${compSeed}-months`));

				// Sale amount within 20% of mortgage loan amount
				const saleAmount = Math.round(
					mortgage.loanAmount * randomFloat(0.85, 1.15, `${compSeed}-price`)
				);

				// Generate nearby address
				const streetNumber = randomInt(100, 9999, `${compSeed}-street`);
				const streetName = randomChoice(STREETS, `${compSeed}-name`);

				// Distance calculation (0.1 to 5 miles)
				const latOffset = randomFloat(-0.05, 0.05, `${compSeed}-lat`, 4);
				const lngOffset = randomFloat(-0.05, 0.05, `${compSeed}-lng`, 4);
				const distance = Number(
					(Math.sqrt(latOffset * latOffset + lngOffset * lngOffset) * 69).toFixed(1)
				);

				await ctx.db.insert("appraisal_comparables", {
					mortgageId,
					address: {
						street: `${streetNumber} ${streetName}`,
						city: mortgage.address.city,
						state: mortgage.address.state,
						zip: generatePostalCode(`${compSeed}`),
					},
					saleAmount,
					saleDate: saleDate.toISOString(),
					distance,
					squareFeet: randomInt(1500, 4500, `${compSeed}-sqft`),
					bedrooms: randomInt(2, 5, `${compSeed}-beds`),
					bathrooms: randomInt(2, 4, `${compSeed}-baths`),
					propertyType: randomChoice(PROPERTY_TYPES, `${compSeed}-type`),
					imageStorageId: PROPERTY_IMAGE_STORAGE_ID,
				});

				comparableCount++;
			}
		}
		console.log(`✅ Created ${comparableCount} appraisal comparables`);

		// Summary
		console.log("\n🎉 Database seeding complete!");
		console.log("Summary:");
		console.log(`  - ${borrowerIds.length} borrowers`);
		console.log(`  - ${mortgageIds.length} mortgages`);
		console.log(`  - ${ownershipCount} ownership records`);
		console.log(`  - ${listingIds.length} listings`);
		console.log(`  - ${paymentCount} payments`);
		console.log(`  - ${comparableCount} appraisal comparables`);

		return {
			success: true,
			counts: {
				borrowers: borrowerIds.length,
				mortgages: mortgageIds.length,
				ownership: ownershipCount,
				listings: listingIds.length,
				payments: paymentCount,
				comparables: comparableCount,
			},
		};
	},
});

/**
 * Clear all data from database (use with caution!)
 */
export const clearDatabase = mutation({
	args: {},
	handler: async (ctx) => {
		console.log("🗑️  Clearing database...");

		// Delete in reverse dependency order
		const comparables = await ctx.db.query("appraisal_comparables").collect();
		for (const comp of comparables) {
			await ctx.db.delete(comp._id);
		}
		console.log(`Deleted ${comparables.length} comparables`);

		const payments = await ctx.db.query("payments").collect();
		for (const payment of payments) {
			await ctx.db.delete(payment._id);
		}
		console.log(`Deleted ${payments.length} payments`);

		const listings = await ctx.db.query("listings").collect();
		for (const listing of listings) {
			await ctx.db.delete(listing._id);
		}
		console.log(`Deleted ${listings.length} listings`);

		const ownership = await ctx.db.query("mortgage_ownership").collect();
		for (const own of ownership) {
			await ctx.db.delete(own._id);
		}
		console.log(`Deleted ${ownership.length} ownership records`);

		const mortgages = await ctx.db.query("mortgages").collect();
		for (const mortgage of mortgages) {
			await ctx.db.delete(mortgage._id);
		}
		console.log(`Deleted ${mortgages.length} mortgages`);

		const borrowers = await ctx.db.query("borrowers").collect();
		for (const borrower of borrowers) {
			await ctx.db.delete(borrower._id);
		}
		console.log(`Deleted ${borrowers.length} borrowers`);

		console.log("✅ Database cleared");

		return { success: true };
	},
});
