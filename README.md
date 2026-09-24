# 🐾 MyPetHealthApp

**MyPetHealthApp** is a full-stack mobile application designed to help pet owners manage pet profiles and keep important pet-related information in one place.

The project combines a **React Native mobile application**, a **Node.js/Express REST API**, and a **PostgreSQL database**.

## ✨ Features

### Authentication

* User registration and login
* JWT-based authentication
* Password hashing with bcrypt
* Protected API routes
* Persistent authentication using AsyncStorage

### User Profile

* User profile management
* Editable user name
* Profile avatar
* Server-side user data storage

### Pet Management

* Create and manage pet profiles
* Support for dogs and cats
* Breed selection
* Pet weight and height information
* Pet age and basic profile information
* Multiple pets associated with one user

### Pet Health & Assistance

The application is being developed as a broader pet health platform and currently includes UI and backend components for:

* Pet medications and health-related information
* Vaccination and calendar functionality
* Pet health records
* Pet passport
* Pet pedigree
* QR code functionality
* AI-powered pet assistance
* Image-based pet-related functionality

Some of these features are still under active development.

---

## 🏗️ Architecture

```text
┌──────────────────────────────┐
│      React Native App        │
│                              │
│  Expo + TypeScript           │
│  Context API                 │
│  AsyncStorage                │
│  Axios                       │
└──────────────┬───────────────┘
               │ HTTP / REST API
               ▼
┌──────────────────────────────┐
│       Node.js Backend        │
│                              │
│  Express.js                  │
│  JWT Authentication          │
│  bcrypt                      │
│  REST API                    │
└──────────────┬───────────────┘
               │ SQL
               ▼
┌──────────────────────────────┐
│        PostgreSQL            │
│                              │
│  Users                       │
│  Pets                        │
│  Breeds                      │
│  Health-related data         │
└──────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend

* React Native
* Expo
* TypeScript
* Axios
* React Context API
* AsyncStorage

### Backend

* Node.js
* Express.js
* JavaScript
* REST API
* JWT
* bcrypt

### Database

* PostgreSQL
* SQL

### Development Tools

* Git
* GitHub
* npm
* Docker / Docker Compose

---

## 📁 Project Structure

```text
MyPetHealthApp/
│
├── assets/                 # Images, icons and fonts
│
├── backend/                # Node.js / Express backend
│   ├── database/           # Database schema
│   ├── scripts/            # Utility scripts
│   └── src/
│       ├── config/         # Database configuration
│       ├── controllers/    # Request handlers
│       ├── middleware/     # Authentication middleware
│       ├── models/         # Data models
│       ├── routes/         # API routes
│       └── services/       # External and application services
│
├── components/             # React Native screens and components
│
├── src/
│   ├── config/             # Application configuration
│   ├── data/               # Application data
│   ├── hooks/              # React hooks and contexts
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
│
├── web/                    # Web-related files
│
├── App.tsx                 # Main application component
├── index.ts                # Application entry point
├── app.json                # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Requirements

Make sure the following tools are installed:

* Node.js
* npm
* PostgreSQL
* Expo CLI / Expo Go
* Git

### 1. Clone the repository

```bash
git clone https://github.com/Octrat/MyPetHealthApp.git
cd MyPetHealthApp
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Configure environment variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=3001
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret_key
```

Do not commit `.env` files to the repository.

### 5. Configure the database

Create a PostgreSQL database and apply the schema from:

```text
backend/database/schema.sql
```

### 6. Start the backend

```bash
cd backend
npm start
```

### 7. Start the Expo application

From the project root:

```bash
npm start
```

Then open the application using **Expo Go** or an available emulator.

---

## 🔐 Authentication Flow

The application uses JWT authentication.

```text
User
  │
  ├── Register / Login
  │
  ▼
Express API
  │
  ├── Validate credentials
  ├── Hash / verify password
  └── Generate JWT
  │
  ▼
React Native App
  │
  └── Store token in AsyncStorage
          │
          ▼
     Authenticated API requests
```

Protected requests include the JWT in the `Authorization` header:

```text
Authorization: Bearer <token>
```

---

## 🔌 API

The backend exposes REST API endpoints for the main application functionality, including:

```text
/api/auth
/api/user
/api/pets
/api/calendar
/api/avatar
/api/vision
/api/breeds
```

The API is responsible for authentication, user data, pet management and other application services.

---

## 🐶 Pet Data Model

The application is designed around a relationship between users and their pets:

```text
User
 │
 ├── Pet
 ├── Pet
 └── Pet
```

Each pet is associated with a specific user, allowing one account to manage multiple pets.

---

## 🔒 Security

The project includes several basic security mechanisms:

* JWT authentication
* Password hashing with bcrypt
* Protected API routes
* Environment variables for sensitive configuration
* `.env` files excluded from Git
* Server-side user authentication

Further security improvements are planned as the project develops.

---

## 🗺️ Roadmap

Planned and ongoing improvements include:

* [ ] Complete pet health records
* [ ] Vaccination and medical calendar
* [ ] Health history
* [ ] Growth curves and health analytics
* [ ] Expanded AI pet assistant
* [ ] Improved image recognition
* [ ] Cloud file storage
* [ ] Production deployment
* [ ] Public demo version
* [ ] Improved mobile UI/UX

---

## 🎯 Project Goals

The main goal of MyPetHealthApp is to create a convenient digital environment where pet owners can:

* manage multiple pets;
* store important pet information;
* track health-related data;
* receive useful recommendations;
* access pet information from a single application.

The project is also intended as a demonstration of full-stack application development using **React Native, Node.js, Express.js and PostgreSQL**.

---

## 📌 Project Status

**Active development**

The core application architecture, authentication, user profiles, pet management and several supporting features are implemented. Additional health-related functionality and production deployment are currently being developed.

---

## 👩‍💻 Author

**Maria Belobrukh**

MyPetHealthApp — personal full-stack mobile application project.

## 📄 License

This project is intended for educational and portfolio purposes.

