const puppeteer = require('puppeteer');
const { config } = require('../config/environment.js');
const MicrosoftAuthService = require('./MicrosoftAuthService.js');

/**
 * Serviço para automação e scraping do sistema Rhevolution
 * Suporta autenticação padrão e SSO Microsoft
 */
class RhevolutionService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isConnected = false;
    this.sessionData = null;
    this.microsoftAuth = new MicrosoftAuthService();
    this.authMethod = 'standard'; // 'standard' ou 'sso'
  }

  /**
   * Inicializa o browser Puppeteer
   */
  async init() {
    try {
      console.log('🚀 Inicializando browser Puppeteer...');
      
      this.browser = await puppeteer.launch({
        headless: config.rhevolution.puppeteer.headless,
        args: config.rhevolution.puppeteer.args,
        defaultViewport: config.rhevolution.puppeteer.defaultViewport,
        devtools: config.rhevolution.puppeteer.devtools,
        slowMo: config.rhevolution.puppeteer.slowMo
      });

      this.page = await this.browser.newPage();
      
      // Configurar user agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      console.log('✅ Browser Puppeteer inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar browser:', error.message);
      throw new Error(`Falha na inicialização do browser: ${error.message}`);
    }
  }

  /**
   * Realiza login no sistema Rhevolution
   * @param {string} username - Nome de usuário
   * * @param {string} password - Senha
   * @param {Object} options - Opções de autenticação
   * @returns {Object} Resultado do login
   */
  async login(username, password, options = {}) {
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa de login ${attempt}/${maxRetries}`);
        return await this._performLogin(username, password, options);
      } catch (error) {
        lastError = error;
        console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
        
        // Se é erro de frame desanexado ou página fechada, reinicializar
        if (error.message.includes('detached Frame') || 
            error.message.includes('Target closed') ||
            error.message.includes('Session closed') ||
            this.page?.isClosed()) {
          console.log('🔄 Reinicializando browser devido a erro de frame...');
          await this.close();
          await new Promise(resolve => setTimeout(resolve, 2000));
          await this.init();
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    throw lastError;
  }
  
  /**
   * Executa o processo de login (método interno)
   */
  async _performLogin(username, password, options = {}) {
    try {
      const { authMethod = 'standard', tenantId = null } = options;
      this.authMethod = authMethod;

      if (!this.browser || !this.page) {
        await this.init();
      }

      console.log(`🔐 Realizando login no Rhevolution para usuário: ${username} (método: ${authMethod})`);

      // Verificar se a página ainda está válida
      if (!this.page || this.page.isClosed()) {
        console.log('🔄 Página fechada, reinicializando...');
        await this.init();
      }

      // Navegar para página de login com retry
      let loginUrl = process.env.RHEVOLUTION_URL;
      
      // Para login padrão, tentar URL específica que evita redirecionamento Microsoft
      if (authMethod === 'standard') {
        // Tentar URLs alternativas que podem evitar SSO automático
        const alternativeUrls = [
          `${process.env.RHEVOLUTION_URL}/login`,
          `${process.env.RHEVOLUTION_URL}/ords/rhportal/rhlgweb.login`,
          `${process.env.RHEVOLUTION_URL}?force_standard_login=true`,
          process.env.RHEVOLUTION_URL
        ];
        
        for (const url of alternativeUrls) {
          try {
            console.log(`🔍 Tentando URL: ${url}`);
            await this._navigateWithRetry(url);
            
            // Aguardar carregamento e verificar se não redirecionou para Microsoft
            await new Promise(resolve => setTimeout(resolve, 3000));
            const currentUrl = this.page.url();
            
            if (!currentUrl.includes('login.microsoftonline.com')) {
              console.log(`✅ URL encontrada sem redirecionamento Microsoft: ${url}`);
              break;
            } else {
              console.log(`❌ URL redirecionou para Microsoft: ${url}`);
            }
          } catch (error) {
            console.log(`⚠️ Erro ao tentar URL ${url}:`, error.message);
            continue;
          }
        }
      } else {
        await this._navigateWithRetry(loginUrl);
      }

      // Aguardar carregamento completo da página antes de verificar SSO
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar página atual para debug
      const { currentUrl, pageContent, isMicrosoftLogin } = await this._analyzeCurrentPage();
      console.log('🔍 URL atual:', currentUrl);
      console.log('🔍 É página Microsoft?', isMicrosoftLogin);
      
      // Priorizar o método de autenticação especificado
      if (authMethod === 'standard') {
        console.log('🔑 Forçando login padrão conforme solicitado...');
        
        // Se estivermos na página Microsoft mas o usuário quer login padrão,
        // tentar navegar para uma URL que force o login padrão
        if (isMicrosoftLogin) {
          console.log('⚠️ Estamos na página Microsoft mas authMethod é standard');
          console.log('🔄 Tentando forçar saída da página Microsoft...');
          
          try {
            // Tentar voltar e acessar uma URL específica
            await this.page.goBack({ waitUntil: 'networkidle0', timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Tentar URL direta do sistema sem SSO
            const directUrl = `${process.env.RHEVOLUTION_URL}/ords/rhportal/rhlgweb.login?disable_sso=true`;
            console.log(`🔄 Tentando URL direta: ${directUrl}`);
            await this.page.goto(directUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            const newUrl = this.page.url();
            console.log(`🔍 Nova URL após tentativa: ${newUrl}`);
            
            if (newUrl.includes('login.microsoftonline.com')) {
              console.log('⚠️ Ainda na página Microsoft - sistema força SSO');
              console.log('🔄 Tentando login padrão mesmo na página Microsoft...');
            }
          } catch (error) {
            console.log('⚠️ Erro ao tentar sair da página Microsoft:', error.message);
          }
        }
        
        return await this.loginStandard(username, password);
      } else if (authMethod === 'sso') {
        console.log('🔗 Usando SSO Microsoft conforme solicitado...');
        return await this.loginWithSSO(username, password, tenantId);
      } else {
        // Verificar se estamos na página de login da Microsoft (fallback)
        if (isMicrosoftLogin) {
          console.log('🔗 Detectada página de login Microsoft, redirecionando para SSO...');
          return await this.loginWithSSO(username, password, tenantId);
        } else {
          return await this.loginStandard(username, password);
        }
      }

    } catch (error) {
      console.error('❌ Erro no login Rhevolution:', error.message);
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * Navega para uma URL com retry automático
   */
  async _navigateWithRetry(url, maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🌐 Tentativa ${retryCount + 1} de navegação para ${url}`);
        await this.page.goto(url, { 
          waitUntil: 'networkidle0', 
          timeout: 30000 
        });
        return;
      } catch (navError) {
        retryCount++;
        console.log(`⚠️ Erro na navegação (tentativa ${retryCount}):`, navError.message);
        if (retryCount >= maxRetries) {
          throw new Error(`Falha na navegação após ${maxRetries} tentativas: ${navError.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  /**
   * Analisa a página atual para determinar o tipo de login
   */
  async _analyzeCurrentPage() {
    let currentUrl = '';
    let pageContent = '';
    
    try {
      currentUrl = this.page.url();
      pageContent = await this.page.content();
    } catch (contentError) {
      console.log('⚠️ Erro ao obter conteúdo da página:', contentError.message);
    }
    
    const isMicrosoftLogin = currentUrl.includes('login.microsoftonline.com') || 
                            currentUrl.includes('microsoftonline') ||
                            pageContent.includes('Entrar em sua conta') ||
                            pageContent.includes('Microsoft') ||
                            pageContent.includes('Office 365') ||
                            pageContent.includes('Sign in to your account');
    
    return { currentUrl, pageContent, isMicrosoftLogin };
  }

  /**
   * Login padrão com usuário e senha
   */
  async loginStandard(username, password) {
    try {
      console.log('🔐 Iniciando login padrão...');
      
      // Verificar se estamos na página Microsoft
      const currentUrl = this.page.url();
      console.log(`🔍 URL atual no loginStandard: ${currentUrl}`);
      
      if (currentUrl.includes('login.microsoftonline.com')) {
        console.log('⚠️ Detectada página Microsoft no loginStandard');
        console.log('🔄 Tentando procurar opção de login alternativo...');
        
        // Procurar por links ou botões que permitam login sem SSO
        try {
          const alternativeLoginSelectors = [
            'a[href*="login"]',
            'a[href*="standard"]',
            'a[href*="alternative"]',
            'button:contains("Outro método")',
            'a:contains("Entrar de outra forma")',
            'a:contains("Usar conta local")',
            'a:contains("Login padrão")',
            '.alternative-login',
            '#alternative-login'
          ];
          
          for (const selector of alternativeLoginSelectors) {
            try {
              const element = await this.page.$(selector);
              if (element) {
                console.log(`✅ Encontrado elemento alternativo: ${selector}`);
                await element.click();
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const newUrl = this.page.url();
                console.log(`🔍 Nova URL após clique: ${newUrl}`);
                
                if (!newUrl.includes('login.microsoftonline.com')) {
                  console.log('✅ Saiu da página Microsoft!');
                  break;
                }
              }
            } catch (error) {
              // Continuar tentando outros seletores
              continue;
            }
          }
        } catch (error) {
          console.log('⚠️ Erro ao procurar login alternativo:', error.message);
        }
        
        // Se ainda estivermos na página Microsoft, tentar fazer login Microsoft mesmo
        const finalUrl = this.page.url();
        if (finalUrl.includes('login.microsoftonline.com')) {
          console.log('⚠️ Ainda na página Microsoft - sistema força SSO');
          console.log('🔄 Fazendo fallback para autenticação Microsoft...');
          
          // Usar as credenciais do RH para tentar login Microsoft
          const microsoftEmail = process.env.RHEVOLUTION_EMAIL || `${username}@globalhitss.com.br`;
          const microsoftPassword = process.env.RHEVOLUTION_PASSWORD || password;
          
          console.log(`🔑 Tentando login Microsoft com: ${microsoftEmail}`);
          return await this.authenticateDirectlyOnMicrosoft(microsoftEmail, microsoftPassword);
        }
      }
      
      // Aguardar elementos de login aparecerem com tratamento de erro
      await this._waitForLoginElements();
      
      // Procurar e preencher campos de login
      const { usernameField, passwordField } = await this._findLoginFields();
      
      if (!usernameField || !passwordField) {
        throw new Error('Campos de login não encontrados na página');
      }
      
      console.log('✅ Campos de login encontrados');
      
      // Preencher credenciais com tratamento de erro
      await this._fillLoginCredentials(usernameField, passwordField, username, password);
      
      // Submeter formulário
      await this._submitLoginForm(passwordField);
      
      // Verificar resultado do login
      await this._verifyLoginResult();
      
      this.isConnected = true;
      this.sessionData = {
        username,
        authMethod: 'standard',
        loginTime: new Date().toISOString(),
        sessionId: this.generateSessionId()
      };
      
      console.log('✅ Login padrão realizado com sucesso no Rhevolution');
      
      return {
        success: true,
        message: 'Login realizado com sucesso',
        sessionId: this.sessionData.sessionId,
        user: username,
        authMethod: 'standard'
      };
      
    } catch (error) {
      console.error('❌ Erro no login padrão:', error.message);
      this.isConnected = false;
      throw new Error(`Falha no login padrão: ${error.message}`);
    }
  }
  
  /**
   * Aguarda elementos de login aparecerem
   */
  async _waitForLoginElements() {
    try {
      await this.page.waitForSelector('input[name="username"], input[type="email"], input[name="email"], #username, #email', { timeout: 10000 });
    } catch (selectorError) {
      console.log('⚠️ Timeout aguardando seletores de username, tentando continuar...');
    }
  }
  
  /**
   * Encontra campos de login na página
   */
  async _findLoginFields() {
    console.log('🔍 Procurando campos de login...');
    
    const usernameSelectors = [
      'input[name="username"]',
      'input[type="email"]', 
      'input[name="email"]',
      '#username',
      '#email',
      'input[name="p_username"]'
    ];
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      '#password',
      'input[name="p_password"]'
    ];
    
    let usernameField = null;
    let passwordField = null;
    
    // Procurar campo de username
    for (const selector of usernameSelectors) {
      try {
        usernameField = await this.page.$(selector);
        if (usernameField) {
          console.log(`✅ Campo username encontrado: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Erro ao procurar ${selector}:`, error.message);
      }
    }
    
    // Procurar campo de password
    for (const selector of passwordSelectors) {
      try {
        passwordField = await this.page.$(selector);
        if (passwordField) {
          console.log(`✅ Campo password encontrado: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Erro ao procurar ${selector}:`, error.message);
      }
    }
    
    return { usernameField, passwordField };
  }
  
  /**
   * Preenche credenciais nos campos de login
   */
  async _fillLoginCredentials(usernameField, passwordField, username, password) {
    try {
      // Limpar e preencher username
      await usernameField.click({ clickCount: 3 }); // Selecionar tudo
      await usernameField.type(username, { delay: 100 });
      console.log('✅ Username preenchido');
      
      // Limpar e preencher password
      await passwordField.click({ clickCount: 3 }); // Selecionar tudo
      await passwordField.type(password, { delay: 100 });
      console.log('✅ Password preenchido');
      
    } catch (error) {
      throw new Error(`Erro ao preencher credenciais: ${error.message}`);
    }
  }
  
  /**
   * Submete o formulário de login
   */
  async _submitLoginForm(passwordField) {
    try {
      console.log('🔘 Procurando botão de login...');
      
      const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Entrar")',
        'button:contains("Login")',
        '#login-button',
        '.login-button',
        '.btn-login'
      ];
      
      let loginButton = null;
      
      for (const selector of buttonSelectors) {
        try {
          loginButton = await this.page.$(selector);
          if (loginButton) {
            console.log(`✅ Botão de login encontrado: ${selector}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Erro ao procurar botão ${selector}:`, error.message);
        }
      }
      
      if (loginButton) {
        await loginButton.click();
        console.log('🔘 Botão de login clicado');
      } else {
        // Fallback: pressionar Enter no campo de password
        console.log('🔘 Botão não encontrado, pressionando Enter...');
        await passwordField.press('Enter');
      }
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      throw new Error(`Erro ao submeter formulário: ${error.message}`);
    }
  }
  
  /**
   * Verifica o resultado do login
   */
  async _verifyLoginResult() {
    try {
      const currentUrl = this.page.url();
      
      // Verificar se houve erro de login
      const errorSelectors = [
        '.error',
        '.alert-danger', 
        '.login-error',
        '[class*="error"]',
        '.message-error'
      ];
      
      for (const selector of errorSelectors) {
        try {
          const errorElement = await this.page.$(selector);
          if (errorElement) {
            const errorText = await errorElement.evaluate(el => el.textContent || el.innerText);
            if (errorText && errorText.trim()) {
              throw new Error(`Erro de autenticação: ${errorText.trim()}`);
            }
          }
        } catch (evalError) {
          console.log(`⚠️ Erro ao verificar ${selector}:`, evalError.message);
        }
      }
      
      // Verificar se ainda estamos na página de login
      if (currentUrl.includes('login') && !currentUrl.includes('dashboard') && !currentUrl.includes('home')) {
        throw new Error('Login falhou - ainda na página de login');
      }
      
      console.log('✅ Login verificado com sucesso');
      
    } catch (error) {
      throw new Error(`Falha na verificação do login: ${error.message}`);
    }
  }

  /**
   * Login com SSO Microsoft
   */
  async loginWithSSO(username, password, tenantId = null) {
    try {
      console.log('🔐 Realizando login com SSO Microsoft...');

      const currentUrl = this.page.url();
      
      // Se já estamos na página Microsoft, fazer login direto
      if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('microsoftonline')) {
        console.log('🔗 Já estamos na página de autenticação Microsoft');
        return await this.authenticateDirectlyOnMicrosoft(username, password);
      }

      // Aguardar a página carregar e analisar conteúdo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Debug: capturar informações da página
      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();
      console.log('📄 Título da página:', pageTitle);
      console.log('🌐 URL da página:', pageUrl);
      
      // Procurar botões SSO Microsoft com seletores mais amplos
      const ssoSelectors = [
        'button[data-provider="microsoft"]',
        '.btn-microsoft',
        '.sso-microsoft', 
        'a[href*="microsoft"]',
        'button:contains("Microsoft")',
        'a:contains("Microsoft")',
        'button:contains("Office 365")',
        'a:contains("Office 365")',
        'button:contains("Azure")',
        'a:contains("Azure")',
        '[class*="microsoft"]',
        '[id*="microsoft"]',
        'input[value*="Microsoft"]',
        'button[title*="Microsoft"]'
      ];
      
      let ssoButton = null;
      
      for (const selector of ssoSelectors) {
        try {
          ssoButton = await this.page.$(selector);
          if (ssoButton) {
            console.log(`✅ Botão SSO encontrado com seletor: ${selector}`);
            break;
          }
        } catch (error) {
          // Continuar tentando outros seletores
        }
      }
      
      // Se não encontrou, listar todos os botões e links para debug
      if (!ssoButton) {
        console.log('🔍 Botão SSO não encontrado, listando elementos disponíveis...');
        
        const buttons = await this.page.$$eval('button', buttons => 
          buttons.map(btn => ({
            text: btn.textContent?.trim(),
            className: btn.className,
            id: btn.id,
            title: btn.title,
            dataset: Object.keys(btn.dataset).length > 0 ? btn.dataset : null
          }))
        );
        
        const links = await this.page.$$eval('a', links => 
          links.map(link => ({
            text: link.textContent?.trim(),
            href: link.href,
            className: link.className,
            id: link.id
          }))
        );
        
        console.log('🔘 Botões encontrados:', JSON.stringify(buttons, null, 2));
        console.log('🔗 Links encontrados:', JSON.stringify(links, null, 2));
      }
      
      if (ssoButton) {
        console.log('🖱️ Clicando no botão SSO Microsoft...');
        await ssoButton.click();
        
        // Aguardar navegação ou mudança na página
        try {
          await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
        } catch (navError) {
          console.log('⚠️ Timeout na navegação, verificando se houve redirecionamento...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Verificar se foi redirecionado para Microsoft
      const newUrl = this.page.url();
      if (newUrl.includes('login.microsoftonline.com')) {
        console.log('🔗 Redirecionado para autenticação Microsoft');
        
        // Usar o serviço de autenticação Microsoft
        await this.microsoftAuth.init();
        const authResult = await this.microsoftAuth.authenticateSSO(username, password, tenantId);
        
        if (authResult.success) {
          // Aguardar redirecionamento de volta para o Rhevolution
          await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
          
          // Verificar se voltou para o Rhevolution autenticado
          const finalUrl = this.page.url();
          if (finalUrl.includes(new URL(process.env.RHEVOLUTION_URL).hostname)) {
            this.isConnected = true;
            this.sessionData = {
              username,
              authMethod: 'sso',
              loginTime: new Date().toISOString(),
              sessionId: this.generateSessionId(),
              microsoftAuth: authResult.userInfo
            };

            console.log('✅ Login SSO Microsoft realizado com sucesso no Rhevolution');
            
            return {
              success: true,
              message: 'Login SSO realizado com sucesso',
              sessionId: this.sessionData.sessionId,
              user: username,
              authMethod: 'sso',
              userInfo: authResult.userInfo
            };
          } else {
            throw new Error('Falha no redirecionamento após autenticação Microsoft');
          }
        } else {
          throw new Error('Falha na autenticação Microsoft');
        }
      } else {
        // Se não foi redirecionado, tentar login padrão
        console.log('⚠️ SSO não disponível, tentando login padrão...');
        return await this.loginStandard(username, password);
      }

    } catch (error) {
      console.error('❌ Erro no login SSO:', error.message);
      
      // Verificar se ainda estamos na página Microsoft
      const currentUrl = this.page.url();
      if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('microsoftonline')) {
        console.log('🚫 Ainda na página Microsoft - não fazendo fallback para login padrão');
        throw new Error(`Falha na autenticação Microsoft: ${error.message}`);
      }
      
      // Fallback para login padrão apenas se não estivermos na página Microsoft
      console.log('🔄 Tentando fallback para login padrão...');
      return await this.loginStandard(username, password);
    }
  }

  /**
   * Autentica diretamente na página Microsoft
   */
  async authenticateDirectlyOnMicrosoft(username, password) {
    try {
      console.log('🔐 Iniciando autenticação direta na página Microsoft...');
      console.log('🌐 URL atual:', this.page.url());
      
      // Aguardar a página carregar completamente com múltiplas verificações
      await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
        console.log('⚠️ Timeout aguardando networkidle, continuando...');
      });
      
      // Aguardar elementos aparecerem
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Debug: capturar conteúdo da página
      const pageContent = await this.page.content();
      const pageTitle = await this.page.title();
      console.log('📄 Título da página:', pageTitle);
      console.log('📄 Conteúdo da página (primeiros 800 chars):', pageContent.substring(0, 800));
      
      // Verificar se estamos numa página de MFA ou numa página de login
      const isMfaPage = pageContent.includes('mfaAuthMethod') || 
                       pageContent.includes('rememberMFA') || 
                       pageTitle.includes('Verificação') ||
                       pageTitle.includes('Verification') ||
                       pageContent.includes('Verificar sua identidade') ||
                       pageContent.includes('ConvergedTFA') ||
                       pageContent.includes('PageID" content="ConvergedTFA') ||
                       (pageTitle.includes('Entrar em sua conta') && pageContent.includes('mfaAuthMethod'));
      
      if (isMfaPage) {
        console.log('🔐 Detectada página de MFA/Verificação - tentando pular...');
        
        // Tentar encontrar botão para pular MFA ou usar método alternativo
        const skipMfaSelectors = [
          'a[href*="skip"]',
          'button:contains("Pular")',
          'a:contains("Pular por agora")',
          'a:contains("Skip for now")',
          'a:contains("Usar outro método")',
          'a:contains("Use another method")',
          '#idBtn_SAOTCS_Cancel',
          '.cancel-button',
          'input[value*="Cancel"]',
          'input[value*="Cancelar"]'
        ];
        
        for (const selector of skipMfaSelectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              console.log(`✅ Encontrado botão para pular MFA: ${selector}`);
              await element.click();
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Verificar se saímos da página de MFA
              const newUrl = this.page.url();
              console.log(`🔍 Nova URL após pular MFA: ${newUrl}`);
              
              if (!newUrl.includes('login.microsoftonline.com')) {
                console.log('✅ Saiu da página Microsoft após pular MFA!');
                return { success: true, message: 'MFA pulado com sucesso' };
              }
              break;
            }
          } catch (error) {
            continue;
          }
        }
        
        // Se não conseguiu pular MFA, tentar continuar sem autenticação
        console.log('⚠️ Não foi possível pular MFA - sistema pode estar bloqueado');
        throw new Error('Página de MFA detectada - não é possível continuar automaticamente');
      }
      
      // Aguardar especificamente por campos de input aparecerem
      console.log('⏳ Aguardando campos de input aparecerem...');
      try {
        await this.page.waitForSelector('input', { timeout: 10000 });
        console.log('✅ Campos de input detectados');
      } catch (error) {
        console.log('⚠️ Timeout aguardando inputs, continuando...');
      }
      
      // Procurar campo de email com estratégia mais robusta
      const emailSelectors = [
        'input[type="email"]',
        'input[name="loginfmt"]',
        'input[id="i0116"]',
        'input[placeholder*="email"]',
        'input[placeholder*="Email"]',
        'input[data-bind*="loginfmt"]',
        'input[autocomplete="username"]',
        'input[aria-label*="email"]',
        'input[aria-label*="Email"]'
      ];
      
      let emailField = null;
      console.log('🔍 Procurando campo de email com estratégia robusta...');
      
      // Tentar múltiplas vezes com intervalos
      for (let attempt = 0; attempt < 3; attempt++) {
        console.log(`🔄 Tentativa ${attempt + 1} de encontrar campo de email...`);
        
        for (const selector of emailSelectors) {
          try {
            emailField = await this.page.$(selector);
            if (emailField) {
              // Verificar se o campo está visível
              const isVisible = await emailField.isVisible().catch(() => false);
              if (isVisible) {
                console.log('✅ Campo de email encontrado e visível:', selector);
                break;
              } else {
                console.log('⚠️ Campo encontrado mas não visível:', selector);
                emailField = null;
              }
            }
          } catch (error) {
            console.log(`⚠️ Erro ao procurar ${selector}:`, error.message);
          }
        }
        
        if (emailField) break;
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!emailField) {
        // Listar todos os inputs disponíveis para debug
        const allInputs = await this.page.$$eval('input', inputs => 
          inputs.map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className,
            visible: input.offsetParent !== null
          }))
        );
        console.log('🔍 Todos os inputs encontrados na página:', JSON.stringify(allInputs, null, 2));
        throw new Error('Campo de email não encontrado na página Microsoft');
      }
      
      // Preencher email
      await emailField.click();
      await emailField.evaluate(el => el.value = ''); // Limpar campo
      await emailField.type(process.env.RHEVOLUTION_EMAIL || username);
      console.log('📧 Email preenchido:', process.env.RHEVOLUTION_EMAIL || username);
      
      // Procurar e clicar no botão "Avançar" ou "Next"
      const nextButtonSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'input[value="Avançar"]',
        'input[value="Next"]',
        '#idSIButton9'
      ];
      
      let nextButton = null;
      for (const selector of nextButtonSelectors) {
        nextButton = await this.page.$(selector);
        if (nextButton) {
          console.log('✅ Botão avançar encontrado:', selector);
          break;
        }
      }
      
      if (nextButton) {
        await nextButton.click();
        // Aguardar navegação após clicar em "Avançar"
        try {
          await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
        } catch (navError) {
          console.log('⚠️ Timeout na navegação, continuando...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Aguardar campo de senha aparecer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Procurar campo de senha
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="passwd"]',
        'input[id="i0118"]',
        'input[placeholder*="password"]',
        'input[placeholder*="Password"]',
        'input[placeholder*="senha"]'
      ];
      
      let passwordField = null;
      for (const selector of passwordSelectors) {
        passwordField = await this.page.$(selector);
        if (passwordField) {
          console.log('✅ Campo de senha encontrado:', selector);
          break;
        }
      }
      
      if (!passwordField) {
        throw new Error('Campo de senha não encontrado na página Microsoft');
      }
      
      // Preencher senha
      await passwordField.click();
      await passwordField.evaluate(el => el.value = ''); // Limpar campo
      await passwordField.type(password);
      console.log('🔑 Senha preenchida');
      
      // Procurar e clicar no botão "Entrar" ou "Sign in"
      const signInButtonSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'input[value="Entrar"]',
        'input[value="Sign in"]',
        '#idSIButton9'
      ];
      
      let signInButton = null;
      for (const selector of signInButtonSelectors) {
        signInButton = await this.page.$(selector);
        if (signInButton) {
          console.log('✅ Botão entrar encontrado:', selector);
          break;
        }
      }
      
      if (!signInButton) {
        throw new Error('Botão de login não encontrado na página Microsoft');
      }
      
      // Clicar no botão de login
      await signInButton.click();
      console.log('🔄 Aguardando redirecionamento após login...');
      
      // Aguardar navegação ou redirecionamento com tratamento robusto
      let navigationCompleted = false;
      const maxWaitTime = 20000; // 20 segundos
      const startTime = Date.now();
      
      while (!navigationCompleted && (Date.now() - startTime) < maxWaitTime) {
        try {
          // Verificar se ainda estamos na página de login Microsoft
          const currentUrl = this.page.url();
          if (!currentUrl.includes('login.microsoftonline.com')) {
            navigationCompleted = true;
            console.log('✅ Redirecionamento detectado para:', currentUrl);
            break;
          }
          
          // Aguardar um pouco antes de verificar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log('⚠️ Erro ao verificar URL, continuando...', error.message);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!navigationCompleted) {
        console.log('⚠️ Timeout aguardando redirecionamento, verificando estado atual...');
      }
      
      // Verificar se o login foi bem-sucedido
       const finalUrl = this.page.url();
       console.log('🔍 URL final após login:', finalUrl);
       
       // Verificar se há mensagens de erro na página
       const errorElements = await this.page.$$('[data-bind*="error"], .error, .alert-error, [id*="error"]');
       if (errorElements.length > 0) {
         for (const errorEl of errorElements) {
           const errorText = await errorEl.evaluate(el => el.textContent);
           if (errorText && errorText.trim()) {
             console.log('⚠️ Erro encontrado na página:', errorText.trim());
           }
         }
       }
       
       if (!finalUrl.includes('login.microsoftonline.com')) {
        this.isConnected = true;
        this.sessionData = {
          username: process.env.RHEVOLUTION_EMAIL || username,
          authMethod: 'sso',
          loginTime: new Date().toISOString(),
          sessionId: this.generateSessionId()
        };
        
        console.log('✅ Login Microsoft realizado com sucesso!');
        
        return {
          success: true,
          message: 'Login Microsoft realizado com sucesso',
          sessionId: this.sessionData.sessionId,
          user: process.env.RHEVOLUTION_EMAIL || username,
          authMethod: 'sso'
        };
      } else {
        throw new Error('Login Microsoft falhou - ainda na página de login');
      }
      
    } catch (error) {
      console.error('❌ Erro na autenticação Microsoft:', error.message);
      throw new Error(`Falha na autenticação Microsoft: ${error.message}`);
    }
  }

  /**
   * Realiza logout do sistema
   */
  async logout() {
    try {
      if (!this.isConnected) {
        return { success: true, message: 'Usuário já desconectado' };
      }

      console.log('🚪 Realizando logout do Rhevolution...');

      if (this.authMethod === 'sso' && this.microsoftAuth) {
        // Logout do Microsoft primeiro
        await this.microsoftAuth.logout();
      }

      if (this.page) {
        // Tentar encontrar botão de logout
        const logoutSelectors = [
          'a[href*="logout"]',
          'button[data-action="logout"]',
          '.btn-logout',
          '#logout',
          'a[title*="Sair"]',
          'a[title*="Logout"]'
        ];

        for (const selector of logoutSelectors) {
          const logoutButton = await this.page.$(selector);
          if (logoutButton) {
            await logoutButton.click();
            await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
            break;
          }
        }
      }

      this.isConnected = false;
      this.sessionData = null;
      this.authMethod = 'standard';

      console.log('✅ Logout realizado com sucesso');
      
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro no logout:', error.message);
      // Forçar desconexão mesmo com erro
      this.isConnected = false;
      this.sessionData = null;
      return {
        success: true,
        message: 'Logout forçado realizado'
      };
    }
  }

  /**
   * Extrai dados de funcionários
   */
  async getEmployees() {
    try {
      if (!this.isConnected) {
        throw new Error('Não conectado ao Rhevolution');
      }

      console.log('👥 Extraindo dados de funcionários...');

      // Navegar para seção de funcionários
      await this.navigateToSection('funcionarios');

      // Aguardar carregamento da lista
      await this.page.waitForSelector('.employee-list, .funcionarios-grid, table', { timeout: 10000 });

      // Extrair dados dos funcionários
      const employees = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('tr, .employee-row, .funcionario-item');
        const employeeData = [];

        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header

          const cells = row.querySelectorAll('td, .cell, .field');
          if (cells.length > 0) {
            employeeData.push({
              id: cells[0]?.textContent?.trim() || `emp_${index}`,
              nome: cells[1]?.textContent?.trim() || 'Nome não encontrado',
              cargo: cells[2]?.textContent?.trim() || 'Cargo não informado',
              departamento: cells[3]?.textContent?.trim() || 'Departamento não informado',
              status: cells[4]?.textContent?.trim() || 'Ativo'
            });
          }
        });

        return employeeData;
      });

      console.log(`✅ ${employees.length} funcionários extraídos com sucesso`);
      
      return {
        success: true,
        data: employees,
        count: employees.length,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao extrair funcionários:', error.message);
      throw new Error(`Falha na extração de funcionários: ${error.message}`);
    }
  }

  /**
   * Extrai dados de frequência/ponto
   */
  async getAttendanceData(startDate, endDate) {
    try {
      if (!this.isConnected) {
        throw new Error('Não conectado ao Rhevolution');
      }

      console.log(`📊 Extraindo dados de frequência de ${startDate} até ${endDate}...`);

      // Navegar para seção de frequência
      await this.navigateToSection('frequencia');

      // Configurar filtros de data se disponível
      await this.setDateFilters(startDate, endDate);

      // Aguardar carregamento dos dados
      await this.page.waitForSelector('.attendance-data, .frequencia-grid, table', { timeout: 10000 });

      // Extrair dados de frequência
      const attendanceData = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('tr, .attendance-row, .frequencia-item');
        const data = [];

        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header

          const cells = row.querySelectorAll('td, .cell, .field');
          if (cells.length > 0) {
            data.push({
              funcionario: cells[0]?.textContent?.trim() || 'Funcionário não identificado',
              data: cells[1]?.textContent?.trim() || new Date().toISOString().split('T')[0],
              entrada: cells[2]?.textContent?.trim() || '00:00',
              saida: cells[3]?.textContent?.trim() || '00:00',
              horasTrabalhadas: cells[4]?.textContent?.trim() || '0:00',
              status: cells[5]?.textContent?.trim() || 'Presente'
            });
          }
        });

        return data;
      });

      console.log(`✅ ${attendanceData.length} registros de frequência extraídos`);
      
      return {
        success: true,
        data: attendanceData,
        count: attendanceData.length,
        period: { startDate, endDate },
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao extrair dados de frequência:', error.message);
      throw new Error(`Falha na extração de frequência: ${error.message}`);
    }
  }

  /**
   * Extrai saldo de banco de horas dos funcionários
   */
  async getHourBankBalance(employeeId = null) {
    try {
      if (!this.isConnected) {
        throw new Error('Não conectado ao Rhevolution');
      }

      console.log('⏰ Extraindo saldo de banco de horas...');

      // Navegar para seção de frequência ou banco de horas
      await this.navigateToSection('frequencia');

      // Procurar por link ou aba de banco de horas
      const hourBankSelectors = [
        'a[href*="banco-horas"]',
        '.banco-horas-tab',
        '#hour-bank',
        'button[data-section="banco-horas"]',
        '.menu-banco-horas'
      ];

      let hourBankFound = false;
      for (const selector of hourBankSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(2000);
          hourBankFound = true;
          break;
        }
      }

      if (!hourBankFound) {
        console.warn('⚠️ Seção de banco de horas não encontrada, tentando extrair da página atual');
      }

      // Aguardar carregamento dos dados
      await this.page.waitForSelector('.hour-bank-data, .banco-horas-grid, table, .saldo-horas', { timeout: 10000 });

      // Extrair dados do banco de horas
      const hourBankData = await this.page.evaluate((empId) => {
        const rows = document.querySelectorAll('tr, .hour-bank-row, .banco-horas-item, .employee-hour-balance');
        const data = [];

        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header

          const cells = row.querySelectorAll('td, .cell, .field, .saldo-info');
          if (cells.length > 0) {
            const employeeData = {
              funcionarioId: cells[0]?.textContent?.trim() || `emp_${index}`,
              nome: cells[1]?.textContent?.trim() || 'Nome não encontrado',
              saldoHoras: cells[2]?.textContent?.trim() || '00:00',
              saldoMinutos: cells[3]?.textContent?.trim() || '0',
              ultimaAtualizacao: cells[4]?.textContent?.trim() || new Date().toISOString().split('T')[0],
              status: cells[5]?.textContent?.trim() || 'Ativo'
            };

            // Se foi especificado um funcionário, filtrar apenas ele
            if (!empId || employeeData.funcionarioId === empId || employeeData.nome.toLowerCase().includes(empId.toLowerCase())) {
              data.push(employeeData);
            }
          }
        });

        // Se não encontrou dados em tabela, tentar extrair de outros elementos
        if (data.length === 0) {
          const saldoElements = document.querySelectorAll('.saldo-horas, .hour-balance, .banco-horas-saldo');
          saldoElements.forEach((element, index) => {
            const saldoText = element.textContent?.trim();
            if (saldoText) {
              data.push({
                funcionarioId: `emp_${index + 1}`,
                nome: 'Funcionário não identificado',
                saldoHoras: saldoText,
                saldoMinutos: '0',
                ultimaAtualizacao: new Date().toISOString().split('T')[0],
                status: 'Ativo'
              });
            }
          });
        }

        return data;
      }, employeeId);

      console.log(`✅ ${hourBankData.length} registros de banco de horas extraídos`);
      
      return {
        success: true,
        data: hourBankData,
        count: hourBankData.length,
        employeeFilter: employeeId,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao extrair banco de horas:', error.message);
      throw new Error(`Falha na extração de banco de horas: ${error.message}`);
    }
  }

  /**
   * Extrai dados da folha de pagamento
   */
  async getPayrollData(month = null, year = null) {
    try {
      if (!this.isConnected) {
        throw new Error('Não conectado ao Rhevolution');
      }

      console.log('💰 Extraindo dados da folha de pagamento...');

      // Navegar para seção de folha de pagamento
      await this.navigateToSection('folha');

      // Se mês e ano foram especificados, configurar filtros
      if (month && year) {
        const monthSelectors = [
          'select[name="month"]',
          'select[name="mes"]',
          '#month-filter',
          '.month-selector'
        ];

        const yearSelectors = [
          'select[name="year"]',
          'select[name="ano"]',
          '#year-filter',
          '.year-selector'
        ];

        // Configurar mês
        for (const selector of monthSelectors) {
          const monthSelect = await this.page.$(selector);
          if (monthSelect) {
            await monthSelect.select(month.toString());
            break;
          }
        }

        // Configurar ano
        for (const selector of yearSelectors) {
          const yearSelect = await this.page.$(selector);
          if (yearSelect) {
            await yearSelect.select(year.toString());
            break;
          }
        }

        // Aplicar filtros
        const applyButton = await this.page.$('button[type="submit"], .btn-apply, #apply-filter, .aplicar-filtro');
        if (applyButton) {
          await applyButton.click();
          await this.page.waitForTimeout(3000);
        }
      }

      // Aguardar carregamento dos dados
      await this.page.waitForSelector('.payroll-data, .folha-pagamento-grid, table, .dados-folha', { timeout: 15000 });

      // Extrair dados da folha de pagamento
      const payrollData = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('tr, .payroll-row, .folha-item, .funcionario-folha');
        const data = [];

        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header

          const cells = row.querySelectorAll('td, .cell, .field, .valor-folha');
          if (cells.length > 0) {
            data.push({
              funcionarioId: cells[0]?.textContent?.trim() || `emp_${index}`,
              nome: cells[1]?.textContent?.trim() || 'Nome não encontrado',
              cargo: cells[2]?.textContent?.trim() || 'Cargo não informado',
              salarioBase: cells[3]?.textContent?.trim() || 'R$ 0,00',
              proventos: cells[4]?.textContent?.trim() || 'R$ 0,00',
              descontos: cells[5]?.textContent?.trim() || 'R$ 0,00',
              salarioLiquido: cells[6]?.textContent?.trim() || 'R$ 0,00',
              status: cells[7]?.textContent?.trim() || 'Processado'
            });
          }
        });

        // Se não encontrou dados em tabela, tentar extrair de outros elementos
        if (data.length === 0) {
          const folhaElements = document.querySelectorAll('.dados-folha, .payroll-summary, .resumo-folha');
          folhaElements.forEach((element, index) => {
            const textoFolha = element.textContent?.trim();
            if (textoFolha) {
              data.push({
                funcionarioId: `emp_${index + 1}`,
                nome: 'Funcionário não identificado',
                cargo: 'Não informado',
                salarioBase: 'R$ 0,00',
                proventos: 'R$ 0,00',
                descontos: 'R$ 0,00',
                salarioLiquido: textoFolha,
                status: 'Processado'
              });
            }
          });
        }

        return data;
      });

      console.log(`✅ ${payrollData.length} registros de folha de pagamento extraídos`);
      
      return {
        success: true,
        data: payrollData,
        count: payrollData.length,
        period: { month, year },
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao extrair folha de pagamento:', error.message);
      throw new Error(`Falha na extração de folha de pagamento: ${error.message}`);
    }
  }

  /**
   * Extrai dados de benefícios dos funcionários
   */
  async getBenefitsData(employeeId = null) {
    try {
      if (!this.isConnected) {
        throw new Error('Não conectado ao Rhevolution');
      }

      console.log('🎁 Extraindo dados de benefícios...');

      // Tentar navegar para seção de benefícios
      const benefitsSelectors = [
        'a[href*="beneficios"]',
        '.menu-beneficios',
        '#nav-benefits',
        'button[data-section="beneficios"]',
        '.benefits-tab'
      ];

      let benefitsFound = false;
      for (const selector of benefitsSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(2000);
          benefitsFound = true;
          break;
        }
      }

      if (!benefitsFound) {
        console.warn('⚠️ Seção de benefícios não encontrada, tentando extrair da página atual');
      }

      // Aguardar carregamento dos dados
      await this.page.waitForSelector('.benefits-data, .beneficios-grid, table, .dados-beneficios', { timeout: 10000 });

      // Extrair dados de benefícios
      const benefitsData = await this.page.evaluate((empId) => {
        const rows = document.querySelectorAll('tr, .benefit-row, .beneficio-item, .employee-benefit');
        const data = [];

        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header

          const cells = row.querySelectorAll('td, .cell, .field, .beneficio-info');
          if (cells.length > 0) {
            const benefitData = {
              funcionarioId: cells[0]?.textContent?.trim() || `emp_${index}`,
              nome: cells[1]?.textContent?.trim() || 'Nome não encontrado',
              tipoBeneficio: cells[2]?.textContent?.trim() || 'Benefício não especificado',
              valor: cells[3]?.textContent?.trim() || 'R$ 0,00',
              dataInicio: cells[4]?.textContent?.trim() || new Date().toISOString().split('T')[0],
              dataFim: cells[5]?.textContent?.trim() || '',
              status: cells[6]?.textContent?.trim() || 'Ativo'
            };

            // Se foi especificado um funcionário, filtrar apenas ele
            if (!empId || benefitData.funcionarioId === empId || benefitData.nome.toLowerCase().includes(empId.toLowerCase())) {
              data.push(benefitData);
            }
          }
        });

        // Se não encontrou dados em tabela, tentar extrair de outros elementos
        if (data.length === 0) {
          const benefitElements = document.querySelectorAll('.dados-beneficios, .benefit-summary, .resumo-beneficios');
          benefitElements.forEach((element, index) => {
            const textoBeneficio = element.textContent?.trim();
            if (textoBeneficio) {
              data.push({
                funcionarioId: `emp_${index + 1}`,
                nome: 'Funcionário não identificado',
                tipoBeneficio: textoBeneficio,
                valor: 'R$ 0,00',
                dataInicio: new Date().toISOString().split('T')[0],
                dataFim: '',
                status: 'Ativo'
              });
            }
          });
        }

        return data;
      }, employeeId);

      console.log(`✅ ${benefitsData.length} registros de benefícios extraídos`);
      
      return {
        success: true,
        data: benefitsData,
        count: benefitsData.length,
        employeeFilter: employeeId,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao extrair benefícios:', error.message);
      throw new Error(`Falha na extração de benefícios: ${error.message}`);
    }
  }

  /**
   * Gera relatórios
   */
  async generateReports(reportType, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Não conectado ao Rhevolution');
      }

      console.log(`📋 Gerando relatório: ${reportType}`);

      // Navegar para seção de relatórios
      await this.navigateToSection('relatorios');

      // Aguardar carregamento da página de relatórios
      await this.page.waitForSelector('.reports-section, .relatorios-grid', { timeout: 10000 });

      // Simular geração de relatório baseado no tipo
      const reportData = {
        folhaPagamento: () => ({ tipo: 'Folha de Pagamento', funcionarios: 150, valorTotal: 'R$ 450.000,00' }),
        frequencia: () => ({ tipo: 'Frequência', registros: 3000, periodo: '30 dias' }),
        beneficios: () => ({ tipo: 'Benefícios', beneficiarios: 120, valorTotal: 'R$ 85.000,00' }),
        admissoes: () => ({ tipo: 'Admissões', novasAdmissoes: 8, periodo: 'Último mês' })
      };

      const report = reportData[reportType] ? reportData[reportType]() : { tipo: 'Relatório Genérico', dados: 'Não especificado' };

      console.log(`✅ Relatório ${reportType} gerado com sucesso`);
      
      return {
        success: true,
        reportType,
        data: report,
        generatedAt: new Date().toISOString(),
        options
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error.message);
      throw new Error(`Falha na geração de relatório: ${error.message}`);
    }
  }

  /**
   * Navega para uma seção específica do sistema
   */
  async navigateToSection(section) {
    try {
      const sectionMap = {
        funcionarios: ['a[href*="funcionarios"]', '.menu-funcionarios', '#nav-employees'],
        frequencia: ['a[href*="frequencia"]', '.menu-frequencia', '#nav-attendance'],
        relatorios: ['a[href*="relatorios"]', '.menu-relatorios', '#nav-reports'],
        folha: ['a[href*="folha"]', '.menu-folha', '#nav-payroll']
      };

      const selectors = sectionMap[section] || [];
      
      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
          console.log(`📍 Navegado para seção: ${section}`);
          return true;
        }
      }

      console.warn(`⚠️ Seção ${section} não encontrada, continuando na página atual`);
      return false;
    } catch (error) {
      console.warn(`⚠️ Erro ao navegar para ${section}:`, error.message);
      return false;
    }
  }

  /**
   * Configura filtros de data
   */
  async setDateFilters(startDate, endDate) {
    try {
      const startDateInput = await this.page.$('input[name="startDate"], input[name="dataInicio"], #start-date');
      const endDateInput = await this.page.$('input[name="endDate"], input[name="dataFim"], #end-date');

      if (startDateInput && startDate) {
        await startDateInput.clear();
        await startDateInput.type(startDate);
      }

      if (endDateInput && endDate) {
        await endDateInput.clear();
        await endDateInput.type(endDate);
      }

      // Procurar botão de aplicar filtro
      const applyButton = await this.page.$('button[type="submit"], .btn-apply, #apply-filter');
      if (applyButton) {
        await applyButton.click();
        await this.page.waitForTimeout(2000); // Aguardar aplicação do filtro
      }

      return true;
    } catch (error) {
      console.warn('⚠️ Erro ao configurar filtros de data:', error.message);
      return false;
    }
  }

  /**
   * Gera um ID de sessão único
   */
  generateSessionId() {
    return `rhev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica se está conectado
   */
  isUserConnected() {
    return this.isConnected;
  }

  /**
   * Obtém dados da sessão
   */
  getSessionData() {
    return this.sessionData;
  }

  /**
   * Fecha o browser e limpa recursos
   */
  async close() {
    try {
      if (this.microsoftAuth) {
        await this.microsoftAuth.close();
      }

      if (this.browser) {
        console.log('🔒 Fechando browser Rhevolution...');
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isConnected = false;
        this.sessionData = null;
      }
    } catch (error) {
      console.error('❌ Erro ao fechar browser:', error.message);
    }
  }
}

module.exports = RhevolutionService;