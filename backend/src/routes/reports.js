const express = require('express');
const ReportController = require('../controllers/ReportController.js');

const router = express.Router();
const reportController = new ReportController();

/**
 * @route GET /api/reports
 * @desc Lista relatórios disponíveis
 * @access Public
 */
router.get('/', async (req, res) => {
  await reportController.listAvailableReports(req, res);
});

/**
 * @route POST /api/reports/payroll
 * @desc Gera relatório de folha de pagamento em Excel
 * @access Public
 * @body {
 *   month?: number,
 *   year?: number,
 *   sendEmail?: boolean,
 *   emailTo?: string,
 *   emailSubject?: string
 * }
 */
router.post('/payroll', async (req, res) => {
  await reportController.generatePayrollReport(req, res);
});

/**
 * @route POST /api/reports/attendance
 * @desc Gera relatório de frequência em Excel
 * @access Public
 * @body {
 *   startDate: string (ISO),
 *   endDate: string (ISO),
 *   sendEmail?: boolean,
 *   emailTo?: string,
 *   emailSubject?: string
 * }
 */
router.post('/attendance', async (req, res) => {
  await reportController.generateAttendanceReport(req, res);
});

/**
 * @route DELETE /api/reports/cleanup
 * @desc Limpa arquivos temporários de relatórios
 * @access Public
 */
router.delete('/cleanup', async (req, res) => {
  await reportController.cleanupTempFiles(req, res);
});

module.exports = router;