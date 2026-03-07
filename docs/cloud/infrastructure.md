# Cloud Infrastructure & Budget Management
*Modified: March 7, 2026*

## 1. Architecture Overview
* **AI Backend (Google Cloud):** Vertex AI handles the heavy multimodal lifting and parses the Game Master's Trust logic. The Gemini Live API manages the real-time, interruptible voice streams.
* **Web Hosting & Edge Routing (Cloudflare):** Cloudflare serves as our primary host and server for the web-facing application and DNS. It handles incoming player connections and securely routes API requests to GCP, keeping latency low so player interruptions hit the AI instantly.

Note: Game is served at `myceliainteractive.com/ls/game` (public) and `myceliainteractive.com/ls/judges/game` (judge access). The backend API domain will be the Cloud Run service URL. 

* **Asset Storage:** Google Cloud Storage (GCS) hosts the FMV video snippets and any dynamically warped visual assets the Game Master triggers.

## 2. Budget & Resource Allocation
* **The Bankroll:** We are operating on an approved $300 Google Cloud credit for this contest. 
* **Token Optimization:** To prevent burning through the credits, we need strict context window management. The Game Master only needs the *current* Trust Level (High/Neutral/Low) and the last few dialogue turns to make decisions, not the entire historical chat log. 
* **Caching:** Cache repetitive FMV retrieval requests at the Cloudflare edge where possible to minimize redundant GCP storage reads.

## 3. Real-Time State & Latency Management
* **The Interruption Imperative:** Because the core mechanic relies on the player physically interrupting the emotional (but rational) NPCs, the handshake between the client, Cloudflare, and the Gemini Live API must be damn near instantaneous. 
<!-- DEPRECATED: Turn-based updating is not used with the Live API.
* **Trust State Syncing:** The Game Master's JSON outputs (updating Trust) must be written to a lightweight, low-latency database (like Firestore) so the active NPC's prompt is seamlessly updated the second the player interrupts or finishes speaking.
-->
* **Trust State Syncing:** The Game Master's JSON outputs (updating Trust) must be written to a lightweight, low-latency database (like Firestore). Because Gemini Live uses persistent WebSockets instead of turn-based prompts, state changes trigger functional updates dynamically rather than hot-swapping the actual NPC system prompt mid-stream.

## 4. Environment & Deployment
* **Project Targeting:** All GCP CLI commands target project ID `project-c4c3ba57-5165-4e24-89e` (display name: Mycelia Interactive). Region: `us-west1`.
* **Auth:** Application Default Credentials (ADC) via `gcloud auth application-default login`. No API key strings. Vertex AI mode bills against GCP project credits.
* **Security:** Never commit `.env` files. No API keys in version control. Cloud Run pulls credentials from the attached service account via ADC automatically.