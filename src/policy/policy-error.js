// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

/**
 * @typedef {Object} PolicyVerdict
 * @property {string} policyId - The id of the policy that produced the verdict.
 * @property {string} ruleName - The name of the matching rule.
 * @property {string} reason - Human-readable explanation of why the operation was blocked.
 */

/**
 * Error type produced by the policy engine on a DENY verdict.
 */
export default class PolicyViolationError extends Error {
  #policyId
  #ruleName
  #reason

  /**
   * Constructs the error from the identifying triple of the policy verdict.
   *
   * @param {PolicyVerdict} verdict - The verdict triple identifying which policy, which rule, and why.
   */
  constructor ({ policyId, ruleName, reason }) {
    const suffix = reason && reason !== ruleName ? `: ${reason}` : ''

    super(`Policy violation: ${policyId}/${ruleName}${suffix}`)

    this.name = 'PolicyViolationError'
    this.#policyId = policyId
    this.#ruleName = ruleName
    this.#reason = reason
  }

  /**
   * The id of the policy that produced the verdict.
   * @returns {string}
   */
  get policyId () { return this.#policyId }

  /**
   * The name of the rule within the policy that matched.
   * @returns {string}
   */
  get ruleName () { return this.#ruleName }

  /**
   * Human-readable explanation of why the operation was blocked.
   * @returns {string}
   */
  get reason () { return this.#reason }
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
  constructor (message) {
    super(message)

    this.name = 'PolicyConfigurationError'
  }
}
