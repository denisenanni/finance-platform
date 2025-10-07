# Full-Stack Web Application

This is a full-stack web application with a React-based frontend and a Node.js backend.

## Features

*   **User Authentication:** Secure user registration and login system using JWT and cookies. Social authentication with Google and Facebook is also supported.
*   **Responsive UI:** A modern and responsive user interface built with Next.js and Tailwind CSS.
*   **RESTful API:** A robust backend API built with Node.js and Express.

## Tech Stack

### Frontend

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Package Manager:** Yarn

### Backend

*   **Framework:** Node.js with Express
*   **Language:** TypeScript
*   **ORM:** Prisma
*   **Database:** PostgreSQL
*   **Authentication:** Passport.js
*   **Package Manager:** Yarn

## Getting Started

### Prerequisites

*   Node.js (v16 or later)
*   Yarn
*   PostgreSQL

### Installation

1.  **Clone the repository.**

2.  **Install frontend dependencies:**
    ```bash
    cd frontend
    yarn install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd ../backend
    yarn install
    ```

### Running the Application

1.  **Set up the database:**
    *   Create a `.env` file in the `backend` directory.
    *   Add the following line to the `.env` file, replacing the placeholder with your PostgreSQL connection string:
        ```
        DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"
        ```
    *   Push the database schema:
        ```bash
        yarn prisma:push
        ```

2.  **Start the backend server:**
    ```bash
    yarn dev
    ```
    The backend server will start on `http://localhost:3001`.

3.  **Start the frontend development server:**
    ```bash
    cd ../frontend
    yarn dev
    ```
    The frontend application will be accessible at `http://localhost:3000`.

## Project Structure

```
.
├── backend/         # Node.js backend application
├── docs/            # Documentation
├── frontend/        # Next.js frontend application
├── k8s-manifests/   # Kubernetes manifests
└── scripts/         # Utility scripts
```