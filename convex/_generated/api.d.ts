/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as illustrationAnatomy from "../illustrationAnatomy.js";
import type * as illustrationPipeline from "../illustrationPipeline.js";
import type * as lib_allowlist from "../lib/allowlist.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_copyPlan from "../lib/copyPlan.js";
import type * as lib_curation from "../lib/curation.js";
import type * as lib_illustration from "../lib/illustration.js";
import type * as lib_illustrationCustomId from "../lib/illustrationCustomId.js";
import type * as lib_illustrationPrompt from "../lib/illustrationPrompt.js";
import type * as lib_loadSpecies from "../lib/loadSpecies.js";
import type * as lib_maskBits from "../lib/maskBits.js";
import type * as lib_seedPlan from "../lib/seedPlan.js";
import type * as lib_selectForGeneration from "../lib/selectForGeneration.js";
import type * as lib_slug from "../lib/slug.js";
import type * as species from "../species.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  http: typeof http;
  illustrationAnatomy: typeof illustrationAnatomy;
  illustrationPipeline: typeof illustrationPipeline;
  "lib/allowlist": typeof lib_allowlist;
  "lib/auth": typeof lib_auth;
  "lib/copyPlan": typeof lib_copyPlan;
  "lib/curation": typeof lib_curation;
  "lib/illustration": typeof lib_illustration;
  "lib/illustrationCustomId": typeof lib_illustrationCustomId;
  "lib/illustrationPrompt": typeof lib_illustrationPrompt;
  "lib/loadSpecies": typeof lib_loadSpecies;
  "lib/maskBits": typeof lib_maskBits;
  "lib/seedPlan": typeof lib_seedPlan;
  "lib/selectForGeneration": typeof lib_selectForGeneration;
  "lib/slug": typeof lib_slug;
  species: typeof species;
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

export declare const components: {};
