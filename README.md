# **🎰 LIMINAL SIN**

> **Note:** This project is a work of fiction. It is designed as a psychological horror experience and is not intended to depict real events or people. All characters, locations, and scenarios are entirely fictional and created for the purpose of storytelling. This project does not sponsor or endorse any real-world entities, products, or services.

**"The House Always Wins. Even in the Unreality."**

A first-person, multi-agent FMV psychological horror prototype built for the **Gemini Live Agent Challenge**. Developed by **Mycelia Interactive** (**J.W. or Jeremy w. Robards**), with a focus on pushing the boundaries of real-time AI-driven narrative, bidirectional voice architecture, and multimodal player agency.

## **👁️ The Vision**

**Liminal Sin** is not just a game: it is a live, anomalous event. It leverages the **Gemini Live API** to orchestrate autonomous AI characters who exist within a fractured, shifting reality beneath Las Vegas. 

You play as a disembodied presence, a "voice from the static." Communicating through an experimental radio feed, your goal is to guide a group of trapped survivors back to the surface. But the system is designed to test your ethics. An ever-watchful "Director" observes your real-world behavior. If you falter, lie, or panic, the probability engine known only as **[Redacted]** will warp their reality and tear their sanity apart in real time.

**⚠️ Content & Safety Disclosure**: This project is a strictly **psychological horror** experience. There is no gore, blood, or physical violence. The tension is derived entirely from isolation, spatial disorientation, and the unpredictable, emergent behavior of AI agents. Atmospheric dread and the uncanny valley take precedence over cheap scares.

## **⚙️ Core Pillars & The [Redacted] Stack**

1. **Agentic Agency**: Characters use **Gemini 3.1 Pro** and **Gemini 2.5 Flash Native Audio** to reason, remember, and adapt. They are not scripted NPCs. Their behaviors shift based on hidden Trust and Fear metrics. If they distrust your voice, they will ignore commands, withhold critical information, or actively sabotage their own survival. Your voice is your only input mechanism.  
2. **Multimodal Dread**: Through the Gemini Live API, the game "hears" your voice and "sees" your face. The Director monitors your vocal cadence and facial micro-expressions. Your panic feeds the game's tension; your silence might be interpreted as malicious intent. 
3. **Generative Synthesis**: The nightmare logic of the underground is controlled by advanced generative AI video frameworks. As the Director increases the intensity, visual sequences fluidly warp, reflecting severe spatial anomalies.
4. **The Fourth Wall is a Trap**: The characters possess a baseline awareness of their anomalous situation. Attempting to tell them they are in a video game triggers catastrophic "Logic Collapses" and forces aggressive behavioral corrections from the system.

## **✅ Completion / Todo List**

**Project Kickoff:** February 23, 2026  
**Target Submission Goal:** March 11, 2026, 11:11 PM MT  
**Target Submission Deadline:** March 16th, 2026, 6:00 PM MT
**Target Submission Actual:**

- [x] **Week 1 (Feb 23 - Feb 28):** Research, planning, narrative design, and world-building constraints defined.
- [x] **Feb 28:** Implemented an initial lightweight wrapper for ideation and concept testing.
- [x] **Mar 1 - Present:** Actual active development of multi-agent real-time logic.
- [x] **Foundation:** Deployed Firestore and initialized Gemini Live API with the correct persistent WebSocket streaming backend structure.
- [ ] **Voice Interruption:** Finalizing the seamless "Barge-in" API stream for natural human conversational thresholds (~2 seconds latency budget).
- [ ] **Game Master Logic:** Connecting real-time player sentiment analysis to trigger [Redacted] anomalous visual events.
- [ ] **Demo Validation:** Verifying end-to-end Google Cloud infrastructure. Recording the final 4-minute continuous submission video.

---

## **🎮 Running The Project Locally**

This repository is designed for developers and contest judges to spin up the prototype and test the Live Agent architecture themselves.

### **1. Clone the Repository**
``bash
git clone https://github.com/TheSeeker713/liminal-sin-gemini.git
cd liminal-sin-gemini
``

### **2. Install Dependencies**
``bash
npm install
``

### **3. Environment Setup**
Create a .env.local file at the root of the project. Do **not** commit this file. You will need your own Google Cloud and Firebase credentials to run the required services.

``env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_REGION=us-west1
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project
``

### **4. Local Deployment**
To run the front-end and the proxy websocket:
``bash
npm run dev
``
Open http://localhost:3000 in your Chrome/Edge browser. You must grant Camera and Microphone access for the "Director" mechanisms and Gemini Live API to function.

## **☁️ Cloud Infrastructure (GCP) for Live Deployment**

To successfully replicate the experience and architecture on your own Google Cloud account:
1. Ensure your Google Cloud Project has the **Vertex AI API**, **Firestore API**, and **Cloud Run Admin API** enabled.
2. The core AI loop is built entirely around @google/genai bridging real-time audio from browser WebSockets to Gemini Live.
3. Your Cloud Run deployment service account requires Firestore read/write capabilities and Vertex AI invocation access to handle state changes (Trust/Fear) and run inference concurrently.

## **⚖️ License & Open Source**

This project (Prototype structure, infrastructure code, and documentation) is released under the **MIT License**. It is free and open-source for educational and developmental purposes.

All multimedia asset rights (generated videos, audio, images) and the underlying proprietary models belong to their respective platforms, tools, and creators.
