/**
 * VERCEL SERVERLESS FUNCTION - CONSULTAR STATUS DO PAGAMENTO NO MERCADO PAGO
 * Suporta consulta por:
 *  - ID do pagamento (ex: 178505683281)
 *  - ID do pedido (ex: ORD01M2QYQ39SVN9SBDTDR12HMFD7)
 *  - E-mail da compradora (?email=...)
 *  - Busca genérica (?query=...)
 *  - Checagem do último Pix aprovado (?check_latest=1)
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

  const rawId = req.query.id || req.query.query || '';
  const email = req.query.email ? req.query.email.trim().toLowerCase() : '';
  const checkLatest = req.query.check_latest === '1';

  if (!rawId && !email && !checkLatest) {
    return res.status(400).json({ error: 'Parâmetro id, query, email ou check_latest é obrigatório.' });
  }

  const accessToken = (process.env.MP_ACCESS_TOKEN || '').trim();
  if (!accessToken) {
    return res.status(500).json({ error: 'Configuração do servidor incompleta. Contate o suporte.' });
  }

  try {
    const cleanId = rawId.trim();

    // 1. Consulta por ID de Pedido (ORD...)
    if (cleanId.startsWith('ORD')) {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/orders/${cleanId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await mpResponse.json();

      if (mpResponse.ok) {
        const pStatus = data.transactions?.payments?.[0]?.status || data.status;
        const isApproved = (data.status === 'processed' || data.status === 'paid' || pStatus === 'approved' || pStatus === 'accredited');
        const amount = Number(data.total_amount || 29.90);
        const hasBump = amount >= 39.0 || (data.description && data.description.toLowerCase().includes('dicas'));

        return res.status(200).json({
          success: true,
          id: data.id,
          status: isApproved ? 'approved' : pStatus,
          status_detail: data.status_detail,
          is_approved: isApproved,
          amount: amount,
          has_bump: hasBump
        });
      }
    }

    // 2. Consulta por ID Numérico de Pagamento (ex: 178505683281)
    if (/^\d+$/.test(cleanId)) {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${cleanId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await mpResponse.json();

      if (mpResponse.ok) {
        const isApproved = (data.status === 'approved' || data.status_detail === 'accredited');
        const amount = Number(data.transaction_amount || 29.90);
        const desc = data.description || '';
        const hasBump = amount >= 39.0 || desc.toLowerCase().includes('dicas');

        return res.status(200).json({
          success: true,
          id: data.id,
          status: isApproved ? 'approved' : data.status,
          status_detail: data.status_detail,
          is_approved: isApproved,
          amount: amount,
          has_bump: hasBump,
          payer_name: data.payer ? `${data.payer.first_name || ''} ${data.payer.last_name || ''}`.trim() : '',
          payer_email: data.payer ? data.payer.email : ''
        });
      }
    }

    // 3. Busca por E-mail ou Query genérica nos pagamentos aprovados recentes
    const searchUrl = new URL('https://api.mercadopago.com/v1/payments/search');
    searchUrl.searchParams.set('sort', 'date_created');
    searchUrl.searchParams.set('criteria', 'desc');
    searchUrl.searchParams.set('status', 'approved');
    searchUrl.searchParams.set('limit', '20');

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();

    if (searchRes.ok && searchData.results && searchData.results.length > 0) {
      // Se veio email para busca
      if (email && email.includes('@')) {
        const match = searchData.results.find(p => 
          (p.payer?.email && p.payer.email.toLowerCase() === email) ||
          (p.additional_info?.payer?.email && p.additional_info.payer.email.toLowerCase() === email)
        );
        if (match) {
          const amount = Number(match.transaction_amount || 29.90);
          const hasBump = amount >= 39.0 || (match.description && match.description.toLowerCase().includes('dicas'));
          return res.status(200).json({
            success: true,
            id: match.id,
            status: 'approved',
            status_detail: match.status_detail,
            is_approved: true,
            amount: amount,
            has_bump: hasBump,
            payer_name: match.payer ? `${match.payer.first_name || ''} ${match.payer.last_name || ''}`.trim() : ''
          });
        }
      }

      // Se veio check_latest=1 (verifica se houve pagamento aprovado nas últimas 6 horas)
      if (checkLatest) {
        const now = Date.now();
        const sixHoursAgo = now - (6 * 60 * 60 * 1000);
        const recentApproved = searchData.results.find(p => {
          const created = new Date(p.date_created).getTime();
          const approved = p.date_approved ? new Date(p.date_approved).getTime() : created;
          return (approved >= sixHoursAgo || created >= sixHoursAgo) && Number(p.transaction_amount) >= 20.0;
        });

        if (recentApproved) {
          const amount = Number(recentApproved.transaction_amount || 29.90);
          const hasBump = amount >= 39.0 || (recentApproved.description && recentApproved.description.toLowerCase().includes('dicas'));
          return res.status(200).json({
            success: true,
            id: recentApproved.id,
            status: 'approved',
            status_detail: recentApproved.status_detail,
            is_approved: true,
            amount: amount,
            has_bump: hasBump,
            found_latest: true
          });
        }
      }

      // Se veio query genérica (busca em external_reference, txid ou id)
      if (cleanId) {
        const match = searchData.results.find(p => {
          const strId = String(p.id);
          const extRef = String(p.external_reference || '');
          const qrCode = String(p.point_of_interaction?.transaction_data?.qr_code || '');
          const e2e = String(p.point_of_interaction?.transaction_data?.e2e_id || '');
          return strId === cleanId || extRef === cleanId || qrCode.includes(cleanId) || e2e.includes(cleanId);
        });

        if (match) {
          const amount = Number(match.transaction_amount || 29.90);
          const hasBump = amount >= 39.0 || (match.description && match.description.toLowerCase().includes('dicas'));
          return res.status(200).json({
            success: true,
            id: match.id,
            status: 'approved',
            status_detail: match.status_detail,
            is_approved: true,
            amount: amount,
            has_bump: hasBump
          });
        }
      }
    }

    return res.status(200).json({
      success: false,
      is_approved: false,
      status: 'not_found',
      message: 'Nenhum pagamento aprovado foi localizado para estes dados.'
    });

  } catch (err) {
    console.error('Erro ao consultar status no Mercado Pago:', err);
    return res.status(500).json({
      error: 'Erro interno ao consultar status',
      message: err.message
    });
  }
};
