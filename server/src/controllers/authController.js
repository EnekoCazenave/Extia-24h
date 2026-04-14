const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../services/authService');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const existingUsername = await User.findOne({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
    }

    const user = await User.create({ email, password, username });

    const tokens = generateTokens(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: user.toJSON(),
      ...tokens
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    await user.update({ lastLogin: new Date() });

    const tokens = generateTokens(user.id);

    res.json({
      message: 'Connexion réussie',
      user: user.toJSON(),
      ...tokens
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token manquant' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Utilisateur invalide' });
    }

    const tokens = generateTokens(user.id);

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: 'Refresh token invalide' });
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};