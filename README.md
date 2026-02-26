# AgentGuard: Multi-Tenant AI Financial Firewall

**AgentGuard** is a stateful security proxy designed for the 2026 agentic web. It acts as an intelligent circuit breaker between autonomous AI agents and LLM providers, preventing "AI financial ruin" caused by infinite loops, logic errors, or unmanaged spending.

---

## 🏗️ Project Architecture

AgentGuard acts as a **Stateful Financial Layer**. It doesn't just proxy traffic; it interprets the logical and financial state of every request to protect the user's wallet.

### 🛡️ Core Security Pillars

#### 1. Recursive Loop Protection (Anti-Arson)

To prevent agents from getting stuck in repetitive logic loops that drain API balances, AgentGuard implements **SHA-256 Request Fingerprinting**.

- **Mechanism:** Every request body is hashed and stored in Redis with a sliding-window TTL.
- **Enforcement:** If an identical request is detected more than 3 times within 60 seconds, the proxy trips a circuit breaker and returns a `403 Forbidden`.

#### 2. Autonomous x402 Negotiation

AgentGuard implements the "Invisible Wallet" pattern, allowing agents to navigate paid APIs without manual developer intervention.

- **Interception:** Captures `402 Payment Required` responses from upstream providers (standardized via the x402 protocol).
- **Authorization:** Checks the specific agent's budget in Redis.
- **Resolution:** Processes the "payment," injects a verification token, and automatically retries the request so the agent receives a seamless `200 OK`.

#### 3. Multi-Tenant Budgeting

The system manages granular spending limits for multiple agents simultaneously.

- **Identity:** Agents are identified via the `x-agent-id` header.
- **Persistence:** Real-time balances are maintained in Redis, allowing for instant "top-ups" and sub-cent accounting.

---

## 📊 System Flow

1. **Agent Request** → `POST /v1/chat/completions`
2. **Pre-Handler** → SHA-256 Hashing + Redis Counter (Check for Loops)
3. **Upstream Proxy** → Forward to Provider (Mock or Real)
4. **Challenge Handling** → If `402`, trigger `processPayment()` in `services/wallet.ts`
5. **Ledger Update** → `LPUSH` transaction details to `agent_audit_log`
6. **Response Delivery** → Return successful data to Agent

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Fastify (High-performance proxying) |
| State Store | Redis (Atomic budget tracking & loop memory) |
| Language | TypeScript |
| Protocol | x402 (HTTP Payment Required) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- Redis Server running on `localhost:6379`

### Installation

```bash
npm install
```

### Running the System

**Start Redis:**
```bash
redis-server
```

**Start the Mock Provider (Target API):**
```bash
npx tsx watch src/mock/provider.ts
```

**Start AgentGuard Proxy:**
```bash
npx tsx watch src/index.ts
```

**Seed an Agent Budget:**
```bash
redis-cli SET budget:research_bot 5.00
```

---

## 🧪 Testing

Send a request via Postman to `http://localhost:3000/v1/chat/completions` with the header `x-agent-id: research_bot`.

Watch the budget deduct in real-time and check the audit log at:

```
GET http://localhost:3000/admin/audit
```

---

## 🗺️ Roadmap

This is still under development with all local configuration currently.
- [ ] **Signature Verification:** Move from simple tokens to cryptographic signatures (ECDSA).
- [ ] **Confidence-Based Spending:** Only authorize payments if the agent's internal confidence score is > 0.8.
- [ ] **Web3 Integration:** Direct settlement via Base (Coinbase L2) smart contracts.
