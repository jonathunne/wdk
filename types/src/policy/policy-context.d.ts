/** @typedef {import('@tetherto/wdk-wallet').IWalletAccountReadOnly} IWalletAccountReadOnly */
/** @typedef {import('./policy-engine.js').PolicyContext} PolicyContext */
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
 * @param {Object} input - The raw inputs from the wrapper.
 * @param {string} input.operation - The wrapped operation name (e.g. 'sendTransaction').
 * @param {string} input.wallet - The wallet identifier this account belongs to (the same string passed to `registerWallet`).
 * @param {IWalletAccountReadOnly} input.account - A read-only view of the wallet account.
 * @param {readonly unknown[]} input.args - The full argument array passed to the method.
 * @returns {PolicyContext} A frozen context object.
 */
export function buildContext({ operation, wallet, account, args }: {
    operation: string;
    wallet: string;
    account: IWalletAccountReadOnly;
    args: readonly unknown[];
}): PolicyContext;
export type IWalletAccountReadOnly = import("@tetherto/wdk-wallet").IWalletAccountReadOnly;
export type PolicyContext = import("./policy-engine.js").PolicyContext;
