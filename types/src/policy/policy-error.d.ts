/**
 * Error type produced by the policy engine on a DENY verdict.
 */
export default class PolicyViolationError extends Error {
    /**
     * Constructs the error from the identifying triple of the policy verdict.
     *
     * @param {object} verdict
     * @param {string} verdict.policyId - The id of the policy that produced the verdict.
     * @param {string} verdict.ruleName - The name of the matching rule.
     * @param {string} verdict.reason - Human-readable explanation of why the operation was blocked.
     */
    constructor({ policyId, ruleName, reason }: {
        policyId: string;
        ruleName: string;
        reason: string;
    });
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
