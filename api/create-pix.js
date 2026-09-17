/**
 * VERCEL SERVERLESS FUNCTION - CRIAR PAGAMENTO PIX VIA MERCADO PAGO
 * Endpoint: POST /api/create-pix
 */

module.exports = async (req, res) => {
  // Configura CORS
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

  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({
      error: 'MP_ACCESS_TOKEN não configurado nas variáveis de ambiente da Vercel.',
      needs_config: true
    });
  }

  try {
    const { buyerName, buyerEmail, amount, orderBump } = req.body || {};

    const transactionAmount = Number(amount) || 1.00;
    const cleanEmail = (buyerEmail && buyerEmail.includes('@')) ? buyerEmail.trim() : 'contato.cliente@desmamenoturno.com';
    
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

    // Gera uma chave de idempotência única para evitar cobranças duplicadas
    const idempotencyKey = `pix-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const mpPayload = {
      transaction_amount: transactionAmount,
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName
      }
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(mpPayload)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro na API do Mercado Pago:', data);
      return res.status(mpResponse.status).json({
        error: data.message || 'Erro ao gerar PIX no Mercado Pago',
        details: data
      });
    }

    const txData = data.point_of_interaction?.transaction_data || {};

    return res.status(200).json({
      success: true,
      payment_id: data.id,
      status: data.status,
      qr_code: txData.qr_code,
      qr_code_base64: txData.qr_code_base64,
      ticket_url: txData.ticket_url,
      amount: data.transaction_amount
    });

  } catch (err) {
    console.error('Erro interno no servidor ao criar PIX:', err);
    return res.status(500).json({
      error: 'Erro interno ao processar pagamento com Mercado Pago',
      message: err.message
    });
  }
};
