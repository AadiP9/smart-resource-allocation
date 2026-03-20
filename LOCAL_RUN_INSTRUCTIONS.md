# Smart Resource Allocation System (SRAS) MVP

## Prerequisites
- Node.js (v16+)
- MongoDB (Running locally on `mongodb://127.0.0.1:27017` or update `backend/server.js` with your URI)

## 1. Setup Backend
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with dummy data:
   ```bash
   node seed.js
   ```
4. Start the server:
   ```bash
   npm run dev
   # OR
   node server.js
   ```
   *The backend runs on http://localhost:8000*

## 2. Setup Frontend
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend usually runs on http://localhost:5173*

## 3. Demo the Application
- **Admin Dashboard**: Open `http://localhost:5173/` to see the heatmap, priority alerts, and live feed.
- **Field Worker Screen**: Open `http://localhost:5173/field` to submit a new report using the mock OCR/Voice buttons. Submitting a report will instantly trigger a WebSockets update on the Admin Dashboard and Volunteer App.
- **Volunteer App**: Open `http://localhost:5173/volunteer` to see a list of urgent tasks matching the volunteer's proximity. Accepting or completing a task updates the Admin Dashboard live feed.
