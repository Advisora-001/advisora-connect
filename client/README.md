# Advisora Connect - Legal Marketplace Platform

A digital legal services marketplace that connects clients with verified lawyers while providing lawyers with digital tools to manage their online presence, consultations, and client relationships.

## 🏗️ Project Structure

```
AdvisoryConnect/
├── client/                 # Next.js Frontend (React)
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   └── lib/           # API client
│   └── public/            # Static assets
├── server/                 # Express Backend (TypeScript)
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Auth & validation
│   └── seed.ts            # Database seeding
└── package.json           # Root workspace
```

## 📋 Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **MongoDB Atlas** account (free tier works)
  - Sign up at: https://www.mongodb.com/atlas
  - Create a cluster (M0 Sandbox)
  - Create a database user with username/password
  - Get your connection string: `mongodb+srv://<username>:<password>@cluster...`

## ⚙️ Environment Setup

### 1. Configure MongoDB

Update `server/.env` with your MongoDB Atlas credentials:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<your-username>:<your-password>@<your-cluster>.mongodb.net/advisora_connect?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY= your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm run install:all
```

Or install separately:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

## 🚀 Running the Application

### Option A: Run Both Servers Together (Recommended)

From the root `AdvisoryConnect/` folder:

```bash
npm run dev
```

This will start:
- **Backend API** on `http://localhost:5000`
- **Frontend** on `http://localhost:3000`

### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 🌱 Seeding Test Data

To populate the database with test accounts:

```bash
cd server
npm run seed
```

This creates:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@advisora.com | Admin123! |
| Lawyer | lawyer@test.com | Lawyer123! |
| Client | client@test.com | Client123! |

## 🧪 Testing the Application

### 1. Open the Frontend
Go to: **http://localhost:3000**

### 2. Test Registration/Login
- **Client**: Register at `/register` or login with `client@test.com` / `Client123!`
- **Lawyer**: Register at `/register?role=lawyer` or login with `lawyer@test.com` / `Lawyer123!`
- **Admin**: Login with `admin@advisora.com` / `Admin123!`

### 3. Test Key Features
- ✅ **Search Lawyers**: Visit `/lawyers` page
- ✅ **View Lawyer Profile**: Click on a lawyer card
- ✅ **Send Enquiry**: Click "Send Enquiry" on a lawyer's profile (requires login)
- ✅ **Admin Panel**: Visit `/admin` (login as admin first)
- ✅ **Verify Lawyers**: In admin panel, approve/reject lawyer profiles

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Lawyers
- `GET /api/lawyers` - Search/filter lawyers
- `GET /api/lawyers/:id` - Get lawyer by ID

### Leads (Enquiries)
- `POST /api/leads` - Create enquiry (authenticated)

### Admin
- `GET /api/admin/analytics` - Dashboard analytics (admin only)
- `GET /api/admin/lawyers/pending` - Pending verifications (admin only)
- `PUT /api/admin/lawyers/:id/verify` - Update lawyer status (admin only)

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (React framework)
- **TypeScript**
- **Tailwind CSS** (styling)
- **Next.js App Router**

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **MongoDB** (Atlas)
- **Mongoose** (ODM)
- **JWT** (authentication)
- **Bcrypt** (password hashing)
- **Multer + Cloudinary** (file uploads)
- **Paystack** (payments - optional)

## 📂 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Homepage with hero, search, featured lawyers |
| Search Lawyers | `/lawyers` | Browse and filter lawyers |
| Lawyer Profile | `/lawyers/[id]` | View lawyer details, send enquiry |
| Login | `/(auth)/login` | User login |
| Register | `/(auth)/register` | User registration |
| Client Dashboard | `/dashboard/client` | Client's enquiries |
| Lawyer Dashboard | `/dashboard/lawyer` | Lawyer's leads and profile |
| Admin Panel | `/admin` | Admin analytics and lawyer verification |

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 5000
npx kill-port 3000 5000
```

### MongoDB Connection Failed
- Check your MongoDB Atlas cluster is running
- Verify username/password in connection string
- Ensure IP whitelist includes your IP (0.0.0.0/0 for testing)

### Frontend/Backend Not Connecting
- Verify both servers are running
- Check CORS settings in `server/src/index.ts`
- Ensure `FRONTEND_URL` is set correctly in `.env`

## 📝 Notes

- Backend runs on port **5000**
- Frontend runs on port **3000**
- The seed script creates test data in MongoDB
- Email verification is implemented (verify / resend flows)
- Payment integration (Paystack) is wired for subscriptions, leads, and featured listings

## 🚧 MVP Features

### Implemented
- User registration & authentication (client, lawyer, admin)
- Lawyer profile creation
- Lawyer verification system
- Lawyer search & filtering
- Client enquiries (leads)
- Admin dashboard with analytics
- Responsive UI design

### Coming Soon (Phase 2)
- Calendar scheduling & appointments
- Video consultation integration
- Client reviews/ratings
- Admin moderation of documents

## 📄 License

Proprietary - All rights reserved

---

Built with ❤️ for Advisora Connect