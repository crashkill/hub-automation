import { AutomationPlugin, AutomationType, AutomationRegistry as IAutomationRegistry } from '../types/automation';
import { RHEvolutionPlugin } from '../plugins/rh-evolution/RHEvolutionPlugin';

/**
 * Registry centralizado para gerenciar plugins de automação
 * Implementa o padrão Singleton para garantir uma única instância
 */
export class AutomationRegistry implements IAutomationRegistry {
  private static instance: AutomationRegistry;
  public readonly plugins = new Map<AutomationType, AutomationPlugin>();

  private constructor() {
    this.initializeDefaultPlugins();
  }

  /**
   * Obtém a instância singleton do registry
   */
  public static getInstance(): AutomationRegistry {
    if (!AutomationRegistry.instance) {
      AutomationRegistry.instance = new AutomationRegistry();
    }
    return AutomationRegistry.instance;
  }

  /**
   * Registra um novo plugin de automação
   */
  public register(plugin: AutomationPlugin): void {
    if (this.plugins.has(plugin.type)) {
      console.warn(`Plugin ${plugin.type} já está registrado. Substituindo...`);
    }
    
    console.info(`Registrando plugin: ${plugin.name} v${plugin.version}`);
    this.plugins.set(plugin.type, plugin);
  }

  /**
   * Remove um plugin do registry
   */
  public unregister(type: AutomationType): void {
    if (this.plugins.has(type)) {
      const plugin = this.plugins.get(type)!;
      console.info(`Removendo plugin: ${plugin.name}`);
      this.plugins.delete(type);
    } else {
      console.warn(`Plugin ${type} não encontrado para remoção`);
    }
  }

  /**
   * Obtém um plugin específico pelo tipo
   */
  public get(type: AutomationType): AutomationPlugin | undefined {
    return this.plugins.get(type);
  }

  /**
   * Lista todos os plugins registrados
   */
  public list(): AutomationPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Obtém plugins por categoria
   */
  public getByCategory(category: string): AutomationPlugin[] {
    return this.list().filter(plugin => 
      plugin.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Verifica se um plugin está registrado
   */
  public isRegistered(type: AutomationType): boolean {
    return this.plugins.has(type);
  }

  /**
   * Obtém estatísticas do registry
   */
  public getStats(): {
    totalPlugins: number;
    categoriesCount: Record<string, number>;
    pluginsByCategory: Record<string, AutomationPlugin[]>;
  } {
    const plugins = this.list();
    const categoriesCount: Record<string, number> = {};
    const pluginsByCategory: Record<string, AutomationPlugin[]> = {};

    plugins.forEach(plugin => {
      const category = plugin.category;
      categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      
      if (!pluginsByCategory[category]) {
        pluginsByCategory[category] = [];
      }
      pluginsByCategory[category].push(plugin);
    });

    return {
      totalPlugins: plugins.length,
      categoriesCount,
      pluginsByCategory
    };
  }

  /**
   * Busca plugins por nome ou descrição
   */
  public search(query: string): AutomationPlugin[] {
    const searchTerm = query.toLowerCase();
    return this.list().filter(plugin => 
      plugin.name.toLowerCase().includes(searchTerm) ||
      plugin.description.toLowerCase().includes(searchTerm) ||
      plugin.category.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Valida se um plugin está funcionando corretamente
   */
  public async validatePlugin(type: AutomationType): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const plugin = this.get(type);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!plugin) {
      errors.push(`Plugin ${type} não encontrado`);
      return { valid: false, errors, warnings };
    }

    try {
      // Validar configuração padrão
      const defaultConfig = plugin.getDefaultConfig();
      if (!defaultConfig) {
        errors.push('Plugin não fornece configuração padrão');
      }

      // Validar schema de configuração
      const schema = plugin.getConfigSchema();
      if (!schema || !schema.fields || schema.fields.length === 0) {
        warnings.push('Plugin não possui schema de configuração definido');
      }

      // Validar propriedades obrigatórias
      if (!plugin.name || plugin.name.trim() === '') {
        errors.push('Plugin deve ter um nome válido');
      }

      if (!plugin.version || plugin.version.trim() === '') {
        errors.push('Plugin deve ter uma versão válida');
      }

      if (!plugin.description || plugin.description.trim() === '') {
        warnings.push('Plugin deveria ter uma descrição');
      }

    } catch (error) {
      errors.push(`Erro ao validar plugin: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Exporta informações dos plugins para backup/debug
   */
  public exportPluginInfo(): {
    timestamp: string;
    plugins: Array<{
      type: string;
      name: string;
      version: string;
      category: string;
      author: string;
    }>;
  } {
    return {
      timestamp: new Date().toISOString(),
      plugins: this.list().map(plugin => ({
        type: plugin.type,
        name: plugin.name,
        version: plugin.version,
        category: plugin.category,
        author: plugin.author
      }))
    };
  }

  /**
   * Inicializa os plugins padrão do sistema
   */
  private initializeDefaultPlugins(): void {
    console.info('Inicializando plugins padrão...');
    
    try {
      // Registrar RH Evolution Plugin
      const rhEvolutionPlugin = new RHEvolutionPlugin();
      this.register(rhEvolutionPlugin);
      
      // TODO: Adicionar outros plugins padrão aqui
      // const emailMarketingPlugin = new EmailMarketingPlugin();
      // this.register(emailMarketingPlugin);
      
      // const dataSyncPlugin = new DataSyncPlugin();
      // this.register(dataSyncPlugin);
      
      console.info(`Plugins padrão inicializados: ${this.plugins.size} plugins registrados`);
      
    } catch (error) {
      console.error('Erro ao inicializar plugins padrão:', error);
    }
  }

  /**
   * Recarrega todos os plugins (útil para desenvolvimento)
   */
  public reload(): void {
    console.info('Recarregando registry de plugins...');
    this.plugins.clear();
    this.initializeDefaultPlugins();
  }

  /**
   * Obtém informações de saúde do registry
   */
  public getHealthStatus(): {
    healthy: boolean;
    pluginCount: number;
    issues: string[];
  } {
    const issues: string[] = [];
    const pluginCount = this.plugins.size;

    if (pluginCount === 0) {
      issues.push('Nenhum plugin registrado');
    }

    // Verificar se há plugins duplicados (não deveria acontecer, mas é uma verificação de sanidade)
    const types = new Set();
    const duplicates: string[] = [];
    
    this.plugins.forEach((plugin, type) => {
      if (types.has(type)) {
        duplicates.push(type);
      }
      types.add(type);
    });

    if (duplicates.length > 0) {
      issues.push(`Plugins duplicados encontrados: ${duplicates.join(', ')}`);
    }

    return {
      healthy: issues.length === 0,
      pluginCount,
      issues
    };
  }
}

// Exportar instância singleton para uso global
export const automationRegistry = AutomationRegistry.getInstance();