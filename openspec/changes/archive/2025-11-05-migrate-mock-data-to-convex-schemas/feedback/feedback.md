@mortgages.ts (173-199) In convex/mortgages.ts around lines 173 to 199, the updateMortgageStatus mutation is missing a returns validator; add a returns validator (e.g., returns: v.id("mortgages")) to the mutation definition after the args block so the mutation's return value is validated as the mortgage id, and ensure the function still returns args.id.





@mortgages.ts (173-199) convex/mortgages.ts lines 56-69: the current query filters for maturityDate <= futureDateISO which includes already-matured mortgages; change the filter to select mortgages with maturityDate >= nowISO and <= futureDateISO (compute nowISO with new Date().toISOString() before the query) so only mortgages maturing between today and the future date are returned, and add a Convex returns validator to the query definition (e.g., returns: v.array(v.object({...})) or the appropriate mortgage schema) to validate the returned array of mortgage objects.


@convex/mortgages.ts lines 56-69: the current query filters for maturityDate <= futureDateISO which includes already-matured mortgages; change the filter to select mortgages with maturityDate >= nowISO and <= futureDateISO (compute nowISO with new Date().toISOString() before the query) so only mortgages maturing between today and the future date are returned, and add a Convex returns validator to the query definition (e.g., returns: v.array(v.object({...})) or the appropriate mortgage schema) to validate the returned array of mortgage objects.



In convex/mortgages.ts around lines 22 to 31, the query lacks a returns validator and uses .order("desc") without an explicit field; add a returns validator (for example returns: v.array(v.id("mortgages")) or an appropriate v.array(v.object(...)) shape) to the query options and make the ordering explicit by passing the field name (e.g., "_creationTime") along with the descending direction to .order so the sort key is clear.


In convex/mortgages.ts around lines 36 to 51, the query definition is missing a returns validator; add a returns property to the query options such as returns: v.array(v.any()) (or a more specific v.array(v.type({...})) matching your mortgage shape) so the query validates its returned array of mortgage objects — place the returns alongside args in the query(...) call and keep it consistent with the status arg validator.

In convex/mortgages.ts around lines 12 to 17, the getMortgage query is missing a returns validator; add a returns validator that matches what ctx.db.get returns (record or null) — for example add returns: v.nullable(v.id("mortgages")) to the query declaration so the query signature validates the returned mortgage or null.

In convex/mortgages.ts around lines 204 to 234, the addDocumentToMortgage mutation is missing a returns validator; add a returns property to the mutation declaration (returns: v.id("mortgages")) to match the returned value (args.mortgageId), ensuring the validator import is available and the mutation signature validates that the function returns a mortgages id.


In convex/mortgages.ts around lines 173 to 199, the updateMortgageStatus mutation is missing a returns validator; add a returns validator (e.g., returns: v.id("mortgages")) to the mutation definition after the args block so the mutation's return value is validated as the mortgage id, and ensure the function still returns args.id.


convex/mortgages.ts lines 56-69: the current query filters for maturityDate <= futureDateISO which includes already-matured mortgages; change the filter to select mortgages with maturityDate >= nowISO and <= futureDateISO (compute nowISO with new Date().toISOString() before the query) so only mortgages maturing between today and the future date are returned, and add a Convex returns validator to the query definition (e.g., returns: v.array(v.object({...})) or the appropriate mortgage schema) to validate the returned array of mortgage objects.


CodeRabbit
Add returns validator and date validation.

The mutation is missing a returns validator. Additionally, there's no validation to ensure that originationDate is before maturityDate, which could lead to invalid mortgage records.

Based on learnings.

Apply this diff:

 export const createMortgage = mutation({
     args: {
         borrowerId: v.id("borrowers"),
         loanAmount: v.number(),
         interestRate: v.number(),
         originationDate: v.string(),
         maturityDate: v.string(),
         status: v.optional(
             v.union(
                 v.literal("active"),
                 v.literal("renewed"),
                 v.literal("closed"),
                 v.literal("defaulted")
             )
         ),
         previousMortgageId: v.optional(v.id("mortgages")),
         address: v.object({
             street: v.string(),
             city: v.string(),
             state: v.string(),
             zip: v.string(),
             country: v.string(),
         }),
         location: v.object({
             lat: v.number(),
             lng: v.number(),
         }),
         propertyType: v.string(),
         images: v.optional(
             v.array(
                 v.object({
                     storageId: v.string(),
                     alt: v.optional(v.string()),
                     order: v.number(),
                 })
             )
         ),
         documents: v.optional(
             v.array(
                 v.object({
                     name: v.string(),
                     type: v.union(
                         v.literal("appraisal"),
                         v.literal("title"),
                         v.literal("inspection"),
                         v.literal("loan_agreement"),
                         v.literal("insurance")
                     ),
                     storageId: v.string(),
                     uploadDate: v.string(),
                     fileSize: v.optional(v.number()),
                 })
             )
         ),
     },
+	returns: v.id("mortgages"),
     handler: async (ctx, args) => {
         // Validate numeric constraints
         if (args.loanAmount <= 0) {
             throw new Error("Loan amount must be greater than 0");
         }
         if (args.interestRate <= 0 || args.interestRate >= 100) {
             throw new Error("Interest rate must be between 0 and 100");
         }

+		// Validate dates
+		const origination = new Date(args.originationDate);
+		const maturity = new Date(args.maturityDate);
+		if (origination >= maturity) {
+			throw new Error("Origination date must be before maturity date");
+		}
+
         // Validate coordinates
         if (args.location.lat < -90 || args.location.lat > 90) {
             throw new Error("Latitude must be between -90 and 90");
         }
         if (args.location.lng < -180 || args.location.lng > 180) {
             throw new Error("Longitude must be between -180 and 180");
         }

         // Validate borrower exists
         const borrower = await ctx.db.get(args.borrowerId);
         if (!borrower) {
             throw new Error("Borrower not found");
         }

         // Create mortgage with defaults
         return await ctx.db.insert("mortgages", {
             borrowerId: args.borrowerId,
             loanAmount: args.loanAmount,
             interestRate: args.interestRate,
             originationDate: args.originationDate,
             maturityDate: args.maturityDate,
             status: args.status ?? "active",
             previousMortgageId: args.previousMortgageId,
             address: args.address,
             location: args.location,
             propertyType: args.propertyType,
             images: args.images ?? [],
             documents: args.documents ?? [],
         });
     },
 });
CodeRabbit
Add returns validator and clarify ordering.

The query is missing a returns validator. Additionally, .order("desc") without a field parameter orders by _creationTime by default, which may be intended but should be made explicit for clarity.

Based on learnings.

Apply this diff:

 export const listMortgagesByBorrower = query({
     args: { borrowerId: v.id("borrowers") },
+	returns: v.array(v.object({
+		_id: v.id("mortgages"),
+		_creationTime: v.number(),
+		borrowerId: v.id("borrowers"),
+		loanAmount: v.number(),
+		interestRate: v.number(),
+		originationDate: v.string(),
+		maturityDate: v.string(),
+		status: v.string(),
+		address: v.any(),
+		location: v.any(),
+		propertyType: v.string(),
+		images: v.array(v.any()),
+		documents: v.array(v.any()),
+	})),
     handler: async (ctx, args) => {
         return await ctx.db
             .query("mortgages")
             .withIndex("by_borrower", (q) => q.eq("borrowerId", args.borrowerId))
             .order("desc")
             .collect();
     },
 });
