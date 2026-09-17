/**
 * VERCEL SERVERLESS FUNCTION - CRIAR PAGAMENTO PIX VIA MERCADO PAGO (ORDERS API)
 * Endpoint: POST /api/create-pix
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const accessToken = (process.env.MP_ACCESS_TOKEN || 'APP_USR-7126802170179896-091702-1da1c976ed6f743042127cd7cf856164-1084454515').trim();

  try {
    const { buyerName, buyerEmail, amount, orderBump } = req.body || {};

    const transactionAmount = Number(amount || 29.90).toFixed(2);
    const cleanEmail = (buyerEmail && buyerEmail.includes('@')) ? buyerEmail.trim() : 'contato.aluna@desmamenoturno.com';
    
    let firstName = 'Aluna';
    let lastName = 'Desmame';
    if (buyerName && buyerName.trim()) {
      const parts = buyerName.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || 'Cliente';
    }

    const description = orderBump 
      ? 'E-book Desmame Noturno + Dicas Durante o Dia' 
      : 'E-book Desmame Noturno Oficial';

    const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const externalRef = `ref-${Date.now()}`;

    const orderPayload = {
      type: 'online',
      total_amount: transactionAmount,
      external_reference: externalRef,
      description: description,
      transactions: {
        payments: [
          {
            payment_method: {
              id: 'pix',
              type: 'bank_transfer'
            },
            amount: transactionAmount
          }
        ]
      },
      payer: {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName
      }
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro na API de Orders do Mercado Pago:', data);
      return res.status(mpResponse.status).json({
        error: data.message || 'Erro ao gerar PIX no Mercado Pago',
        details: data
      });
    }

    const paymentInfo = data.transactions?.payments?.[0] || {};
    const paymentMethod = paymentInfo.payment_method || {};

    return res.status(200).json({
      success: true,
      order_id: data.id,
      payment_id: paymentInfo.id || data.id,
      status: data.status,
      status_detail: data.status_detail,
      qr_code: paymentMethod.qr_code,
      qr_code_base64: paymentMethod.qr_code_base64,
      ticket_url: paymentMethod.ticket_url,
      amount: data.total_amount
    });

  } catch (err) {
    console.error('Erro interno no servidor ao criar PIX:', err);
    return res.status(500).json({
      error: 'Erro interno ao processar pagamento com Mercado Pago',
      message: err.message
    });
  }
};
