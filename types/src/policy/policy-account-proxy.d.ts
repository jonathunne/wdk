/**
 * Returns a Proxy that exposes policy-enforced versions of write methods on
 * the given account. The policy engine itself does not mutate the account
 * (the WDK manager's `_registerProtocols` step does install
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
 * @param {object} options
 * @param {string} options.blockchain - The wallet identifier.
 * @param {string | undefined} options.path
 * @param {number | undefined} options.index
 * @param {object} options.engine - The PolicyEngine instance.
 * @returns {Promise<object>} The proxy-wrapped account, or the original if no policy applies.
 */
export function createPolicyEnforcedAccount(account: IWalletAccount, { blockchain, path, index, engine }: {
    blockchain: string;
    path: string | undefined;
    index: number | undefined;
    engine: object;
}): Promise<object>;
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
