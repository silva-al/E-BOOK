/**
 * VERCEL SERVERLESS FUNCTION - PROCESSAR PAGAMENTO POR CARTÃO DE CRÉDITO VIA MERCADO PAGO
 * Endpoint: POST /api/create-card-payment
 */

function detectCardBrand(number) {
  const clean = (number || '').replace(/\D/g, '');
  // Elo deve ser verificado antes de Visa pois possui faixas começando com 4 (ex: 4011, 4312, 4514)
  if (/^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-7][0-9]|90[0-9]{2})|627780|63(6297|6368)|650(03[1-3]|04[0-9]|05[0-1]|4(0[5-9]|[1-3][0-9]|8[5-9]|9[0-9])|5(0[0-9]|1[0-9]|2[0-9]|3[0-8]|4[1-9]|[5-8][0-9]|9[0-8])|7(0[0-9]|1[0-8]|2[0-7])|9(0[1-9]|[1-6][0-9]|7[0-8]))|6516(5[2-9]|[6-7][0-9])|6550([0-1][0-9]|2[1-9]|[3-4][0-9]|5[0-8]))/.test(clean)) return 'elo';
  if (/^(4011|4312|4389|4514|4573|4576|5041|5067|5090|6277|6362|6363|650|6516|6550)/.test(clean)) return 'elo';
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'master';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(606282|3841)/.test(clean)) return 'hipercard';
  return 'visa'; // Padrão seguro
}

function getErrorMessageByStatusDetail(statusDetail) {
  const map = {
    'cc_rejected_bad_filled_card_number': 'Número do cartão inválido. Verifique os dados digitados.',
    'cc_rejected_bad_filled_date': 'Data de validade incorreta ou cartão vencido.',
    'cc_rejected_bad_filled_other': 'Dados do cartão incorretos. Por favor revise.',
    'cc_rejected_bad_filled_security_code': 'Código de segurança (CVV) inválido.',
    'cc_rejected_blacklist': 'Transação não autorizada. Tente outro cartão ou utilize o PIX.',
    'cc_rejected_call_for_authorize': 'O banco emissor solicitou autorização prévia. Entre em contato com seu banco ou use PIX.',
    'cc_rejected_card_disabled': 'Cartão desabilitado. Contate a operadora ou pague via PIX.',
    'cc_rejected_card_error': 'Não foi possível processar o pagamento com este cartão.',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado identificado recentemente.',
    'cc_rejected_high_risk': 'Transação recusada pelas políticas de segurança da operadora. Recomendamos pagar via PIX.',
    'cc_rejected_insufficient_amount': 'Saldo ou limite insuficiente no cartão.',
    'cc_rejected_invalid_installments': 'Número de parcelas inválido para este cartão.',
    'cc_rejected_max_attempts': 'Limite de tentativas excedido para este cartão. Tente via PIX.'
  };
  return map[statusDetail] || 'Pagamento recusado pela operadora do cartão. Verifique os dados ou utilize o PIX.';
}

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
    const {
      cardNumber,
      cardholderName,
      cardExpirationMonth,
      cardExpirationYear,
      securityCode,
      docNumber,
      docType,
      installments,
      buyerEmail,
      buyerName,
      buyerPhone,
      amount,
      orderBump
    } = req.body || {};

    if (!cardNumber || !cardholderName || !cardExpirationMonth || !cardExpirationYear || !securityCode) {
      return res.status(400).json({ error: 'Todos os campos do cartão são obrigatórios.' });
    }

    const cleanCard = String(cardNumber).replace(/\D/g, '');
    const cleanDoc = String(docNumber || '').replace(/\D/g, '') || '19119119100';
    const cleanEmail = (buyerEmail && buyerEmail.includes('@')) ? buyerEmail.trim() : 'contato.aluna@desmamenoturno.com';
    const transactionAmount = Number(amount || 29.90);
    const numInstallments = Math.max(1, parseInt(installments, 10) || 1);

    let expYear = parseInt(cardExpirationYear, 10);
    if (expYear < 100) expYear += 2000;
    const expMonth = parseInt(cardExpirationMonth, 10);

    const paymentMethodId = detectCardBrand(cleanCard);

    let firstName = 'Aluna';
    let lastName = 'Desmame';
    const rawName = (buyerName || cardholderName || '').trim();
    if (rawName) {
      const parts = rawName.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || 'Cliente';
    }

    const cleanPhone = String(buyerPhone || '').replace(/\D/g, '');
    let phoneArea = '11';
    let phoneNum = '999999999';
    if (cleanPhone.length >= 10) {
      phoneArea = cleanPhone.slice(0, 2);
      phoneNum = cleanPhone.slice(2);
    }

    // 1. Gerar Card Token na API do Mercado Pago
    const tokenPayload = {
      card_number: cleanCard,
      expiration_month: expMonth,
      expiration_year: expYear,
      security_code: String(securityCode).trim(),
      cardholder: {
        name: cardholderName.trim().toUpperCase(),
        identification: {
          type: docType || 'CPF',
          number: cleanDoc
        }
      }
    };

    const tokenRes = await fetch('https://api.mercadopago.com/v1/card_tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenPayload)
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.id) {
      console.error('Erro gerando token de cartão no MP:', tokenData);
      return res.status(400).json({
        error: 'Dados do cartão inválidos. Verifique os números, validade e CVV.',
        details: tokenData
      });
    }

    const cardToken = tokenData.id;
    const idempotencyKey = `card-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const description = 'E-book Desmame Diurno e Noturno Oficial';

    // 2. Efetuar cobrança na API /v1/payments com dados completos antifraude
    const paymentPayload = {
      transaction_amount: Number(transactionAmount.toFixed(2)),
      token: cardToken,
      description: description,
      installments: numInstallments,
      payment_method_id: paymentMethodId,
      statement_descriptor: 'DESMAME',
      payer: {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: docType || 'CPF',
          number: cleanDoc
        },
        phone: {
          area_code: phoneArea,
          number: phoneNum
        }
      },
      additional_info: {
        items: [
          {
            id: 'desmame-diurno-noturno',
            title: description,
            description: 'Guia Prático Passo a Passo: Desmame Diurno e Noturno',
            category_id: 'learnings',
            quantity: 1,
            unit_price: Number(transactionAmount.toFixed(2))
          }
        ],
        payer: {
          first_name: firstName,
          last_name: lastName,
          phone: {
            area_code: phoneArea,
            number: phoneNum
          }
        }
      },
      metadata: {
        buyer_phone: buyerPhone || '',
        buyer_name: buyerName || '',
        order_bump: Boolean(orderBump)
      }
    };

    const paymentRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      console.error('Erro no /v1/payments do Mercado Pago:', paymentData);
      const friendlyMsg = getErrorMessageByStatusDetail(paymentData.status_detail || paymentData.cause?.[0]?.code);
      return res.status(paymentRes.status).json({
        error: friendlyMsg,
        status: paymentData.status || 'rejected',
        status_detail: paymentData.status_detail,
        details: paymentData
      });
    }

    const isApproved = paymentData.status === 'approved';

    return res.status(200).json({
      success: isApproved,
      payment_id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      is_approved: isApproved,
      amount: paymentData.transaction_amount,
      installments: paymentData.installments,
      message: isApproved 
        ? 'Pagamento com cartão aprovado com sucesso!' 
        : getErrorMessageByStatusDetail(paymentData.status_detail)
    });

  } catch (err) {
    console.error('Erro interno processando pagamento no cartão:', err);
    return res.status(500).json({
      error: 'Erro interno ao processar pagamento com cartão.',
      message: err.message
    });
  }
};
