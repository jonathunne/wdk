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

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccountReadOnly} IWalletAccountReadOnly */
/** @typedef {import('./policy-engine.js').PolicyContext} PolicyContext */

/**
 * The raw inputs from the wrapper used to build a frozen PolicyContext.
 *
 * @typedef {Object} BuildContextInput
 * @property {string} operation - The wrapped operation name (e.g. 'sendTransaction').
 * @property {string} wallet - The wallet identifier this account belongs to (the same string passed to `registerWallet`).
 * @property {IWalletAccountReadOnly} account - A read-only view of the wallet account.
 * @property {readonly unknown[]} args - The full argument array passed to the method.
 */

/**
 * Builds the immutable context object passed to every condition function.
 *
 * Each cloneable argument is passed through structuredClone so condition
 * functions see a snapshot taken at evaluation time. This prevents
 * time-of-check / time-of-use mutation: a caller mutating the original
 * tx object after the wrapper builds the context (e.g., concurrent
 * middleware on a shared request body) cannot change what the conditions
 * already evaluated. The original arguments still flow through to the
 * underlying method untouched. Arguments that aren't structured-cloneable
 * (functions, class instances with non-cloneable internals) fall back to
 * their raw value.
 *
 * @internal
 * @param {BuildContextInput} input - The raw inputs from the wrapper.
 * @returns {PolicyContext} A frozen context object.
 */
export function buildContext ({ operation, wallet, account, args }) {
  const safeArgs = Object.freeze(snapshotArgs(args))

  return Object.freeze({
    operation,
    wallet,
    account,
    params: safeArgs[0],
    args: safeArgs
  })
}

/**
 * Clones each argument so the result is isolated from later mutation of the
 * caller's originals (see {@link buildContext} for the cloning semantics and
 * the non-cloneable fallback).
 *
 * Besides building the condition context, the wrapper forwards a snapshot of
 * the arguments to the underlying wallet method. Cloning there closes a
 * time-of-check / time-of-use gap: policy evaluation is asynchronous, and
 * without an isolated copy a caller could mutate the original argument objects
 * across that await (e.g. flip `tx.to` / `tx.value` after the policy already
 * approved them) and have the mutated values reach the wallet. Each wrapped
 * call takes its own snapshot, so the forwarded copy is also independent from
 * the context the conditions see — a condition cannot mutate its way into the
 * executed call.
 *
 * @internal
 * @param {readonly unknown[]} args - The full argument array passed to the method.
 * @returns {unknown[]} A new array whose elements are per-argument snapshots.
 */
export function snapshotArgs (args) {
  return Array.from(args, snapshot)
}

function snapshot (value) {
  if (value === null || typeof value !== 'object') return value

  try {
    return structuredClone(value)
  } catch (err) {
    // structuredClone throws DOMException(name: 'DataCloneError') for values
    // it can't serialize (functions, class instances with non-cloneable
    // internals, etc.). Fall back to the raw value in that case; rethrow
    // anything else so real bugs surface.
    if (err.name === 'DataCloneError') return value
    throw err
  }
}
