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
import type * as brokers_approval from "../brokers/approval.js";
import type * as brokers_clients from "../brokers/clients.js";
import type * as brokers_codes from "../brokers/codes.js";
import type * as brokers_commissions from "../brokers/commissions.js";
import type * as brokers_commissions_actions from "../brokers/commissions_actions.js";
import type * as brokers_commissions_internal from "../brokers/commissions_internal.js";
import type * as brokers_communication from "../brokers/communication.js";
import type * as brokers_documents from "../brokers/documents.js";
import type * as brokers_management from "../brokers/management.js";
import type * as brokers_onboarding from "../brokers/onboarding.js";
import type * as brokers_stats from "../brokers/stats.js";
import type * as brokers_validation from "../brokers/validation.js";
import type * as brokers_workflows from "../brokers/workflows.js";
import type * as brokers_workos from "../brokers/workos.js";
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
import type * as investors_onboarding from "../investors/onboarding.js";
import type * as lawyers_identityProvider from "../lawyers/identityProvider.js";
import type * as lawyers_nameMatch from "../lawyers/nameMatch.js";
import type * as lawyers_registryStore from "../lawyers/registryStore.js";
import type * as lawyers_types from "../lawyers/types.js";
import type * as ledger from "../ledger.js";
import type * as lib_authorizedFunctions from "../lib/authorizedFunctions.js";
import type * as lib_broker from "../lib/broker.js";
import type * as lib_brokerLedger from "../lib/brokerLedger.js";
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
import type * as migrations from "../migrations.js";
import type * as migrations_documentGroupsAndTypes from "../migrations/documentGroupsAndTypes.js";
import type * as migrations_fix_ownership_user_references from "../migrations/fix_ownership_user_references.js";
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

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  auditEvents: typeof auditEvents;
  auditEventsCron: typeof auditEventsCron;
  authTests: typeof authTests;
  borrowers: typeof borrowers;
  "brokers/approval": typeof brokers_approval;
  "brokers/clients": typeof brokers_clients;
  "brokers/codes": typeof brokers_codes;
  "brokers/commissions": typeof brokers_commissions;
  "brokers/commissions_actions": typeof brokers_commissions_actions;
  "brokers/commissions_internal": typeof brokers_commissions_internal;
  "brokers/communication": typeof brokers_communication;
  "brokers/documents": typeof brokers_documents;
  "brokers/management": typeof brokers_management;
  "brokers/onboarding": typeof brokers_onboarding;
  "brokers/stats": typeof brokers_stats;
  "brokers/validation": typeof brokers_validation;
  "brokers/workflows": typeof brokers_workflows;
  "brokers/workos": typeof brokers_workos;
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
  "investors/onboarding": typeof investors_onboarding;
  "lawyers/identityProvider": typeof lawyers_identityProvider;
  "lawyers/nameMatch": typeof lawyers_nameMatch;
  "lawyers/registryStore": typeof lawyers_registryStore;
  "lawyers/types": typeof lawyers_types;
  ledger: typeof ledger;
  "lib/authorizedFunctions": typeof lib_authorizedFunctions;
  "lib/broker": typeof lib_broker;
  "lib/brokerLedger": typeof lib_brokerLedger;
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
  migrations: typeof migrations;
  "migrations/documentGroupsAndTypes": typeof migrations_documentGroupsAndTypes;
  "migrations/fix_ownership_user_references": typeof migrations_fix_ownership_user_references;
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

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  filesControl: {
    accessControl: {
      addAccessKey: FunctionReference<
        "mutation",
        "internal",
        { accessKey: string; storageId: string },
        { accessKey: string }
      >;
      removeAccessKey: FunctionReference<
        "mutation",
        "internal",
        { accessKey: string; storageId: string },
        { removed: boolean }
      >;
      updateFileExpiration: FunctionReference<
        "mutation",
        "internal",
        { expiresAt: null | number; storageId: string },
        { expiresAt: null | number }
      >;
    };
    cleanUp: {
      cleanupExpired: FunctionReference<
        "mutation",
        "internal",
        {
          limit?: number;
          r2Config?: {
            accessKeyId: string;
            accountId: string;
            bucketName: string;
            secretAccessKey: string;
          };
        },
        { deletedCount: number; hasMore: boolean }
      >;
      deleteFile: FunctionReference<
        "mutation",
        "internal",
        {
          r2Config?: {
            accessKeyId: string;
            accountId: string;
            bucketName: string;
            secretAccessKey: string;
          };
          storageId: string;
        },
        { deleted: boolean }
      >;
      deleteStorageFile: FunctionReference<
        "action",
        "internal",
        {
          r2Config?: {
            accessKeyId: string;
            accountId: string;
            bucketName: string;
            secretAccessKey: string;
          };
          storageId: string;
          storageProvider: "convex" | "r2";
        },
        null
      >;
    };
    download: {
      consumeDownloadGrantForUrl: FunctionReference<
        "mutation",
        "internal",
        {
          accessKey?: string;
          downloadToken: string;
          password?: string;
          r2Config?: {
            accessKeyId: string;
            accountId: string;
            bucketName: string;
            secretAccessKey: string;
          };
        },
        {
          downloadUrl?: string;
          status:
            | "ok"
            | "not_found"
            | "expired"
            | "exhausted"
            | "file_missing"
            | "file_expired"
            | "access_denied"
            | "password_required"
            | "invalid_password";
        }
      >;
      createDownloadGrant: FunctionReference<
        "mutation",
        "internal",
        {
          expiresAt?: null | number;
          maxUses?: null | number;
          password?: string;
          shareableLink?: boolean;
          storageId: string;
        },
        {
          downloadToken: string;
          expiresAt: null | number;
          maxUses: null | number;
          shareableLink: boolean;
          storageId: string;
        }
      >;
    };
    queries: {
      getFile: FunctionReference<
        "query",
        "internal",
        { storageId: string },
        {
          _id: string;
          expiresAt: number | null;
          storageId: string;
          storageProvider: "convex" | "r2";
          virtualPath: string | null;
        } | null
      >;
      getFileByVirtualPath: FunctionReference<
        "query",
        "internal",
        { virtualPath: string },
        {
          _id: string;
          expiresAt: number | null;
          storageId: string;
          storageProvider: "convex" | "r2";
          virtualPath: string | null;
        } | null
      >;
      hasAccessKey: FunctionReference<
        "query",
        "internal",
        { accessKey: string; storageId: string },
        boolean
      >;
      listAccessKeysPage: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          storageId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<string>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listDownloadGrantsPage: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _id: string;
            expiresAt: number | null;
            hasPassword: boolean;
            maxUses: null | number;
            storageId: string;
            useCount: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listFilesByAccessKeyPage: FunctionReference<
        "query",
        "internal",
        {
          accessKey: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _id: string;
            expiresAt: number | null;
            storageId: string;
            storageProvider: "convex" | "r2";
            virtualPath: string | null;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listFilesPage: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _id: string;
            expiresAt: number | null;
            storageId: string;
            storageProvider: "convex" | "r2";
            virtualPath: string | null;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
    transfer: {
      transferFile: FunctionReference<
        "action",
        "internal",
        {
          r2Config?: {
            accessKeyId: string;
            accountId: string;
            bucketName: string;
            secretAccessKey: string;
          };
          storageId: string;
          targetProvider: "convex" | "r2";
          virtualPath?: string;
        },
        {
          storageId: string;
          storageProvider: "convex" | "r2";
          virtualPath: string | null;
        }
      >;
    };
    upload: {
      computeR2Metadata: FunctionReference<
        "action",
        "internal",
        {
          r2Config: {
            accessKeyId: string;
            accountId: string;
            bucketName: string;
            secretAccessKey: string;
          };
          storageId: string;
        },
        {
          contentType: string | null;
          sha256: string;
          size: number;
          storageId: string;
        }
      >;
      finalizeUpload: FunctionReference<
        "mutation",
        "internal",
        {
          accessKeys: Array<string>;
          expiresAt?: null | number;
          metadata?: {
            contentType: string | null;
            sha256: string;
            size: number;
          };
          storageId: string;
          uploadToken: string;
          virtualPath?: string;
        },
        {
          expiresAt: null | number;
          metadata: {
            contentType: string | null;
            sha256: string;
            size: number;
            storageId: string;
          } | null;
          storageId: string;
          storageProvider: "convex" | "r2";
          virtualPath: string | null;
        }
      >;
      generateUploadUrl: FunctionReference<
        "mutation",
        "internal",
        {
          provider: "convex" | "r2";
          r2Config?: {
            accessKeyId: string;
            accountId: string;
            bucketName: string;
            secretAccessKey: string;
          };
          virtualPath?: string;
        },
        {
          storageId: string | null;
          storageProvider: "convex" | "r2";
          uploadToken: string;
          uploadTokenExpiresAt: number;
          uploadUrl: string;
        }
      >;
      registerFile: FunctionReference<
        "mutation",
        "internal",
        {
          accessKeys: Array<string>;
          expiresAt?: null | number;
          metadata?: {
            contentType: string | null;
            sha256: string;
            size: number;
          };
          storageId: string;
          storageProvider: "convex" | "r2";
          virtualPath?: string;
        },
        {
          expiresAt: null | number;
          metadata: {
            contentType: string | null;
            sha256: string;
            size: number;
            storageId: string;
          } | null;
          storageId: string;
          storageProvider: "convex" | "r2";
          virtualPath: string | null;
        }
      >;
    };
  };
  workflow: {
    event: {
      create: FunctionReference<
        "mutation",
        "internal",
        { name: string; workflowId: string },
        string
      >;
      send: FunctionReference<
        "mutation",
        "internal",
        {
          eventId?: string;
          name?: string;
          result:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId?: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        string
      >;
    };
    journal: {
      load: FunctionReference<
        "query",
        "internal",
        { shortCircuit?: boolean; workflowId: string },
        {
          blocked?: boolean;
          journalEntries: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          ok: boolean;
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      startSteps: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          steps: Array<{
            retry?:
              | boolean
              | { base: number; initialBackoffMs: number; maxAttempts: number };
            schedulerOptions?: { runAt?: number } | { runAfter?: number };
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
          }>;
          workflowId: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        Array<{
          _creationTime: number;
          _id: string;
          step:
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                functionType: "query" | "mutation" | "action";
                handle: string;
                inProgress: boolean;
                kind?: "function";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workId?: string;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                handle: string;
                inProgress: boolean;
                kind: "workflow";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workflowId?: string;
              }
            | {
                args: { eventId?: string };
                argsSize: number;
                completedAt?: number;
                eventId?: string;
                inProgress: boolean;
                kind: "event";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
              };
          stepNumber: number;
          workflowId: string;
        }>
      >;
    };
    workflow: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        null
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        boolean
      >;
      complete: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          runResult:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId: string;
        },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          maxParallelism?: number;
          onComplete?: { context?: any; fnHandle: string };
          startAsync?: boolean;
          workflowArgs: any;
          workflowHandle: string;
          workflowName: string;
        },
        string
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          inProgress: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            context?: any;
            name?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listByName: FunctionReference<
        "query",
        "internal",
        {
          name: string;
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            context?: any;
            name?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listSteps: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          workflowId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            completedAt?: number;
            eventId?: string;
            kind: "function" | "workflow" | "event";
            name: string;
            nestedWorkflowId?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt: number;
            stepId: string;
            stepNumber: number;
            workId?: string;
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
  };
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  crons: {
    public: {
      del: FunctionReference<
        "mutation",
        "internal",
        { identifier: { id: string } | { name: string } },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { identifier: { id: string } | { name: string } },
        {
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        }>
      >;
      register: FunctionReference<
        "mutation",
        "internal",
        {
          args: Record<string, any>;
          functionHandle: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        },
        string
      >;
    };
  };
};
