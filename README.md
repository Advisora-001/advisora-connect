# ⚖️ Advisora Connect

**Building Africa's Trusted Legal Access & Practice Enablement Platform**

A digital legal services marketplace connecting clients with verified lawyers while providing lawyers with digital tools to manage their online presence, consultations, and client relationships.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- npm or yarn

### 1. Clone and Install
```bash
npm run install:all
```

### 2. Configure Environment
Update `server/.env` with your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/advisora_connect?retryWrites=true&w=majority
```

### 3. Seed Test Data
```bash
cd server
node seed.js
```

### 4. Start Development Servers
```bash
# From root directory
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📚 Documentation

See [client/README.md](./client/README.md) for detailed setup instructions, testing guide, and API documentation.

## 🛠️ Tech Stack

### Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js + Express
- TypeScript
- MongoDB (Atlas)
- Mongoose
- JWT Authentication

## 👥 Test Accounts

After seeding:
- **Admin**: admin@advisora.com / Admin123!
- **Lawyer**: lawyer@test.com / Lawyer123!
- **Client**: client@test.com / Client123!

## 📁 Project Structure

```
AdvisoryConnect/
├── client/              # Next.js frontend
│   ├── src/app/        # Pages & routing
│   ├── src/components/ # UI components
│   └── src/lib/        # API client
├── server/              # Express backend
│   ├── src/            # Source code
│   ├── start.js        # Server entry point
│   └── seed.js         # Database seeding
└── package.json        # Root workspace config
```

## 🎯 Features (Phase 1 MVP)

- ✅ User registration & authentication
- ✅ Lawyer profile creation & verification
- ✅ Lawyer search & filtering
- ✅ Client enquiries (leads)
- ✅ Admin dashboard & analytics
- ✅ Responsive design

## 🚧 Roadmap

### Phase 2: Monetization
- Subscription plans (Basic, Professional, Premium)
- Pay-per-lead system
- Featured listings
- Payment integration (Paystack)

### Phase 3: Practice Management
- Calendar scheduling
- Video consultations
- Document management
- Client CRM
- Reviews & ratings

## 📝 License

Proprietary - All rights reserved

---

Built for Advisora Connect © 2025