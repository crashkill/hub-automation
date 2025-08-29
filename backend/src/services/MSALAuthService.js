import { ConfidentialClientApplication } from '@azure/msal-node';
import fs from 'fs/promises';
import path from 'path';

/**
 * Serviço de autenticação Microsoft usando MSAL (Microsoft Authentication Library)
 * Implementa OAuth2 flow para autenticação segura sem necessidade de 2FA manual
 */
class MSALAuthService {
  constructor() {
    this.msalInstance = null;
    this.tokenCache = null;
    this.userAccount = null;
    this.tempDir = path.join(process.cwd(), 'temp');
    this.tokenCacheFile = path.join(this.tempDir, 'msal-token-cache.json');
    
    // Configuração MSAL
    this.clientConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`
      },
      cache: {
        cacheLocation: 'filesystem'
      }
    };
    
    // Escopos necessários para acessar o RHEvolution
    this.scopes = [
      'https://graph.microsoft.com/User.Read',
      'openid',
      'profile',
      'email'
    ];
  }

  /**
   * Inicializa o serviço MSAL
   */
  async init() {
    try {
      console.log('🔧 Inicializando MSAL Auth Service...');
      
      // Validar variáveis de ambiente
      this.validateEnvironmentVariables();
      
      // Criar diretório temporário se não existir
      await this.ensureTempDirectory();
      
      // Carregar cache de tokens se existir
      await this.loadTokenCache();
      
      // Inicializar MSAL
      this.msalInstance = new ConfidentialClientApplication(this.clientConfig);
      
      console.log('✅ MSAL Auth Service inicializado com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao inicializar MSAL Auth Service:', error.message);
      throw new Error(`Falha na inicialização MSAL: ${error.message}`);
    }
  }

  /**
   * Valida se todas as variáveis de ambiente necessárias estão configuradas
   */
  validateEnvironmentVariables() {
    const required = ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      throw new Error(`Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`);
    }
  }

  /**
   * Autentica usando MSAL OAuth2 flow
   */
  async authenticate(username, password = null) {
    try {
      console.log('🔐 Iniciando autenticação MSAL...');
      
      if (!this.msalInstance) {
        await this.init();
      }

      // Tentar autenticação silenciosa primeiro (usando cache)
      const silentResult = await this.attemptSilentAuthentication(username);
      if (silentResult) {
        console.log('✅ Autenticação silenciosa bem-sucedida');
        return silentResult;
      }

      // Se autenticação silenciosa falhar, usar Resource Owner Password Credentials (ROPC)
      if (password) {
        const ropcResult = await this.authenticateWithROPC(username, password);
        if (ropcResult) {
          console.log('✅ Autenticação ROPC bem-sucedida');
          return ropcResult;
        }
      }

      // Fallback: Device Code Flow (usuário precisa autorizar manualmente)
      console.log('⚠️ Iniciando Device Code Flow - autorização manual necessária');
      return await this.authenticateWithDeviceCode();
      
    } catch (error) {
      console.error('❌ Erro na autenticação MSAL:', error.message);
      throw new Error(`Falha na autenticação MSAL: ${error.message}`);
    }
  }

  /**
   * Tenta autenticação silenciosa usando tokens em cache
   */
  async attemptSilentAuthentication(username) {
    try {
      const accounts = await this.msalInstance.getTokenCache().getAllAccounts();
      const account = accounts.find(acc => acc.username === username);
      
      if (!account) {
        console.log('📝 Nenhuma conta em cache encontrada para:', username);
        return null;
      }

      const silentRequest = {
        account: account,
        scopes: this.scopes
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      
      this.userAccount = account;
      await this.saveTokenCache();
      
      return {
        success: true,
        accessToken: response.accessToken,
        account: account,
        expiresOn: response.expiresOn,
        method: 'silent'
      };
      
    } catch (error) {
      console.log('⚠️ Autenticação silenciosa falhou:', error.message);
      return null;
    }
  }

  /**
   * Autentica usando ROPC (Resource Owner Password Credentials)
   * Suportado pelo ConfidentialClientApplication
   */
  async authenticateWithROPC(username, password) {
    try {
      console.log('🔐 Tentando autenticação ROPC...');
      
      const request = {
        scopes: ['https://graph.microsoft.com/.default'],
        username: username,
        password: password
      };

      const response = await this.msalInstance.acquireTokenByUsernamePassword(request);
      
      this.userAccount = response.account;
      await this.saveTokenCache();
      
      return {
        success: true,
        accessToken: response.accessToken,
        account: response.account,
        expiresOn: response.expiresOn,
        method: 'ropc'
      };
      
    } catch (error) {
      console.log('⚠️ Autenticação ROPC falhou:', error.message);
      return null;
    }
  }

  /**
   * Autentica usando Client Credentials Flow
   * Para aplicações que não precisam de contexto de usuário
   */
  async authenticateWithClientCredentials() {
    try {
      console.log('🔑 Iniciando Client Credentials Flow...');
      
      const request = {
        scopes: ['https://graph.microsoft.com/.default']
      };

      const response = await this.msalInstance.acquireTokenByClientCredential(request);
      
      await this.saveTokenCache();
      
      return {
        success: true,
        accessToken: response.accessToken,
        expiresOn: response.expiresOn,
        method: 'client_credentials'
      };
      
    } catch (error) {
      console.error('❌ Client Credentials Flow falhou:', error.message);
      throw error;
    }
  }

  /**
   * Obtém um token de acesso válido (renovando se necessário)
   */
  async getAccessToken() {
    try {
      if (!this.userAccount) {
        throw new Error('Usuário não autenticado');
      }

      const silentRequest = {
        account: this.userAccount,
        scopes: this.scopes
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
      
    } catch (error) {
      console.error('❌ Erro ao obter token de acesso:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    return this.userAccount !== null;
  }

  /**
   * Obtém informações do usuário autenticado
   */
  getUserInfo() {
    if (!this.userAccount) {
      return null;
    }

    return {
      username: this.userAccount.username,
      name: this.userAccount.name,
      localAccountId: this.userAccount.localAccountId,
      homeAccountId: this.userAccount.homeAccountId,
      tenantId: this.userAccount.tenantId
    };
  }

  /**
   * Faz logout e limpa o cache
   */
  async logout() {
    try {
      if (this.userAccount) {
        await this.msalInstance.getTokenCache().removeAccount(this.userAccount);
        this.userAccount = null;
      }
      
      await this.clearTokenCache();
      console.log('✅ Logout realizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error.message);
      throw error;
    }
  }

  /**
   * Carrega o cache de tokens do arquivo
   */
  async loadTokenCache() {
    try {
      const cacheData = await fs.readFile(this.tokenCacheFile, 'utf8');
      this.tokenCache = JSON.parse(cacheData);
      console.log('📂 Cache de tokens carregado');
    } catch (error) {
      console.log('📝 Nenhum cache de tokens encontrado, iniciando novo');
      this.tokenCache = {};
    }
  }

  /**
   * Salva o cache de tokens no arquivo
   */
  async saveTokenCache() {
    try {
      if (this.msalInstance) {
        const cache = this.msalInstance.getTokenCache().serialize();
        await fs.writeFile(this.tokenCacheFile, cache, 'utf8');
        console.log('💾 Cache de tokens salvo');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar cache de tokens:', error.message);
    }
  }

  /**
   * Limpa o cache de tokens
   */
  async clearTokenCache() {
    try {
      await fs.unlink(this.tokenCacheFile);
      console.log('🗑️ Cache de tokens limpo');
    } catch (error) {
      // Arquivo pode não existir, ignorar erro
    }
  }

  /**
   * Garante que o diretório temporário existe
   */
  async ensureTempDirectory() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('📁 Diretório temporário criado:', this.tempDir);
    }
  }

  /**
   * Obtém URL para autorização OAuth2
   * @returns {Promise<string>} URL de autorização
   */
  async getAuthCodeUrl() {
    try {
      if (!this.msalInstance) {
        await this.init();
      }
      
      const authCodeUrlParameters = {
        scopes: this.scopes,
        redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      };
      
      const response = await this.msalInstance.getAuthCodeUrl(authCodeUrlParameters);
      console.log('✅ URL de autorização gerada com sucesso');
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao gerar URL de autorização:', error.message);
      throw new Error(`Falha ao gerar URL de autorização: ${error.message}`);
    }
  }

  /**
   * Troca código de autorização por tokens
   * @param {string} code - Código de autorização recebido no callback
   * @returns {Promise<Object>} Resposta com tokens
   */
  async acquireTokenByCode(code) {
    try {
      if (!this.msalInstance) {
        await this.init();
      }
      
      const tokenRequest = {
        code: code,
        scopes: this.scopes,
        redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      };
      
      const response = await this.msalInstance.acquireTokenByCode(tokenRequest);
      
      // Armazena conta do usuário
      this.userAccount = response.account;
      await this.saveTokenCache();
      
      console.log('✅ Token adquirido com sucesso via código de autorização');
      
      return {
        success: true,
        accessToken: response.accessToken,
        account: response.account,
        expiresOn: response.expiresOn,
        method: 'authorization_code'
      };
    } catch (error) {
      console.error('❌ Erro ao adquirir token por código:', error.message);
      throw new Error(`Falha ao adquirir token: ${error.message}`);
    }
  }

  /**
   * Obtém informações do usuário usando o token de acesso
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<Object>} Informações do usuário
   */
  async getUserInfoFromGraph(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API do Graph: ${response.status} ${response.statusText}`);
      }
      
      const userInfo = await response.json();
      console.log('✅ Informações do usuário obtidas com sucesso');
      
      return userInfo;
    } catch (error) {
      console.error('❌ Erro ao obter informações do usuário:', error.message);
      throw new Error(`Falha ao obter informações do usuário: ${error.message}`);
    }
  }

  /**
   * Fecha o serviço e limpa recursos
   */
  async close() {
    try {
      await this.saveTokenCache();
      this.msalInstance = null;
      this.userAccount = null;
      console.log('🔒 MSAL Auth Service fechado');
    } catch (error) {
      console.error('❌ Erro ao fechar MSAL Auth Service:', error.message);
    }
  }
}

export default MSALAuthService;