import puppeteer from 'puppeteer';
import NodeCache from 'node-cache';

/**
 * Serviço de Web Scraping para o Rhevolution
 * Implementa automação segura com Puppeteer
 */
class RhevolutionScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isAuthenticated = false;
    this.cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 300 });
    this.baseUrl = process.env.RHEVOLUTION_URL;
    this.timeout = parseInt(process.env.PUPPETEER_TIMEOUT) || 30000;
  }

  /**
   * Inicializa o browser Puppeteer
   */
  async initBrowser() {
    if (this.browser) {
      return;
    }

    console.log('🚀 Inicializando browser Puppeteer...');
    
    this.browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1366,
        height: 768
      }
    });

    this.page = await this.browser.newPage();
    
    // Configurar user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Configurar timeouts
    this.page.setDefaultTimeout(this.timeout);
    this.page.setDefaultNavigationTimeout(this.timeout);

    console.log('✅ Browser inicializado com sucesso');
  }

  /**
   * Realiza login no sistema Rhevolution
   */
  async login(username, password) {
    try {
      await this.initBrowser();
      
      console.log('🔐 Iniciando processo de login...');
      
      // Navegar para a página de login
      await this.page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.timeout 
      });

      // Aguardar elementos de login carregarem
      await this.page.waitForSelector('input[type="text"], input[type="email"], input[name="username"]', { timeout: 10000 });
      await this.page.waitForSelector('input[type="password"]', { timeout: 10000 });

      // Preencher credenciais
      const usernameSelector = await this.page.$('input[type="text"], input[type="email"], input[name="username"]');
      const passwordSelector = await this.page.$('input[type="password"]');
      
      if (!usernameSelector || !passwordSelector) {
        throw new Error('Elementos de login não encontrados');
      }

      await usernameSelector.type(username, { delay: 100 });
      await passwordSelector.type(password, { delay: 100 });

      // Procurar e clicar no botão de login
      const loginButton = await this.page.$('button[type="submit"], input[type="submit"], button:contains("Entrar"), button:contains("Login")');
      
      if (!loginButton) {
        throw new Error('Botão de login não encontrado');
      }

      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.timeout }),
        loginButton.click()
      ]);

      // Verificar se o login foi bem-sucedido
      const currentUrl = this.page.url();
      const hasErrorMessage = await this.page.$('.error, .alert-danger, [class*="error"]');
      
      if (hasErrorMessage || currentUrl.includes('login') || currentUrl.includes('error')) {
        throw new Error('Credenciais inválidas ou erro no login');
      }

      this.isAuthenticated = true;
      console.log('✅ Login realizado com sucesso');
      
      return {
        success: true,
        message: 'Login realizado com sucesso',
        sessionId: await this.page.evaluate(() => document.cookie)
      };

    } catch (error) {
      console.error('❌ Erro no login:', error.message);
      this.isAuthenticated = false;
      
      const authError = new Error('Falha na autenticação');
      authError.code = 'AUTH_FAILED';
      throw authError;
    }
  }

  /**
   * Extrai lista de funcionários
   */
  async getEmployees(filters = {}) {
    const cacheKey = `employees_${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('📋 Retornando funcionários do cache');
      return cached;
    }

    if (!this.isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('👥 Extraindo lista de funcionários...');
      
      // Navegar para a seção de funcionários
      await this.page.goto(`${this.baseUrl}/employees`, { 
        waitUntil: 'networkidle2' 
      });

      // Aguardar carregamento da tabela
      await this.page.waitForSelector('table, .employee-list, [data-testid="employee-table"]', { timeout: 10000 });

      // Extrair dados dos funcionários
      const employees = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr, .employee-item');
        const employeeData = [];

        rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td, .employee-field');
          
          if (cells.length >= 3) {
            employeeData.push({
              id: cells[0]?.textContent?.trim() || `emp_${index}`,
              name: cells[1]?.textContent?.trim() || 'Nome não disponível',
              department: cells[2]?.textContent?.trim() || 'Departamento não informado',
              position: cells[3]?.textContent?.trim() || 'Cargo não informado',
              status: cells[4]?.textContent?.trim() || 'Ativo',
              email: cells[5]?.textContent?.trim() || '',
              phone: cells[6]?.textContent?.trim() || '',
              hireDate: cells[7]?.textContent?.trim() || ''
            });
          }
        });

        return employeeData;
      });

      // Aplicar filtros
      let filteredEmployees = employees;
      
      if (filters.department) {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.department.toLowerCase().includes(filters.department.toLowerCase())
        );
      }
      
      if (filters.status && filters.status !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.status.toLowerCase() === filters.status.toLowerCase()
        );
      }

      // Aplicar paginação
      const offset = filters.offset || 0;
      const limit = filters.limit || 100;
      const paginatedEmployees = filteredEmployees.slice(offset, offset + limit);

      const result = {
        employees: paginatedEmployees,
        total: filteredEmployees.length,
        offset,
        limit,
        hasMore: (offset + limit) < filteredEmployees.length
      };

      // Cache do resultado
      this.cache.set(cacheKey, result);
      
      console.log(`✅ ${paginatedEmployees.length} funcionários extraídos`);
      return result;

    } catch (error) {
      console.error('❌ Erro ao extrair funcionários:', error.message);
      throw error;
    }
  }

  /**
   * Gera relatório específico
   */
  async generateReport(reportConfig) {
    const cacheKey = `report_${JSON.stringify(reportConfig)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('📊 Retornando relatório do cache');
      return cached;
    }

    if (!this.isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log(`📊 Gerando relatório: ${reportConfig.type}...`);
      
      // Navegar para a seção de relatórios
      await this.page.goto(`${this.baseUrl}/reports`, { 
        waitUntil: 'networkidle2' 
      });

      // Aguardar carregamento da página
      await this.page.waitForSelector('.report-form, [data-testid="report-generator"]', { timeout: 10000 });

      // Configurar parâmetros do relatório
      await this.page.select('select[name="reportType"]', reportConfig.type);
      await this.page.type('input[name="startDate"]', reportConfig.startDate);
      await this.page.type('input[name="endDate"]', reportConfig.endDate);
      
      if (reportConfig.departments && reportConfig.departments.length > 0) {
        for (const dept of reportConfig.departments) {
          await this.page.select('select[name="departments"]', dept);
        }
      }

      // Gerar relatório
      await Promise.all([
        this.page.waitForSelector('.report-result, .download-link', { timeout: 30000 }),
        this.page.click('button[type="submit"], .generate-report-btn')
      ]);

      // Extrair dados do relatório
      const reportData = await this.page.evaluate(() => {
        const reportElement = document.querySelector('.report-result, .report-data');
        
        if (!reportElement) {
          return null;
        }

        return {
          title: document.querySelector('.report-title')?.textContent?.trim() || 'Relatório',
          generatedAt: new Date().toISOString(),
          data: reportElement.textContent?.trim() || '',
          downloadUrl: document.querySelector('.download-link')?.href || null
        };
      });

      if (!reportData) {
        throw new Error('Não foi possível gerar o relatório');
      }

      const result = {
        ...reportData,
        config: reportConfig,
        status: 'completed'
      };

      // Cache do resultado
      this.cache.set(cacheKey, result, 600); // 10 minutos para relatórios
      
      console.log('✅ Relatório gerado com sucesso');
      return result;

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error.message);
      throw error;
    }
  }

  /**
   * Realiza logout do sistema
   */
  async logout() {
    if (!this.isAuthenticated) {
      return { success: true, message: 'Usuário já desconectado' };
    }

    try {
      console.log('🚪 Realizando logout...');
      
      // Procurar botão de logout
      const logoutButton = await this.page.$('a[href*="logout"], button:contains("Sair"), .logout-btn');
      
      if (logoutButton) {
        await logoutButton.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
      }

      this.isAuthenticated = false;
      console.log('✅ Logout realizado com sucesso');
      
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro no logout:', error.message);
      this.isAuthenticated = false;
      return {
        success: true,
        message: 'Sessão encerrada (com avisos)'
      };
    }
  }

  /**
   * Encerra o browser
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isAuthenticated = false;
        console.log('🔒 Browser encerrado');
      }
    } catch (error) {
      console.error('❌ Erro ao encerrar browser:', error.message);
    }
  }

  /**
   * Verifica status da conexão
   */
  getStatus() {
    return {
      isConnected: !!this.browser,
      isAuthenticated: this.isAuthenticated,
      cacheStats: this.cache.getStats(),
      uptime: process.uptime()
    };
  }
}

export default RhevolutionScraper;