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

import { OPERATIONS, WILDCARD } from './constants.js'
import { PolicyConfigurationError } from './policy-error.js'
import {
  formatPolicyError,
  formatRegisterOptionsError,
  normalisePolicyWallet,
  policySchema,
  registerOptionsSchema
} from './policy-schemas.js'

/** @typedef {import('./policy-engine.js').RegisterPolicyOptions} RegisterPolicyOptions */

export { normalisePolicyWallet }

/**
 * Validates the options bag passed to registerPolicy.
 *
 * @internal
 * @param {RegisterPolicyOptions} [options] - Registration options.
 */
export function validateRegisterOptions (options) {
  if (options === undefined) return

  const result = registerOptionsSchema.safeParse(options)

  if (!result.success) {
    throw new PolicyConfigurationError(formatRegisterOptionsError(result.error))
  }
}

/**
 * Validates a single policy object and returns the normalised wallet binding.
 * Throws synchronously on the first failure.
 *
 * @internal
 * @param {object} policy - The policy to validate.
 * @returns {string[] | undefined} The normalised wallet binding, or undefined for "all wallets".
 */
export function validatePolicy (policy) {
  const result = policySchema.safeParse(policy)

  if (!result.success) {
    throw new PolicyConfigurationError(formatPolicyError(result.error, policy))
  }

  return normalisePolicyWallet(result.data.wallet)
}

/**
 * Returns true if the given rule addresses the supplied operation.
 *
 * @internal
 * @param {object} rule
 * @param {string} operation
 * @returns {boolean}
 */
export function ruleAddressesOperation (rule, operation) {
  if (rule.operation === operation || rule.operation === WILDCARD) return true

  if (Array.isArray(rule.operation)) {
    return rule.operation.includes(operation) || rule.operation.includes(WILDCARD)
  }

  return false
}

/**
 * Returns the union of operation names referenced by the given policies.
 * If any rule uses the wildcard, the result includes the full operation set.
 *
 * @internal
 * @param {Iterable<object>} policies
 * @returns {Set<string>}
 */
export function collectReferencedOperations (policies) {
  const operations = new Set()

  for (const policy of policies) {
    for (const rule of policy.rules) {
      if (rule.operation === WILDCARD || rule.operation.includes?.(WILDCARD)) {
        return new Set(OPERATIONS)
      }

      Array.isArray(rule.operation)
        ? rule.operation.forEach((op) => operations.add(op))
        : operations.add(rule.operation)
    }
  }

  return operations
}
