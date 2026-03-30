/**
 * DO NOT import from this file directly on the client or server.
 * Client code → import from "@/shared/const" via the @shared/* path alias.
 * This file exists only for legacy compatibility; it re-exports from the
 * canonical shared/const.ts to avoid duplicated definitions.
 */
export { COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG } from "@/shared/const";
