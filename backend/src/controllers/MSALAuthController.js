import MSALAuthService from '../services/MSALAuthService.js';

class MSALAuthController {
  constructor() {
    this.msalService = new MSALAuthService();
  }

  /**
   * Inicia o fluxo de autenticação OAuth2 (Authorization Code Flow)
   * GET /auth/microsoft/login
   * Equivalente ao redirectToProvider() do Laravel
   */
  async initiateLogin(req, res) {
    try {
      console.log('🚀 Iniciando Authorization Code Flow da Microsoft...');
      
      // Inicializar o serviço MSAL
      await this.msalService.init();
      
      // Gerar URL de autorização
      const authUrl = await this.msalService.getAuthCodeUrl();
      
      console.log('✅ URL de autorização gerada, redirecionando usuário...');
      
      // Redireciona para a URL de autenticação da Microsoft
      res.redirect(authUrl);
      
    } catch (error) {
      console.error('❌ Erro ao iniciar Authorization Code Flow:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao iniciar autenticação',
        error: error.message
      });
    }
  }

  /**
   * Processa o callback da autenticação OAuth2
   * GET /auth/microsoft/callback
   * Equivalente ao handleProviderCallback() do Laravel
   */
  async handleCallback(req, res) {
    try {
      console.log('🔄 Processando callback de autorização Microsoft...');
      
      // Inicializar o serviço MSAL
      await this.msalService.init();
      
      const { code, error, error_description } = req.query;
      
      // Verificar se houve erro na autorização
      if (error) {
        console.error('❌ Erro na autorização Microsoft:', error, error_description);
        return res.status(400).json({
          success: false,
          error: `Erro de autorização: ${error}`,
          description: error_description
        });
      }
      
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Código de autorização não encontrado'
        });
      }

      console.log('🔑 Trocando código de autorização por tokens...');
      const tokenResponse = await this.msalService.acquireTokenByCode(code);
      
      // Obter informações do usuário do Microsoft Graph
      console.log('👤 Obtendo informações do usuário...');
      const userInfo = await this.msalService.getUserInfoFromGraph(tokenResponse.accessToken);
      
      console.log('✅ Autenticação Microsoft concluída com sucesso');
      console.log('📧 Usuário autenticado:', userInfo.mail || userInfo.userPrincipalName);
      
      // Retornar dados do usuário (similar ao Laravel)
      res.json({
        success: true,
        message: 'Autenticação Microsoft concluída com sucesso',
        data: {
          user: {
            id: userInfo.id,
            displayName: userInfo.displayName,
            email: userInfo.mail || userInfo.userPrincipalName,
            givenName: userInfo.givenName,
            surname: userInfo.surname,
            jobTitle: userInfo.jobTitle,
            department: userInfo.department,
            employeeId: userInfo.employeeId,
            userPrincipalName: userInfo.userPrincipalName
          },
          account: tokenResponse.account,
          expiresOn: tokenResponse.expiresOn,
          method: 'authorization_code'
        }
      });

    } catch (error) {
      console.error('❌ Erro no callback de autorização:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor no callback',
        details: error.message
      });
    }
  }

  /**
   * Testa a autenticação usando ROPC (Resource Owner Password Credentials)
   * POST /auth/microsoft/test-ropc
   */
  async testROPC(req, res) {
    try {
      console.log('🧪 Testando autenticação ROPC via MSAL...');
      
      // Inicializar o serviço MSAL
      await this.msalService.init();
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username e password são obrigatórios'
        });
      }

      const tokenResponse = await this.msalService.authenticateWithROPC(username, password);
      
      if (!tokenResponse) {
        return res.status(401).json({
          success: false,
          error: 'Falha na autenticação ROPC'
        });
      }

      res.json({
        success: true,
        message: 'Autenticação ROPC bem-sucedida',
        data: {
          accessToken: tokenResponse.accessToken ? '***' : null,
          account: tokenResponse.account,
          expiresOn: tokenResponse.expiresOn,
          method: tokenResponse.method
        }
      });

    } catch (error) {
      console.error('❌ Erro no teste ROPC:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Testa a autenticação usando Client Credentials Flow
   * POST /auth/microsoft/test-client-credentials
   */
  async testClientCredentials(req, res) {
    try {
      console.log('🔧 Testando Client Credentials Flow...');
      
      // Verificar se as credenciais estão configuradas
      const hasValidCredentials = 
        process.env.AZURE_CLIENT_ID && 
        process.env.AZURE_CLIENT_SECRET && 
        process.env.AZURE_TENANT_ID &&
        !process.env.AZURE_CLIENT_ID.includes('your-') &&
        !process.env.AZURE_CLIENT_SECRET.includes('your-') &&
        !process.env.AZURE_TENANT_ID.includes('your-');
      
      if (!hasValidCredentials) {
        return res.status(400).json({
          success: false,
          message: 'Credenciais Azure AD não configuradas',
          details: {
            clientId: process.env.AZURE_CLIENT_ID?.includes('your-') ? 'Placeholder detectado' : 'Configurado',
            clientSecret: process.env.AZURE_CLIENT_SECRET?.includes('your-') ? 'Placeholder detectado' : 'Configurado',
            tenantId: process.env.AZURE_TENANT_ID?.includes('your-') ? 'Placeholder detectado' : 'Configurado'
          },
          instructions: 'Consulte /docs/AZURE_AD_SETUP.md para configurar as credenciais reais'
        });
      }
      
      // Inicializar o serviço MSAL
      await this.msalService.init();
      
      const tokenResponse = await this.msalService.authenticateWithClientCredentials();

      res.json({
        success: true,
        message: 'Client Credentials Flow executado com sucesso',
        data: {
          tokenType: tokenResponse.tokenType,
          expiresOn: tokenResponse.expiresOn,
          scopes: tokenResponse.scopes
        }
      });

    } catch (error) {
      console.error('❌ Erro no Client Credentials Flow:', error);
      res.status(500).json({
        success: false,
        message: 'Erro na autenticação Client Credentials',
        error: error.message,
        instructions: 'Verifique se as credenciais Azure AD estão corretas em /docs/AZURE_AD_SETUP.md'
      });
    }
  }

  /**
   * Gera URL de autorização para Authorization Code Flow
   * GET /auth/microsoft/auth-url
   */
  async getAuthUrl(req, res) {
    try {
      console.log('🔗 Gerando URL de autorização...');
      
      // Verificar se as credenciais estão configuradas
      const hasValidCredentials = 
        process.env.AZURE_CLIENT_ID && 
        process.env.AZURE_TENANT_ID &&
        !process.env.AZURE_CLIENT_ID.includes('your-') &&
        !process.env.AZURE_TENANT_ID.includes('your-');
      
      if (!hasValidCredentials) {
        return res.status(400).json({
          success: false,
          message: 'Credenciais Azure AD não configuradas para Authorization Code Flow',
          details: {
            clientId: process.env.AZURE_CLIENT_ID?.includes('your-') ? 'Placeholder detectado' : 'Configurado',
            tenantId: process.env.AZURE_TENANT_ID?.includes('your-') ? 'Placeholder detectado' : 'Configurado'
          },
          instructions: 'Consulte /docs/AZURE_AD_SETUP.md para configurar as credenciais reais'
        });
      }
      
      // Inicializar o serviço MSAL
      await this.msalService.init();
      
      const { redirectUri } = req.query;
      const authUrl = await this.msalService.getAuthCodeUrl(redirectUri);

      res.json({
        success: true,
        message: 'URL de autorização gerada com sucesso',
        authUrl: authUrl
      });

    } catch (error) {
      console.error('❌ Erro ao gerar URL de autorização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar URL de autorização',
        error: error.message,
        instructions: 'Verifique se as credenciais Azure AD estão corretas em /docs/AZURE_AD_SETUP.md'
      });
    }
  }

  /**
   * Verifica o status da autenticação
   * GET /auth/microsoft/status
   */
  async getAuthStatus(req, res) {
    try {
      const isAuthenticated = await this.msalService.isAuthenticated();
      
      res.json({
        success: true,
        authenticated: isAuthenticated,
        message: isAuthenticated ? 'Usuário autenticado' : 'Usuário não autenticado'
      });
      
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar status de autenticação',
        error: error.message
      });
    }
  }

  /**
   * Autenticação integrada: Microsoft + RHEvolution
   * POST /auth/microsoft/rhevolution-login
   */
  async authenticateAndLoginRHEvolution(req, res) {
    try {
      console.log('🔐 Iniciando autenticação integrada Microsoft + RHEvolution...');
      
      // Verificar se as credenciais Microsoft estão configuradas
      const microsoftEmail = process.env.MICROSOFT_EMAIL;
      const microsoftPassword = process.env.MICROSOFT_PASSWORD;
      
      console.log('🔍 Verificando credenciais Microsoft...');
      console.log('📧 Email Microsoft:', microsoftEmail ? 'Configurado' : 'NÃO CONFIGURADO');
      console.log('🔑 Senha Microsoft:', microsoftPassword ? 'Configurada' : 'NÃO CONFIGURADA');
      
      if (!microsoftEmail || !microsoftPassword) {
        console.log('❌ Credenciais Microsoft não encontradas');
        return res.status(400).json({
          success: false,
          message: 'Credenciais Microsoft não configuradas',
          details: 'Configure MICROSOFT_EMAIL e MICROSOFT_PASSWORD no Doppler'
        });
      }
      
      // Verificar se as credenciais RHEvolution estão configuradas
      const rhevolutionUsername = process.env.RHEVOLUTION_USERNAME;
      const rhevolutionPassword = process.env.RHEVOLUTION_PASSWORD;
      
      console.log('🔍 Verificando credenciais RHEvolution...');
      console.log('👤 Username RHEvolution:', rhevolutionUsername ? 'Configurado' : 'NÃO CONFIGURADO');
      console.log('🔑 Senha RHEvolution:', rhevolutionPassword ? 'Configurada' : 'NÃO CONFIGURADA');
      
      if (!rhevolutionUsername || !rhevolutionPassword) {
        console.log('❌ Credenciais RHEvolution não encontradas');
        return res.status(400).json({
          success: false,
          message: 'Credenciais RHEvolution não configuradas',
          details: 'Configure RHEVOLUTION_USERNAME e RHEVOLUTION_PASSWORD no Doppler'
        });
      }
      
      // Importar o serviço RHEvolution dinamicamente
      const { default: RhevolutionService } = await import('../services/RhevolutionService.js');
      const rhService = new RhevolutionService();
      
      try {
        // Inicializar o serviço
        await rhService.init();
        
        // Navegar para a página do RHEvolution primeiro
        console.log('🌐 Navegando para RHEvolution...');
        await rhService.page.goto(process.env.RHEVOLUTION_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Analisar a página antes de tentar login
        console.log('🔍 Analisando página do RHEvolution...');
        const pageTitle = await rhService.page.title();
        const pageUrl = rhService.page.url();
        console.log('📄 Título da página:', pageTitle);
        console.log('🌐 URL atual:', pageUrl);
        
        // Capturar screenshot para debug
        try {
          await rhService.page.screenshot({ path: 'rhevolution-page-debug.png', fullPage: true });
          console.log('📸 Screenshot salvo como rhevolution-page-debug.png');
        } catch (screenshotError) {
          console.log('⚠️ Erro ao capturar screenshot:', screenshotError.message);
        }
        
        // Fazer login SSO usando as credenciais Microsoft
        console.log('🔐 Iniciando login SSO...');
        const loginResult = await rhService.loginWithSSO(microsoftEmail, microsoftPassword);
        
        if (loginResult.success) {
          res.json({
            success: true,
            message: 'Autenticação integrada realizada com sucesso',
            data: {
              microsoft: {
                email: microsoftEmail,
                authenticated: true
              },
              rhevolution: {
                username: rhevolutionUsername,
                authenticated: true,
                sessionId: loginResult.sessionId,
                currentUrl: loginResult.currentUrl
              },
              timestamp: new Date().toISOString()
            }
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'Falha na autenticação integrada',
            error: loginResult.error || 'Erro desconhecido no login SSO'
          });
        }
        
      } finally {
        // Fechar o navegador
        await rhService.close();
      }
      
    } catch (error) {
      console.error('❌ Erro na autenticação integrada:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno na autenticação integrada',
        error: error.message
      });
    }
  }

  /**
   * Testa o Authorization Code Flow completo
   * GET /auth/microsoft/test-auth-flow
   */
  async testAuthorizationCodeFlow(req, res) {
    try {
      console.log('🧪 Testando Authorization Code Flow completo...');
      
      // Inicializar o serviço MSAL
      await this.msalService.init();
      
      // Gerar URL de autorização
      const authUrl = await this.msalService.getAuthCodeUrl();
      
      console.log('✅ URL de autorização gerada com sucesso');
      
      res.json({
        success: true,
        message: 'Authorization Code Flow iniciado com sucesso',
        data: {
          authUrl: authUrl,
          instructions: [
            '1. Acesse a URL de autorização fornecida',
            '2. Faça login com suas credenciais Microsoft',
            '3. Após autorização, você será redirecionado para o callback',
            '4. O callback processará o código e retornará os dados do usuário'
          ],
          callbackUrl: process.env.AZURE_REDIRECT_URI || 'http://localhost:3001/auth/microsoft/callback',
          testFlow: 'authorization_code'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro no teste do Authorization Code Flow:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor no teste',
        details: error.message
      });
    }
  }

  /**
   * Realiza logout
   * POST /auth/microsoft/logout
   */
  async logout(req, res) {
    try {
      await this.msalService.logout();
      
      console.log('Logout realizado com sucesso');
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao realizar logout',
        error: error.message
      });
    }
  }
}

export default MSALAuthController;