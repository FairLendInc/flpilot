/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as logger from "../logger.js";
import type * as myFunctions from "../myFunctions.js";
import type * as organizations from "../organizations.js";
import type * as profile from "../profile.js";
import type * as roles from "../roles.js";
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
  crons: typeof crons;
  http: typeof http;
  logger: typeof logger;
  myFunctions: typeof myFunctions;
  organizations: typeof organizations;
  profile: typeof profile;
  roles: typeof roles;
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
