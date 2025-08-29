import express from 'express';
import MSALAuthController from '../controllers/MSALAuthController.js';

const router = express.Router();
const msalAuthController = new MSALAuthController();

/**
 * @route GET /auth/microsoft/login
 * @desc Inicia o fluxo de autenticação OAuth2 da Microsoft
 * @access Public
 */
router.get('/login', async (req, res) => {
  await msalAuthController.initiateLogin(req, res);
});

/**
 * @route GET /auth/microsoft/callback
 * @desc Processa o callback da autenticação OAuth2
 * @access Public
 */
router.get('/callback', async (req, res) => {
  await msalAuthController.handleCallback(req, res);
});

/**
 * @route POST /auth/microsoft/test-ropc
 * @desc Testa autenticação usando ROPC (Resource Owner Password Credentials)
 * @access Public
 * @body { username: string, password: string }
 */
router.post('/test-ropc', async (req, res) => {
  await msalAuthController.testROPC(req, res);
});

/**
 * @route POST /auth/microsoft/test-client-credentials
 * @desc Testa autenticação usando Client Credentials Flow
 * @access Public
 */
router.post('/test-client-credentials', async (req, res) => {
  await msalAuthController.testClientCredentials(req, res);
});

/**
 * @route GET /auth/microsoft/auth-url
 * @desc Gera URL de autorização para Authorization Code Flow
 * @access Public
 */
router.get('/auth-url', async (req, res) => {
  await msalAuthController.getAuthUrl(req, res);
});

/**
 * @route GET /auth/microsoft/status
 * @desc Verifica o status da autenticação
 * @access Public
 */
router.get('/status', async (req, res) => {
  await msalAuthController.getAuthStatus(req, res);
});

/**
 * @route GET /auth/microsoft/test-auth-flow
 * @desc Testa o Authorization Code Flow completo
 * @access Public
 */
router.get('/test-auth-flow', async (req, res) => {
  await msalAuthController.testAuthorizationCodeFlow(req, res);
});

/**
 * @route POST /auth/microsoft/rhevolution-login
 * @desc Autenticação integrada Microsoft + RHEvolution
 * @access Public
 */
router.post('/rhevolution-login', async (req, res) => {
  await msalAuthController.authenticateAndLoginRHEvolution(req, res);
});

/**
 * @route POST /auth/microsoft/logout
 * @desc Realiza logout do usuário
 * @access Public
 */
router.post('/logout', async (req, res) => {
  await msalAuthController.logout(req, res);
});

// Middleware de tratamento de erros específico para rotas MSAL
router.use((error, req, res, next) => {
  console.error('Erro nas rotas MSAL:', error);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor nas rotas de autenticação MSAL',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

export default router;