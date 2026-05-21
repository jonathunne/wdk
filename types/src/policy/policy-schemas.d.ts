/**
 * Normalises the wallet field of a parsed policy into an array of
 * non-empty strings or `undefined` (meaning "apply to every registered wallet").
 *
 * @internal
 * @param {string | string[] | undefined} wallet
 * @returns {string[] | undefined}
 */
export function normalisePolicyWallet(wallet: string | string[] | undefined): string[] | undefined;
/**
 * Builds a human-readable message for the first issue in a ZodError,
 * prefixed with the policy (and rule, when applicable) context.
 *
 * @internal
 * @param {import('zod').ZodError} zodError
 * @param {object} policy - The policy object that failed validation.
 * @returns {string}
 */
export function formatPolicyError(zodError: import("zod").ZodError, policy: object): string;
/**
 * Builds a human-readable message for the first issue in a ZodError thrown
 * by the registerOptions schema.
 *
 * @internal
 * @param {import('zod').ZodError} zodError
 * @returns {string}
 */
export function formatRegisterOptionsError(zodError: import("zod").ZodError): string;
export const policySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    scope: z.ZodEnum<{
        [x: string]: string;
    }>;
    wallet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    accounts: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    rules: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        reason: z.ZodOptional<z.ZodString>;
        operation: z.ZodUnion<readonly [z.ZodEnum<{
            [x: string]: string;
        }>, z.ZodArray<z.ZodEnum<{
            [x: string]: string;
        }>>]>;
        action: z.ZodEnum<{
            [x: string]: string;
        }>;
        override_broader_scope: z.ZodOptional<z.ZodBoolean>;
        conditions: z.ZodArray<z.ZodCustom<any, any>>;
        state: z.ZodOptional<z.ZodUnknown>;
        onSuccess: z.ZodOptional<z.ZodCustom<any, any>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export const registerOptionsSchema: z.ZodOptional<z.ZodObject<{
    state: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    conditionTimeoutMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
import { z } from 'zod';
