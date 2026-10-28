# 🔬 Resonance Labs

Welcome to the official repository for **Resonance Labs**, an experimental R&D environment focused on low-latency hybrid AI architectures, browser-based neural network model configuration, and computational metacognition.

## 🚀 Vision
Resonance Labs bridges the gap between deep learning theory and production-grade engineering. We provide developers and students with a unified SaaS studio to design, train, and deploy multi-model pipelines right in the browser.

## 📦 Key Subsystems
*   **Neural Layer Designer:** Interactive drag-and-drop workspace supporting local client training via WebGPU and WebAssembly.
*   **Multi-Model Router:** Real-time optimization matrix tracking latency bottlenecks, inference cost balances, and model performance.
*   **Metacognitive Control Console:** An experimental dashboard designed to train and monitor AI models equipped with reflective inner monologues and autonomous self-correction loops.
*   **PayPal Billing Loop:** Full multi-tenant subscriber account routing with automated usage limits.
*   **Educational Curriculum:** Structured engineering lessons and interactive runtime scratchpads for mastering Actor-Critic architectures.

## 🛠️ Architecture & Modules

### Module 1: Relational Database Architecture (PostgreSQL)
Found in `database/schema.sql`. Contains schema definitions for:
- `user_profiles`: Multi-tenant user profiles with PayPal subscription tiers (`hobby`, `pro`, `enterprise`) and billing status.
- `ai_projects`: AI Model Projects Topology storing layer chains in JSONB alongside learning rates, empathy factors, and metacognition factors.
- `telemetry_logs`: High-throughput time-series logs tracking task loss, task accuracy, metacognitive confidence, inner monologue snapshots, and token rates.

### Module 2: Production Express Server Runtime
Found in `server.ts` and `server/app.ts`. Provides REST endpoints:
- `POST /api/auth/register-interest`: Pre-launch landing page waitlist registration.
- `POST /api/v1/billing/paypal-webhook`: Automated PayPal subscription lifecycle handling (`BILLING.SUBSCRIPTION.CREATED`, `BILLING.SUBSCRIPTION.ACTIVATED`, `CANCELLED`).
- `POST /api/v1/studio/commit-model`: Commits complete network states and empathy/metacognition parameters to registry.
- `GET /api/v1/telemetry/stream/:projectId`: Serves real-time execution snapshots mapping actor error vs. critic reflection states.
- `GET /api/health`: Hardware and server runtime status.

### Module 3: System Hardware Health Telemetry
Found in `scripts/system_health_telemetry.py`. Local Python automation engine monitoring system CPU load, thread states, and platform diagnostics.

### Module 4: Educational Curriculum (Lesson 01)
Interactive implementation of computational metacognition and the Actor-Critic loop with real-time confidence evaluation and self-correction playback.

## 🏃 Quickstart

```bash
# Install dependencies
npm install

# Start full-stack development studio (Express API + Vite SPA)
npm run dev
```

Visit `http://localhost:3000` to access the Resonance Labs Studio.
