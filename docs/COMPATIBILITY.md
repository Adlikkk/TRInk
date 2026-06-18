# TRInk Compatibility Matrix

Version: `0.3.11`

This matrix tracks current compatibility for manual local annotations. `Expiry` is not a user-facing feature. Legacy `expiry_line` data remains compatibility-only for older internal files.

Legend:
- `Yes`: supported in current builds
- `Partial`: supported with documented limits
- `Legacy`: load/render compatibility only, not user-creatable

| Drawable type | Render | Select | Move | Anchor edit | Property edit | Lock | Ordering | Duplicate | Delete | Session save | Session load | JSON export | PNG export |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pen | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Highlighter | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Arrow | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Rectangle | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Text | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Trend | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Channel | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Support / Resistance zone | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| CALL marker | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| PUT marker | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| QM Bullish | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| QM Bearish | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| BOS | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| CHoCH | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| FVG | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Liquidity Sweep | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Horizontal Line | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Vertical Marker | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Ray | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Fibonacci Retracement | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Fibonacci Fan | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Andrew's Pitchfork | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Legacy vertical marker (`expiry_line`) | Legacy | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

Notes:
- Freehand pen and highlighter strokes support whole-object move/edit. Per-point freehand anchor editing remains limited.
- Locked objects remain selectable but cannot be moved, anchor-edited, deleted, or property-edited until unlocked.
- Ordering affects render, hit-test, session save/load, annotation JSON export, and annotation PNG export.
- Timer UI and runtime state are excluded from sessions and exports.
- Selection outlines, handles, lock indicators, toolbar UI, settings UI, and palette UI are excluded from exports.
- Malformed or unsupported annotations are skipped safely during load/export validation.
