/**
 * @databolsa/core — financial calculation engine.
 *
 * Public API surface for packages/core.
 * Import from this file; never from internal modules directly.
 */

export { calculateAveragePrice, calculateCurrentQuantity, calculatePosition } from './position';
export type { PositionResult, Transaction, TransactionType } from './types';
