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

  const accessToken = (process.env.MP_ACCESS_TOKEN || '').trim();
  if (!accessToken) {
    return res.status(500).json({ error: 'Configuração do servidor incompleta. Contate o suporte.' });
  }

  try {
    const { buyerName, buyerEmail, buyerPhone, amount, orderBump } = req.body || {};

    const transactionAmount = Number(amount || 29.90).toFixed(2);
    const cleanEmail = (buyerEmail && buyerEmail.includes('@')) ? buyerEmail.trim() : 'contato.aluna@desmamenoturno.com';
    const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    
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

    const cleanPhone = String(buyerPhone || '').replace(/\D/g, '');
    let phoneObj = undefined;
    if (cleanPhone.length >= 10) {
      phoneObj = {
        area_code: cleanPhone.slice(0, 2),
        number: cleanPhone.slice(2)
      };
    }

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
        last_name: lastName,
        ...(phoneObj ? { phone: phoneObj } : {})
      }
    };

    const mpHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey
    };
    if (clientIp) {
      mpHeaders['X-Forwarded-For'] = clientIp;
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: mpHeaders,
      body: JSON.stringify(orderPayload)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.warn('Orders API retornou erro, acionando fallback para Payments API do Mercado Pago:', data);
      const fallbackHeaders = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-fb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      };
      if (clientIp) {
        fallbackHeaders['X-Forwarded-For'] = clientIp;
      }
      const paymentPayload = {
        transaction_amount: Number(transactionAmount),
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: cleanEmail,
          first_name: firstName,
          last_name: lastName
        }
      };
      try {
        const fallbackRes = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: fallbackHeaders,
          body: JSON.stringify(paymentPayload)
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.point_of_interaction?.transaction_data) {
          const txData = fallbackData.point_of_interaction.transaction_data;
          return res.status(200).json({
            success: true,
            order_id: fallbackData.id,
            payment_id: fallbackData.id,
            status: fallbackData.status,
            status_detail: fallbackData.status_detail,
            qr_code: txData.qr_code,
            qr_code_base64: txData.qr_code_base64,
            ticket_url: txData.ticket_url,
            amount: fallbackData.transaction_amount
          });
        }
      } catch (fbErr) {
        console.error('Erro no fallback da Payments API:', fbErr);
      }

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
