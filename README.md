# Graphite (Professional Networking Platform)

Graphite is a modern, full-stack professional networking platform similar to LinkedIn. It allows users to build professional profiles, connect with others, share posts, send real-time messages, and receive real-time notifications.

## 🌟 Key Features

- **Authentication & Security**: Secure JWT-based authentication with email password resets (via Nodemailer).
- **Professional Profiles**: Customizable profiles including avatars, banners, headlines, about sections, experience, and skills.
- **Social Feed**: Infinite-scrolling feed of posts. Users can create posts with images (via Cloudinary), like, and comment.
- **Real-time Messaging**: 1:1 direct messaging built with Socket.io. Features include typing indicators, online status, read receipts, and image attachments.
- **Real-time Notifications**: Instant updates for new connections, likes, and comments.
- **Networking**: Send, accept, or decline connection requests. View your professional network.
- **Search**: Global search functionality to discover other professionals.

## 🛠️ Tech Stack

**Frontend**
- React 18 (Vite)
- Tailwind CSS (Styling)
- Zustand (Global State Management)
- React Query (Data fetching & caching)
- React Router (Routing)
- Lucide React (Icons)

**Backend**
- Node.js & Express.js
- MongoDB & Mongoose (Database)
- Socket.io (Real-time WebSockets)
- Cloudinary & Multer (Image uploads)
- Nodemailer (Email services)
- JSON Web Tokens (Authentication)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB account (MongoDB Atlas recommended)
- Cloudinary account (for image hosting)
- Gmail account (with App Password for email services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chiragsethi12/Graphyte.git
   cd graphite
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

You need to set up environment variables for both the backend and frontend. 

**Backend (`backend/.env`)**
Create a `.env` file in the `backend` directory:
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret Keys
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary Setup (Images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:3000

# Nodemailer Setup (for Forgot Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS="your_16_character_app_password"
```

**Frontend (`frontend/.env`)**
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Application

You can run the frontend and backend servers simultaneously. Open two terminal tabs:

**Terminal 1 (Backend)**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend)**
```bash
cd frontend
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## 📁 Project Structure

```text
graphite/
├── backend/                  # Express server
│   ├── config/               # DB and Cloudinary configs
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth and validation middlewares
│   ├── models/               # Mongoose schemas (User, Post, Message, etc.)
│   ├── routes/               # Express API routes
│   ├── socket/               # Socket.io event handlers
│   ├── utils/                # Utility functions (Nodemailer)
│   └── index.js              # Server entry point
│
└── frontend/                 # React application
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── context/          # React Context (AuthContext)
    │   ├── hooks/            # Custom React Query hooks
    │   ├── lib/              # Axios instance and Socket client
    │   ├── pages/            # Page-level components
    │   └── App.jsx           # Main application routing
    └── vite.config.js        # Vite configuration
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is licensed under the MIT License.
