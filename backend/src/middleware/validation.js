const Joi = require('joi');

/**
 * Middleware de validação usando Joi
 * @param {Object} schema - Schema Joi para validação
 * @returns {Function} Middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errorDetails
      });
    }

    next();
  };
};

/**
 * Schemas de validação para as rotas
 */
const schemas = {
  // Schema para login (padrão e SSO)
  login: Joi.object({
    username: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Username é obrigatório',
        'string.min': 'Username deve ter pelo menos 3 caracteres',
        'string.max': 'Username deve ter no máximo 100 caracteres'
      }),
    
    password: Joi.string()
      .min(1)
      .required()
      .messages({
        'string.empty': 'Password é obrigatório'
      }),
    
    authMethod: Joi.string()
      .valid('standard', 'sso')
      .default('standard')
      .messages({
        'any.only': 'Método de autenticação deve ser "standard" ou "sso"'
      }),
    
    tenantId: Joi.string()
      .optional()
      .allow('')
      .messages({
        'string.base': 'Tenant ID deve ser uma string'
      })
  }),

  // Schema para geração de relatórios
  generateReport: Joi.object({
    reportType: Joi.string()
      .valid('employees', 'attendance', 'payroll', 'benefits')
      .required()
      .messages({
        'any.only': 'Tipo de relatório deve ser: employees, attendance, payroll ou benefits',
        'any.required': 'Tipo de relatório é obrigatório'
      }),
    
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'Data de início deve estar no formato ISO (YYYY-MM-DD)'
      }),
    
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.format': 'Data de fim deve estar no formato ISO (YYYY-MM-DD)',
        'date.min': 'Data de fim deve ser posterior à data de início'
      }),
    
    filters: Joi.object()
      .optional()
      .messages({
        'object.base': 'Filtros devem ser um objeto'
      })
  }),

  // Schema para sincronização de dados
  syncData: Joi.object({
    dataType: Joi.string()
      .valid('employees', 'departments', 'positions', 'all')
      .default('all')
      .messages({
        'any.only': 'Tipo de dados deve ser: employees, departments, positions ou all'
      }),
    
    forceUpdate: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Force update deve ser um valor booleano'
      })
  }),

  // Schema para busca de funcionários
  employeeSearch: Joi.object({
    department: Joi.string()
      .optional()
      .allow('')
      .messages({
        'string.base': 'Departamento deve ser uma string'
      }),
    
    status: Joi.string()
      .valid('active', 'inactive', 'all')
      .default('active')
      .messages({
        'any.only': 'Status deve ser: active, inactive ou all'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .default(100)
      .messages({
        'number.base': 'Limit deve ser um número',
        'number.integer': 'Limit deve ser um número inteiro',
        'number.min': 'Limit deve ser pelo menos 1',
        'number.max': 'Limit deve ser no máximo 1000'
      }),
    
    offset: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.base': 'Offset deve ser um número',
        'number.integer': 'Offset deve ser um número inteiro',
        'number.min': 'Offset deve ser pelo menos 0'
      })
  }),

  // Schema para geração de relatórios (alias)
  reportGeneration: Joi.object({
    type: Joi.string()
      .valid('employees', 'attendance', 'payroll', 'benefits')
      .required()
      .messages({
        'any.only': 'Tipo de relatório deve ser: employees, attendance, payroll ou benefits',
        'any.required': 'Tipo de relatório é obrigatório'
      }),
    
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'Data de início deve estar no formato ISO (YYYY-MM-DD)'
      }),
    
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.format': 'Data de fim deve estar no formato ISO (YYYY-MM-DD)',
        'date.min': 'Data de fim deve ser posterior à data de início'
      }),
    
    format: Joi.string()
      .valid('pdf', 'excel', 'csv', 'json')
      .default('json')
      .messages({
        'any.only': 'Formato deve ser: pdf, excel, csv ou json'
      }),
    
    filters: Joi.object()
      .optional()
      .messages({
        'object.base': 'Filtros devem ser um objeto'
      })
  })
};

// Exportar schemas e validate
module.exports = { validate, schemas };