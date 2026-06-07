# GRIB 🧠
> *Your brain, dumped. Your AI, trained on you.*

## Quick Start

### 1. Fill in credentials
Edit `d:\Grib\.env` (already done if you followed setup)

### 2. Start the backend
```bash
cd server
npm run dev
```
Server runs on **http://localhost:5000**

### 3. Start the frontend (new terminal)
```bash
cd client
npm run dev
```
App runs on **http://localhost:5173**

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| AI | Groq (Llama 3.3 70B) |
| Auth | JWT |

## API Endpoints
```
POST  /api/auth/register
POST  /api/auth/login

POST  /api/dumps           save a dump
GET   /api/dumps           get all (paginated)
GET   /api/dumps/search    full-text search
DELETE /api/dumps/:id      delete a dump

POST  /api/chat            chat with your second brain
GET   /api/chat/history    past messages
DELETE /api/chat/history   clear history

GET   /api/insights        weekly pattern stats
```

---

*dump everything. forget nothing.*
