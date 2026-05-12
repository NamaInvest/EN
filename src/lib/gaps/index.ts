/**
 * Gap-filling engines barrel.
 * Each engine adds a feature missing from the current ERP per global ERP comparison.
 *
 * To wire into the main app, import from this barrel:
 *   import { runAnomalyDetection, forecastDemand, computeEVM } from '@/lib/gaps';
 */

export * from './anomaly-detection-engine';
export * from './anomaly-explanation';
export * from './demand-forecast-v2-engine';
export * from './esg-engine';
export * from './evm-engine';
export * from './abc-costing-engine';
export * from './olap-cube-engine';
export * from './customer-portal-v2-engine';
export * from './vendor-portal-v2-engine';
export * from './document-ai-extraction';

export * from "./restaurant-core-engine";
