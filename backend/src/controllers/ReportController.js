const RhevolutionService = require('../services/RhevolutionService.js');
const ExcelReportService = require('../services/ExcelReportService.js');
const Joi = require('joi');

/**
 * Controller para geração e envio de relatórios
 */
class ReportController {
  constructor() {
    this.rhevolutionService = new RhevolutionService();
    this.excelReportService = new ExcelReportService();
  }

  /**
   * Gera relatório de folha de pagamento em Excel
   */
  async generatePayrollReport(req, res) {
    try {
      // Validar entrada
      const schema = Joi.object({
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2020).max(2030),
        sendEmail: Joi.boolean().default(false),
        emailTo: Joi.string().email().when('sendEmail', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
        emailSubject: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { month, year, sendEmail, emailTo, emailSubject } = value;

      // Verificar se o usuário está autenticado no Rhevolution
      if (!this.rhevolutionService.isUserConnected()) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado no Rhevolution'
        });
      }

      // Obter dados da folha de pagamento
      console.log('📊 Obtendo dados da folha de pagamento...');
      const payrollData = await this.rhevolutionService.getPayrollData(month, year);

      // Processar dados para o formato Excel
      const processedData = this.processPayrollData(payrollData);

      // Gerar relatório Excel
      const emailOptions = {
        sendEmail,
        to: emailTo,
        subject: emailSubject || `Relatório de Folha de Pagamento - ${month || 'Atual'}/${year || new Date().getFullYear()}`
      };

      const result = await this.excelReportService.generateAndSendReport(
        'payroll',
        processedData,
        emailOptions
      );

      res.json({
        success: true,
        message: 'Relatório de folha de pagamento gerado com sucesso',
        data: {
          fileName: result.report.fileName,
          reportType: result.report.reportType,
          emailSent: !!result.email,
          generatedAt: result.generatedAt
        }
      });

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de folha:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Gera relatório de frequência em Excel
   */
  async generateAttendanceReport(req, res) {
    try {
      // Validar entrada
      const schema = Joi.object({
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
        sendEmail: Joi.boolean().default(false),
        emailTo: Joi.string().email().when('sendEmail', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
        emailSubject: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { startDate, endDate, sendEmail, emailTo, emailSubject } = value;

      // Verificar se o usuário está autenticado no Rhevolution
      if (!this.rhevolutionService.isUserConnected()) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado no Rhevolution'
        });
      }

      // Obter dados de frequência
      console.log('📊 Obtendo dados de frequência...');
      const attendanceData = await this.rhevolutionService.getAttendanceData(startDate, endDate);

      // Processar dados para o formato Excel
      const processedData = this.processAttendanceData(attendanceData);

      // Gerar relatório Excel
      const emailOptions = {
        sendEmail,
        to: emailTo,
        subject: emailSubject || `Relatório de Frequência - ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`
      };

      const result = await this.excelReportService.generateAndSendReport(
        'attendance',
        processedData,
        emailOptions
      );

      res.json({
        success: true,
        message: 'Relatório de frequência gerado com sucesso',
        data: {
          fileName: result.report.fileName,
          reportType: result.report.reportType,
          emailSent: !!result.email,
          generatedAt: result.generatedAt
        }
      });

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de frequência:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Lista relatórios disponíveis
   */
  async listAvailableReports(req, res) {
    try {
      const reports = [
        {
          type: 'payroll',
          name: 'Folha de Pagamento',
          description: 'Relatório completo da folha de pagamento com salários, benefícios e descontos',
          parameters: [
            { name: 'month', type: 'number', required: false, description: 'Mês (1-12)' },
            { name: 'year', type: 'number', required: false, description: 'Ano' },
            { name: 'sendEmail', type: 'boolean', required: false, description: 'Enviar por email' },
            { name: 'emailTo', type: 'string', required: false, description: 'Email de destino' }
          ]
        },
        {
          type: 'attendance',
          name: 'Frequência',
          description: 'Relatório de frequência e ponto dos funcionários',
          parameters: [
            { name: 'startDate', type: 'date', required: true, description: 'Data inicial (ISO)' },
            { name: 'endDate', type: 'date', required: true, description: 'Data final (ISO)' },
            { name: 'sendEmail', type: 'boolean', required: false, description: 'Enviar por email' },
            { name: 'emailTo', type: 'string', required: false, description: 'Email de destino' }
          ]
        }
      ];

      res.json({
        success: true,
        message: 'Relatórios disponíveis',
        data: reports
      });

    } catch (error) {
      console.error('❌ Erro ao listar relatórios:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Limpa arquivos temporários
   */
  async cleanupTempFiles(req, res) {
    try {
      await this.excelReportService.cleanupTempFiles();
      
      res.json({
        success: true,
        message: 'Limpeza de arquivos temporários concluída'
      });

    } catch (error) {
      console.error('❌ Erro na limpeza:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Processa dados da folha de pagamento para Excel
   */
  processPayrollData(rawData) {
    // Simular processamento de dados reais
    // Em um cenário real, isso viria do Rhevolution
    const employees = [
      {
        name: 'João Silva',
        position: 'Desenvolvedor Senior',
        baseSalary: 8000,
        overtime: 1200,
        benefits: 800,
        deductions: 1500,
        netSalary: 8500
      },
      {
        name: 'Maria Santos',
        position: 'Analista de RH',
        baseSalary: 6000,
        overtime: 800,
        benefits: 600,
        deductions: 1200,
        netSalary: 6200
      },
      {
        name: 'Pedro Costa',
        position: 'Gerente de Projetos',
        baseSalary: 10000,
        overtime: 0,
        benefits: 1000,
        deductions: 2000,
        netSalary: 9000
      }
    ];

    const totals = {
      baseSalary: employees.reduce((sum, emp) => sum + emp.baseSalary, 0),
      overtime: employees.reduce((sum, emp) => sum + emp.overtime, 0),
      benefits: employees.reduce((sum, emp) => sum + emp.benefits, 0),
      deductions: employees.reduce((sum, emp) => sum + emp.deductions, 0),
      netSalary: employees.reduce((sum, emp) => sum + emp.netSalary, 0)
    };

    return {
      employees,
      totals,
      generatedAt: new Date().toISOString(),
      source: 'Rhevolution'
    };
  }

  /**
   * Processa dados de frequência para Excel
   */
  processAttendanceData(rawData) {
    // Simular dados de frequência
    const records = [
      {
        employeeName: 'João Silva',
        date: '2025-01-20',
        checkIn: '08:00',
        lunchOut: '12:00',
        lunchIn: '13:00',
        checkOut: '17:00',
        workedHours: '8:00',
        status: 'Presente'
      },
      {
        employeeName: 'Maria Santos',
        date: '2025-01-20',
        checkIn: '08:15',
        lunchOut: '12:00',
        lunchIn: '13:00',
        checkOut: '17:15',
        workedHours: '8:00',
        status: 'Presente'
      },
      {
        employeeName: 'Pedro Costa',
        date: '2025-01-20',
        checkIn: '09:00',
        lunchOut: '12:30',
        lunchIn: '13:30',
        checkOut: '18:00',
        workedHours: '8:00',
        status: 'Presente'
      }
    ];

    return {
      records,
      summary: {
        totalRecords: records.length,
        presentCount: records.filter(r => r.status === 'Presente').length,
        absentCount: records.filter(r => r.status === 'Ausente').length
      },
      generatedAt: new Date().toISOString(),
      source: 'Rhevolution'
    };
  }
}

module.exports = ReportController;