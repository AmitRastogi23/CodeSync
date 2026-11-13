# 🚀 CodeSync - Real-Time Collaborative Interview Platform

CodeSync is a production-ready, full-stack technical interview platform designed for seamless, real-time collaboration. It bridges the gap between interviewers and candidates by providing a unified workspace with live code editing, video/audio calling, collaborative whiteboarding, and built-in proctoring.

### 🔗 [Live Demo](https://codesync-interview-six.vercel.app/)

---

## ✨ Key Features

- **🔐 Enterprise-Grade Authentication:** Secure login/signup using Passport.js with support for **Local (Email/Password)**, **Google OAuth**, and **GitHub OAuth**. Includes Email OTP verification and **TOTP-based 2FA** (Google Authenticator).
- **⚡ Conflict-Free Real-Time Collaboration:** Integrated **Monaco Editor** with **Yjs (CRDT)** for simultaneous coding. No data loss, no overwrites, and sub-second synchronization latency.
- **🎨 Collaborative Whiteboard:** Real-time shared drawing canvas built with Excalidraw and Yjs, syncing both elements and live user cursors.
- **🎥 Integrated Video & Audio:** Peer-to-peer WebRTC video calling with Socket.io for signaling, allowing face-to-face interaction during the interview.
- **🛡️ Smart Proctoring System:** Automatically detects tab-switching, window blur, and fullscreen exits, sending instant alerts to the interviewer.
- **💻 Live Code Execution:** Secure code execution in **6 languages** (C, C++, Java, JS, Python, PHP) against visible and hidden test cases using the Judge0 API.
- **💬 Real-Time Chat & Notifications:** Built-in WebSocket chat with unread message badges to keep communication flowing without leaving the room.
- **📝 Automated Reports:** Generates a comprehensive PDF interview report including final code, test case results, private interviewer notes, and violation logs.
- **⏳ Waiting Room & Access Control:** Strict room security. Candidates must wait in a secure waiting room until the interviewer explicitly admits them.

---

## 🏗️ System Architecture

CodeSync is divided into three specialized services to handle high concurrency and real-time state:

1. **Frontend (React + Vite):** Handles the UI, Monaco editor, Excalidraw, and WebRTC video streams.
2. **Backend API & Socket Server (Node.js + Express):** Handles authentication, database operations, email dispatch, code execution, and WebRTC signaling.
3. **Yjs WebSocket Server (Node.js):** A dedicated CRDT server to handle high-frequency code and whiteboard state synchronization without blocking the main API server.

---

## 🛠️ Tech Stack

### Frontend

- **React.js (Vite):** UI development
- **Monaco Editor:** Core code editor
- **Yjs & y-monaco:** CRDT-based code synchronization
- **Excalidraw:** Collaborative whiteboard
- **WebRTC:** Peer-to-peer video/audio
- **React Router & Context API:** Routing and state management

### Backend

- **Node.js & Express.js:** REST API and server logic
- **Socket.io:** Real-time chat, signaling, and room state
- **Passport.js:** Authentication strategies (Local, OAuth)
- **Speakeasy & QRCode:** 2FA implementation
- **Judge0 API:** Remote code execution
- **Nodemailer (SMTP) / Brevo (HTTP):** Transactional emails

### Database & Cloud

- **MongoDB (Mongoose):** Primary database (Users, Sessions, Questions)
- **Redis (Upstash):** OTP storage, rate limiting, and caching
- **Cloudinary:** Profile and question image storage
- **Render:** Cloud hosting for backend and Yjs server
- **Vercel:** Frontend deployment

---

## 📁 Project Structure

```text
CodeSync/
├── Backend/                       # Node.js + Express server
│   ├── config/                    # Configuration files
│   │   ├── cloudinary.js          # Image upload setup (Multer)
│   │   ├── db.js                  # MongoDB connection logic
│   │   ├── mailer.js              # Brevo/Nodemailer email templates
│   │   ├── passport.js            # Local & OAuth (Google/GitHub) strategies
│   │   └── redis.js               # Redis client setup
│   ├── middleware/                # Custom middlewares
│   │   └── rateLimiter.js         # Redis-backed rate limiting
│   ├── models/                    # Mongoose Database Schemas
│   │   ├── CodeSubmission.js      # Candidate code & test case results
│   │   ├── Questions.js           # Question bank with hidden/visible test cases
│   │   ├── Session.js             # Interview session, roomId, violations
│   │   ├── SessionNote.js         # Private interviewer notes
│   │   └── User.js                # User schema (auth, 2FA, OAuth)
│   ├── routes/                    # API Endpoints
│   │   ├── auth.js                # Login, Signup, OTP, 2FA, OAuth
│   │   ├── question.js            # CRUD for questions, sharing, archiving
│   │   ├── session.js             # Create, edit, report, session logic
│   │   └── user.js                # Profile, password, delete account
│   ├── sockets/                   # Real-time WebSocket Logic
│   │   └── socketHandler.js       # Room joining, waiting room, chat, WebRTC signaling
│   ├── app.js                     # Express app configuration & Session setup
│   ├── server.js                  # HTTP server & Socket.io initialization
│   ├── package.json
│   └── .env                       # Environment variables (not tracked)
│
├── Frontend/                      # React + Vite application
│   ├── public/
│   │   ├── favicon.svg
│   │   └── google...html          # Google Search Console verification
│   ├── src/
│   │   ├── api/                   # Axios instance with interceptors
│   │   ├── context/               # AuthContext for global user state
│   │   ├── components/            # Reusable UI & Feature Modules
│   │   │   ├── Auth/              # Login, Signup, Protected/Public Routes
│   │   │   ├── Hero/              # Landing page, Features, How It Works
│   │   │   ├── Interview/         # Interview Room, Editor, Whiteboard, Video
│   │   │   ├── Navbar/            # Global navigation
│   │   │   ├── Settings/          # Profile, Security, Questions, Sessions
│   │   │   ├── Toast/             # Global notification component
│   │   │   └── ...
│   │   ├── utils/                 # Helper functions (PDF generator)
│   │   ├── App.jsx                # Router configuration
│   │   ├── main.jsx               # React entry point
│   │   └── socket.js              # Socket.io singleton client
│   ├── package.json
│   └── .env                       # Vite environment variables
│
├── YjsServer/                     # Dedicated CRDT WebSocket server
│   ├── package.json               # Runs npx y-websocket
│   └── ...
│
├── .gitignore
└── README.md
```

🚀 Local Setup & Installation

Prerequisites
Node.js (v18+)
MongoDB (Local or Atlas)
Redis (Local or Upstash)
Cloudinary Account
Google & GitHub OAuth Credentials

Step 1: Clone the Repository
git clone https://github.com/AmitRastogi23/CodeSync.git
cd CodeSync

Step 2: Setup the Backend
cd Backend
npm install

Create a .env file in the Backend folder:
PORT=5000
MONGO_URL=your_mongodb_url
REDIS_URL=your_redis_url
SESSION_SECRET=your_secret
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Cloudinary

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# OAuth

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Mail

BREVO_API_KEY=xxx
BREVO_SENDER_EMAIL=xxx

# Compiler

COMPILER_URL=https://ce.judge0.com/submissions?base64_encoded=false&wait=true

Run the backend:
npm run dev

Step 3: Setup the Yjs Server
cd ../YjsServer
npm install

Run the CRDT server:
HOST=localhost PORT=1234 npx y-websocket

Step 4: Setup the Frontend
cd ../Frontend
npm install

Create a .env file in the Frontend folder:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_YJS_URL=ws://localhost:1234

Run the frontend:
bash
npm run dev

📜 License
This project is licensed under the MIT License.
