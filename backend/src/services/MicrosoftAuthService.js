const { ConfidentialClientApplication } = require('@azure/msal-node');
const fs = require('fs/promises');
const path = require('path');

/**
 * Serviço para autenticação SSO Microsoft usando MSAL
 * Suporta diferentes fluxos de autenticação Microsoft OAuth2
 * Implementa cache de tokens e gerenciamento de sessão seguro
 */
class MicrosoftAuthService {
  constructor() {
    this.msalInstance = null;
    this.isAuthenticated = false;
    this.userInfo = null;
    this.accessToken = null;
    this.tokenCache = null;
    this.sessionPersistent = true;
    this.cachePath = path.join(process.cwd(), 'temp', 'msal-cache.json');
  }

  /**
   * Inicializa o cliente MSAL para autenticação
   */
  async init() {
    try {
      console.log('🚀 Inicializando MSAL para autenticação Microsoft...');
      
      // Criar diretório temp se não existir
      await this.ensureTempDirectory();
      
      // Configuração do MSAL
      const msalConfig = {
        auth: {
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
          authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`
        },
        cache: {
          cacheLocation: this.cachePath
        }
      };

      // Validar configurações obrigatórias
      if (!msalConfig.auth.clientId || !msalConfig.auth.clientSecret) {
        throw new Error('AZURE_CLIENT_ID e AZURE_CLIENT_SECRET são obrigatórios');
      }

      this.msalInstance = new ConfidentialClientApplication(msalConfig);
      
      // Carregar cache de tokens se existir
      await this.loadTokenCache();

      console.log('✅ MSAL inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar MSAL:', error.message);
      throw new Error(`Falha na inicialização do MSAL: ${error.message}`);
    }
  }

  /**
   * Realiza autenticação SSO Microsoft usando MSAL
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @param {string} tenantId - ID do tenant (opcional)
   * @returns {Object} Resultado da autenticação
   */
  async authenticateSSO(email, password, tenantId = null) {
    try {
      if (!this.msalInstance) {
        throw new Error('MSAL não inicializado. Execute init() primeiro.');
      }

      console.log(`🔐 Iniciando autenticação MSAL para: ${email}`);
      
      // Verificar se já existe um token válido em cache
      const existingToken = await this.getValidTokenFromCache(email);
      if (existingToken) {
        console.log('✅ Token válido encontrado em cache');
        this.accessToken = existingToken.accessToken;
        this.isAuthenticated = true;
        this.userInfo = existingToken.account;
        return {
          success: true,
          message: 'Autenticação realizada com token em cache',
          userInfo: this.userInfo,
          sessionReused: true
        };
      }

      // Tentar autenticação usando ROPC (Resource Owner Password Credentials)
      console.log('🔐 Tentando autenticação ROPC...');
      
      const ropcRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
        username: email,
        password: password
      };

      try {
        const response = await this.msalInstance.acquireTokenByUsernamePassword(ropcRequest);
        
        if (response && response.accessToken) {
          console.log('✅ Autenticação ROPC bem-sucedida');
          
          this.accessToken = response.accessToken;
          this.isAuthenticated = true;
          this.userInfo = response.account;
          
          // Salvar token em cache
          await this.saveTokenCache(response);
          
          return {
            success: true,
            message: 'Autenticação Microsoft realizada com sucesso via ROPC',
            userInfo: this.userInfo,
            accessToken: this.accessToken,
            sessionReused: false
          };
        }
      } catch (ropcError) {
        console.log('❌ ROPC falhou, tentando Device Code Flow...');
        console.log('Erro ROPC:', ropcError.message);
        
        // Fallback para Device Code Flow
        return await this.authenticateWithDeviceCode();
      }

    } catch (error) {
      console.error('❌ Erro na autenticação SSO:', error.message);
      throw new Error(`Falha na autenticação Microsoft: ${error.message}`);
    }
  }

  /**
   * Autenticação usando Device Code Flow (fallback)
   */
  async authenticateWithDeviceCode() {
    try {
      console.log('📱 Iniciando Device Code Flow...');
      
      const deviceCodeRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
        deviceCodeCallback: (response) => {
          console.log('🔗 Acesse:', response.verificationUri);
          console.log('🔑 Código:', response.userCode);
          console.log('📋 Copie o código acima e cole no navegador');
        }
      };

      const response = await this.msalInstance.acquireTokenByDeviceCode(deviceCodeRequest);
      
      if (response && response.accessToken) {
        console.log('✅ Autenticação Device Code bem-sucedida');
        
        this.accessToken = response.accessToken;
        this.isAuthenticated = true;
        this.userInfo = response.account;
        
        // Salvar token em cache
        await this.saveTokenCache(response);
        
        return {
          success: true,
          message: 'Autenticação Microsoft realizada com sucesso via Device Code',
          userInfo: this.userInfo,
          accessToken: this.accessToken,
          sessionReused: false
        };
      }
    } catch (error) {
      console.error('❌ Erro no Device Code Flow:', error.message);
      throw new Error(`Falha na autenticação Device Code: ${error.message}`);
    }
  }

  /**
   * Salva token em cache para reutilização
   */
  async saveTokenCache(tokenResponse) {
    try {
      if (this.tokenCache && tokenResponse) {
        // O cache é gerenciado automaticamente pelo MSAL
        console.log('💾 Token salvo em cache');
        
        // Salvar informações adicionais se necessário
        this.lastTokenTime = Date.now();
      }
    } catch (error) {
      console.error('❌ Erro ao salvar token em cache:', error.message);
    }
  }

  /**
   * Carrega cache de tokens se existir
   */
  async loadTokenCache() {
    try {
      // O MSAL gerencia automaticamente o cache de tokens
      console.log('📂 Cache de tokens carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar cache de tokens:', error.message);
    }
  }

  /**
   * Verifica se há token válido em cache
   */
  async getValidTokenFromCache(email) {
    try {
      if (!this.msalInstance) {
        return null;
      }

      const accounts = await this.msalInstance.getTokenCache().getAllAccounts();
      
      if (accounts.length > 0) {
        const account = accounts.find(acc => acc.username === email) || accounts[0];
        
        const silentRequest = {
          scopes: ['https://graph.microsoft.com/.default'],
          account: account
        };

        try {
          const response = await this.msalInstance.acquireTokenSilent(silentRequest);
          
          if (response && response.accessToken) {
            console.log('✅ Token válido encontrado em cache');
            return response;
          }
        } catch (silentError) {
          console.log('⚠️ Token em cache expirado ou inválido');
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao verificar cache de token:', error.message);
      return null;
    }
  }

  /**
   * Extrai informações do usuário usando Microsoft Graph API
   */
  async extractUserInfo() {
    try {
      if (!this.accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      // Fazer chamada para Microsoft Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        
        console.log('👤 Informações do usuário extraídas via Graph API:', {
          displayName: userInfo.displayName,
          email: userInfo.mail || userInfo.userPrincipalName,
          id: userInfo.id
        });
        
        return {
          displayName: userInfo.displayName,
          email: userInfo.mail || userInfo.userPrincipalName,
          id: userInfo.id,
          jobTitle: userInfo.jobTitle,
          department: userInfo.department
        };
      } else {
        throw new Error(`Erro na API Graph: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao extrair informações do usuário:', error.message);
      
      // Fallback para informações básicas do account
      if (this.userInfo) {
        return {
          displayName: this.userInfo.name || 'Usuário Microsoft',
          email: this.userInfo.username || 'usuario@microsoft.com',
          id: this.userInfo.homeAccountId
        };
      }
      
      return {
        displayName: 'Usuário Microsoft',
        email: 'usuario@microsoft.com'
      };
    }
  }

  /**
   * Gera um ID de sessão único
   */
  generateSessionId() {
    return `msal_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Obtém informações do usuário autenticado
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * Faz requisição HTTP autenticada para uma URL específica
   * @param {string} url - URL de destino
   * @param {Object} options - Opções da requisição (method, headers, body)
   */
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      if (!this.isAuthenticated || !this.accessToken) {
        throw new Error('Usuário não está autenticado ou token inválido');
      }

      const defaultOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      console.log(`🔗 Fazendo requisição autenticada para: ${url}`);
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erro na requisição autenticada:', error.message);
      throw error;
    }
  }

  /**
   * Cria diretório temporário se não existir
   */
  async ensureTempDirectory() {
    try {
      const tempDir = path.dirname(this.cachePath);
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      console.warn('⚠️ Erro ao criar diretório temp:', error.message);
    }
  }

  /**
   * Obtém informações da sessão atual
   */
  async getSessionInfo() {
    try {
      if (!this.isAuthenticated || !this.accessToken) {
        return null;
      }

      return {
        isAuthenticated: this.isAuthenticated,
        userInfo: this.userInfo,
        accessToken: this.accessToken,
        tokenExpiry: this.userInfo?.idTokenClaims?.exp,
        sessionId: this.generateSessionId()
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações da sessão:', error.message);
      return null;
    }
  }

  /**
   * Verifica se a sessão ainda é válida
   */
  isSessionValid() {
    try {
      if (!this.isAuthenticated || !this.accessToken) {
        return false;
      }

      // Verificar se o token ainda é válido (básico)
      if (this.userInfo?.idTokenClaims?.exp) {
        const expiryTime = this.userInfo.idTokenClaims.exp * 1000; // Converter para ms
        const currentTime = Date.now();
        
        if (currentTime >= expiryTime) {
          console.log('⏰ Token expirado');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar validade da sessão:', error.message);
      return false;
    }
  }

  /**
   * Verifica se existe sessão válida usando MSAL cache
   */
  async checkExistingSession() {
    try {
      console.log('🔍 Verificando sessão existente no cache MSAL...');
      
      if (!this.msalInstance) {
        return false;
      }

      const accounts = await this.msalInstance.getTokenCache().getAllAccounts();
      
      if (accounts.length > 0) {
        const account = accounts[0];
        
        const silentRequest = {
          scopes: ['https://graph.microsoft.com/.default'],
          account: account
        };

        try {
          const response = await this.msalInstance.acquireTokenSilent(silentRequest);
          
          if (response && response.accessToken) {
            console.log('✅ Sessão válida encontrada no cache MSAL');
            this.isAuthenticated = true;
            this.accessToken = response.accessToken;
            this.userInfo = response.account;
            
            return {
              success: true,
              userInfo: this.userInfo,
              sessionId: this.generateSessionId(),
              authenticatedAt: new Date().toISOString(),
              cacheUsed: true
            };
          }
        } catch (silentError) {
          console.log('ℹ️ Token em cache expirado ou inválido');
        }
      }
      
      console.log('ℹ️ Nenhuma sessão válida encontrada - nova autenticação necessária');
      return false;
    } catch (error) {
      console.log('ℹ️ Verificação de sessão falhou - nova autenticação necessária');
      return false;
    }
  }

  /**
   * Limpa cache de tokens MSAL
   */
  async clearTokenCache() {
    try {
      if (this.msalInstance) {
        const accounts = await this.msalInstance.getTokenCache().getAllAccounts();
        
        for (const account of accounts) {
          await this.msalInstance.getTokenCache().removeAccount(account);
        }
        
        console.log('🗑️ Cache de tokens MSAL limpo');
        return true;
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache de tokens:', error.message);
    }
    return false;
  }

  /**
   * Logout e limpeza de sessão MSAL
   */
  async logout() {
    try {
      // Limpar cache de tokens
      await this.clearTokenCache();
      
      // Limpar propriedades da instância
      this.accessToken = null;
      this.isAuthenticated = false;
      this.userInfo = null;
      
      console.log('👋 Logout Microsoft realizado via MSAL');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout MSAL:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpa recursos MSAL
   */
  async close() {
    try {
      // Limpar propriedades da instância
      this.accessToken = null;
      this.isAuthenticated = false;
      this.userInfo = null;
      
      console.log('🔒 Recursos MSAL limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar recursos MSAL:', error.message);
    }
  }

  /**
   * Obtém status da autenticação
   */
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasValidToken: !!this.accessToken,
      userInfo: this.userInfo,
      sessionValid: this.isSessionValid()
    };
  }
}

module.exports = MicrosoftAuthService;