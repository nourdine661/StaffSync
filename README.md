# Employee and Project Management System

This is a full-stack web application designed to help businesses manage their employees, projects, and track performance. It provides a simple interface for administrators to oversee projects and for employees to view their assigned tasks.

## Features

*   **User Authentication:** Secure login system for administrators and employees using JWT.
*   **Role-Based Access:** Different views and permissions for admins and regular employees.
*   **Project Management:** Admins can create, update, and manage projects.
*   **Task Management:** Admins can create and assign tasks to employees.
*   **Employee Dashboard:** Employees can view their assigned projects and tasks.
*   **Presence Tracking:** System to log employee check-in and check-out times.
*   **Performance Monitoring:** Track monthly employee performance metrics.

## Tech Stack

*   **Frontend:** HTML, CSS, Vanilla JavaScript
*   **Backend:** Node.js, Express.js
*   **Database:** PostgreSQL
*   **Authentication:** bcrypt for password hashing, JSON Web Tokens (JWT) for session management.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm)
*   [PostgreSQL](https://www.postgresql.org/download/)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd <project-folder>
    ```

2.  **Install backend dependencies:**
    Navigate to the `server` directory and install the required npm packages.
    ```sh
    cd server
    npm install
    ```

3.  **Set up the database:**
    *   Make sure your PostgreSQL server is running.
    *   Create a new database for the project.
    *   Execute the `init_database.sql` script located in the `data base` folder to create the necessary tables. You can use a tool like `psql` or a GUI like pgAdmin.
    ```sh
    psql -U your_postgres_user -d your_database_name -f "data base/init_database.sql"
    ```
    *   You will also need to create a `.env` file in the `server` directory to store your database connection details. See `server/db.js` for the required environment variables (`DB_USER`, `DB_HOST`, `DB_DATABASE`, `DB_PASSWORD`, `DB_PORT`).

## Usage

1.  **Run the backend server:**
    From the `server` directory, run:
    ```sh
    npm start
    ```
    This will start the server, typically on `http://localhost:5000`.

2.  **Open the frontend:**
    Open any of the HTML files from the `frontend` directory (e.g., `frontend/login.html`) in your web browser to use the application.

## Project Structure

```
.
├── data base/
│   ├── dummydata.js
│   └── init_database.sql
├── frontend/
│   ├── admin.html
│   ├── create-project.html
│   ├── create-task.html
│   ├── employee.html
│   ├── homepage.html
│   ├── login.html
│   ├── css/
│   └── js/
└── server/
    ├── package.json
    ├── index.js
    ├── db.js
    ├── middleware.js
    ├── counrolers/
    └── routs/
```

## Contributors

| Name                    | Contribution                                                  |
| ----------------------- | ------------------------------------------------------------- |
| Benomrane Nourdine      | Frontend (Homepage, Login Page)                               |
| anas terfaia            | Frontend (Admin, Create Project, Create Task, Employee pages) |
| ben adballah nour aicha | Database Design and Setup (`init_database.sql`)               |
| amal guenda             | Backend (Routes for Employees, Projects, Tasks)               |
| athmani chahinaz        | Backend (Routes for Performances, Presences, Employee-Projects)|
