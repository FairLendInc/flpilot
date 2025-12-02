/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as authTests from "../authTests.js";
import type * as borrowers from "../borrowers.js";
import type * as comparables from "../comparables.js";
import type * as crons from "../crons.js";
import type * as dealStateMachine from "../dealStateMachine.js";
import type * as deal_documents from "../deal_documents.js";
import type * as deals from "../deals.js";
import type * as documenso from "../documenso.js";
import type * as documentAnalysis from "../documentAnalysis.js";
import type * as documentCategorization from "../documentCategorization.js";
import type * as documentGroups from "../documentGroups.js";
import type * as documentTypes from "../documentTypes.js";
import type * as http from "../http.js";
import type * as lib_authorizedFunctions from "../lib/authorizedFunctions.js";
import type * as lib_broker from "../lib/broker.js";
import type * as lib_client from "../lib/client.js";
import type * as lib_server from "../lib/server.js";
import type * as listings from "../listings.js";
import type * as lockRequests from "../lockRequests.js";
import type * as logger from "../logger.js";
import type * as migrations_documentGroupsAndTypes from "../migrations/documentGroupsAndTypes.js";
import type * as migrations_fix_ownership_user_references from "../migrations/fix_ownership_user_references.js";
import type * as migrations from "../migrations.js";
import type * as mortgages from "../mortgages.js";
import type * as myFunctions from "../myFunctions.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as ownership from "../ownership.js";
import type * as payments from "../payments.js";
import type * as profile from "../profile.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as sync from "../sync.js";
import type * as syncHelpers from "../syncHelpers.js";
import type * as users from "../users.js";
import type * as workos from "../workos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  authTests: typeof authTests;
  borrowers: typeof borrowers;
  comparables: typeof comparables;
  crons: typeof crons;
  dealStateMachine: typeof dealStateMachine;
  deal_documents: typeof deal_documents;
  deals: typeof deals;
  documenso: typeof documenso;
  documentAnalysis: typeof documentAnalysis;
  documentCategorization: typeof documentCategorization;
  documentGroups: typeof documentGroups;
  documentTypes: typeof documentTypes;
  http: typeof http;
  "lib/authorizedFunctions": typeof lib_authorizedFunctions;
  "lib/broker": typeof lib_broker;
  "lib/client": typeof lib_client;
  "lib/server": typeof lib_server;
  listings: typeof listings;
  lockRequests: typeof lockRequests;
  logger: typeof logger;
  "migrations/documentGroupsAndTypes": typeof migrations_documentGroupsAndTypes;
  "migrations/fix_ownership_user_references": typeof migrations_fix_ownership_user_references;
  migrations: typeof migrations;
  mortgages: typeof mortgages;
  myFunctions: typeof myFunctions;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  ownership: typeof ownership;
  payments: typeof payments;
  profile: typeof profile;
  roles: typeof roles;
  seed: typeof seed;
  storage: typeof storage;
  sync: typeof sync;
  syncHelpers: typeof syncHelpers;
  users: typeof users;
  workos: typeof workos;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
