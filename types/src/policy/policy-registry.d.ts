/**
 * @internal
 *
 * In-memory store for registered policies, partitioned into two buckets:
 *   - `_project`              project-scope policies, ordered list, indexed by id.
 *   - `_accountByChain[chain]` account-scope policies bound to that chain
 *      (matching against `policy.accounts` entries — paths or indexes — is
 *      done at evaluation time).
 *
 * Same-id-within-same-bucket replaces in place, preserving registration order.
 * Different bindings (same id under chain A vs chain B vs project) are
 * independent records.
 */
export default class PolicyRegistry {
    /** @private */
    private _project;
    /** @private */
    private _accountByChain;
    /**
     * Registers a single policy under the given chain bindings.
     * - For a project-scope policy: chains === undefined applies it globally;
     *   a chain array narrows the policy to those chains only.
     * - For an account-scope policy: chains is required and binds the policy
     *   into the per-chain account bucket.
     *
     * Stores a defensive deep-ish clone of the policy so callers cannot mutate
     * engine state by editing the original object after registration.
     *
     * @param {object} policy
     * @param {string[] | undefined} chains
     */
    add(policy: object, chains: string[] | undefined): void;
    /**
     * Returns the policies that may apply to a given (chain, path, index) call,
     * partitioned into the two groups (account, project). An account-scope
     * policy matches when `policy.accounts` contains the path (string match)
     * or the index (number match). A project-scope policy matches when it
     * has no chain restriction or its restriction includes the chain.
     *
     * @param {string} chain
     * @param {string | undefined} path
     * @param {number | undefined} index
     * @returns {{ account: object[], project: object[] }}
     */
    applicable(chain: string, path: string | undefined, index: number | undefined): {
        account: object[];
        project: object[];
    };
    /**
     * Returns every policy that's potentially relevant to a given (chain, path, index),
     * regardless of scope. Used to compute the operation-name set the wrapper
     * needs to handle.
     *
     * @param {string} chain
     * @param {string | undefined} path
     * @param {number | undefined} index
     * @returns {object[]}
     */
    relevant(chain: string, path: string | undefined, index: number | undefined): object[];
    /**
     * Removes every binding of this chain from the registry:
     * - account-scope policies bound to the chain are dropped entirely.
     * - project-scope policies that included this chain in their restriction
     *   are narrowed to the remaining chains; if no chains are left, the
     *   policy is removed entirely.
     * - global (unrestricted) project-scope policies are untouched.
     *
     * @param {string} chain
     */
    disposeChain(chain: string): void;
    /**
     * Removes every registered policy across both buckets.
     */
    disposeAll(): void;
}
