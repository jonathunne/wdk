/**
 * Validates the options bag passed to registerPolicy.
 *
 * @internal
 * @param {RegisterPolicyOptions} [options] - Registration options.
 */
export function validateRegisterOptions(options?: RegisterPolicyOptions): void;
/**
 * Validates a single policy object and returns the normalised wallet binding.
 * Throws synchronously on the first failure.
 *
 * @internal
 * @param {object} policy - The policy to validate.
 * @returns {string[] | undefined} The normalised wallet binding, or undefined for "all wallets".
 */
export function validatePolicy(policy: object): string[] | undefined;
/**
 * Returns true if the given rule addresses the supplied operation.
 *
 * @internal
 * @param {object} rule
 * @param {string} operation
 * @returns {boolean}
 */
export function ruleAddressesOperation(rule: object, operation: string): boolean;
/**
 * Returns the union of operation names referenced by the given policies.
 * If any rule uses the wildcard, the result includes the full operation set.
 *
 * @internal
 * @param {Iterable<object>} policies
 * @returns {Set<string>}
 */
export function collectReferencedOperations(policies: Iterable<object>): Set<string>;
export { normalisePolicyWallet };
export type RegisterPolicyOptions = import("./policy-engine.js").RegisterPolicyOptions;
import { normalisePolicyWallet } from './policy-schemas.js';
