# AI-Powered Smart Resource Allocation System (SRAS) 🚨🌍

[![Hackathon Ready](https://img.shields.io/badge/Status-Hackathon_Ready-success?style=for-the-badge&logo=hackaday)](https://github.com/your-username/sras)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN_|_Socket.io-blue?style=for-the-badge)](https://reactjs.org/)

SRAS is an intelligent, real-time crisis management and resource allocation platform. Designed to help NGOs and emergency responders overcome the chaos of scattered data, SRAS utilizes cutting-edge web technologies and AI integrations to gather community reports, determine urgencies, and automatically match tasks to the best-suited field volunteers. 

It is designed to feel alive—transforming a static dashboard into an **intelligent, pulsing command center** for live operational awareness.

---

## 🔥 Key Features

### 1. 🖥️ Command Center (Admin Dashboard)
- **High-End Dark UI:** Beautiful, glassmorphic dark-theme analytics environment.
- **Interactive Heatmap:** Live `react-leaflet` map exhibiting active crisis events with pulsating colored hotspots (Red=Critical, Orange=High, Green=Low).
- **Predictive AI Insights Panel:** Simulates intelligent system foresight (e.g. "Medical shortage predicted in Sector 12").
- **Live WebSocket Feed:** Real-time event log tracking system alerts, volunteer acceptances, and task completions without needing a page refresh.

### 2. 📲 Field Operative UI
- **Smart Data Ingestion:**
  - **Visual Scan:** Uses `tesseract.js` for on-device OCR logic to extract needs straight from camera uploads.
  - **Comms Link:** Uses the Web Speech API to transcribe active audio reports from the field directly into the system.
- **AI Triage Validation:** Submits the data to the backend where a custom Priority Engine identifies the core need and assigns a dynamic 0-100 `Urgency Score`.

### 3. 🧍 Volunteer Unit
- **Location-Aware Mission Board:** Calculates exact distances (simulated coordinates) between the volunteers and the active crisis hubs.
- **Action Flow:** Dynamic mission lifecycle UI (`Accept Mission` -> `Start Route` -> `Complete Mission`), immediately updating the central command dashboard in real-time.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion (for fluid animations), React Router v6, React-Leaflet, Lucide React (Icons).
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (using Mongoose schemas).
- **Real-Time Layer:** Socket.io (Bi-directional multi-client updates).
- **AI Integrations:** Tesseract.js (OCR), Web Speech API.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Running locally or an Atlas connection)

### 1. Setup the Backend
Open a terminal and execute the following:
```bash
cd backend
npm install
```
If you want to use the default configuration, create a `.env` in the backend folder:
```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/sras
```
Seed the database with testing data and start the server:
```bash
node seed.js
npm run dev
```
*(Server will start on http://localhost:8000)*

### 2. Setup the Frontend
Open a new terminal and execute:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend will start on http://localhost:5173)*

---

## 🌩️ Running the 'Crisis Simulation' Demo
To truly see the application come to life during a pitch or presentation:
1. Open the Admin Command Center (`http://localhost:5173/`).
2. Click the **"SIMULATE CRISIS"** button at the top right.
3. Watch as the system randomly generates massive crisis events, updates the live alert feed, and visually paints the priority sectors onto the interactive map—all in real-time.

---

## 🗄️ System Architecture Context

For further reading regarding early design requirements and tech stack iterations, refer to:
- `PRD.txt`
- `DesignDoc.txt`
- `TechStack.txt`
- `ToDo.md`

*(Built for Hackathon MVP Demonstrations)*
