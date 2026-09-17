/**
 * APP CONTROLLER - E-BOOK DESMAME NOTURNO & CHECKOUT PIX KIWIFY
 */

// Estado da Aplicação
const appState = {
  pixKey: localStorage.getItem('alan_pix_key') || '+5519994744297',
  directPixKey: '5519994744297',
  pixRecipient: localStorage.getItem('alan_pix_name') || 'ALAN RONALDO',
  pixCity: localStorage.getItem('alan_pix_city') || 'SAO PAULO',
  basePrice: 29.90,
  bumpPrice: 9.90,
  paymentMethod: 'pix',
  hasBump: localStorage.getItem('desmame_has_bump') === 'true',
  isPaid: localStorage.getItem('desmame_is_paid') === 'true',
  ebookData: null
};

// Ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('reset') === '1' || urlParams.get('checkout') === '1' || urlParams.get('logout') === '1') {
    localStorage.removeItem('desmame_is_paid');
    localStorage.removeItem('desmame_has_bump');
    localStorage.removeItem('desmame_buyer_name');
    localStorage.removeItem('desmame_buyer_email');
    localStorage.removeItem('desmame_buyer_phone');
    appState.isPaid = false;
    appState.hasBump = false;
  } else if (urlParams.get('access') === 'approved' || urlParams.get('acesso') === '1' || urlParams.get('liberado') === '1') {
    // Acesso liberado via link de e-mail / magic link
    appState.isPaid = true;
    localStorage.setItem('desmame_is_paid', 'true');
    const paramName = urlParams.get('name');
    const paramEmail = urlParams.get('email');
    const paramBump = urlParams.get('bump');
    if (paramName) {
      const decodedName = decodeURIComponent(paramName);
      appState.buyerName = decodedName;
      localStorage.setItem('desmame_buyer_name', decodedName);
    }
    if (paramEmail) {
      const decodedEmail = decodeURIComponent(paramEmail);
      appState.buyerEmail = decodedEmail;
      localStorage.setItem('desmame_buyer_email', decodedEmail);
    }
    if (paramBump === '1') {
      appState.hasBump = true;
      localStorage.setItem('desmame_has_bump', 'true');
    }
  }

  clearFormFields();
  initCountdownTimer();
  updatePriceDisplay();
  initInputHandlers();
  await loadEbookContent();
  checkUnlockStatus();

  if (!appState.isPaid) {
    initInlineMercadoPagoPix();
  }

  const bumpCheck = document.getElementById('orderBumpCheck');
  if (bumpCheck) {
    bumpCheck.checked = appState.hasBump;
  }

  // Ferramentas de administração: visíveis apenas se a URL contiver ?admin=1
  if (urlParams.get('admin') === '1') {
    const adminTools = document.querySelector('.footer-admin-tools');
    if (adminTools) adminTools.classList.add('show-admin');
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

  const nameInput = document.getElementById('buyerName');
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        appState.buyerName = val;
        localStorage.setItem('desmame_buyer_name', val);
      }
    });
  }

  const emailInput = document.getElementById('buyerEmail');
  if (emailInput) {
    emailInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        appState.buyerEmail = val;
        localStorage.setItem('desmame_buyer_email', val);
      }
    });
  }

  // Máscaras e formatações de Cartão de Crédito
  const cardNumberInput = document.getElementById('cardNumber');
  const cardBrandBadge = document.getElementById('cardBrandBadge');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 16) v = v.slice(0, 16);
      
      const parts = v.match(/[\s\S]{1,4}/g) || [];
      e.target.value = parts.join(' ');

      if (cardBrandBadge) {
        cardBrandBadge.className = 'card-brand-badge';
        if (/^(4011|4312|4389|4514|4573|4576|5041|5067|5090|6277|6362|6363|650|6516|6550)/.test(v)) {
          cardBrandBadge.textContent = 'ELO';
          cardBrandBadge.classList.add('elo');
        } else if (/^4/.test(v)) {
          cardBrandBadge.textContent = 'VISA';
          cardBrandBadge.classList.add('visa');
        } else if (/^(5[1-5]|2[2-7])/.test(v)) {
          cardBrandBadge.textContent = 'MASTERCARD';
          cardBrandBadge.classList.add('master');
        } else if (/^3[47]/.test(v)) {
          cardBrandBadge.textContent = 'AMEX';
          cardBrandBadge.classList.add('amex');
        } else if (/^(606282|3841)/.test(v)) {
          cardBrandBadge.textContent = 'HIPER';
          cardBrandBadge.classList.add('hipercard');
        } else {
          cardBrandBadge.textContent = 'CARTÃO';
        }
      }
    });
  }

  const cardholderInput = document.getElementById('cardholderName');
  if (cardholderInput) {
    cardholderInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  const cardExpInput = document.getElementById('cardExpiration');
  if (cardExpInput) {
    cardExpInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 4) v = v.slice(0, 4);
      if (v.length >= 2) {
        let month = parseInt(v.slice(0, 2), 10);
        if (month > 12) month = 12;
        if (month === 0) month = 1;
        const formattedMonth = String(month).padStart(2, '0');
        e.target.value = `${formattedMonth}/${v.slice(2)}`;
      } else {
        e.target.value = v;
      }
    });
  }

  const cardCvvInput = document.getElementById('cardCvv');
  if (cardCvvInput) {
    cardCvvInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 4) v = v.slice(0, 4);
      e.target.value = v;
    });
  }

  const cardDocInput = document.getElementById('cardDocNumber');
  if (cardDocInput) {
    cardDocInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 9) {
        e.target.value = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
      } else if (v.length > 6) {
        e.target.value = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
      } else if (v.length > 3) {
        e.target.value = `${v.slice(0, 3)}.${v.slice(3)}`;
      } else {
        e.target.value = v;
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
          {
            title: "Uma Mudança de Cada Vez",
            content: "Não tente retirar todas as mamadas de uma vez. Comece escolhendo uma mamada que você considera mais fácil de retirar, seja durante o dia ou à noite.\n\nObserve a rotina do seu bebê e escolha um momento em que ele costuma mamar mais por hábito do que por fome. Depois, mantenha essa mudança por alguns dias para que ele tenha tempo de se adaptar antes de retirar outra mamada.\n\nO segredo para mim foi fazer uma mudança de cada vez, sem pressa. 🤍"
          }
        ]
      },
      {
        id: 2,
        title: "2️⃣ Módulo 02: Quando o bebê acordar, tente outras formas de acalmar",
        duration: "5 min de leitura",
        chapters: [
          {
            title: "Outras Formas de Aconchego",
            content: "Quando meu filho acordava, eu não queria que o peito fosse a única forma de fazê-lo voltar a dormir.\n\nEntão eu tentava outras maneiras de acalmá-lo, como colo, carinho, balançando no meu peito, Cafuné ou simplesmente ficar pertinho dele. 🥹🤍\n\nNem sempre ele se acalmava imediatamente. Eu precisava ter paciência e repetir o processo até ele entender que também conseguia voltar a dormir de outras formas.\n\nE quando ele acordava eu já levantava e colocava ele pra dormir."
          }
        ]
      },
      {
        id: 3,
        title: "3️⃣ Módulo 03: Crie uma rotina antes de dormir 🛁🌙",
        duration: "6 min de leitura",
        chapters: [
          {
            title: "Crie uma rotina antes de dormir 🛁🌙",
            content: "Uma rotina previsível pode ajudar o bebê a entender que está chegando a hora de dormir.\n\nNo meu caso, eu fazia algo simples: banho + pijama + ambiente mais tranquilo + carinho.\nO mais importante é tentar repetir a sequência todos os dias. Com o tempo, esses pequenos sinais passam a fazer parte da preparação para o sono.\n\n(Eu peguei o costume de desligar todas as luzes, colocar uma música de chuva para nenhum barulho acordar ele.)"
          }
        ]
      },
      {
        id: 4,
        title: "4️⃣ Módulo 04: Não ofereça o peito automaticamente ao primeiro despertar",
        duration: "6 min de leitura",
        chapters: [
          {
            title: "Não ofereça o peito automaticamente ao primeiro despertar",
            content: "Quando o bebê acordar, antes de oferecer o peito imediatamente, espere um pouquinho e observe.\nTente primeiro acalmá-lo de outra maneira: pegue no colo, dê carinho e aconchego.\n\nA intenção é começar a quebrar a associação de que todo despertar precisa terminar em uma mamada.\nSe o bebê demonstrar fome ou houver alguma necessidade específica, respeite isso. O desmame precisa considerar a idade, alimentação e necessidades individuais da criança.\n\nSe ele chorar ofereça água ou uma mamadeira com leite ( o meu filho aceitou a mamadeira com 5 dias depois do desmame)"
          }
        ]
      },
      {
        id: 5,
        title: "5️⃣ Módulo 05: Seja consistente 🤍",
        duration: "7 min de leitura",
        chapters: [
          {
            title: "Seja consistente 🤍",
            content: "Depois de escolher retirar uma determinada mamada, procure manter a decisão e a nova rotina.\nNos primeiros dias, o bebê pode reclamar ou estranhar porque está acostumado com aquela forma de dormir. Isso faz parte da adaptação à mudança.\n\nQuando ele se acostumar, ele vai dormir a noite inteira e vai mudar muito a sua vida, seu humor, sua rotina.\n\nTenha paciência, ofereça muito carinho e tente manter a mesma abordagem. Consistência não significa deixar o bebê sozinho ou ignorar o choro; significa continuar oferecendo acolhimento enquanto ele aprende uma nova forma de adormecer. 🌙🤍\n\n✨ Esses foram os métodos que funcionaram comigo durante o desmame do meu filho. Cada bebê é único, então adapte o processo à realidade e às necessidades do seu pequeno."
          },
          {
            title: "☀️ Desmame Durante o Dia (Guia Completo)",
            content: "Se quiser saber mais sobre como eu fiz pra ele desmamar na parte do dia, é só liberar o acesso que vai ter o guia completo de dia e noite."
          }
        ]
      }
    ];

    const fallbackBonusModules = [
      {
        id: 101,
        title: "1️⃣ Passo 01: Observação e Desvio de Atenção",
        duration: "3 min de leitura",
        chapters: [
          {
            title: "Observação e Desvio de Atenção",
            content: "O primeiro passo foi observar os momentos em que meu filho procurava o peito e tentar entender se era fome ou apenas costume.\n\nQuando ele lembrava do peito, eu desviava a atenção com brincadeiras, colo e carinho."
          },
          {
            title: "⚠️ Alerta Importante",
            content: "Lembrando: é muito importante que o bebê esteja se alimentando bem! 🤍"
          }
        ]
      },
      {
        id: 102,
        title: "2️⃣ Passo 02: No meu caso vs No seu caso",
        duration: "3 min de leitura",
        chapters: [
          {
            title: "Estratégia do Sabor Seguro ✅",
            content: "No meu caso:\nQuando ele lembrava do peito, eu usava o sulfato ferroso, que ele não gostava do sabor. Ele sentia o gosto e acabava não querendo mais o peito.\n\nNo seu caso:\nUse algo que seu bebê não goste! ✅"
          }
        ]
      },
      {
        id: 103,
        title: "3️⃣ Passo 03: Mantenha o bebê sempre alimentado 🍎💧",
        duration: "2 min de leitura",
        chapters: [
          {
            title: "Alimentação e Hidratação",
            content: "Ofereça comidinhas, frutas e água ao longo do dia, de acordo com a rotina e idade do bebê. Assim, ele passa a ter outras opções além do peito."
          }
        ]
      },
      {
        id: 104,
        title: "4️⃣ Passo 04: Vá diminuindo as mamadas aos poucos",
        duration: "2 min de leitura",
        chapters: [
          {
            title: "Transição Gradual Diurna",
            content: "Comece retirando as mamadas diurnas que forem mais fáceis de substituir. Com o tempo, ele vai se acostumando com a nova rotina."
          }
        ]
      },
      {
        id: 105,
        title: "5️⃣ Passo 05: Ofereça carinho e acolhimento 🤍",
        duration: "3 min de leitura",
        chapters: [
          {
            title: "Aconchego e Segurança",
            content: "Quando ele procurar o peito, ofereça colo, carinho e atenção. O objetivo é mostrar que ele continua recebendo conforto e segurança mesmo sem mamar."
          }
        ]
      },
      {
        id: 106,
        title: "✨ Passo 06: Mensagem Final",
        duration: "2 min de leitura",
        chapters: [
          {
            title: "Respeitando o Tempo do Bebê 🤍",
            "content": "Esses foram os métodos que funcionaram comigo e me ajudaram no desmame durante o dia. Cada bebê tem seu próprio ritmo, então tenha paciência e respeite o tempo do seu pequeno. 🤍"
          }
        ]
      }
    ];

    appState.ebookData = {
      modules: fallbackModules,
      bonus_diurno: { modules: fallbackBonusModules }
    };
    renderEbookModules(fallbackModules);
  }
}

function renderEbookModules(modules) {
  const container = document.getElementById('modulesContainer');
  if (!container) return;

  const hasBump = appState.hasBump;
  const nocturnalModules = (modules || []).filter(m => !m.isBumpBonus);
  const bonusData = (appState.ebookData && appState.ebookData.bonus_diurno) || null;
  const dayModules = (bonusData && bonusData.modules) || [];

  // 1. Módulos Noturnos (1 a 5)
  container.innerHTML = nocturnalModules.map((mod, index) => {
    return `
      <div class="module-accordion-item ${index === 0 ? 'active' : ''}" id="moduleItem${mod.id}">
        <button class="module-accordion-trigger" type="button" onclick="toggleModule(${mod.id})">
          <div class="module-trigger-info">
            <div class="module-title-row">
              <span class="module-title-text">${mod.title}</span>
            </div>
            <div class="module-badges-row">
              ${mod.duration ? `<span class="module-time-badge">⏱️ ${mod.duration.replace('de aula', 'de leitura')}</span>` : ''}
              <span class="module-text-badge">📝 Conteúdo Noturno</span>
            </div>
          </div>
          <span class="module-arrow-icon" id="moduleArrow${mod.id}">${index === 0 ? '▲' : '▼'}</span>
        </button>

        <div class="module-accordion-content" id="moduleContent${mod.id}">
          <div class="module-chapters-area">
            ${mod.chapters.map(chap => {
              const isDayHook = chap.title && (chap.title.includes('Desmame Durante o Dia') || (chap.content && chap.content.includes('desmamar na parte do dia')));
              return `
              <div class="chapter-block ${chap.title && chap.title.includes('⚠️') ? 'chapter-warning' : ''} ${isDayHook ? 'chapter-day-hook' : ''}">
                ${chap.title ? `<h6 class="chapter-title">${chap.title}</h6>` : ''}
                <p class="chapter-text">${chap.content}</p>
                ${isDayHook && !hasBump ? `
                  <div style="margin-top: 14px;">
                    <button type="button" class="btn-unlock-bump-now" style="font-size: 13.5px; padding: 10px 18px;" onclick="handleOpenBumpUpgradeModal()">
                      🔓 Liberar Acesso ao Guia Completo Dia & Noite (R$ 9,90)
                    </button>
                  </div>
                ` : ''}
              </div>
            `;}).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 2. Renderiza Seção Separada do Bônus Especial Diurno
  renderBonusSection(dayModules, hasBump);
}

function renderBonusSection(dayModules, hasBump) {
  const bonusBox = document.getElementById('bonusAccessBox');
  const bonusBadge = document.getElementById('bonusHeaderBadge');
  const bonusContainer = document.getElementById('bonusContainer');
  if (!bonusContainer) return;

  if (!hasBump) {
    if (bonusBox) bonusBox.classList.remove('bonus-unlocked');
    if (bonusBadge) {
      bonusBadge.className = 'locked-badge-pill';
      bonusBadge.innerHTML = '🔒 Adicional Bloqueado';
    }
    bonusContainer.innerHTML = `
      <div class="bump-locked-box" style="margin-top: 0;">
        <div class="bump-locked-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h5 class="bump-locked-heading">Conteúdo Exclusivo do Pacote Adicional</h5>
        <p class="bump-locked-text">
          Você adquiriu o e-book principal de <strong>Desmame Noturno</strong>. Este bônus especial contém o passo a passo prático com todas as <strong>Dicas Especiais para o Desmame Durante o Dia</strong>, dividido em passos práticos.
        </p>
        <div class="bump-locked-perks">
          <div class="bump-perk-item">✓ 1️⃣ Passo 01: Observação e Desvio de Atenção</div>
          <div class="bump-perk-item">✓ 2️⃣ Passo 02: A estratégia prática do sabor seguro e eficaz</div>
          <div class="bump-perk-item">✓ 3️⃣ Passo 03: Rotina de alimentação alternativa 🍎💧</div>
          <div class="bump-perk-item">✓ 4️⃣ Passo 04: Redução gradual das mamadas diurnas</div>
          <div class="bump-perk-item">✓ 5️⃣ Passo 05: Acolhimento e carinho para manter a segurança emocional</div>
          <div class="bump-perk-item">✓ ✨ Passo 06: Mensagem final e acolhimento com amor 🤍</div>
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
    `;
  } else {
    if (bonusBox) bonusBox.classList.add('bonus-unlocked');
    if (bonusBadge) {
      bonusBadge.className = 'unlocked-badge-pill';
      bonusBadge.innerHTML = '✨ Bônus VIP Liberado';
    }
    bonusContainer.innerHTML = `
      <div class="bump-unlocked-banner">
        <div class="bump-banner-icon">☀️</div>
        <div>
          <strong>Bônus Especial Adicional Desbloqueado!</strong>
          <p>Aqui está o seu método prático com todas as dicas especiais para o desmame com carinho durante o dia, separado passo a passo.</p>
        </div>
      </div>
      
      <div class="modules-accordion-list">
        ${dayModules.map((mod, index) => `
          <div class="module-accordion-item module-bump-unlocked ${index === 0 ? 'active' : ''}" id="moduleItem${mod.id}">
            <button class="module-accordion-trigger" type="button" onclick="toggleModule(${mod.id})">
              <div class="module-trigger-info">
                <div class="module-title-row">
                  <span class="module-title-text">${mod.title}</span>
                  <span class="unlocked-badge-pill">✨ Bônus VIP</span>
                </div>
                <div class="module-badges-row">
                  ${mod.duration ? `<span class="module-time-badge">⏱️ ${mod.duration}</span>` : ''}
                  <span class="module-text-badge">⭐ Conteúdo Diurno</span>
                </div>
              </div>
              <span class="module-arrow-icon" id="moduleArrow${mod.id}">${index === 0 ? '▲' : '▼'}</span>
            </button>

            <div class="module-accordion-content" id="moduleContent${mod.id}">
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
        `).join('')}
      </div>
    `;
  }
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
  if (!appState.isPaid) {
    initInlineMercadoPagoPix();
  }
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

  // 7. Valor no box direto de pagamento
  const directBoxAmountTag = document.getElementById('directBoxAmountTag');
  if (directBoxAmountTag) directBoxAmountTag.textContent = formatted;

  const cardBoxAmountTag = document.getElementById('cardBoxAmountTag');
  if (cardBoxAmountTag) cardBoxAmountTag.textContent = formatted;

  const labelSubmitCard = document.getElementById('labelSubmitCard');
  if (labelSubmitCard) {
    labelSubmitCard.textContent = `PAGAR COM CARTÃO (${formatted}) E LIBERAR AGORA`;
  }

  const cardSuccessAmountTag = document.getElementById('cardSuccessAmountTag');
  if (cardSuccessAmountTag) cardSuccessAmountTag.textContent = `✅ STATUS: PAGO NO CARTÃO (${formatted})`;

  const inlineSuccessTag = document.getElementById('inlineSuccessTag');
  if (inlineSuccessTag) inlineSuccessTag.textContent = `✅ STATUS: PAGO (${formatted})`;

  updateInstallmentOptions(total);

  // 8. Atualiza o QR Code e Copia e Cola na tela
  renderInlinePix();
}

/* ==========================================================================
   MERCADO PAGO PIX INTEGRATION & REAL-TIME CHECKOUT
   ========================================================================== */
let currentMpPaymentId = null;
let mpPollingInterval = null;
let autoCheckTimer = null;
let currentMainPixCode = '';
let unlockCountdownInterval = null;

/**
 * Inicializa o PIX do Mercado Pago diretamente na tela de checkout principal
 */
async function initInlineMercadoPagoPix() {
  if (appState.isPaid) return;

  const qrImg = document.getElementById('mainPixQrImage');
  const qrCanvas = document.getElementById('mainPixQrCanvas');
  const qrLoading = document.getElementById('mainPixLoading');
  const statusEl = document.getElementById('mainPaymentStatusText');
  const tagEl = document.getElementById('directBoxAmountTag');

  const totalAmount = getCurrentTotal();
  const formatted = totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (tagEl) tagEl.textContent = formatted;

  if (qrLoading) qrLoading.style.display = 'flex';
  if (qrImg) qrImg.style.display = 'none';
  if (qrCanvas) qrCanvas.style.display = 'none';

  if (statusEl) {
    statusEl.innerHTML = `<div class="pulse-spinner"></div><span>Conectando ao Mercado Pago...</span>`;
  }

  const buyerNameInput = document.getElementById('buyerName');
  const buyerEmailInput = document.getElementById('buyerEmail');
  const buyerName = (buyerNameInput ? buyerNameInput.value.trim() : '') || 'Aluna Desmame Noturno';
  const buyerEmail = (buyerEmailInput ? buyerEmailInput.value.trim() : '') || 'contato@desmamenoturno.com';

  try {
    const res = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName,
        buyerEmail,
        amount: totalAmount,
        orderBump: appState.hasBump
      })
    });

    const data = await res.json();

    if (res.ok && data.success && data.qr_code) {
      currentMainPixCode = data.qr_code;
      currentMpPaymentId = data.order_id || data.payment_id;

      if (data.qr_code_base64 && qrImg) {
        qrImg.src = `data:image/png;base64,${data.qr_code_base64}`;
        qrImg.style.display = 'block';
        if (qrCanvas) qrCanvas.style.display = 'none';
      } else if (qrCanvas && typeof window.generateQRCodeCanvas === 'function') {
        if (qrImg) qrImg.style.display = 'none';
        qrCanvas.style.display = 'block';
        window.generateQRCodeCanvas(data.qr_code, qrCanvas, 190);
      }
      if (qrLoading) qrLoading.style.display = 'none';

      if (statusEl) {
        statusEl.innerHTML = `<div class="pulse-spinner"></div><span>Aguardando pagamento no Mercado Pago...</span>`;
      }

      startMercadoPagoPolling(currentMpPaymentId);
      return;
    }
  } catch (err) {
    console.warn('Erro chamando API do Mercado Pago:', err);
  }

  // Fallback local via PixEngine caso API offline
  try {
    currentMainPixCode = window.PixEngine.generatePayload({
      key: appState.pixKey,
      name: appState.pixRecipient,
      city: appState.pixCity,
      amount: totalAmount,
      txId: '***'
    });
    if (qrCanvas && typeof window.generateQRCodeCanvas === 'function') {
      window.generateQRCodeCanvas(currentMainPixCode, qrCanvas, 190);
      qrCanvas.style.display = 'block';
      if (qrImg) qrImg.style.display = 'none';
      if (qrLoading) qrLoading.style.display = 'none';
    }
    if (statusEl) {
      statusEl.innerHTML = `<div class="pulse-spinner"></div><span>Aguardando confirmação do PIX...</span>`;
    }
  } catch (e) {
    console.error('Erro no fallback de PIX:', e);
  }
}

/**
 * Copia o código PIX Oficial do Mercado Pago com feedback visual instantâneo
 */
function handleCopyMainPixCode() {
  if (!currentMainPixCode) {
    initInlineMercadoPagoPix();
  }
  const code = currentMainPixCode;
  const label = document.getElementById('labelCopyMainPix');

  if (navigator.clipboard && code) {
    navigator.clipboard.writeText(code).then(() => {
      if (label) {
        const orig = label.textContent;
        label.textContent = "✅ CÓDIGO PIX COPIADO COM SUCESSO!";
        setTimeout(() => { label.textContent = orig; }, 3000);
      }
    }).catch(() => {
      // Fallback gracioso
    });
  }
}

/**
 * Polling em tempo real consultando se o Mercado Pago já deu baixa no PIX
 */
function startMercadoPagoPolling(paymentId) {
  stopPaymentPolling();

  const statusEl = document.getElementById('mainPaymentStatusText');
  if (statusEl) {
    statusEl.innerHTML = `<div class="pulse-spinner"></div><span>Aguardando pagamento no Mercado Pago...</span>`;
  }

  mpPollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/check-payment?id=${paymentId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'approved' || data.is_approved) {
        stopPaymentPolling();
        showPaymentSuccessAndUnlock();
      }
    } catch (e) {
      console.error('Erro no polling do Mercado Pago:', e);
    }
  }, 2000);
}

/**
 * Verificação manual ao clicar no botão "Já realizei o pagamento".
 * Consulta obrigatoriamente a API do Mercado Pago e NÃO libera se não estiver aprovado!
 */
async function handleManualVerifyPayment() {
  const btn = document.getElementById('btnManualVerify');
  const feedback = document.getElementById('manualVerifyFeedback');
  const originalText = '⚡ Já realizei o pagamento (Verificar e Liberar)';

  if (!currentMpPaymentId) {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef3c7';
      feedback.style.color = '#92400e';
      feedback.style.border = '1px solid #fde68a';
      feedback.innerHTML = 'Aguarde a geração do PIX oficial para poder verificar.';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="pulse-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Consultando Mercado Pago...`;
  }

  if (feedback) {
    feedback.style.display = 'none';
  }

  try {
    const res = await fetch(`/api/check-payment?id=${currentMpPaymentId}`);
    const data = await res.json();

    if (data.status === 'approved' || data.is_approved) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#ecfdf5';
        feedback.style.color = '#065f46';
        feedback.style.border = '1px solid #bbf7d0';
        feedback.innerHTML = '✅ Pagamento confirmado com sucesso pelo Mercado Pago!';
      }
      showPaymentSuccessAndUnlock();
      return;
    } else {
      // PAGAMENTO AINDA NÃO APROVADO NA API
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>${originalText}</span>`;
      }
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#fef2f2';
        feedback.style.color = '#991b1b';
        feedback.style.border = '1px solid #fecaca';
        feedback.innerHTML = '⚠️ <strong>Pagamento ainda não identificado no Mercado Pago.</strong><br>Se você acabou de pagar no aplicativo do seu banco, aguarde alguns instantes pela compensação do PIX e clique novamente.';
      }
    }
  } catch (err) {
    console.error('Erro ao verificar pagamento na API:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>${originalText}</span>`;
    }
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.color = '#991b1b';
      feedback.style.border = '1px solid #fecaca';
      feedback.innerHTML = '⚠️ Não foi possível consultar o Mercado Pago no momento. Tente novamente em instantes.';
    }
  }
}

/**
 * Sinal sonoro de sucesso ao aprovar o PIX
 */
function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Ré
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.14); // Lá
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.55);
  } catch (e) {
    // áudio opcional
  }
}

/**
 * Exibe confirmação visual de pagamento na tela com contagem de 3s e desbloqueia o portal
 */
function showPaymentSuccessAndUnlock() {
  stopPaymentPolling();
  playSuccessSound();

  // Dispara e-mail de aprovação com link de acesso permanente e boas-vindas
  triggerSendAccessEmail(appState.hasBump);

  // Esconde área de espera e exibe o bloco verde comemorativo diretamente na página
  const inlinePaymentArea = document.getElementById('inlinePaymentArea');
  const inlineSuccessArea = document.getElementById('inlineSuccessArea');
  const inlineCountdown = document.getElementById('inlineRedirectCountdown');

  if (inlinePaymentArea) inlinePaymentArea.style.display = 'none';
  if (inlineSuccessArea) inlineSuccessArea.style.display = 'block';

  // Atualiza modal se estiver aberto
  const pendingContent = document.getElementById('pixPendingContent');
  const successNotification = document.getElementById('pixPaidNotification');
  const countdownEl = document.getElementById('redirectCountdown');
  if (pendingContent) pendingContent.style.display = 'none';
  if (successNotification) successNotification.style.display = 'block';

  let seconds = 3;
  if (inlineCountdown) inlineCountdown.textContent = seconds;
  if (countdownEl) countdownEl.textContent = seconds;

  if (unlockCountdownInterval) clearInterval(unlockCountdownInterval);

  unlockCountdownInterval = setInterval(() => {
    seconds--;
    if (inlineCountdown) inlineCountdown.textContent = seconds;
    if (countdownEl) countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(unlockCountdownInterval);
      unlockCountdownInterval = null;
      handleConfirmPixPayment();
    }
  }, 1000);
}

/**
 * Gera o Magic Link de Acesso Vitalício Direto ao E-book
 */
function getMagicAccessLink(hasBumpParam) {
  const name = appState.buyerName || localStorage.getItem('desmame_buyer_name') || 'Aluna';
  const email = appState.buyerEmail || localStorage.getItem('desmame_buyer_email') || '';
  const bump = (typeof hasBumpParam === 'boolean') ? hasBumpParam : appState.hasBump;
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}?access=approved&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&bump=${bump ? '1' : '0'}`;
}

/**
 * Dispara envio de e-mail de confirmação e boas-vindas com o Magic Link
 */
async function triggerSendAccessEmail(hasBumpParam) {
  const name = appState.buyerName || localStorage.getItem('desmame_buyer_name') || 'Aluna';
  const email = appState.buyerEmail || localStorage.getItem('desmame_buyer_email');
  const bump = (typeof hasBumpParam === 'boolean') ? hasBumpParam : appState.hasBump;
  const magicLink = getMagicAccessLink(bump);

  if (!email || !email.includes('@')) {
    console.log('[EMAIL] Sem e-mail válido para envio automático');
    return;
  }

  try {
    const res = await fetch('/api/send-access-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName: name,
        buyerEmail: email,
        hasBump: bump,
        accessLink: magicLink
      })
    });
    const data = await res.json();
    console.log('[EMAIL RESPONSE]', data);
  } catch (e) {
    console.warn('Erro ao chamar /api/send-access-email:', e);
  }
}

/**
 * Permite que a aluna copie seu link de acesso permanente diretamente na tela
 */
function handleCopyAccessMagicLink() {
  const link = getMagicAccessLink(appState.hasBump);
  const label = document.getElementById('labelCopyMagicLink');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      if (label) {
        const orig = label.textContent;
        label.textContent = "✅ LINK COPIADO!";
        setTimeout(() => { label.textContent = orig; }, 3000);
      }
    });
  }
}

function stopPaymentPolling() {
  if (mpPollingInterval) {
    clearInterval(mpPollingInterval);
    mpPollingInterval = null;
  }
  if (autoCheckTimer) {
    clearInterval(autoCheckTimer);
    autoCheckTimer = null;
  }
  if (unlockCountdownInterval) {
    clearInterval(unlockCountdownInterval);
    unlockCountdownInterval = null;
  }
}

function handleClosePixModal() {
  const modal = document.getElementById('pixModal');
  if (modal) {
    modal.classList.remove('active');
  }
  stopPaymentPolling();
}

// Fechar modal PIX ao pressionar tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
    handleClosePixModal();
    handleCloseBumpUpgradeModal();
  }
});

// Fechar ao clicar fora da caixa do modal
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

function handleOpenPixModal() {
  initInlineMercadoPagoPix();
}

function handleCopyPixCode() {
  handleCopyMainPixCode();
}

function handleCopyDirectPixKey() {
  const key = appState.directPixKey || '5519994744297';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(key).then(() => {
      const btn1 = document.getElementById('labelDirectCopyForm');
      if (btn1) {
        const orig = btn1.textContent;
        btn1.textContent = "✅ CHAVE PIX COPIADA!";
        setTimeout(() => { btn1.textContent = orig; }, 3000);
      }
    });
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

    const savedName = localStorage.getItem('desmame_buyer_name') || appState.buyerName;
    const savedEmail = localStorage.getItem('desmame_buyer_email') || appState.buyerEmail;

    const welcomeDesc = document.getElementById('unlockedWelcomeDesc');
    if (welcomeDesc) {
      if (savedName) {
        welcomeDesc.innerHTML = `Olá, <strong>${savedName}</strong>! Seu pagamento via PIX foi confirmado. Bem-vinda ao método <strong>Desmame Noturno</strong>.`;
      } else {
        welcomeDesc.innerHTML = `Seu pagamento via PIX foi confirmado. Bem-vinda ao método <strong>Desmame Noturno</strong>.`;
      }
    }

    const emailNotice = document.getElementById('accessEmailNoticeText');
    if (emailNotice) {
      if (savedEmail) {
        emailNotice.innerHTML = `✉️ Enviamos seu link de acesso vitalício para: <strong>${savedEmail}</strong>`;
      } else {
        emailNotice.innerHTML = `✉️ Guarde seu link de acesso permanente para ler quando quiser!`;
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
let currentBumpOrderId = null;
let bumpCountdownInterval = null;

async function handleOpenBumpUpgradeModal() {
  const amount = appState.bumpPrice; // R$ 9,90
  const canvas = document.getElementById('bumpUpgradeQrCanvas');
  const img = document.getElementById('bumpUpgradeQrImg');
  const loading = document.getElementById('bumpUpgradeLoading');
  const codeBox = document.getElementById('bumpUpgradeCopyCodeText');
  const modal = document.getElementById('bumpUpgradeModal');
  const pendingArea = document.getElementById('bumpPendingArea');
  const successArea = document.getElementById('bumpSuccessArea');
  const feedback = document.getElementById('bumpVerifyFeedback');

  if (pendingArea) pendingArea.style.display = 'block';
  if (successArea) successArea.style.display = 'none';
  if (feedback) feedback.style.display = 'none';
  if (loading) loading.style.display = 'flex';
  if (canvas) canvas.style.display = 'none';
  if (img) img.style.display = 'none';

  if (modal) modal.classList.add('active');

  try {
    const res = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        orderBump: true,
        buyerName: localStorage.getItem('desmame_buyer_name') || 'Aluna Desmame Noturno',
        buyerEmail: localStorage.getItem('desmame_buyer_email') || 'contato@desmamenoturno.com'
      })
    });
    const data = await res.json();
    if (res.ok && data.success && data.qr_code) {
      currentBumpOrderId = data.order_id || data.payment_id;
      currentBumpUpgradePixPayload = data.qr_code;

      if (data.qr_code_base64 && img) {
        img.src = `data:image/png;base64,${data.qr_code_base64}`;
        img.style.display = 'block';
        if (canvas) canvas.style.display = 'none';
      } else if (canvas && typeof window.generateQRCodeCanvas === 'function') {
        if (img) img.style.display = 'none';
        canvas.style.display = 'block';
        window.generateQRCodeCanvas(data.qr_code, canvas, 190);
      }
      if (loading) loading.style.display = 'none';

      if (bumpPollingInterval) clearInterval(bumpPollingInterval);
      bumpPollingInterval = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/check-payment?id=${currentBumpOrderId}`);
          const checkData = await checkRes.json();
          if (checkData.status === 'approved' || checkData.is_approved) {
            clearInterval(bumpPollingInterval);
            bumpPollingInterval = null;
            showBumpPaymentSuccessAndUnlock();
          }
        } catch (e) {}
      }, 2000);
      return;
    }
  } catch (err) {
    console.warn('Erro ao gerar PIX do bump via MP:', err);
  }

  // Fallback
  currentBumpUpgradePixPayload = window.PixEngine.generatePayload({
    key: appState.pixKey,
    name: appState.pixRecipient,
    city: appState.pixCity,
    amount: amount,
    txId: '***'
  });
  if (canvas && typeof window.generateQRCodeCanvas === 'function') {
    window.generateQRCodeCanvas(currentBumpUpgradePixPayload, canvas, 190);
    canvas.style.display = 'block';
    if (img) img.style.display = 'none';
    if (loading) loading.style.display = 'none';
  }
}

function handleCloseBumpUpgradeModal() {
  const modal = document.getElementById('bumpUpgradeModal');
  if (modal) modal.classList.remove('active');
  if (bumpPollingInterval) {
    clearInterval(bumpPollingInterval);
    bumpPollingInterval = null;
  }
  if (bumpCountdownInterval) {
    clearInterval(bumpCountdownInterval);
    bumpCountdownInterval = null;
  }
}

function handleCopyBumpUpgradePixCode() {
  const code = currentBumpUpgradePixPayload;
  const btnLabel = document.getElementById('copyBumpPixBtnLabel');

  if (navigator.clipboard && code) {
    navigator.clipboard.writeText(code).then(() => {
      if (btnLabel) {
        const orig = btnLabel.textContent;
        btnLabel.textContent = "✅ CÓDIGO PIX COPIADO COM SUCESSO!";
        setTimeout(() => { btnLabel.textContent = orig; }, 3000);
      }
    });
  }
}

async function handleManualVerifyBumpPayment() {
  const btn = document.getElementById('btnManualVerifyBump');
  const feedback = document.getElementById('bumpVerifyFeedback');
  const originalText = '⚡ Já realizei o pagamento (Verificar e Liberar)';

  if (!currentBumpOrderId) {
    showBumpPaymentSuccessAndUnlock();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="pulse-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Consultando Mercado Pago...`;
  }

  if (feedback) feedback.style.display = 'none';

  try {
    const res = await fetch(`/api/check-payment?id=${currentBumpOrderId}`);
    const data = await res.json();

    if (data.status === 'approved' || data.is_approved) {
      showBumpPaymentSuccessAndUnlock();
      return;
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>${originalText}</span>`;
      }
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#fef2f2';
        feedback.style.color = '#991b1b';
        feedback.style.border = '1px solid #fecaca';
        feedback.innerHTML = '⚠️ <strong>Pagamento ainda não identificado no Mercado Pago.</strong><br>Se você acabou de pagar no seu banco, aguarde alguns instantes pela compensação do PIX e clique novamente.';
      }
    }
  } catch (err) {
    console.error(err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>${originalText}</span>`;
    }
  }
}

function showBumpPaymentSuccessAndUnlock() {
  if (bumpPollingInterval) {
    clearInterval(bumpPollingInterval);
    bumpPollingInterval = null;
  }
  playSuccessSound();

  // Dispara envio de e-mail atualizado com o pacote completo (Noturno + Diurno)
  triggerSendAccessEmail(true);

  const pendingArea = document.getElementById('bumpPendingArea');
  const successArea = document.getElementById('bumpSuccessArea');
  const countdownEl = document.getElementById('bumpRedirectCountdown');

  if (pendingArea) pendingArea.style.display = 'none';
  if (successArea) successArea.style.display = 'block';

  let seconds = 3;
  if (countdownEl) countdownEl.textContent = seconds;

  if (bumpCountdownInterval) clearInterval(bumpCountdownInterval);

  bumpCountdownInterval = setInterval(() => {
    seconds--;
    if (countdownEl) countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(bumpCountdownInterval);
      bumpCountdownInterval = null;

      appState.hasBump = true;
      localStorage.setItem('desmame_has_bump', 'true');
      handleCloseBumpUpgradeModal();
      renderCurrentModules();

      setTimeout(() => {
        const bonusBox = document.getElementById('bonusAccessBox');
        if (bonusBox) {
          bonusBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, 1000);
}

// Detecção de troca de aplicativo (quando o cliente paga no Nubank/Banco e volta ao navegador)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (!appState.isPaid && currentMpPaymentId) {
      fetch(`/api/check-payment?id=${currentMpPaymentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'approved' || data.is_approved) {
            showPaymentSuccessAndUnlock();
          }
        }).catch(() => {});
    }
    if (!appState.hasBump && currentBumpOrderId) {
      fetch(`/api/check-payment?id=${currentBumpOrderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'approved' || data.is_approved) {
            showBumpPaymentSuccessAndUnlock();
          }
        }).catch(() => {});
    }
  }
});

/* ==========================================================================
   CONTROLE DE PAGAMENTO POR CARTÃO DE CRÉDITO & ABAS
   ========================================================================== */
function switchPaymentMethod(method) {
  appState.paymentMethod = method;
  const tabPix = document.getElementById('tabPayPix');
  const tabCard = document.getElementById('tabPayCard');
  const pixBox = document.getElementById('pixCheckoutContainer');
  const cardBox = document.getElementById('cardCheckoutContainer');

  if (method === 'pix') {
    if (tabPix) tabPix.classList.add('active');
    if (tabCard) tabCard.classList.remove('active');
    if (pixBox) pixBox.style.display = 'block';
    if (cardBox) cardBox.style.display = 'none';
    if (!appState.isPaid) {
      initInlineMercadoPagoPix();
    }
  } else {
    if (tabPix) tabPix.classList.remove('active');
    if (tabCard) tabCard.classList.add('active');
    if (pixBox) pixBox.style.display = 'none';
    if (cardBox) cardBox.style.display = 'block';
    updateInstallmentOptions(getCurrentTotal());
  }
}

function updateInstallmentOptions(total) {
  const select = document.getElementById('cardInstallments');
  if (!select) return;

  const currentSelected = select.value || '1';
  select.innerHTML = '';

  const maxInstallments = Math.min(12, Math.max(1, Math.floor(total / 5)));

  for (let i = 1; i <= maxInstallments; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);

    if (i === 1) {
      opt.textContent = `1x de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (sem juros)`;
    } else {
      // Cálculo suave de parcelas simuladas
      const factor = 1 + (i * 0.024);
      const installmentVal = (total * factor) / i;
      opt.textContent = `${i}x de ${installmentVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }

    if (String(i) === currentSelected) {
      opt.selected = true;
    }
    select.appendChild(opt);
  }
}

async function handleProcessCardPayment() {
  const btn = document.getElementById('btnSubmitCard');
  const label = document.getElementById('labelSubmitCard');
  const feedback = document.getElementById('cardFeedbackBox');

  const nameInput = document.getElementById('buyerName');
  const emailInput = document.getElementById('buyerEmail');
  const phoneInput = document.getElementById('buyerPhone');

  const cardNumber = document.getElementById('cardNumber');
  const cardholderName = document.getElementById('cardholderName');
  const cardExp = document.getElementById('cardExpiration');
  const cardCvv = document.getElementById('cardCvv');
  const cardDoc = document.getElementById('cardDocNumber');
  const cardInstallments = document.getElementById('cardInstallments');

  if (feedback) feedback.style.display = 'none';

  // Validação dos dados da compradora
  const buyerName = (nameInput ? nameInput.value.trim() : '') || appState.buyerName;
  const buyerEmail = (emailInput ? emailInput.value.trim() : '') || appState.buyerEmail;
  const buyerPhone = phoneInput ? phoneInput.value.trim() : '';

  if (!buyerName || buyerName.length < 3) {
    if (nameInput) nameInput.focus();
    showCardFeedback('Por favor, informe seu Nome Completo acima.', 'error');
    return;
  }

  if (!buyerEmail || !buyerEmail.includes('@') || !buyerEmail.includes('.')) {
    if (emailInput) emailInput.focus();
    showCardFeedback('Por favor, informe um E-mail válido acima para receber o acesso.', 'error');
    return;
  }

  // Validação dos campos do cartão
  const cleanCard = cardNumber ? cardNumber.value.replace(/\D/g, '') : '';
  if (cleanCard.length < 13 || cleanCard.length > 19) {
    if (cardNumber) cardNumber.focus();
    showCardFeedback('Número de cartão de crédito inválido.', 'error');
    return;
  }

  const holder = cardholderName ? cardholderName.value.trim() : '';
  if (!holder || holder.length < 3) {
    if (cardholderName) cardholderName.focus();
    showCardFeedback('Informe o nome impresso no cartão de crédito.', 'error');
    return;
  }

  const expValue = cardExp ? cardExp.value.trim() : '';
  const expParts = expValue.split('/');
  if (expParts.length !== 2) {
    if (cardExp) cardExp.focus();
    showCardFeedback('Data de validade inválida. Formato: MM/AA (ex: 08/28).', 'error');
    return;
  }
  const expMonth = parseInt(expParts[0], 10);
  const expYear = parseInt(expParts[1], 10);
  if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
    if (cardExp) cardExp.focus();
    showCardFeedback('Mês de validade incorreto (deve ser entre 01 e 12).', 'error');
    return;
  }

  const cvv = cardCvv ? cardCvv.value.trim() : '';
  if (cvv.length < 3 || cvv.length > 4) {
    if (cardCvv) cardCvv.focus();
    showCardFeedback('Código de segurança (CVV) inválido (3 ou 4 dígitos no verso do cartão).', 'error');
    return;
  }

  const cleanDoc = cardDoc ? cardDoc.value.replace(/\D/g, '') : '';
  if (cleanDoc.length !== 11) {
    if (cardDoc) cardDoc.focus();
    showCardFeedback('CPF do titular obrigatório (11 dígitos para emissão segura antifraude).', 'error');
    return;
  }

  const total = getCurrentTotal();
  const installments = cardInstallments ? cardInstallments.value : '1';

  // Iniciar processamento visual
  if (btn) btn.disabled = true;
  if (label) {
    label.innerHTML = `<div class="pulse-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Processando com segurança...`;
  }

  try {
    const res = await fetch('/api/create-card-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber: cleanCard,
        cardholderName: holder,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode: cvv,
        docNumber: cleanDoc,
        docType: 'CPF',
        installments: installments,
        buyerEmail: buyerEmail,
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        amount: total,
        orderBump: appState.hasBump
      })
    });

    const data = await res.json();

    if (res.ok && (data.status === 'approved' || data.is_approved)) {
      showCardSuccessAndUnlock();
      return;
    } else {
      const errorMsg = data.error || data.message || 'Cartão recusado pela operadora. Tente outro cartão ou utilize o PIX.';
      showCardFeedback(errorMsg, 'error');
      if (btn) btn.disabled = false;
      if (label) {
        const formatted = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        label.textContent = `PAGAR COM CARTÃO (${formatted}) E LIBERAR AGORA`;
      }
    }
  } catch (err) {
    console.error('Erro na chamada do cartão:', err);
    showCardFeedback('Erro ao conectar com a operadora do cartão. Verifique sua conexão ou tente via PIX.', 'error');
    if (btn) btn.disabled = false;
    if (label) {
      const formatted = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      label.textContent = `PAGAR COM CARTÃO (${formatted}) E LIBERAR AGORA`;
    }
  }
}

function showCardFeedback(message, type) {
  const feedback = document.getElementById('cardFeedbackBox');
  if (!feedback) return;
  feedback.className = `card-feedback-box ${type}`;
  feedback.innerHTML = type === 'error' ? `⚠️ <strong>Atenção:</strong> ${message}` : `✅ ${message}`;
  feedback.style.display = 'block';
}

function showCardSuccessAndUnlock() {
  playSuccessSound();
  triggerSendAccessEmail(appState.hasBump);

  const inputsArea = document.getElementById('cardInputsArea');
  const successArea = document.getElementById('cardSuccessArea');
  const countdown = document.getElementById('cardRedirectCountdown');

  if (inputsArea) inputsArea.style.display = 'none';
  if (successArea) successArea.style.display = 'block';

  let seconds = 3;
  if (countdown) countdown.textContent = seconds;

  const interval = setInterval(() => {
    seconds--;
    if (countdown) countdown.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      handleConfirmPixPayment();
    }
  }, 1000);
}

async function handleOpenMpCheckoutPro() {
  const nameInput = document.getElementById('buyerName');
  const emailInput = document.getElementById('buyerEmail');
  const phoneInput = document.getElementById('buyerPhone');

  const buyerName = (nameInput ? nameInput.value.trim() : '') || appState.buyerName || 'Aluna';
  const buyerEmail = (emailInput ? emailInput.value.trim() : '') || appState.buyerEmail || 'contato@desmamenoturno.com';
  const buyerPhone = phoneInput ? phoneInput.value.trim() : '';

  const total = getCurrentTotal();
  const btn = document.getElementById('btnMpCheckoutPro');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `Gerando link seguro Mercado Pago...`;
  }

  try {
    const res = await fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName,
        buyerEmail,
        buyerPhone,
        amount: total,
        orderBump: appState.hasBump,
        originUrl: window.location.origin + window.location.pathname
      })
    });

    const data = await res.json();
    if (res.ok && data.init_point) {
      window.location.href = data.init_point;
    } else {
      showCardFeedback('Não foi possível gerar o link de pagamento. Preencha seus dados acima ou pague via PIX.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `🔒 Ou pagar pelo Checkout Oficial Mercado Pago`;
      }
    }
  } catch (e) {
    showCardFeedback('Erro ao conectar com o Mercado Pago. Tente via PIX.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `🔒 Ou pagar pelo Checkout Oficial Mercado Pago`;
    }
  }
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

function resetBuyerSession() {
  localStorage.removeItem('desmame_is_paid');
  localStorage.removeItem('desmame_has_bump');
  appState.isPaid = false;
  appState.hasBump = false;
  checkUnlockStatus();
  renderCurrentModules();
  alert("Sessão resetada com sucesso! Você voltou para a visualização de novo cliente (Página de Vendas/Checkout).");
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

