/**
 * VERCEL SERVERLESS FUNCTION - CONSULTAR STATUS DO PAGAMENTO PIX NO MERCADO PAGO
 * Endpoint: GET /api/check-payment?id=PAYMENT_ID
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  const paymentId = req.query.id;
  if (!paymentId) {
    return res.status(400).json({ error: 'Parâmetro id do pagamento é obrigatório.' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({
      error: 'MP_ACCESS_TOKEN não configurado nas variáveis de ambiente da Vercel.',
      needs_config: true
    });
  }

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`
      }
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json({
        error: data.message || 'Erro ao consultar pagamento no Mercado Pago',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      payment_id: data.id,
      status: data.status, // 'approved', 'pending', 'in_process', 'rejected', 'cancelled'
      status_detail: data.status_detail,
      date_approved: data.date_approved
    });

  } catch (err) {
    console.error('Erro ao consultar status no Mercado Pago:', err);
    return res.status(500).json({
      error: 'Erro interno ao consultar status do pagamento',
      message: err.message
    });
  }
};
