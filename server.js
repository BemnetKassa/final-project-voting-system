// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// --- Project Management (admin) ---
const projectsFile = path.join(__dirname, 'projects.json');
if (!fs.existsSync(projectsFile)) {
  fs.writeFileSync(projectsFile, JSON.stringify([
    { id: 1, name: "Smart Irrigation System - Amanuel T. & Sara K." },
    { id: 2, name: "AI Health Assistant - Meron B. & Dawit M." },
    { id: 3, name: "Campus Navigation App - Lidet H. & Yonas Z." }
  ], null, 2));
}
function loadProjects() {
  return JSON.parse(fs.readFileSync(projectsFile));
}
function saveProjects(projects) {
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
}

// --- Voting Data ---
const votersFile = path.join(__dirname, 'voters.json');
if (!fs.existsSync(votersFile)) {
  fs.writeFileSync(votersFile, JSON.stringify({}));
}
let voters = JSON.parse(fs.readFileSync(votersFile));

// Load or initialize votes
const votesFile = path.join(__dirname, 'votes.json');
if (!fs.existsSync(votesFile)) {
  fs.writeFileSync(votesFile, JSON.stringify({}));
}
let votes = JSON.parse(fs.readFileSync(votesFile));

// --- Voting Routes ---
app.post('/submit-vote', (req, res) => {
  const selectedProject = req.body.vote;
  const voterId = req.ip; // You can replace this with student ID/email

  if (voters[voterId]) {
    return res.send('<h2>You have already voted!</h2><a href="/">Go back</a>');
  }

  votes[selectedProject] = (votes[selectedProject] || 0) + 1;
  voters[voterId] = true;

  fs.writeFileSync(votersFile, JSON.stringify(voters));
  fs.writeFileSync(votesFile, JSON.stringify(votes));

  res.send('<h2>Thank you for voting!</h2><a href="/">Go back</a>');
});

// API route to serve vote results as JSON
app.get('/api/results', (req, res) => {
  res.json(votes);
});

// --- Admin Project Management API ---
app.get('/api/projects', (req, res) => {
  res.json(loadProjects());
});

app.post('/api/projects', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const projects = loadProjects();
  const newProject = {
    id: projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1,
    name
  };
  projects.push(newProject);
  saveProjects(projects);
  res.status(201).json(newProject);
});

app.delete('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let projects = loadProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  projects.splice(index, 1);
  saveProjects(projects);
  res.status(204).end();
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

