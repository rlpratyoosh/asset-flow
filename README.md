# Asset Flow

**Asset Flow** is a premium, full-stack asset management platform designed to help organizations take control of their physical resources. It features a stunning, minimalist monochrome interface and a robust backend to handle everything from real-time asset tracking to resource booking and lifecycle audits.

---

## 🌟 Key Features

### 📦 Smart Asset Directory
Maintain a centralized repository of all your assets. Track real-time statuses—whether an asset is available, allocated to a department or user, or under maintenance. 

### 📅 Resource Booking Calendar
Prevent scheduling conflicts with a unified calendar view. Allow employees to seamlessly book shared resources like conference rooms, company vehicles, or expensive specialized equipment.

### 🔍 Lifecycle Audits
Ensure accountability across the board. Schedule periodic audits, assign auditors, and keep a definitive history of every asset's condition over time. 

### 👥 Role-Based Access Control
Secure your workspace with distinct roles (Admin, Asset Manager, Department Head, Employee). Tailor permissions so users only see and interact with what they need.

---

## 🏗️ Technology Stack

The project is structured as a monorepo, divided into a high-performance backend and a sleek frontend.

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: Vanilla CSS Modules (Minimalist Monochrome Theme)
- **Components**: Custom, accessible UI components 
- **Calendar**: React Big Calendar with Date-fns

### Backend
- **Language**: [Go](https://golang.org/)
- **Framework**: [Gin HTTP Web Framework](https://gin-gonic.com/)
- **Database**: SQLite
- **ORM**: [GORM](https://gorm.io/)
- **Auth**: JWT-based Authentication

---

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites
- [Go](https://golang.org/doc/install) (1.20+)
- [Node.js](https://nodejs.org/) (18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Setting up the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Download dependencies:
   ```bash
   go mod download
   ```
3. Run the server (it will automatically migrate the SQLite database):
   ```bash
   go run cmd/server/main.go
   ```
   *The backend server will run on `http://localhost:8080`.*

### 2. Setting up the Frontend

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be available at `http://localhost:3000`.*

---

## 🎨 Design Philosophy

Asset Flow strictly adheres to a **minimalist, light-and-black monochrome theme**. By stripping away gradients, heavy shadows, and unnecessary colors, the application reduces cognitive load and allows the data to take center stage. The result is a highly readable, lightning-fast, and premium user experience.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
