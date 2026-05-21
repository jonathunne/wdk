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

import { z } from 'zod'

import { ACTIONS, OPERATIONS, SCOPES, WILDCARD } from './constants.js'

const OPERATION_NAMES = [...OPERATIONS, WILDCARD]

const operationField = z.union([
  z.enum(OPERATION_NAMES),
  z.array(z.enum(OPERATION_NAMES)).nonempty()
])

const accountIdentifier = z.union([
  z.string().min(1),
  z.number().int().nonnegative()
])

const conditionFunction = z.custom((v) => typeof v === 'function')

const ruleSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(1).optional(),
  operation: operationField,
  action: z.enum(ACTIONS),
  override_broader_scope: z.boolean().optional(),
  conditions: z.array(conditionFunction),
  state: z.unknown().optional(),
  onSuccess: conditionFunction.optional()
})

const walletField = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).nonempty()
]).optional()

export const policySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  scope: z.enum(SCOPES),
  wallet: walletField,
  accounts: z.array(accountIdentifier).nonempty().optional(),
  rules: z.array(ruleSchema).nonempty()
}).superRefine((policy, ctx) => {
  const fromRefine = { fromRefine: true }

  if (policy.scope === 'account') {
    if (policy.accounts === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['accounts'],
        message: `Policy '${policy.id}': 'accounts' is required and must be a non-empty array of derivation paths or non-negative integer indexes when scope is 'account'.`,
        params: fromRefine
      })
    }
    if (policy.wallet === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['wallet'],
        message: `Policy '${policy.id}': account-scope policies must declare a 'wallet' field.`,
        params: fromRefine
      })
    }
  } else if (policy.accounts !== undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['accounts'],
      message: `Policy '${policy.id}': 'accounts' is only allowed when scope is 'account'.`,
      params: fromRefine
    })
  }

  policy.rules?.forEach((rule, i) => {
    if (rule.override_broader_scope === true && (policy.scope !== 'account' || rule.action !== 'ALLOW')) {
      ctx.addIssue({
        code: 'custom',
        path: ['rules', i, 'override_broader_scope'],
        message: `Rule '${rule.name}' in policy '${policy.id}': 'override_broader_scope' is only valid on account-scope ALLOW rules.`,
        params: fromRefine
      })
    }
  })
})

export const registerOptionsSchema = z.object({
  state: z.record(z.string(), z.unknown()).optional(),
  conditionTimeoutMs: z.number().finite().positive().optional()
}).optional()

/**
 * Normalises the wallet field of a parsed policy into an array of
 * non-empty strings or `undefined` (meaning "apply to every registered wallet").
 *
 * @internal
 * @param {string | string[] | undefined} wallet
 * @returns {string[] | undefined}
 */
export function normalisePolicyWallet (wallet) {
  if (wallet === undefined) return undefined
  if (typeof wallet === 'string') return [wallet]
  return Array.from(new Set(wallet))
}

/**
 * Translates the first issue of a ZodError into a human-readable string,
 * scoped to the policy whose validation failed. Replicates the message
 * format used by the engine since v1.0.
 *
 * @internal
 * @param {import('zod').ZodError} zodError
 * @param {object} policy - The policy object that failed validation.
 * @returns {string}
 */
export function formatPolicyError (zodError, policy) {
  const issue = zodError.issues[0]
  const { path, code, message: zodMessage, params } = issue

  // Messages emitted by our superRefine carry the final text already.
  if (code === 'custom' && params?.fromRefine) return zodMessage

  if (path.length === 0) return 'Policy: must be an object.'

  const top = path[0]
  const id = policy?.id
  const idStr = typeof id === 'string' && id.length > 0 ? `Policy '${id}'` : 'Policy'

  if (top === 'id') return "Policy: 'id' is required and must be a non-empty string."
  if (top === 'name') return `${idStr}: 'name' is required and must be a non-empty string.`
  if (top === 'scope') return `${idStr}: 'scope' must be one of: ${SCOPES.join(', ')}.`

  if (top === 'wallet') {
    if (typeof policy?.wallet === 'string') return `${idStr}: 'wallet' must be a non-empty string.`
    return `${idStr}: 'wallet' must be a non-empty string or non-empty array of non-empty strings.`
  }

  if (top === 'accounts') {
    return `${idStr}: 'accounts' is required and must be a non-empty array of derivation paths or non-negative integer indexes when scope is 'account'.`
  }

  if (top === 'rules') {
    if (path.length === 1) return `${idStr}: 'rules' must be a non-empty array.`

    const ruleIdx = path[1]
    const rule = policy?.rules?.[ruleIdx]
    const ruleName = rule?.name
    const ruleStr = typeof ruleName === 'string' && ruleName.length > 0
      ? `Rule '${ruleName}' in policy '${id}'`
      : `Rule in policy '${id}'`

    if (path.length === 2) return `Rule in policy '${id}': rule must be an object.`

    const field = path[2]

    if (field === 'name') return `Rule in policy '${id}': 'name' is required and must be a non-empty string.`

    if (field === 'operation') {
      const op = readOperationAtPath(rule, path)

      if (typeof op === 'string' && !OPERATION_NAMES.includes(op)) {
        return `${ruleStr}: unknown operation '${op}'. Supported: ${OPERATIONS.join(', ')}, ${WILDCARD}.`
      }

      return `${ruleStr}: 'operation' must be a string or non-empty array of strings.`
    }

    if (field === 'action') return `${ruleStr}: 'action' must be 'ALLOW' or 'DENY'.`
    if (field === 'override_broader_scope') return `${ruleStr}: 'override_broader_scope' must be a boolean.`
    if (field === 'reason') return `${ruleStr}: 'reason' must be a non-empty string.`

    if (field === 'conditions') {
      if (path.length === 3) return `${ruleStr}: 'conditions' must be an array.`

      return `${ruleStr}: condition at index ${path[3]} must be a function.`
    }
  }

  return `${idStr}: ${path.join('.')}: ${zodMessage}`
}

function readOperationAtPath (rule, path) {
  if (path.length === 3) return rule?.operation

  const idx = path[3]

  return Array.isArray(rule?.operation) ? rule.operation[idx] : rule?.operation
}

/**
 * Translates the first issue of a ZodError thrown by the registerOptions
 * schema into a registerPolicy-specific human-readable message.
 *
 * @internal
 * @param {import('zod').ZodError} zodError
 * @returns {string}
 */
export function formatRegisterOptionsError (zodError) {
  const issue = zodError.issues[0]
  const path = issue.path

  if (path.length === 0) return 'registerPolicy options: must be an object.'
  if (path[0] === 'state') return "registerPolicy options: 'state' must be an object."
  if (path[0] === 'conditionTimeoutMs') return "registerPolicy options: 'conditionTimeoutMs' must be a positive finite number."

  return `registerPolicy options: ${path.join('.')}: ${issue.message}`
}
