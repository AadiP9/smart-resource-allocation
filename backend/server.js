require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const taskRoutes = require('./routes/tasks');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Setup WebSockets
const io = new Server(server, {
  cors: {
    origin: '*', // For hackathon MVP
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket] A client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// etup MongoDB in-memory or real (Using Mocked Local for MVP if MONGO_URI is absent)
// To keep the MVP running out of the box without complicated mongo setup, let's use a local connection if accessible, or if user wants true zero-config, we'll try to connect but handle errors gracefully.
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('SRAS API is running');
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
