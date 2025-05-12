import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';

function Home() {
  return (
    <Box textAlign="center" mt={8}>
      <Typography variant="h3" gutterBottom>Legal Document RAG App</Typography>
      <Typography variant="h6" gutterBottom>
        Upload, summarize, and ask questions about your legal documents securely.
      </Typography>
    </Box>
  );
}

function Login() {
  return <Typography variant="h5">Login Page (Keycloak integration coming soon)</Typography>;
}

function Signup() {
  return <Typography variant="h5">Signup Page (Keycloak integration coming soon)</Typography>;
}

function Dashboard() {
  return <Typography variant="h5">Dashboard (Upload and manage your documents)</Typography>;
}

function QA() {
  return <Typography variant="h5">Q&A (Ask questions about your documents)</Typography>;
}

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Legal RAG
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/login">Login</Button>
          <Button color="inherit" component={Link} to="/signup">Signup</Button>
          <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
          <Button color="inherit" component={Link} to="/qa">Q&A</Button>
        </Toolbar>
      </AppBar>
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qa" element={<QA />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
