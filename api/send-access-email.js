/**
 * VERCEL SERVERLESS FUNCTION - ENVIAR E-MAIL DE APROVAÇÃO E BOAS-VINDAS
 * Endpoint: POST /api/send-access-email
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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

  try {
    const { buyerName, buyerEmail, hasBump, accessLink, loginPassword } = req.body || {};

    const cleanEmail = (buyerEmail && buyerEmail.includes('@')) ? buyerEmail.trim() : null;
    const cleanName = (buyerName && buyerName.trim()) ? buyerName.trim() : 'Aluna';
    const cleanPassword = (loginPassword && String(loginPassword).trim()) ? String(loginPassword).trim() : 'desmame2026';
    const siteUrl = 'https://desmame-noturno.vercel.app';
    
    // Constrói o Magic Link de Acesso Vitalício Direto se não vier fornecido
    const magicLink = accessLink || `${siteUrl}/?access=approved&name=${encodeURIComponent(cleanName)}&email=${encodeURIComponent(cleanEmail || '')}&bump=${hasBump ? '1' : '0'}`;

    if (!cleanEmail) {
      return res.status(400).json({ error: 'E-mail do comprador é obrigatório.' });
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso Liberado - Desmame Noturno</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Top Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">🎉 Pagamento Confirmado!</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">Seja muito bem-vinda ao método Desmame Noturno</p>
            </td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="font-size: 16px; margin: 0 0 16px 0; color: #334155;">
                Olá, <strong>${cleanName}</strong>! 🤍
              </p>
              
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; color: #475569;">
                Temos uma ótima notícia: o seu pagamento foi <strong>identificado e aprovado com sucesso</strong>!
              </p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 6px; margin-bottom: 22px;">
                <p style="margin: 0; font-size: 14.5px; color: #166534; font-weight: 600;">
                  ✅ Seu acesso vitalício já está 100% liberado!
                </p>
                <p style="margin: 4px 0 0 0; font-size: 13.5px; color: #15803d;">
                  Você pode acessar pelo celular, tablet ou computador quando quiser.
                </p>
              </div>

              <!-- Dados de Login e Senha para Área da Aluna -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #166534; font-weight: 800; letter-spacing: 0.3px;">
                      🔐 SEUS DADOS DE ACESSO À ÁREA DA ALUNA:
                    </h3>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14.5px; color: #1e293b;">
                      <tr>
                        <td style="padding: 6px 0; color: #475569; width: 100px;"><strong>Site / Login:</strong></td>
                        <td style="padding: 6px 0;">
                          <a href="${siteUrl}" style="color: #0284c7; font-weight: 700; text-decoration: underline;">${siteUrl}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #475569;"><strong>Seu Login:</strong></td>
                        <td style="padding: 6px 0; font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a;">
                          ${cleanEmail}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #475569;"><strong>Sua Senha:</strong></td>
                        <td style="padding: 6px 0;">
                          <span style="font-family: monospace; font-size: 16px; font-weight: 800; color: #047857; background: #dcfce7; padding: 4px 12px; border-radius: 6px; display: inline-block; letter-spacing: 0.5px;">${cleanPassword}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 12px 0 0 0; font-size: 12.5px; color: #15803d; line-height: 1.4;">
                      💡 <em>Guarde estes dados. Você pode entrar no site clicando em "Já é aluna? Entrar" usando seu e-mail e senha acima, ou clicar no botão verde abaixo para entrar direto sem precisar digitar senha!</em>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Itens Adquiridos -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                      Resumo do Seu Pacote:
                    </h3>
                    <div style="font-size: 14.5px; color: #1e293b; margin-bottom: 6px;">
                      📖 <strong>E-book Completo Desmame Noturno</strong> (5 Módulos + PDF)
                    </div>
                    <div style="font-size: 14.5px; color: #1e293b; margin-bottom: 6px;">
                      🎁 <strong>Bônus:</strong> Guia do Sono Tranquilo
                    </div>
                    ${hasBump ? `
                    <div style="font-size: 14.5px; color: #047857; font-weight: 700;">
                      ☀️ <strong>Bônus VIP Desbloqueado:</strong> Dicas Especiais para Desmame Diurno (Passo a Passo)
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Botão Principal de Acesso Direto -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${magicLink}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 800; text-decoration: none; padding: 15px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35); text-align: center;">
                  👉 CLIQUE AQUI PARA ACESSAR DIRETO
                </a>
              </div>

              <p style="font-size: 13.5px; line-height: 1.5; color: #64748b; margin: 0 0 16px 0; text-align: center;">
                💡 <strong>Dica:</strong> Clicando no botão acima, seu material abre desbloqueado automaticamente em qualquer aparelho.
              </p>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; font-size: 13.5px; color: #64748b;">
                <p style="margin: 0 0 8px 0;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:
                </p>
                <p style="margin: 0; word-break: break-all; color: #0284c7; font-size: 12.5px;">
                  <a href="${magicLink}" style="color: #0284c7;">${magicLink}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Rodapé do E-mail -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #64748b;">
                Precisa de ajuda com o seu acesso?
              </p>
              <a href="https://wa.me/5519994744297?text=Olá!%20Comprei%20o%20e-book%20Desmame%20Noturno%20e%20gostaria%20de%20ajuda" target="_blank" style="color: #10b981; font-weight: 700; text-decoration: none;">
                💬 Falar com o Suporte Oficial no WhatsApp
              </a>
              <p style="margin: 12px 0 0 0; font-size: 11.5px; color: #cbd5e1;">
                &copy; 2026 Desmame Noturno. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Envio via RESEND se a chave estiver configurada
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const fromEmail = process.env.EMAIL_FROM || 'Desmame Noturno <onboarding@resend.dev>';
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [cleanEmail],
          subject: '🎉 Pagamento Confirmado! Seus dados de acesso e senha - Desmame Noturno',
          html: emailHtml
        })
      });

      const resendData = await resendResponse.json();
      if (resendResponse.ok) {
        return res.status(200).json({
          success: true,
          provider: 'resend',
          email_id: resendData.id,
          recipient: cleanEmail,
          magic_link: magicLink
        });
      } else {
        console.error('Erro ao enviar e-mail via Resend:', resendData);
      }
    }

    // 2. Envio via BREVO (Sendinblue) se configurada
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Desmame Noturno', email: process.env.EMAIL_FROM_ADDRESS || 'contato@desmamenoturno.com' },
          to: [{ email: cleanEmail, name: cleanName }],
          subject: '🎉 Pagamento Confirmado! Seus dados de acesso e senha - Desmame Noturno',
          htmlContent: emailHtml
        })
      });

      const brevoData = await brevoResponse.json();
      if (brevoResponse.ok) {
        return res.status(200).json({
          success: true,
          provider: 'brevo',
          messageId: brevoData.messageId,
          recipient: cleanEmail,
          magic_link: magicLink
        });
      } else {
        console.error('Erro ao enviar e-mail via Brevo:', brevoData);
      }
    }

    // Se nenhuma chave de e-mail estiver configurada no Vercel no momento, 
    // a API não quebra a experiência do usuário: retorna sucesso e registra o magicLink
    console.log(`[EMAIL INFO] E-mail de boas-vindas gerado com sucesso para ${cleanEmail}. Link de acesso: ${magicLink}`);
    return res.status(200).json({
      success: true,
      provider: 'magic_link_ready',
      recipient: cleanEmail,
      magic_link: magicLink,
      note: 'Configure RESEND_API_KEY ou BREVO_API_KEY nas variáveis de ambiente da Vercel para envio automático.'
    });

  } catch (err) {
    console.error('Erro no envio de e-mail:', err);
    return res.status(500).json({
      error: 'Erro interno ao processar envio do e-mail',
      message: err.message
    });
  }
};
