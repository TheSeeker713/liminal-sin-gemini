# **🎰 LIMINAL SIN**

**"The House Always Wins. Even in the Unreality."**

A first-person, multi-agent FMV psychological horror experience built for the **Gemini Live Agent Challenge**. Developed by **Mycelia Interactive**.

## **👁️ The Vision**

**Liminal Sin** is not just a game: it is a "live" anomalous event. It leverages the **Gemini Live API** to create a world where autonomous AI characters do not just follow scripts; they exist within a fractured reality beneath the Las Vegas Strip. The experience aims to bridge the gap between cinema and agency, using the latest advancements in large language models to create a "Director" that watches you as closely as you watch the screen.

You play as a disembodied presence, a "voice from the static," communicating with a filmmaker named **Jason**. Your goal is to guide Jason through the maze to find his lost companions, but the system is designed to test your ethics. If you are feeling particularly cruel, you can watch the "Slotsky" probability engine tear their sanity apart by feeding their paranoias and manipulating their surroundings in real time.

**⚠️ Content & Safety Disclosure**: This project is a strictly **psychological horror** experience. There is no gore, blood, or extreme physical violence. The tension is derived entirely from spatial disorientation, isolation, and the unpredictable behavior of the AI agents. We prioritize atmospheric dread, the "uncanny valley," and existential weight over visceral shock.

### **Core Pillars:**

1. **Agentic Agency**: Characters use **Gemini 3.1 Pro** and **Gemini 2.5 Flash Native Audio** to reason, remember, and rebel. They are not NPCs: they are agents with shifting Trust and Fear metrics. Unlike traditional branching narratives, their reactions are emergent. If Jason begins to distrust your voice, he may withhold information, choose different paths than the ones you suggest, or even attempt to mute his smart glasses to escape your influence. This creates a "human-on-the-loop" architecture where your social engineering is the primary mechanic.  
2. **Multimodal Dread**: The game "sees" you via your webcam and "hears" your voice. Using the Gemini Live API, the system monitors your vocal cadence and facial micro-expressions. If you sound panicked, Jason will sense your instability and his own Fear metrics will spike. If you remain eerily calm during a high-tension sequence, the "Director" may interpret this as a sign of your own anomalous nature, triggering more aggressive psychological tactics. The characters smell your confidence or your fear through the static.  
3. **Full Generative Synthesis**: The environment is constructed entirely through advanced AI generation to ensure total control over the nightmare logic. We utilize **VEO 3**, **Kling 3.0**, and **Grok Imagine** to create synthetic liminal Vegas spaces, such as impossible Bally’s basements and infinite concrete flood tunnels. This workflow allows for "visual glitches" where the architecture subtly shifts in real time; a door that was there a moment ago might dissolve into a wall, or the lighting might begin to pulse in a rhythm that matches the character's heartbeat.  
4. **The Fourth Wall is a Lie**: The AI agents are programmed with a baseline awareness of their anomalous situation. Attempting to tell the characters they are in a video game or a simulation does not break the immersion; instead, it triggers a "Logic Collapse" event. The characters will experience an existential crisis, the FMV will begin to "tear" with generative artifacts, and the Slotsky engine will drastically increase the Anomalous Intensity. Reality is a consensus, and your interference can shatter it.

## **🏗️ Technical Architecture: The "Slotsky" Stack**

Liminal Sin runs on a sophisticated multi-agent hierarchy orchestrated through Google Cloud, ensuring that every interaction is persistent and reactive.

### **1\. The Director Agent (The House)**

* **Model**: gemini-3.1-pro-preview-09-2025  
* **Role**: Acting as the "Game Master," this agent has **Bimodal Perception**. It processes a 1 FPS video stream of the player and a continuous audio feed via the Gemini Live API.  
* **Function**: This agent is the orchestrator of the experience. It does not speak to the player directly; instead, it manipulates the "Anomalous Intensity" (AI) variable in **Firestore**. When the AI variable rises, the Director triggers FMV sequence swaps, ambient audio shifts, and environmental "glitches." It acts as the house in a casino, always ensuring that the odds are stacked against the survivors. It is the invisible architect of the nightmare.

### **2\. The Character Agents (The Survivors)**

* **Models**: Individual instances of gemini-2.5-flash-preview-tts and gemini-2.5-flash-preview-09-2025.  
* **The POV: Jason**: Jason is a guerrilla filmmaker whose smart glasses provide your only window into the underworld. You see what he sees, and he hears your voice as an intrusive thought or a radio transmission. He is highly suggestible and prone to panic, though his professional documentarian instinct often overrides his fear until the situation becomes undeniably impossible.  
* **The Lost: Audrey and Josh**: Audrey, a skeptical casino employee, and Josh, Jason's boisterous best friend, have been separated from Jason during the initial fall. In this vertical slice, they are heard but not seen. They communicate via distant shouts, radio static, or the "Director" using their voices as bait. Your goal is to navigate Jason toward them, though their trust in your voice must be earned before they will reveal their true locations.  
* **Unimodal Constraints**: Characters can only hear the player voice. They cannot "see" the game state or the player facial expressions unless the Director "describes" those feelings to them via internal hidden prompts. This creates a massive informational asymmetry that the player must manage.

### **3\. The FMV Pipeline**

* **VEO 3 and Kling 3.0**: These models handle high-fidelity, temporal-consistent video generation to create the core FMV sequences. The use of generative video allows for a non-Euclidean environment where spaces can rearrange themselves without the constraints of physical filming.  
* **Morphic Studio**: Used to maintain character consistency across generative video clips, ensuring that Jason, Audrey, and Josh maintain their visual identity throughout the narrative.  
* **Grok Imagine**: Employed for initial environment plates and conceptual stills to define the aesthetic of each underworld layer before they are animated into living, breathing FMV segments.

## **📜 Vertical Slice: "The Sunken Oasis"**

The contest submission for the Gemini Live Agent Challenge is a single, self-contained vertical slice prototype. This playable level serves as a proof of concept for the broader multi-agent FMV ecosystem and showcases the "Sunken Oasis" anomaly.

### **The Mission: Finding the Lost**

In this level, the player must guide Jason through a spatial anomaly to find **Audrey** and **Josh**. While their voices echo through the tunnels, their physical location is constantly being shifted by the Slotsky engine. The player acts as the communications relay, passing information between separated characters who cannot hear each other directly.

### **The Setting: Contrast and Dissonance**

The level is set within a massive intersection where a segment of the **Boring Company Tunnel** has meshed with an abandoned, underground water park. The visual style is defined by a jarring, uncomfortable contrast:

1. **The Infrastructure**: One half of the playable area consists of the Boring Tunnel. It is harsh, industrial, and oppressive: defined by raw concrete, exposed wiring, and sterile white LED strips. It represents the cold reality of construction and progress.  
2. **The Sunken Oasis**: The other half is a perfectly preserved, abandoned water park. Unlike the decay typical of such spaces, this park is fully functional. The lights are bright and inviting; the water is clear, majestic, and flowing through intricate slides and lazy rivers. It looks beautiful, pristine, and completely out of place beneath the earth.

### **Gameplay Implications**

This "majestic" water park serves as a trap for the characters' senses. While the Boring Tunnel feels like a prison, the Sunken Oasis feels like a sanctuary, yet its perfection is what makes it anomalous. The clear, flowing water becomes a primary source of dread; Jason may see reflections of Audrey and Josh that are not actually there, or hear the sound of their laughter echoing through the slides when the player remains silent. The majestic beauty is the house's primary weapon.

### **The Antagonist: Slotsky**

Slotsky is not a person or a monster. It is a **Probability Engine**  that governs the logic of the underworld. It is the manifestation of the Vegas philosophy: "The House Always Wins." The engine calculates the likelihood of character survival based on the player's interactions.

When the player speaks, the model interprets the intent. If the player lies to Jason or leads him toward the false echoes of his friends in the "majestic" water, the "Slotsky Engine" increases the intensity of the horror. The engine treats the survivors like chips on a table: once the player runs out of "Trust," the house collects its debt, and the character is lost to the static.

## **🛠️ The 21-Day Vertical Slice Roadmap**

Our mission for the Devpost submission is a high-polish execution of "The Sunken Oasis," proving the technical feasibility of real-time multi-agent FMV.

* **Phase 1: Foundation (Days 1-7)**  
  * Deploy the **Firestore** architecture to handle multi-agent state persistence and real-time variable updates for Trust and Fear.  
  * Initialize the **Gemini Live API** logic, specifically focusing on Jason's audio-only reception of the player and the "Barge-in" interruption protocol.  
  * Establish the "Trust/Fear" feedback loop regarding the water park versus the tunnel in the system prompts.  
* **Phase 2: The Flesh (Days 8-14)**  
  * Finalize the "Agentic Prompting" for Jason, Audrey, and Josh, giving them specific reactions to the "beautiful" water park environment.  
  * Integrate **Vertex AI** for real-time player sentiment analysis to feed the Director Agent's pacing engine.  
  * Generate synthetic FMV sequences using **VEO 3** and **Kling 3.0** to simulate the contrast between concrete and clear, flowing water.  
* **Phase 3: The Nightmare (Days 15-21)**  
  * Finalize the visual sequences using **Grok Imagine** to define the majestic, high-end look of the "Sunken Oasis."  
  * Polish the "Director Tool" UI to show the "God-eye" view of the AI internal reasoning for the final submission video.  
  * Complete the final documentation, architecture diagrams, and GitHub repository for the Gemini Live Agent Challenge.

## **🤝 Attribution & Legal**

**Liminal Sin** is a project by **Mycelia Interactive**, a studio dedicated to exploring the intersection of artificial intelligence and interactive storytelling.

* **Author/Lead Dev**: J.W.  
* **Tech Stack**: Gemini 3.1, Gemini 2.5, Google Cloud, Vertex AI, Firebase, and the Gemini Live API.  
* **Compliance**: This project is built in strict adherence to the Google Generative AI Prohibited Use Policy. All content is designed to be safe, psychological, and transformative in its use of generative technology.

*"Keep At It, Always. Even if the tunnels never end."*

### **Reference Documentation:**

1. **Backpack.md**: Inventory and gear mechanics.  
2. **Ballys.md**: Real-world location context.  
3. **Characters.md**: Agent persona and system prompt specifications.  
4. **Gamemaster.md**: Director agent operational logic.  
5. **Instructions.md**: Player onboarding and session flow.  
6. **Player_voice.md**: Interaction protocols.  
7. **Tunnel-and-park.md**: Environment and lighting specifications.  
8. **WORLD_BIBLE.md**: The foundational lore and world layers.

## **🚀 Production Pipeline (Implementation Flow)**

This section describes how the current repository is intended to move from concept to shipped vertical slice.

### **1. Pre-Production (Narrative + Systems Design)**

* Define core narrative beats and decision loops in `/docs` (`WORLD_BIBLE.md`, `Characters.md`, `Gamemaster.md`).  
* Lock interaction rules (voice input, trust/fear updates, anomaly escalation) before implementation.  
* Finalize scene requirements and shot lists for each FMV segment.

### **2. Asset Production (FMV + Audio + Reference Packs)**

* Generate and curate visual source material in `assets/images/references` and `assets/images/screenshots`.  
* Produce and organize audio in `assets/Audio/podcasts` and `assets/Audio/Voice_Overs`.  
* Assemble clip-ready material in `assets/Clips` and `assets/screen-records` for integration/testing.

### **3. App Integration (Next.js Runtime Layer)**

* Build UI/interaction surfaces in `app/` using React 19 + Next.js App Router.  
* Integrate live model and multi-agent orchestration paths through the Google AI + Firebase layers.  
* Connect FMV playback, camera/mic capture, and state transitions (Trust/Fear/Anomaly intensity).

### **4. Validation (Stability + Experience Quality)**

* Run local development loop with `npm run dev`.  
* Enforce quality gates with `npm run lint` and TypeScript strict checks.  
* Verify real-time behavior, pacing, and fail-safe handling for disrupted camera/mic/network conditions.

### **5. Build + Release (Contest/Production Packaging)**

* Create production build with `npm run build`.  
* Serve and verify production runtime using `npm run start`.  
* Export final proof assets (screen captures, architecture notes, demo script) for submission/review.

## **🧰 Tech Stack (Current Repository)**

### **Core Framework**

* **Next.js 16.1.6** (App Router)  
* **React 19.2.3** + **React DOM 19.2.3**  
* **TypeScript 5** (strict mode)

### **AI + Real-Time Services**

* **@google/generative-ai 0.24.1** (Gemini integration surface)  
* **Firebase 12.9.0** (state + cloud integration baseline)

### **Interaction + Media**

* **react-webcam 7.2.0** (camera input)  
* **react-player 3.4.0** (video playback)  
* **howler 2.2.4** (audio control)  
* **framer-motion 12.34.3** (motion/transitions)

### **State + UI Utilities**

* **zustand 5.0.11** (client state orchestration)  
* **lucide-react 0.575.0** (icon system)  
* **clsx 2.1.1** (class composition)

### **Styling + Tooling**

* **Tailwind CSS 4** + **@tailwindcss/postcss 4**  
* **ESLint 9** + **eslint-config-next 16.1.6**  
* **React Compiler** enabled via `next.config.ts` and `babel-plugin-react-compiler`

### **Project Scripts**

* `npm run dev` → local development server  
* `npm run lint` → lint and code-quality checks  
* `npm run build` → production build  
* `npm run start` → serve production build
