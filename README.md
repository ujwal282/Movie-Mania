# 🎬 Movie Mania

A full-stack movie ticket booking platform built with the **MERN stack**.

Movie Mania is designed to provide a complete movie-booking experience, connecting users with movies, theaters, and ticket booking through a modern web application.

---

## ✨ Features

* 🎬 Browse movies
* 🏢 Explore available theaters
* 🎟️ Book movie tickets
* 👤 User authentication
* 🔐 Protected user functionality
* 💳 Payment integration
* 📍 Find theaters based on distance
* 📱 Responsive user interface
* ⚡ Full-stack architecture with separate frontend and backend

---

## 🛠️ Tech Stack

### Frontend

<p>
  <img src="https://skillicons.dev/icons?i=react,js,tailwind" />
</p>

### Backend

<p>
  <img src="https://skillicons.dev/icons?i=nodejs,express" />
</p>

### Database

<p>
  <img src="https://skillicons.dev/icons?i=mongodb" />
</p>

### Tools & Services

<p>
  <img src="https://skillicons.dev/icons?i=git,github,vscode,postman" />
</p>

---

## 🏗️ Project Structure

```text
Movie-Mania/
│
├── frontend/        # React frontend
│
├── backend/         # Node.js / Express backend
│
└── README.md
```

The application is separated into independent frontend and backend layers to keep the client and server responsibilities clearly organized.

---

## 🔄 Application Flow

```text
              User
                │
                ▼
        React Frontend
                │
                │ HTTP Requests
                ▼
        Express Backend
                │
        ┌───────┴───────┐
        ▼               ▼
   Authentication    Application
                       Logic
                         │
                         ▼
                     MongoDB
```

---

## 🎟️ Booking Flow

```text
Browse Movies
      ↓
Select Movie
      ↓
Find Theater
      ↓
Choose Show
      ↓
Select Tickets
      ↓
Payment
      ↓
Booking Confirmation
```

---

## 📍 Theater Discovery

Movie Mania includes location-based theater discovery using distance calculation, allowing users to identify theaters based on their location.

This makes the application more practical than a simple movie-listing application.

---

## 🔐 Authentication

The backend provides authentication functionality for managing users and protecting application resources.

The authentication layer is integrated between the React frontend and Node.js/Express backend.

---

## 💳 Payment

The project includes a payment workflow for movie ticket purchases, allowing the booking process to extend beyond simply selecting a movie and generating a booking.

---

## 🧠 What I Learned

Building Movie Mania helped me understand how different parts of a full-stack application work together:

* Designing REST APIs
* Connecting React with a Node.js backend
* Working with MongoDB
* Authentication and protected resources
* Handling booking workflows
* Working with location-based calculations
* Integrating payment functionality
* Structuring a full-stack project
* Managing frontend/backend communication

---

## 🚀 Future Improvements

* [ ] Advanced movie search and filtering
* [ ] Better seat-selection experience
* [ ] Booking history
* [ ] Email notifications
* [ ] Admin dashboard
* [ ] Improved error handling
* [ ] Automated testing
* [ ] Production deployment

---

## ⚙️ Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/ujwal282/Movie-Mania.git
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## 👨‍💻 Author

### Ujwal Paudel

Full-Stack JavaScript Developer focused on building practical applications with **React, Node.js, Express, and MongoDB**.

* GitHub: [@ujwal282](https://github.com/ujwal282)
* Portfolio: [paudelujwal.com.np](https://paudelujwal.com.np)

---

## ⭐ If you find this project interesting

Feel free to explore the code, open an issue, or leave a star!
