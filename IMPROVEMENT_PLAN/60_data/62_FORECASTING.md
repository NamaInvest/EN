# 62 — Forecasting | التنبؤ

## 🟡 الأولوية: متوسط

## 🔍 الموجود
- demand-forecast/ بسيط (moving average فقط)

## 🎯 الخطة

### 62.1 — Forecasting Library (5 أيام)
```typescript
export interface Forecaster {
  fit(historicalData: TimeSeries): Promise<Model>;
  predict(model, periods): Promise<Forecast>;
  evaluate(model, holdout): Promise<Metrics>;
}

class MovingAverageForecaster { ... }
class ExponentialSmoothingForecaster { ... }
class ARIMAForecaster { ... }
class ProphetForecaster { ... }
class NeuralProphetForecaster { ... }
```

### 62.2 — Sales Forecast (8 أيام)
- Per-product, per-branch, per-customer
- Daily, weekly, monthly horizons
- Seasonality (Ramadan, Eid, summer)
- Holidays effect
- New product cold-start handling

### 62.3 — Cash Flow Forecast (8 أيام)
- 13-week rolling
- AR collections (based on aging + payment patterns)
- AP payments (based on terms)
- Recurring (rent, payroll, taxes)
- Variable (utilities, marketing)
- Scenarios (best/likely/worst)

### 62.4 — Inventory Forecast (5 أيام)
- Demand forecast → reorder point
- Lead time consideration
- Safety stock optimization
- Stockout risk

### 62.5 — Demand Sensing (Real-time) (6 أيام)
- POS data → immediate signals
- Adjust forecasts daily
- Promotion lift
- External signals (weather, events)

### 62.6 — Forecast Accuracy Tracking (4 أيام)
- MAPE (Mean Absolute Percentage Error)
- Per-product accuracy
- Continuous improvement
- Model selection (ensemble)

### 62.7 — Workforce Planning (5 أيام)
- Hiring forecast
- Departures forecast
- Salary growth projections
- GOSI / EOS provisions

### 62.8 — Budget vs Forecast (4 أيام)
- Compare static budget vs rolling forecast
- Variance analysis
- Re-forecasting workflow

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Forecast MAPE | غير مقاس | < 15% |
| Cash forecast accuracy | غير مقاس | > 85% |
| Stockout reduction | غير مقاس | -50% |

## ⏱️ المدة: 45 يوم عمل
