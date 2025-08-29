const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Serviço para geração de relatórios Excel e envio automático por email
 */
class ExcelReportService {
  constructor() {
    this.transporter = null;
    this.initEmailTransporter();
  }

  /**
   * Inicializa o transportador de email
   */
  async initEmailTransporter() {
    try {
      // Configuração do transportador de email usando variáveis do Doppler
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true para 465, false para outras portas
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verificar conexão
      await this.transporter.verify();
      console.log('✅ Transportador de email configurado com sucesso');
    } catch (error) {
      console.warn('⚠️ Erro ao configurar email:', error.message);
      console.warn('📧 Relatórios serão gerados apenas localmente');
    }
  }

  /**
   * Gera relatório Excel de folha de pagamento
   */
  async generatePayrollExcel(payrollData, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Folha de Pagamento');

      // Configurar cabeçalhos
      worksheet.columns = [
        { header: 'Funcionário', key: 'employee', width: 30 },
        { header: 'Cargo', key: 'position', width: 25 },
        { header: 'Salário Base', key: 'baseSalary', width: 15 },
        { header: 'Horas Extras', key: 'overtime', width: 15 },
        { header: 'Benefícios', key: 'benefits', width: 15 },
        { header: 'Descontos', key: 'deductions', width: 15 },
        { header: 'Salário Líquido', key: 'netSalary', width: 18 }
      ];

      // Estilizar cabeçalho
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '366092' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Adicionar dados
      if (payrollData && payrollData.employees) {
        payrollData.employees.forEach(employee => {
          worksheet.addRow({
            employee: employee.name || 'N/A',
            position: employee.position || 'N/A',
            baseSalary: this.formatCurrency(employee.baseSalary || 0),
            overtime: this.formatCurrency(employee.overtime || 0),
            benefits: this.formatCurrency(employee.benefits || 0),
            deductions: this.formatCurrency(employee.deductions || 0),
            netSalary: this.formatCurrency(employee.netSalary || 0)
          });
        });
      }

      // Adicionar totais
      const totalRow = worksheet.addRow({
        employee: 'TOTAL',
        position: '',
        baseSalary: this.formatCurrency(payrollData?.totals?.baseSalary || 0),
        overtime: this.formatCurrency(payrollData?.totals?.overtime || 0),
        benefits: this.formatCurrency(payrollData?.totals?.benefits || 0),
        deductions: this.formatCurrency(payrollData?.totals?.deductions || 0),
        netSalary: this.formatCurrency(payrollData?.totals?.netSalary || 0)
      });

      // Estilizar linha de totais
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      });

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `folha_pagamento_${timestamp}.xlsx`;
      const filePath = path.join(__dirname, '../../temp', fileName);

      // Criar diretório temp se não existir
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Salvar arquivo
      await workbook.xlsx.writeFile(filePath);

      console.log(`✅ Relatório Excel gerado: ${fileName}`);

      return {
        success: true,
        fileName,
        filePath,
        reportType: 'payroll'
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório Excel:', error.message);
      throw new Error(`Falha na geração do relatório Excel: ${error.message}`);
    }
  }

  /**
   * Gera relatório Excel de frequência
   */
  async generateAttendanceExcel(attendanceData, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatório de Frequência');

      // Configurar cabeçalhos
      worksheet.columns = [
        { header: 'Funcionário', key: 'employee', width: 30 },
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Entrada', key: 'checkIn', width: 12 },
        { header: 'Saída Almoço', key: 'lunchOut', width: 15 },
        { header: 'Volta Almoço', key: 'lunchIn', width: 15 },
        { header: 'Saída', key: 'checkOut', width: 12 },
        { header: 'Horas Trabalhadas', key: 'workedHours', width: 18 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      // Estilizar cabeçalho
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2E8B57' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Adicionar dados
      if (attendanceData && attendanceData.records) {
        attendanceData.records.forEach(record => {
          worksheet.addRow({
            employee: record.employeeName || 'N/A',
            date: this.formatDate(record.date),
            checkIn: record.checkIn || 'N/A',
            lunchOut: record.lunchOut || 'N/A',
            lunchIn: record.lunchIn || 'N/A',
            checkOut: record.checkOut || 'N/A',
            workedHours: record.workedHours || 'N/A',
            status: record.status || 'N/A'
          });
        });
      }

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `frequencia_${timestamp}.xlsx`;
      const filePath = path.join(__dirname, '../../temp', fileName);

      // Criar diretório temp se não existir
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Salvar arquivo
      await workbook.xlsx.writeFile(filePath);

      console.log(`✅ Relatório de frequência gerado: ${fileName}`);

      return {
        success: true,
        fileName,
        filePath,
        reportType: 'attendance'
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de frequência:', error.message);
      throw new Error(`Falha na geração do relatório de frequência: ${error.message}`);
    }
  }

  /**
   * Envia relatório por email
   */
  async sendReportByEmail(reportInfo, emailOptions = {}) {
    try {
      if (!this.transporter) {
        throw new Error('Transportador de email não configurado');
      }

      const {
        to = process.env.DEFAULT_REPORT_EMAIL,
        subject = `Relatório ${reportInfo.reportType} - ${new Date().toLocaleDateString('pt-BR')}`,
        text = 'Segue em anexo o relatório solicitado.',
        html = '<p>Segue em anexo o relatório solicitado.</p>'
      } = emailOptions;

      if (!to) {
        throw new Error('Email de destino não configurado');
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
        attachments: [
          {
            filename: reportInfo.fileName,
            path: reportInfo.filePath
          }
        ]
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        to,
        subject
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error.message);
      throw new Error(`Falha no envio do email: ${error.message}`);
    }
  }

  /**
   * Gera e envia relatório completo
   */
  async generateAndSendReport(reportType, data, emailOptions = {}) {
    try {
      let reportInfo;

      // Gerar relatório baseado no tipo
      switch (reportType) {
        case 'payroll':
          reportInfo = await this.generatePayrollExcel(data);
          break;
        case 'attendance':
          reportInfo = await this.generateAttendanceExcel(data);
          break;
        default:
          throw new Error(`Tipo de relatório não suportado: ${reportType}`);
      }

      // Enviar por email se configurado
      let emailResult = null;
      if (this.transporter && emailOptions.sendEmail !== false) {
        try {
          emailResult = await this.sendReportByEmail(reportInfo, emailOptions);
        } catch (emailError) {
          console.warn('⚠️ Falha no envio do email, mas relatório foi gerado:', emailError.message);
        }
      }

      return {
        success: true,
        report: reportInfo,
        email: emailResult,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao gerar e enviar relatório:', error.message);
      throw new Error(`Falha na geração e envio do relatório: ${error.message}`);
    }
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value) {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata data
   */
  formatDate(date) {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return date.toString();
    }
  }

  /**
   * Limpa arquivos temporários antigos
   */
  async cleanupTempFiles(maxAgeHours = 24) {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        if (file.endsWith('.xlsx')) {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            console.log(`🗑️ Arquivo temporário removido: ${file}`);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro na limpeza de arquivos temporários:', error.message);
    }
  }
}

module.exports = ExcelReportService;