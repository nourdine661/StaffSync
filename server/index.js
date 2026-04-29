import "dotenv/config";

import express from "express";
import employeeRoutes from "./routs/employees.js";
import projectRoutes from "./routs/projects.js";
import taskRoutes from "./routs/tasks.js";
import presenceRoutes from "./routs/presences.js";
import performanceRoutes from "./routs/performances.js";
import employeeProjectRoutes from "./routs/employee-projects.js";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static('../frontend'));

const server = app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

process.stdin.resume();

app.get("/", (req, res) => {
	res.redirect("/homepage.html");
});

app.use("/api/employees", employeeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/presences", presenceRoutes);
app.use("/api/performances", performanceRoutes);
app.use("/api/employee-projects", employeeProjectRoutes);
