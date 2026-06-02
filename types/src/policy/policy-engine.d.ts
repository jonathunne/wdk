export default class PolicyEngine {
    /** @private */
    private _registry;
    /** @private */
    private _conditionTimeoutMs;
    /**
     * Registers one or more policies. Synchronously throws on validation failures.
     * Validation runs to completion before any registry mutation, so a failure
     * never leaves the engine partially mutated.
     *
     * @param {Policy | Policy[]} policies - A single policy or array of policies to register.
     * @param {RegisterPolicyOptions} [options] - Engine-level settings such as `conditionTimeoutMs`.
     * @param {{ knownWallets?: Set<string> }} [registrationContext] - Optional
     *   set of registered wallet identifiers. When provided, the engine verifies
     *   every wallet binding referenced by the policies is in this set before
     *   touching the registry.
     * @throws {PolicyConfigurationError} If any policy or option fails schema validation, the input is an empty array, or a policy binds to a wallet not present in `registrationContext.knownWallets`.
     */
    register(policies: Policy | Policy[], options?: RegisterPolicyOptions, registrationContext?: {
        knownWallets?: Set<string>;
    }): void;
    /**
     * Returns a policy-enforced view of the given account — a Proxy that
     * exposes enforced versions of write methods. The original account is
     * never mutated. If no policy applies, returns the original account.
     *
     * @param {IWalletAccount} account - The raw account from the wallet manager. Mutated only by the WDK manager's `_registerProtocols` step (which runs before this method), not by the policy engine.
     * @param {Object} ctx - The wrap context.
     * @param {string} ctx.blockchain - The wallet identifier (named `blockchain` for parity with the WDK manager's existing API; treated as an opaque key here).
     * @param {string | undefined} ctx.path - Derivation path of the account, when known.
     * @param {number | undefined} [ctx.index] - The index passed to `wdk.getAccount(wallet, index)`, when known. Used to match index-form entries in `policy.accounts`.
     * @returns {Promise<IWalletAccount>} The enforced proxy, or the original account if no policy applies.
     * @throws {PolicyConfigurationError} If at least one policy applies but the underlying account does not implement `toReadOnlyAccount()`.
     */
    applyPoliciesTo(account: IWalletAccount, { blockchain, path, index }: {
        blockchain: string;
        path: string | undefined;
        index?: number | undefined;
    }): Promise<IWalletAccount>;
    /**
     * Removes account-scope and chain-bound project policies registered under
     * the given wallet identifier.
     *
     * @param {string} wallet
     */
    disposeWallet(wallet: string): void;
    /**
     * Removes all registered policies across every bucket.
     */
    disposeAll(): void;
    /** @private */
    private _relevantOperations;
    /** @private */
    private _evaluateContext;
    /** @private */
    private _simulateContext;
}
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type IWalletAccountReadOnly = import("@tetherto/wdk-wallet").IWalletAccountReadOnly;
export type PolicyAction = "ALLOW" | "DENY";
export type PolicyScope = "project" | "account";
export type PolicyOperation = "sendTransaction" | "transfer" | "approve" | "signMessage" | "signHash" | "signTypedData" | "signAuthorization" | "delegate" | "revokeDelegation" | "swap" | "bridge" | "supply" | "withdraw" | "borrow" | "repay" | "buy" | "sell" | "*";
export type PolicyContext = {
    /**
     * - The intercepted operation name.
     */
    operation: PolicyOperation;
    /**
     * - The wallet identifier (the same string passed to `wdk.registerWallet`). Despite the name, this is an opaque key chosen by the consumer — it might be a chain name like `"ethereum"`, but it could equally be `"treasury-cold"` or any other label.
     */
    wallet: string;
    /**
     * - A read-only view of the wallet account.
     */
    account: IWalletAccountReadOnly;
    /**
     * - The first argument to the wrapped method.
     */
    params: unknown;
    /**
     * - The full argument array.
     */
    args: readonly unknown[];
};
export type PolicyCondition = (context: PolicyContext) => boolean | Promise<boolean>;
export type PolicyRule = {
    /**
     * - Stable identifier for the rule within its policy. Surfaces on PolicyViolationError.ruleName and in simulation traces.
     */
    name: string;
    /**
     * - Optional human-readable explanation. When set on a DENY rule that matches, propagates to PolicyViolationError.reason and to the matching simulate-result. Defaults to the rule's name.
     */
    reason?: string;
    /**
     * - The wrapped operation(s) this rule addresses. May be a single operation name, an array, or the wildcard `*`.
     */
    operation: PolicyOperation | PolicyOperation[];
    /**
     * - Whether a matching rule allows or denies the operation.
     */
    action: PolicyAction;
    /**
     * - When true on an account-scope ALLOW rule that matches, the rule's verdict short-circuits project-scope evaluation. Account-scope rules are evaluated in registration order; the first matching override-flag rule wins. Only valid on account-scope ALLOW rules.
     */
    override_broader_scope?: boolean;
    /**
     * - Functions evaluated in order; all must return truthy for the rule to match. Each is raced against `conditionTimeoutMs`.
     */
    conditions: PolicyCondition[];
    /**
     * - Reserved for future use; currently ignored at runtime.
     */
    state?: Record<string, unknown>;
    /**
     * - Reserved for future use; currently ignored at runtime.
     */
    onSuccess?: (c: PolicyContext) => void | Promise<void>;
};
export type AccountIdentifier = string | number;
export type Policy = {
    /**
     * - Unique identifier within an engine. Re-registering the same id replaces the prior policy in the same wallet bucket.
     */
    id: string;
    /**
     * - Human-readable label.
     */
    name: string;
    /**
     * - Whether the policy applies to all accounts on the wallet(s) (`project`) or a specific subset (`account`).
     */
    scope: PolicyScope;
    /**
     * - The wallet identifier(s) this policy binds to. Each entry must match a string previously passed to `wdk.registerWallet`. For `scope: 'project'`, omitting `wallet` applies the policy across every registered wallet; providing one or more narrows it to those wallets. For `scope: 'account'`, `wallet` is required.
     */
    wallet?: string | string[];
    /**
     * - The accounts this policy applies to (required when scope is 'account'). Each entry is either a derivation path (exact-string match against `account.path`) or a non-negative integer (match against the index passed to `wdk.getAccount(wallet, index)`). Index entries do not match accounts retrieved via `getAccountByPath` — use derivation paths if you need both retrieval styles to work.
     */
    accounts?: AccountIdentifier[];
    /**
     * - Ordered list of rules. Evaluation is rule-by-rule within a policy; DENY wins over ALLOW within the same scope.
     */
    rules: PolicyRule[];
};
export type RegisterPolicyOptions = {
    /**
     * - Reserved for future use; currently ignored at runtime.
     */
    state?: Record<string, unknown>;
    /**
     * - Per-condition evaluation timeout in milliseconds. Defaults to 30000. A condition that exceeds the timeout is treated the same as a throw — fail-closed for DENY rules, fail-open-as-no-match for ALLOW rules. Engine-wide; the most recent registerPolicy call's value wins.
     */
    conditionTimeoutMs?: number;
};
export type SimulationTraceEntry = {
    /**
     * - The scope of the policy that emitted this trace entry.
     */
    scope: PolicyScope;
    /**
     * - The id of the policy whose rule was evaluated.
     */
    policy_id: string;
    /**
     * - The name of the rule that was evaluated.
     */
    rule_name: string;
    /**
     * - True if every condition on the rule returned truthy (and didn't throw or time out).
     */
    matched: boolean;
    /**
     * - Set when a condition threw or timed out; carries the error message.
     */
    error?: string;
};
export type SimulationResult = {
    /**
     * - The verdict the engine would produce for this context.
     */
    decision: "ALLOW" | "DENY";
    /**
     * - Id of the policy whose rule produced the verdict, or null when the verdict is `not-governed` / `governed-but-unmatched`.
     */
    policy_id: string | null;
    /**
     * - Name of the matching rule, or null when no rule matched.
     */
    matched_rule: string | null;
    /**
     * - Human-readable explanation: the rule's `reason` field, or one of `matched` / `override` / `not-governed` / `governed-but-unmatched`.
     */
    reason: string | null;
    /**
     * - Per-rule evaluation outcomes in the order they were considered. Useful for debugging.
     */
    trace: SimulationTraceEntry[];
};
