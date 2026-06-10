/**
 * Returns a Proxy that exposes policy-enforced versions of write methods on
 * the given account. The policy engine itself does not mutate the account
 * (the WDK's `_registerProtocols` step does install
 * `registerProtocol` / `getXProtocol` helpers on the account before the
 * proxy is built — that's a separate, pre-existing concern).
 *
 * Nested-call escape falls out naturally from how the Proxy works rather
 * than from any kind of async-context tracking:
 *
 * - When a user calls a write method via the proxy, the proxy's `get` trap
 *   returns the enforced wrapper. The wrapper evaluates policies, then
 *   invokes the original method (bound to the underlying account, not the
 *   proxy).
 * - Inside the original method, `this.someOtherMethod()` resolves on the
 *   underlying account — bypassing the proxy entirely. SDK code that holds
 *   a direct reference to the underlying account (which is how protocol
 *   packages are constructed) is also unaffected.
 * - Only access through the proxy goes through policy evaluation.
 *
 * This works identically on every JavaScript runtime that supports `Proxy`
 * (i.e. all of them). No async context, no Promise patching, no
 * runtime-specific code paths.
 *
 * If no policy applies to the (wallet, path, index) tuple, the function
 * returns the original account unchanged.
 *
 * @internal
 * @param {IWalletAccount} account - The underlying account from the wallet manager.
 * @param {Object} options - Wrap context.
 * @param {string} options.blockchain - The wallet identifier (treated as an opaque key by the engine).
 * @param {string | undefined} options.path - Derivation path of the account, when known.
 * @param {number | undefined} options.index - Index passed to `wdk.getAccount(wallet, index)`, when known.
 * @param {PolicyEngine} options.engine - The PolicyEngine instance the proxy delegates evaluation to.
 * @returns {Promise<IWalletAccount>} The proxy-wrapped account, or the original if no policy applies.
 * @throws {PolicyConfigurationError} If at least one policy applies but the underlying account does not implement `toReadOnlyAccount()`.
 */
export function createPolicyEnforcedAccount(account: IWalletAccount, { blockchain, path, index, engine }: {
    blockchain: string;
    path: string | undefined;
    index: number | undefined;
    engine: PolicyEngine;
}): Promise<IWalletAccount>;
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type PolicyEngine = import("./policy-engine.js").default;
