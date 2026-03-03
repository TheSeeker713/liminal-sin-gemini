# Cloud Infrastructure & Budget Management

## 1. Architecture Overview
* **AI Backend (Google Cloud):** Vertex AI handles the heavy multimodal lifting and parses the Game Master's Trust logic. The Gemini Live API manages the real-time, interruptible voice streams.
* **Web Hosting & Edge Routing (Cloudflare):** Cloudflare serves as our primary host and server for the web-facing application and DNS. It handles incoming player connections and securely routes API requests to GCP, keeping latency low so player interruptions hit the AI instantly.

Note: When deployed to Clouflare Pages, The website will be ls.thes33k3r.com. 

* **Asset Storage:** Google Cloud Storage (GCS) hosts the FMV video snippets and any dynamically warped visual assets the Game Master triggers.

## 2. Budget & Resource Allocation
* **The Bankroll:** We are operating on an approved $300 Google Cloud credit for this contest. 
* **Token Optimization:** To prevent burning through the credits, we need strict context window management. The Game Master only needs the *current* Trust Level (High/Neutral/Low) and the last few dialogue turns to make decisions, not the entire historical chat log. 
* **Caching:** Cache repetitive FMV retrieval requests at the Cloudflare edge where possible to minimize redundant GCP storage reads.

## 3. Real-Time State & Latency Management
* **The Interruption Imperative:** Because the core mechanic relies on the player physically interrupting the emotional (but rational) NPCs, the handshake between the client, Cloudflare, and the Gemini Live API must be damn near instantaneous. 
* **Trust State Syncing:** The Game Master's JSON outputs (updating Trust) must be written to a lightweight, low-latency database (like Firestore) so the active NPC's prompt is seamlessly updated the second the player interrupts or finishes speaking.

## 4. Environment & Deployment
* **Project Targeting:** Ensure all automated deployment scripts and standard GCP CLI commands target the `myceliainteractive` project ID.
* **Security:** Never commit `.env` files. API keys (`GEMINI_API_KEY`, Cloudflare tokens, etc.) stay strictly out of version control.