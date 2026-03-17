# AgentGuard: Multi-Tenant AI Financial Firewall

AgentGuard is a stateful security proxy engineered for the 2026 agentic web. It acts as an intelligent **circuit breaker** between autonomous AI agents and LLM providers, preventing "AI financial ruin" caused by infinite loops, logic errors, or unmanaged spending.

---

## 🏗️ Project Architecture

AgentGuard acts as a **Stateful Financial Layer**. Unlike standard proxies, it treats agents as first-class entities with defined profiles, spending caps, and operational statuses.

### Monorepo Structure

```
AGENTGUARD/
├── backend/            # Fastify API, Redis Logic, & Wallet Service
├── frontend/           # React Dashboard (Vite + Tailwind)
└── README.md           # Project Documentation
```

---

## 🛡️ Core Security Pillars

### 1. Recursive Loop Protection (Anti-Arson)

To prevent agents from getting stuck in repetitive logic loops that drain API balances, AgentGuard implements **SHA-256 Request Fingerprinting**.

- **Mechanism:** Every request body is hashed and stored in Redis with a sliding-window TTL.
- **Enforcement:** If an identical request is detected more than 3 times within 60 seconds, the proxy trips a circuit breaker and returns a `403 Forbidden` with the reason `AgentGuard_Blocked`.

### 2. Autonomous x402 Negotiation

AgentGuard implements the **"Invisible Wallet"** pattern, allowing agents to navigate paid APIs without manual developer intervention.

- **Interception:** Captures `402 Payment Required` responses from upstream providers (standardized via the emerging x402 protocol).
- **Authorization:** Automatically checks the specific agent's `maxPerRequest` safety cap and `totalBudget`.
- **Resolution:** Processes the payment, updates the JSON agent profile in Redis, and retries the request seamlessly.

### 3. Entity-Based Management

The system moves beyond simple key-value pairs to a structured **Agent Entity Model**.

- **Governance:** Every agent has a status (`active`, `frozen`, `retired`) and a per-request spending limit.
- **Persistence:** Real-time profiles are maintained as JSON strings in Redis, ensuring atomic updates and high-speed retrieval.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js v20+ (ESM) |
| **Framework** | Fastify (High-performance proxying) |
| **State Store** | Redis (JSON-serialized Agent profiles & audit logs) |
| **Language** | TypeScript (Strict type safety) |
| **Protocol** | x402 (Standardized HTTP Payment Required) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- Redis Server running on `localhost:6379`

### Installation

```bash
git clone https://github.com/Ahsanulk27/agent-guard.git
cd agent-guard/backend
npm install
```

### Running the System

**1. Start Redis:**
```bash
# In a separate terminal
redis-server
```

**2. Start the Mock Provider (Target API):**
```bash
# From the /backend directory
npx tsx watch src/mock/provider.ts
```

**3. Start AgentGuard Proxy:**
```bash
# From the /backend directory
npx tsx watch src/app.ts
```

---

## 🧪 API Reference & Testing

### Register a New Agent

`POST http://localhost:3000/admin/register`

```json
{
  "id": "research_bot",
  "name": "Deep Research AI",
  "initialBudget": 15.00,
  "maxPerRequest": 0.50
}
```

### Update / Top-up Budget

`POST http://localhost:3000/admin/budget`

```json
{
  "agent_id": "research_bot",
  "amount": 10.00
}
```

### System Observability

- **Live Stats:** `GET /admin/stats` — Returns all registered agent profiles
- **Audit Ledger:** `GET /admin/audit` — Returns full transaction history

---

## 🗺️ Roadmap

- [x] **Entity-Based Management:** Shift from primitive strings to structured Agent JSON objects.
- [ ] **UI Command Center:** A React-based dashboard for real-time monitoring and "Kill-Switch" control.
- [ ] **API Key Mapping:** Transition from manual headers to secure `Authorization: Bearer` token mapping.
- [ ] **Web3 Settlement:** Direct, non-custodial settlement via Coinbase Managed Wallets on Base L2.
