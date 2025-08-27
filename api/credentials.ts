import { Request, Response } from 'express';

/**
 * Endpoint para buscar credenciais do Doppler de forma segura
 * Este endpoint só deve ser acessado internamente pelo frontend
 */
export default function handler(req: Request, res: Response) {
  // Verificar se é uma requisição GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Buscar credenciais do RH Evolution do Doppler
    const credentials = {
      serverUrl: process.env.RH_EVOLUTION_SERVER_URL || '',
      username: process.env.RH_EVOLUTION_USERNAME || '',
      password: process.env.RH_EVOLUTION_PASSWORD || ''
    };

    // Verificar se todas as credenciais estão disponíveis
    const hasAllCredentials = credentials.serverUrl && credentials.username && credentials.password;

    return res.status(200).json({
      success: true,
      hasCredentials: hasAllCredentials,
      credentials: hasAllCredentials ? credentials : null,
      message: hasAllCredentials 
        ? 'Credenciais carregadas com sucesso'
        : 'Algumas credenciais não foram encontradas no Doppler'
    });
  } catch (error) {
    console.error('Erro ao buscar credenciais:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar credenciais'
    });
  }
}