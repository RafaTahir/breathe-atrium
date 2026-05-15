# Data Contract

Prototype telemetry payload:

```json
{
  "device": "breatheatrium-esp32",
  "data": "simulated",
  "occupiedTempC": 30.9,
  "roofLayerTempC": 37.9,
  "relativeHumidityPct": 64.0,
  "co2Ppm": 620,
  "damperOpeningPct": 72,
  "airflowIndex": 68
}
```

Every payload must include a `data` field with one of:

- `simulated`
- `assumed`
- `measured`

Do not mix measured and simulated series without explicit labels.
