/**
 * VERCEL SERVERLESS FUNCTION - CONSULTAR STATUS DO PAGAMENTO NO MERCADO PAGO
 * Endpoint: GET /api/check-payment?id=ORDER_ID_OR_PAYMENT_ID
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

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Parâmetro id é obrigatório.' });
  }

  const accessToken = (process.env.MP_ACCESS_TOKEN || 'APP_USR-6818937706719064-091702-bff5e6cdf3a5b0670e12fdb2e7e7cda9-3696663622').trim();

  try {
    // Se o ID começar com ORD, consulta na API de Orders
    const isOrder = id.startsWith('ORD');
    const endpoint = isOrder 
      ? `https://api.mercadopago.com/v1/orders/${id}`
      : `https://api.mercadopago.com/v1/payments/${id}`;

    const mpResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json({
        error: data.message || 'Erro ao consultar status no Mercado Pago',
        details: data
      });
    }

    // Identifica se está aprovado (no Orders é 'processed' / 'paid' ou 'approved', no Payments é 'approved')
    let isApproved = false;
    let paymentStatus = data.status;

    if (isOrder) {
      const pStatus = data.transactions?.payments?.[0]?.status || data.status;
      paymentStatus = pStatus;
      if (data.status === 'processed' || data.status === 'paid' || pStatus === 'approved') {
        isApproved = true;
      }
    } else {
      if (data.status === 'approved') {
        isApproved = true;
      }
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      status: isApproved ? 'approved' : paymentStatus,
      status_detail: data.status_detail,
      is_approved: isApproved
    });

  } catch (err) {
    console.error('Erro ao consultar status no Mercado Pago:', err);
    return res.status(500).json({
      error: 'Erro interno ao consultar status',
      message: err.message
    });
  }
};
