/**
 * The identifying triple a DENY verdict carries: which policy, which rule,
 * and the human-readable reason.
 *
 * @typedef {Object} PolicyVerdict
 * @property {string} policyId - The id of the policy that produced the verdict.
 * @property {string} ruleName - The name of the matching rule.
 * @property {string} reason - Human-readable explanation of why the operation was blocked.
 */
/**
 * Error type produced by the policy engine on a DENY verdict.
 */
export default class PolicyViolationError extends Error {
    /**
     * Constructs the error from the identifying triple of the policy verdict.
     *
     * @param {PolicyVerdict} verdict - The verdict triple identifying which policy, which rule, and why.
     */
    constructor({ policyId, ruleName, reason }: PolicyVerdict);
    /**
     * The id of the policy that produced the verdict.
     * @returns {string}
     */
    get policyId(): string;
    /**
     * The name of the rule within the policy that matched.
     * @returns {string}
     */
    get ruleName(): string;
    /**
     * Human-readable explanation of why the operation was blocked.
     * @returns {string}
     */
    get reason(): string;
    #private;
}
/**
 * Error type produced by the policy engine for invalid registration inputs.
 */
export class PolicyConfigurationError extends Error {
    /**
     * Constructs the error with the given configuration-problem explanation.
     *
     * @param {string} message - Human-readable explanation of the configuration problem.
     */
    constructor(message: string);
}
/**
 * The identifying triple a DENY verdict carries: which policy, which rule,
 * and the human-readable reason.
 */
export type PolicyVerdict = {
    /**
     * - The id of the policy that produced the verdict.
     */
    policyId: string;
    /**
     * - The name of the matching rule.
     */
    ruleName: string;
    /**
     * - Human-readable explanation of why the operation was blocked.
     */
    reason: string;
};
