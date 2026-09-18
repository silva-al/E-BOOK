/**
 * VERCEL SERVERLESS FUNCTION - CRIAR PREFERÊNCIA MERCADO PAGO (CHECKOUT PRO / MODAL)
 * Endpoint: POST /api/create-preference
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
    const { buyerName, buyerEmail, buyerPhone, amount, orderBump, originUrl } = req.body || {};

    const totalAmount = Number(amount || 29.90);
    const cleanEmail = (buyerEmail && buyerEmail.includes('@')) ? buyerEmail.trim() : 'contato.aluna@desmamenoturno.com';
    const baseUrl = (originUrl && originUrl.startsWith('https://')) ? originUrl.replace(/\/$/, '') : 'https://ebook-desmame.vercel.app';

    let firstName = 'Aluna';
    let lastName = 'Desmame';
    if (buyerName && buyerName.trim()) {
      const parts = buyerName.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || 'Cliente';
    }

    const title = orderBump 
      ? 'E-book Desmame Noturno + Dicas Durante o Dia' 
      : 'E-book Desmame Noturno Oficial';

    const preferencePayload = {
      items: [
        {
          id: orderBump ? 'desmame-combo' : 'desmame-ebook',
          title: title,
          description: 'Acesso imediato e vitalício ao e-book oficial Desmame Noturno',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(totalAmount.toFixed(2))
        }
      ],
      payer: {
        name: firstName,
        surname: lastName,
        email: cleanEmail,
        phone: {
          area_code: '11',
          number: buyerPhone ? buyerPhone.replace(/\D/g, '') : '999999999'
        }
      },
      back_urls: {
        success: `${baseUrl}/?access=approved&name=${encodeURIComponent(buyerName || 'Aluna')}&email=${encodeURIComponent(cleanEmail)}&bump=${orderBump ? '1' : '0'}`,
        failure: `${baseUrl}/?payment_status=failed`,
        pending: `${baseUrl}/?payment_status=pending`
      },
      auto_return: 'approved',
      statement_descriptor: 'DESMAME',
      external_reference: `pref-${Date.now()}`
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferencePayload)
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Erro criando preferência no Mercado Pago:', data);
      return res.status(mpRes.status).json({
        error: data.message || 'Erro ao criar checkout Mercado Pago',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      preference_id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    });

  } catch (err) {
    console.error('Erro interno ao criar preferência MP:', err);
    return res.status(500).json({
      error: 'Erro interno ao conectar com Mercado Pago.',
      message: err.message
    });
  }
};
