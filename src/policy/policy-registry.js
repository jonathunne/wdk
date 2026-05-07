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
  constructor () {
    /** @private */
    this._project = []

    /** @private */
    this._accountByChain = Object.create(null)
  }

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
  add (policy, chains) {
    const cloned = clonePolicy(policy)

    if (cloned.scope === 'project') {
      // Tag the cloned policy with its chain restriction for later filtering.
      // undefined means "applies to every chain".
      cloned._chains = chains
      replaceById(this._project, cloned)

      return
    }

    for (const chain of chains) {
      this._accountByChain[chain] ??= []

      replaceById(this._accountByChain[chain], cloned)
    }
  }

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
  applicable (chain, path, index) {
    const account = []

    if (this._accountByChain[chain]) {
      for (const policy of this._accountByChain[chain]) {
        if (matchesAccount(policy.accounts, path, index)) {
          account.push(policy)
        }
      }
    }

    const project = []

    for (const policy of this._project) {
      if (policy._chains === undefined || policy._chains.includes(chain)) {
        project.push(policy)
      }
    }

    return { account, project }
  }

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
  relevant (chain, path, index) {
    const { account, project } = this.applicable(chain, path, index)

    return [...account, ...project]
  }

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
  disposeChain (chain) {
    delete this._accountByChain[chain]

    this._project = this._project.filter((policy) => {
      if (policy._chains === undefined) return true

      const remaining = policy._chains.filter((c) => c !== chain)

      if (remaining.length === 0) return false

      policy._chains = remaining

      return true
    })
  }

  /**
   * Removes every registered policy across both buckets.
   */
  disposeAll () {
    this._project = []

    for (const key of Object.keys(this._accountByChain)) delete this._accountByChain[key]
  }
}

function matchesAccount (accounts, path, index) {
  if (!Array.isArray(accounts)) return false

  for (const entry of accounts) {
    if (typeof entry === 'string') {
      if (path !== undefined && entry === path) return true
    } else if (typeof entry === 'number') {
      if (index !== undefined && entry === index) return true
    }
  }

  return false
}

function replaceById (list, policy) {
  const i = list.findIndex((p) => p.id === policy.id)

  if (i === -1) {
    list.push(policy)
  } else {
    list[i] = policy
  }
}

function clonePolicy (policy) {
  return {
    ...policy,
    accounts: policy.accounts ? [...policy.accounts] : undefined,
    rules: policy.rules.map(cloneRule)
  }
}

function cloneRule (rule) {
  const cloned = {
    ...rule,
    operation: Array.isArray(rule.operation) ? [...rule.operation] : rule.operation,
    conditions: [...rule.conditions]
  }

  // Phase 2 reservation: rule.state is engine-managed at runtime in Phase 2.
  // Deep clone here so the caller's reference cannot be mutated post-registration.
  if (rule.state !== undefined) {
    cloned.state = structuredClone(rule.state)
  }

  return cloned
}
