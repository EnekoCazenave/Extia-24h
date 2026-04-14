require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
const { cors, helmet, globalLimiter, authLimiter } = require('./middleware/security');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors);
app.use(helmet);
app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authLimiter, authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║   Serveur démarré sur le port ${PORT}            ║
║   Mode: ${process.env.NODE_ENV || 'development'}                    ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Erreur au démarrage:', error);
    process.exit(1);
  }
};

startServer();