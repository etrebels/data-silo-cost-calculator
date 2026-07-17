# Data Silo Cost Calculator

**Open-source model for the annual cost of fragmented, disconnected data — and the ROI of unifying it.** For data and AI leaders (CDO, Head of Data, Head of AI) sizing the cost of data silos before an integration or knowledge-graph investment.

▶ **Use the live tool:** [tools.langoptima.com/calculator](https://tools.langoptima.com/calculator)

The live version adds a saved, shareable report. This repo is the open calculation engine underneath — the assumptions are transparent and yours to inspect.

> The pricing figures here are **illustrative placeholders**, not a quote. Plug in your own numbers (see [`config.example.json`](./config.example.json)) before relying on the output.

## What it models

- The annual cost of siloed data: duplicated effort, integration overhead, and analyst/scientist time lost to reconciliation.
- The ROI and payback period of moving to a unified, connected data layer.

## Install & use

```bash
npm install
npm run typecheck && npm test
```

```ts
import { calculateResults, DEFAULT_INPUTS } from "@langoptima/data-silo-cost-calculator";

const result = calculateResults(DEFAULT_INPUTS);
// → cost breakdown, ROI projection, payback period (or null if it never pays back)
```

Framework-agnostic TypeScript, zero runtime dependencies.

## Built by LangOptima

LangOptima builds AI-ready data and knowledge-graph systems for enterprises. This is one of our open-source [free tools](https://tools.langoptima.com) — [langoptima.com](https://www.langoptima.com).

## License

[Apache-2.0](./LICENSE). Free to use, modify, and redistribute. The **LangOptima name and marks are not licensed** — a fork may not imply endorsement (see [`NOTICE`](./NOTICE)). Contributions: [`CONTRIBUTING.md`](./CONTRIBUTING.md) · Support: [`SUPPORT.md`](./SUPPORT.md).
