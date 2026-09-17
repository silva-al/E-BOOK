/**
 * APP CONTROLLER - E-BOOK DESMAME NOTURNO & CHECKOUT PIX KIWIFY
 */

// Estado da Aplicação
const appState = {
  pixKey: localStorage.getItem('alan_pix_key') || '+5519994744297',
  directPixKey: '5519994744297',
  pixRecipient: localStorage.getItem('alan_pix_name') || 'ALAN RONALDO',
  pixCity: localStorage.getItem('alan_pix_city') || 'SAO PAULO',
  basePrice: 30.00,
  bumpPrice: 9.90,
  hasBump: localStorage.getItem('desmame_has_bump') === 'true',
  isPaid: localStorage.getItem('desmame_is_paid') === 'true',
  ebookData: null
};

// Ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  clearFormFields();
  initCountdownTimer();
  updatePriceDisplay();
  initInputHandlers();
  await loadEbookContent();
  checkUnlockStatus();

  const bumpCheck = document.getElementById('orderBumpCheck');
  if (bumpCheck) {
    bumpCheck.checked = appState.hasBump;
  }
});

function clearFormFields() {
  const form = document.getElementById('checkoutForm');
  if (form) form.reset();
  const nameInput = document.getElementById('buyerName');
  const emailInput = document.getElementById('buyerEmail');
  const phoneInput = document.getElementById('buyerPhone');
  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';

  // Limpa resquícios de testes anteriores caso existam
  if (localStorage.getItem('desmame_buyer_name') === 'Camila Silva Martins' || localStorage.getItem('desmame_buyer_name') === 'Aluna Desmame Gentil') {
    localStorage.removeItem('desmame_buyer_name');
    localStorage.removeItem('desmame_buyer_email');
    localStorage.removeItem('desmame_buyer_phone');
  }
}

function initInputHandlers() {
  const phoneInput = document.getElementById('buyerPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 6) {
        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
      } else if (v.length > 2) {
        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      } else if (v.length > 0) {
        e.target.value = `(${v}`;
      } else {
        e.target.value = '';
      }
    });
  }
}

function renderCurrentModules() {
  if (appState.ebookData && appState.ebookData.modules) {
    renderEbookModules(appState.ebookData.modules);
  }
}

/* ==========================================================================
   CARREGAR CONTEÚDO DO CONTENT.JSON
   ========================================================================== */
async function loadEbookContent() {
  try {
    const response = await fetch('ebook/content.json');
    if (!response.ok) throw new Error('Falha ao ler ebook/content.json');
    const data = await response.json();
    appState.ebookData = data;
    if (data.product && data.product.title) {
      const titleEl = document.getElementById('productTitle');
      if (titleEl) titleEl.innerText = data.product.title;
    }
    renderEbookModules(data.modules);
  } catch (error) {
    console.warn('Carregamento via fetch local (modo direto arquivo): usando fallback estruturado', error);
    // Dados fallback idênticos ao content.json caso seja aberto como file:// sem servidor web
    const fallbackModules = [
      {
        id: 1,
        title: "1️⃣ Módulo 01: Escolha por onde começar",
        duration: "5 min de leitura",
        chapters: [
          { content: "Você pode começar retirando uma mamada de dia ou noturna por vez, em vez de tentar mudar toda a rotina de uma vez." }
        ]
      },
      {
        id: 2,
        title: "2️⃣ Módulo 02: Quando o bebê acordar, tente outras formas de acalmar",
        duration: "5 min de leitura",
        chapters: [
          { content: "Colo, carinho, embalo, cafuné, água ou simplesmente ficar pertinho. 🥹🤍" }
        ]
      },
      {
        id: 3,
        title: "3️⃣ Módulo 03: Faça uma rotina antes de dormir",
        duration: "5 min de leitura",
        chapters: [
          { content: "Banho + pijama + ambiente mais tranquilo + carinho. Repetir a rotina ajuda o bebê a entender que chegou a hora de dormir." }
        ]
      },
      {
        id: 4,
        title: "4️⃣ Módulo 04: Não ofereça o peito automaticamente ao primeiro despertar",
        duration: "5 min de leitura",
        chapters: [
          { content: "Se ele acordar, espere um pouquinho e tente acalmar de outra forma primeiro." }
        ]
      },
      {
        id: 5,
        title: "5️⃣ Módulo 05: Seja consistente",
        duration: "5 min de leitura",
        chapters: [
          { content: "Se decidiu retirar aquela mamada, tente manter a mudança. O bebê pode reclamar nos primeiros dias enquanto se adapta." }
        ]
      },
      {
        id: 6,
        title: "6️⃣ Módulo 06: Vá no ritmo de vocês",
        duration: "5 min de leitura",
        chapters: [
          { content: "Se estiver muito difícil, dê mais tempo antes de retirar outra mamada. Desmame não precisa acontecer de um dia para o outro. 🤍" }
        ]
      },
      {
        id: 7,
        title: "☀️ Bônus Especial: Como fiz o desmame durante o dia!",
        duration: "7 min de leitura",
        isBumpBonus: true,
        chapters: [
          {
            title: "Observação e Desvio de Atenção",
            content: "O primeiro passo foi observar os momentos em que meu filho procurava o peito e tentar entender se era fome ou apenas costume.\n\nQuando ele lembrava do peito, eu desviava a atenção com brincadeiras, colo e carinho."
          },
          {
            title: "⚠️ Alerta Importante",
            content: "Lembrando: é muito importante que o bebê esteja se alimentando bem! 🤍"
          },
          {
            title: "1️⃣ No meu caso vs No seu caso",
            content: "No meu caso:\nQuando ele lembrava do peito, eu usava o sulfato ferroso, que ele não gostava do sabor. Ele sentia o gosto e acabava não querendo mais o peito.\n\nNo seu caso:\nUse algo que seu bebê não goste! ✅"
          },
          {
            title: "2️⃣ Mantenha o bebê sempre alimentado 🍎💧",
            content: "Ofereça comidinhas, frutas e água ao longo do dia, de acordo com a rotina e idade do bebê. Assim, ele passa a ter outras opções além do peito."
          },
          {
            title: "3️⃣ Vá diminuindo as mamadas aos poucos",
            content: "Comece retirando as mamadas diurnas que forem mais fáceis de substituir. Com o tempo, ele vai se acostumando com a nova rotina."
          },
          {
            title: "4️⃣ Ofereça carinho e acolhimento 🤍",
            content: "Quando ele procurar o peito, ofereça colo, carinho e atenção. O objetivo é mostrar que ele continua recebendo conforto e segurança mesmo sem mamar."
          },
          {
            title: "✨ Mensagem Final",
            content: "Esses foram os métodos que funcionaram comigo e me ajudaram no desmame durante o dia. Cada bebê tem seu próprio ritmo, então tenha paciência e respeite o tempo do seu pequeno. 🤍"
          }
        ]
      }
    ];
    appState.ebookData = { modules: fallbackModules };
    renderEbookModules(fallbackModules);
  }
}

function renderEbookModules(modules) {
  const container = document.getElementById('modulesContainer');
  if (!container) return;

  const hasBump = appState.hasBump;

  container.innerHTML = modules.map((mod, index) => {
    // Caso 1: É o módulo adicional/order bump e a aluna NÃO comprou o adicional
    if (mod.isBumpBonus && !hasBump) {
      return `
        <div class="module-accordion-item module-bump-locked" id="moduleItem${mod.id}">
          <button class="module-accordion-trigger" type="button" onclick="toggleModule(${mod.id})">
            <div class="module-trigger-info">
              <div class="module-title-row">
                <span class="module-title-text">${mod.title}</span>
                <span class="locked-badge-pill">🔒 Adicional Bloqueado</span>
              </div>
              <div class="module-badges-row">
                <span class="module-time-badge">⏱️ ${mod.duration || '7 min de leitura'}</span>
                <span class="module-locked-tag">Disponível por R$ 9,90</span>
              </div>
            </div>
            <span class="module-arrow-icon" id="moduleArrow${mod.id}">▼</span>
          </button>

          <div class="module-accordion-content" id="moduleContent${mod.id}">
            <div class="bump-locked-box">
              <div class="bump-locked-icon-wrap">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h5 class="bump-locked-heading">Conteúdo Exclusivo do Pacote Adicional</h5>
              <p class="bump-locked-text">
                Você adquiriu o e-book principal de <strong>Desmame Noturno</strong>. Este módulo especial contém o passo a passo prático com todas as <strong>Dicas Especiais para o Desmame Durante o Dia</strong>.
              </p>
              <div class="bump-locked-perks">
                <div class="bump-perk-item">✓ O que fazer quando ele lembrar do peito de dia (desvio de atenção)</div>
                <div class="bump-perk-item">✓ A estratégia prática do sabor seguro e eficaz</div>
                <div class="bump-perk-item">✓ Rotina de alimentação alternativa 🍎💧 e redução gradual</div>
                <div class="bump-perk-item">✓ Acolhimento e carinho para manter a segurança emocional</div>
              </div>
              <div class="bump-locked-cta-box">
                <div class="bump-cta-price-info">
                  <span class="bump-cta-sub">Acesso vitalício imediato:</span>
                  <span class="bump-cta-val">Apenas R$ 9,90 no PIX</span>
                </div>
                <button type="button" class="btn-unlock-bump-now" onclick="handleOpenBumpUpgradeModal()">
                  🔓 Liberar Este Bônus Agora por R$ 9,90
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Caso 2: Módulo normal ou módulo bônus com adicional PAGO
    const isBumpUnlocked = mod.isBumpBonus && hasBump;

    return `
      <div class="module-accordion-item ${isBumpUnlocked ? 'module-bump-unlocked' : ''} ${index === 0 ? 'active' : ''}" id="moduleItem${mod.id}">
        <button class="module-accordion-trigger" type="button" onclick="toggleModule(${mod.id})">
          <div class="module-trigger-info">
            <div class="module-title-row">
              <span class="module-title-text">${mod.title}</span>
              ${isBumpUnlocked ? `<span class="unlocked-badge-pill">✨ Bônus VIP Liberado</span>` : ''}
            </div>
            <div class="module-badges-row">
              ${mod.duration ? `<span class="module-time-badge">⏱️ ${mod.duration.replace('de aula', 'de leitura')}</span>` : ''}
              <span class="module-text-badge">${isBumpUnlocked ? '⭐ Conteúdo Adicional Incluso' : '📝 Conteúdo Completo'}</span>
            </div>
          </div>
          <span class="module-arrow-icon" id="moduleArrow${mod.id}">${index === 0 ? '▲' : '▼'}</span>
        </button>

        <div class="module-accordion-content" id="moduleContent${mod.id}">
          ${isBumpUnlocked ? `
            <div class="bump-unlocked-banner">
              <div class="bump-banner-icon">☀️</div>
              <div>
                <strong>Bônus Especial Adicional Desbloqueado!</strong>
                <p>Aqui está o seu método prático com todas as dicas especiais para o desmame com carinho durante o dia.</p>
              </div>
            </div>
          ` : ''}
          
          <!-- Capítulos Escritos do E-book -->
          <div class="module-chapters-area">
            ${mod.chapters.map(chap => `
              <div class="chapter-block ${chap.title && chap.title.includes('⚠️') ? 'chapter-warning' : ''}">
                ${chap.title ? `<h6 class="chapter-title">${chap.title}</h6>` : ''}
                <p class="chapter-text">${chap.content}</p>
              </div>
            `).join('')}
          </div>

        </div>
      </div>
    `;
  }).join('');
}

function handleEditModuleVideo(moduleId, moduleTitle) {
  const current = getModuleVideoUrl(moduleId, '');
  const newUrl = prompt(
    `Insira o Link do Vídeo para:\n"${moduleTitle}"\n\n(Exemplos aceitos: YouTube, Vimeo, Google Drive ou link .mp4):`,
    current
  );

  if (newUrl !== null) {
    const trimmed = newUrl.trim();
    if (trimmed) {
      localStorage.setItem(`alan_video_mod_${moduleId}`, trimmed);
      alert(`Vídeo do Módulo ${moduleId} atualizado com sucesso!`);
    } else {
      localStorage.removeItem(`alan_video_mod_${moduleId}`);
      alert(`Vídeo do Módulo ${moduleId} resetado para o padrão.`);
    }
    // Re-renderiza módulos para atualizar o player na hora
    if (appState.ebookData && appState.ebookData.modules) {
      renderEbookModules(appState.ebookData.modules);
    } else {
      loadEbookContent();
    }
  }
}

function toggleModule(id) {
  const item = document.getElementById(`moduleItem${id}`);
  const arrow = document.getElementById(`moduleArrow${id}`);
  if (!item) return;

  const isActive = item.classList.contains('active');
  item.classList.toggle('active');
  if (arrow) {
    arrow.textContent = isActive ? '▼' : '▲';
  }
}

/* ==========================================================================
   TIMER DE CONTAGEM REGRESSIVA (ESTILO KIWIFY)
   ========================================================================== */
function initCountdownTimer() {
  const timerElem = document.getElementById('countdownTimer');
  if (!timerElem) return;

  let totalSeconds = 14 * 60 + 59;
  const interval = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(interval);
      timerElem.textContent = "00:00";
      return;
    }
    totalSeconds--;
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    timerElem.textContent = `${m}:${s}`;
  }, 1000);
}

/* ==========================================================================
   ORDER BUMP E CÁLCULO DE VALOR
   ========================================================================== */
function handleToggleBump(checkbox) {
  appState.hasBump = checkbox.checked;
  localStorage.setItem('desmame_has_bump', String(checkbox.checked));
  updatePriceDisplay();
}

function getCurrentTotal() {
  return appState.hasBump ? (appState.basePrice + appState.bumpPrice) : appState.basePrice;
}

let currentInlinePixPayload = '';

function renderInlinePix() {
  const totalAmount = getCurrentTotal();
  try {
    currentInlinePixPayload = window.PixEngine.generatePayload({
      key: appState.pixKey,
      name: appState.pixRecipient,
      city: appState.pixCity,
      amount: totalAmount,
      txId: '***'
    });
  } catch (e) {
    console.error('Erro gerando payload inline:', e);
  }

  const canvas = document.getElementById('inlinePixQrCanvas');
  if (canvas && typeof window.generateQRCodeCanvas === 'function') {
    window.generateQRCodeCanvas(currentInlinePixPayload, canvas, 180);
  }

  const tag = document.getElementById('inlineQrAmountTag');
  if (tag) {
    const formatted = totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    tag.textContent = `Valor: ${formatted}`;
  }
}

function handleCopyInlinePixCode() {
  if (!currentInlinePixPayload) {
    renderInlinePix();
  }
  const label = document.getElementById('labelCopyInlinePix');
  if (navigator.clipboard && currentInlinePixPayload) {
    navigator.clipboard.writeText(currentInlinePixPayload).then(() => {
      if (label) {
        const orig = label.textContent;
        label.textContent = "✅ Código PIX Copiado com Sucesso!";
        setTimeout(() => { label.textContent = orig; }, 3000);
      }
    });
  } else {
    prompt("Copie o código PIX Copia e Cola abaixo:", currentInlinePixPayload);
  }
}

function switchPixTab(tab) {
  const tabBtnQr = document.getElementById('tabBtnQr');
  const tabBtnKey = document.getElementById('tabBtnKey');
  const paneQr = document.getElementById('paneQr');
  const paneKey = document.getElementById('paneKey');

  if (tab === 'qr') {
    if (tabBtnQr) tabBtnQr.classList.add('active');
    if (tabBtnKey) tabBtnKey.classList.remove('active');
    if (paneQr) paneQr.classList.add('active');
    if (paneKey) paneKey.classList.remove('active');
    renderInlinePix();
  } else {
    if (tabBtnQr) tabBtnQr.classList.remove('active');
    if (tabBtnKey) tabBtnKey.classList.add('active');
    if (paneQr) paneQr.classList.remove('active');
    if (paneKey) paneKey.classList.add('active');
  }
}

function updatePriceDisplay() {
  const total = getCurrentTotal();
  const formatted = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  // 1. Cabeçalho do produto no topo
  const displayPrice = document.getElementById('displayPrice');
  if (displayPrice) displayPrice.textContent = formatted;

  // 2. Badge de valor no título da seção PIX
  const pixHeaderBadgeAmount = document.getElementById('pixHeaderBadgeAmount');
  if (pixHeaderBadgeAmount) pixHeaderBadgeAmount.textContent = `Valor: ${formatted}`;

  // 3. Resumo dinâmico de valor abaixo do PIX
  const checkoutTotalPix = document.getElementById('checkoutTotalPix');
  if (checkoutTotalPix) {
    checkoutTotalPix.textContent = formatted;
    checkoutTotalPix.style.transform = 'scale(1.08)';
    setTimeout(() => { checkoutTotalPix.style.transform = 'scale(1)'; }, 200);
  }

  // 4. Linha adicional do order bump no resumo
  const bumpSummaryRow = document.getElementById('bumpSummaryRow');
  if (bumpSummaryRow) {
    bumpSummaryRow.style.display = appState.hasBump ? 'flex' : 'none';
  }

  // 5. Botão de checkout com valor dinâmico
  const btnSubmitCheckoutText = document.getElementById('btnSubmitCheckoutText');
  if (btnSubmitCheckoutText) {
    btnSubmitCheckoutText.textContent = `PAGAR COM PIX (${formatted}) E LIBERAR O CURSO AGORA`;
  }

  // 6. Valor no modal
  const pixModalAmount = document.getElementById('pixModalAmount');
  if (pixModalAmount) pixModalAmount.textContent = formatted;

  // 7. Atualiza o QR Code e Copia e Cola na tela
  renderInlinePix();
}

/* ==========================================================================
   CHECKOUT PIX KIWIFY (GERAÇÃO REAL COM QR CODE & COPIA E COLA)
   ========================================================================== */
function handleOpenPixModal() {
  const buyerNameInput = document.getElementById('buyerName');
  const buyerEmailInput = document.getElementById('buyerEmail');
  const buyerPhoneInput = document.getElementById('buyerPhone');

  const buyerName = (buyerNameInput ? buyerNameInput.value.trim() : '') || 'Aluna Desmame Noturno';
  const buyerEmail = buyerEmailInput ? buyerEmailInput.value.trim() : '';
  const buyerPhone = buyerPhoneInput ? buyerPhoneInput.value.trim() : '';

  if (buyerName && buyerName !== 'Aluna Desmame Noturno') localStorage.setItem('desmame_buyer_name', buyerName);
  if (buyerEmail) localStorage.setItem('desmame_buyer_email', buyerEmail);
  if (buyerPhone) localStorage.setItem('desmame_buyer_phone', buyerPhone);

  const totalAmount = getCurrentTotal();

  // 1. Gera o payload BR Code oficial do PIX através do PixEngine
  let pixPayload = '';
  try {
    pixPayload = window.PixEngine.generatePayload({
      key: appState.pixKey,
      name: appState.pixRecipient,
      city: appState.pixCity,
      amount: totalAmount,
      txId: '***'
    });
  } catch (e) {
    console.error('Erro gerando payload:', e);
  }

  // 2. Preenche o código copia e cola no modal
  const codeBox = document.getElementById('pixCopyCodeText');
  if (codeBox) {
    codeBox.textContent = pixPayload;
    codeBox.setAttribute('data-full-code', pixPayload);
  }

  // 3. Desenha o QR Code nítido no canvas
  const canvas = document.getElementById('pixQrCanvas');
  if (canvas && typeof window.generateQRCodeCanvas === 'function') {
    window.generateQRCodeCanvas(pixPayload, canvas, 220);
  }

  // 4. Abre o modal
  const modal = document.getElementById('pixModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function handleClosePixModal() {
  const modal = document.getElementById('pixModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Fechar modal PIX ao pressionar tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
    handleClosePixModal();
    handleCloseBumpUpgradeModal();
  }
});

// Fechar ao clicar fora da caixa do modal (no fundo escuro)
window.addEventListener('click', (e) => {
  const modal = document.getElementById('pixModal');
  if (modal && e.target === modal) {
    handleClosePixModal();
  }
  const bumpModal = document.getElementById('bumpUpgradeModal');
  if (bumpModal && e.target === bumpModal) {
    handleCloseBumpUpgradeModal();
  }
});

function handleCopyPixCode() {
  const codeBox = document.getElementById('pixCopyCodeText');
  const btnLabel = document.getElementById('copyPixBtnLabel');
  const code = codeBox ? (codeBox.getAttribute('data-full-code') || codeBox.textContent) : '';

  if (navigator.clipboard && code) {
    navigator.clipboard.writeText(code).then(() => {
      if (btnLabel) {
        const original = btnLabel.textContent;
        btnLabel.textContent = "✅ Código PIX Copiado com Sucesso!";
        setTimeout(() => { btnLabel.textContent = original; }, 3000);
      }
    });
  } else {
    alert("Código copiado: " + code);
  }
}

function handleCopyDirectPixKey() {
  const key = appState.directPixKey || '5519994744297';
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(key).then(() => {
      // Feedback nos botões
      const btn1 = document.getElementById('labelDirectCopyForm');
      const btn2 = document.getElementById('labelDirectCopyModal');
      if (btn1) {
        const orig = btn1.textContent;
        btn1.textContent = "✅ Copiada!";
        setTimeout(() => { btn1.textContent = orig; }, 3000);
      }
      if (btn2) {
        const orig = btn2.textContent;
        btn2.textContent = "✅ Copiada!";
        setTimeout(() => { btn2.textContent = orig; }, 3000);
      }
      alert(`Chave PIX copiada com sucesso:\n${key}\n\nAbra o aplicativo do seu banco e cole na opção PIX > Telefone.`);
    }).catch(() => {
      prompt("Copie a chave PIX abaixo:", key);
    });
  } else {
    prompt("Copie a chave PIX abaixo:", key);
  }
}

/* ==========================================================================
   CONFIRMAÇÃO / LIBERAÇÃO DO CURSO APÓS PAGAMENTO
   ========================================================================== */
function handleConfirmPixPayment() {
  // Salva no estado
  appState.isPaid = true;
  localStorage.setItem('desmame_is_paid', 'true');
  localStorage.setItem('desmame_has_bump', String(appState.hasBump));

  // Fecha o modal PIX
  handleClosePixModal();

  // Esconde a área de compra e exibe o curso desbloqueado
  checkUnlockStatus();
  renderCurrentModules();

  // Rola a tela com suavidade até o portal desbloqueado
  setTimeout(() => {
    const portal = document.getElementById('unlockedPortal');
    if (portal) {
      portal.scrollIntoView({ behavior: 'smooth' });
    }
  }, 300);
}

function checkUnlockStatus() {
  const checkoutSection = document.getElementById('checkoutSection');
  const unlockedPortal = document.getElementById('unlockedPortal');
  const topNoticeBar = document.getElementById('topNoticeBar');

  if (appState.isPaid) {
    if (checkoutSection) checkoutSection.style.display = 'none';
    if (topNoticeBar) topNoticeBar.style.display = 'none';
    if (unlockedPortal) unlockedPortal.classList.add('active');

    const savedName = localStorage.getItem('desmame_buyer_name');
    const welcomeDesc = document.getElementById('unlockedWelcomeDesc');
    if (welcomeDesc) {
      if (savedName) {
        welcomeDesc.innerHTML = `Olá, <strong>${savedName}</strong>! Seu pagamento via PIX foi confirmado. Bem-vinda ao método <strong>Desmame Noturno</strong>.`;
      } else {
        welcomeDesc.innerHTML = `Seu pagamento via PIX foi confirmado. Bem-vinda ao método <strong>Desmame Noturno</strong>.`;
      }
    }
  } else {
    if (checkoutSection) checkoutSection.style.display = 'grid';
    if (topNoticeBar) topNoticeBar.style.display = 'flex';
    if (unlockedPortal) unlockedPortal.classList.remove('active');
  }
}

/* ==========================================================================
   UPGRADE DO ADICIONAL / ORDER BUMP (DESMAME DIURNO)
   ========================================================================== */
let currentBumpUpgradePixPayload = '';

function handleOpenBumpUpgradeModal() {
  const amount = appState.bumpPrice; // R$ 9,90
  try {
    currentBumpUpgradePixPayload = window.PixEngine.generatePayload({
      key: appState.pixKey,
      name: appState.pixRecipient,
      city: appState.pixCity,
      amount: amount,
      txId: '***'
    });
  } catch (e) {
    console.error('Erro gerando payload para upgrade:', e);
  }

  const canvas = document.getElementById('bumpUpgradeQrCanvas');
  if (canvas && typeof window.generateQRCodeCanvas === 'function') {
    window.generateQRCodeCanvas(currentBumpUpgradePixPayload, canvas, 200);
  }

  const codeBox = document.getElementById('bumpUpgradeCopyCodeText');
  if (codeBox) {
    codeBox.textContent = currentBumpUpgradePixPayload;
    codeBox.setAttribute('data-full-code', currentBumpUpgradePixPayload);
  }

  const modal = document.getElementById('bumpUpgradeModal');
  if (modal) modal.classList.add('active');
}

function handleCloseBumpUpgradeModal() {
  const modal = document.getElementById('bumpUpgradeModal');
  if (modal) modal.classList.remove('active');
}

function handleCopyBumpUpgradePixCode() {
  const codeBox = document.getElementById('bumpUpgradeCopyCodeText');
  const btnLabel = document.getElementById('copyBumpPixBtnLabel');
  const code = codeBox ? (codeBox.getAttribute('data-full-code') || codeBox.textContent) : '';

  if (navigator.clipboard && code) {
    navigator.clipboard.writeText(code).then(() => {
      if (btnLabel) {
        const orig = btnLabel.textContent;
        btnLabel.textContent = "✅ Código PIX Copiado!";
        setTimeout(() => { btnLabel.textContent = orig; }, 3000);
      }
    });
  } else {
    prompt("Copie o código PIX abaixo:", code);
  }
}

function handleConfirmBumpUpgrade() {
  appState.hasBump = true;
  localStorage.setItem('desmame_has_bump', 'true');
  handleCloseBumpUpgradeModal();
  renderCurrentModules();

  setTimeout(() => {
    const item7 = document.getElementById('moduleItem7');
    if (item7) {
      item7.classList.add('active');
      const arrow = document.getElementById('moduleArrow7');
      if (arrow) arrow.textContent = '▲';
      item7.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 250);

  alert("🎉 Parabéns! O bônus especial 'Como fiz o desmame durante o dia!' foi liberado com sucesso!");
}

/* ==========================================================================
   PAINEL RÁPIDO DO ALAN
   ========================================================================== */
function toggleViewMode() {
  appState.isPaid = !appState.isPaid;
  localStorage.setItem('desmame_is_paid', String(appState.isPaid));
  checkUnlockStatus();
  renderCurrentModules();
  alert(`Modo alterado para: ${appState.isPaid ? 'Área da Aluna (Curso Liberado)' : 'Página de Checkout Kiwify'}`);
}

function toggleBumpMode() {
  appState.hasBump = !appState.hasBump;
  localStorage.setItem('desmame_has_bump', String(appState.hasBump));
  renderCurrentModules();
  alert(`Status do Adicional Diurno alterado para:\n${appState.hasBump ? 'PAGO / LIBERADO ✅' : 'NÃO PAGO / BLOQUEADO 🔒'}`);
}

function editPixKeyPrompt() {
  const currentKey = appState.pixKey;
  const currentName = appState.pixRecipient;
  const currentCity = appState.pixCity;

  const newKey = prompt("1/3: Digite sua Chave PIX (Telefone com DDD, CPF, E-mail ou Aleatória):", currentKey);
  if (newKey === null) return;
  const newName = prompt("2/3: Digite o Nome do Titular da Conta no Banco (como aparece no app):", currentName);
  if (newName === null) return;
  const newCity = prompt("3/3: Digite a Cidade da sua Conta Bancária (ex: SAO PAULO):", currentCity);
  if (newCity === null) return;

  if (newKey && newKey.trim() !== "") {
    appState.pixKey = newKey.trim();
    localStorage.setItem('alan_pix_key', appState.pixKey);
  }
  if (newName && newName.trim() !== "") {
    appState.pixRecipient = newName.trim().toUpperCase();
    localStorage.setItem('alan_pix_name', appState.pixRecipient);
  }
  if (newCity && newCity.trim() !== "") {
    appState.pixCity = newCity.trim().toUpperCase();
    localStorage.setItem('alan_pix_city', appState.pixCity);
  }

  updatePriceDisplay();
  alert(`Dados PIX atualizados com sucesso!\n\nChave: ${appState.pixKey}\nTitular: ${appState.pixRecipient}\nCidade: ${appState.pixCity}\n\nO QR Code foi regerado com estes dados.`);
}

function toggleAdminBar() {
  const bar = document.getElementById('alanAdminBar');
  if (bar) {
    bar.classList.toggle('expanded');
  }
}

