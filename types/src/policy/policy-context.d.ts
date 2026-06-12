/** @typedef {import('@tetherto/wdk-wallet').IWalletAccountReadOnly} IWalletAccountReadOnly */
/** @typedef {import('./policy-engine.js').PolicyContext} PolicyContext */
/**
 * The raw inputs from the wrapper used to build a frozen PolicyContext.
 *
 * @typedef {Object} BuildContextInput
 * @property {string} operation - The wrapped operation name (e.g. 'sendTransaction').
 * @property {string} wallet - The wallet identifier this account belongs to (the same string passed to `registerWallet`).
 * @property {IWalletAccountReadOnly} account - A read-only view of the wallet account.
 * @property {readonly unknown[]} args - The full argument array passed to the method.
 */
/**
 * Builds the immutable context object passed to every condition function.
 *
 * Each cloneable argument is passed through structuredClone so condition
 * functions see a snapshot taken at evaluation time. This prevents
 * time-of-check / time-of-use mutation: a caller mutating the original
 * tx object after the wrapper builds the context (e.g., concurrent
 * middleware on a shared request body) cannot change what the conditions
 * already evaluated. The original arguments still flow through to the
 * underlying method untouched. Arguments that aren't structured-cloneable
 * (functions, class instances with non-cloneable internals) fall back to
 * their raw value.
 *
 * @internal
 * @param {BuildContextInput} input - The raw inputs from the wrapper.
 * @returns {PolicyContext} A frozen context object.
 */
export function buildContext({ operation, wallet, account, args }: BuildContextInput): PolicyContext;
export type IWalletAccountReadOnly = import("@tetherto/wdk-wallet").IWalletAccountReadOnly;
export type PolicyContext = import("./policy-engine.js").PolicyContext;
/**
 * The raw inputs from the wrapper used to build a frozen PolicyContext.
 */
export type BuildContextInput = {
    /**
     * - The wrapped operation name (e.g. 'sendTransaction').
     */
    operation: string;
    /**
     * - The wallet identifier this account belongs to (the same string passed to `registerWallet`).
     */
    wallet: string;
    /**
     * - A read-only view of the wallet account.
     */
    account: IWalletAccountReadOnly;
    /**
     * - The full argument array passed to the method.
     */
    args: readonly unknown[];
};
