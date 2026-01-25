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
import type * as auditEvents from "../auditEvents.js";
import type * as auditEventsCron from "../auditEventsCron.js";
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
import type * as flags from "../flags.js";
import type * as http from "../http.js";
import type * as ledger from "../ledger.js";
import type * as lib_authorizedFunctions from "../lib/authorizedFunctions.js";
import type * as lib_broker from "../lib/broker.js";
import type * as lib_client from "../lib/client.js";
import type * as lib_events_auditedMutation from "../lib/events/auditedMutation.js";
import type * as lib_events_emitter from "../lib/events/emitter.js";
import type * as lib_events_index from "../lib/events/index.js";
import type * as lib_events_types from "../lib/events/types.js";
import type * as lib_ownershipConfig from "../lib/ownershipConfig.js";
import type * as lib_ownershipLedger from "../lib/ownershipLedger.js";
import type * as lib_server from "../lib/server.js";
import type * as lib_webhookPagination from "../lib/webhookPagination.js";
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
import type * as pendingOwnershipTransfers from "../pendingOwnershipTransfers.js";
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
  auditEvents: typeof auditEvents;
  auditEventsCron: typeof auditEventsCron;
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
  flags: typeof flags;
  http: typeof http;
  ledger: typeof ledger;
  "lib/authorizedFunctions": typeof lib_authorizedFunctions;
  "lib/broker": typeof lib_broker;
  "lib/client": typeof lib_client;
  "lib/events/auditedMutation": typeof lib_events_auditedMutation;
  "lib/events/emitter": typeof lib_events_emitter;
  "lib/events/index": typeof lib_events_index;
  "lib/events/types": typeof lib_events_types;
  "lib/ownershipConfig": typeof lib_ownershipConfig;
  "lib/ownershipLedger": typeof lib_ownershipLedger;
  "lib/server": typeof lib_server;
  "lib/webhookPagination": typeof lib_webhookPagination;
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
  pendingOwnershipTransfers: typeof pendingOwnershipTransfers;
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
