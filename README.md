# AbilityBid – Inclusive Auction Platform for Creative Talent

AbilityBid is an online auction platform designed to support artists with disabilities by allowing them to showcase and auction their handmade art, crafts, and creative products.

## Tech Stack

- **Frontend:** React.js, HTML, CSS, JavaScript
- **Backend:** Node.js with Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** Firebase Authentication + JWT (app session token)

## Project Structure

```
abilitybid/
├── backend/
│   ├── config/
│   │   └── multer.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── artworkController.js
│   │   ├── authController.js
│   │   └── bidController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Artwork.js
│   │   ├── Bid.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── artworks.js
│   │   ├── auth.js
│   │   └── bids.js
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   copy .env.example .env
   ```

4. Update `.env` with your values:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/abilitybid
   JWT_SECRET=your_secret_key
   FRONTEND_URL=http://localhost:3000
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=firebase_admin_sdk_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env`:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

## Commands to Run the Project

### Run Backend

```bash
cd backend
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Run Frontend

```bash
cd frontend
npm start
```

### Run Both (from project root)

**Terminal 1 – Backend:**
```bash
cd backend && npm start
```

**Terminal 2 – Frontend:**
```bash
cd frontend && npm start
```

- Backend: http://localhost:5000  
- Frontend: http://localhost:3000  

## Default Admin Account

On first backend start, a default admin account is created:

- **Email:** admin@abilitybid.com  
- **Password:** admin123  

Change this password in production.

## API Endpoints

### Auth
- `POST /api/auth/register` – Register
- `POST /api/auth/login` – Login
- `POST /api/auth/firebase` – Firebase login/register token exchange
- `GET /api/auth/me` – Get current user (requires auth)

### Artworks
- `GET /api/artworks` – List artworks (supports search, category, status)
- `GET /api/artworks/:id` – Get single artwork
- `POST /api/artworks` – Create artwork (artist)
- `PUT /api/artworks/:id` – Update artwork (artist)
- `DELETE /api/artworks/:id` – Delete artwork
- `GET /api/artworks/artist/artworks` – Artist’s artworks

### Bids
- `POST /api/bids` – Place bid
- `GET /api/bids/user` – User’s bids
- `GET /api/bids/artwork/:artworkId` – Bids for an artwork

### Admin
- `GET /api/admin/users` – All users
- `GET /api/admin/auctions` – All auctions
- `GET /api/admin/stats` – Dashboard stats
- `PUT /api/admin/verify-artist/:id` – Verify artist
- `DELETE /api/admin/artworks/:id` – Remove artwork

## User Roles

- **Artist** – Upload artworks, run auctions
- **Buyer** – Browse and bid on artworks
- **Admin** – Verify artists, manage auctions, remove listings

## Accessibility

- Larger touch targets (min 44px)
- Clear focus outlines
- Readable fonts
- Responsive layout
- Screen-reader-friendly markup
