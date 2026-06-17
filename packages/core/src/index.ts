/**
 * @databolsa/core — financial calculation engine.
 *
 * Public API surface for packages/core.
 * Import from this file; never from internal modules directly.
 */

export { calculateAveragePrice, calculateCurrentQuantity, calculatePosition, calculateRealizedGain } from './position';
export type { PositionResult, Transaction, TransactionType } from './types';
export { simulatePosition } from './simulate';
export type { HypotheticalTransaction, SimulationInput, SimulationResult } from './simulate';
export { buildPortfolioSeries, buildPortfolioSeriesWithCurrencies } from './timeseries';
export type { TimeSeriesPoint, PricePoint } from './timeseries';
