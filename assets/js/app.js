/**
 * APP CONTROLLER - E-BOOK DESMAME NOTURNO & CHECKOUT PIX KIWIFY
 */

// Estado da Aplicação
const appState = {
  pixKey: localStorage.getItem('alan_pix_key') || '+5519994744297',
  directPixKey: '5519994744297',
  pixRecipient: 'ALAN RONALDO',
  pixCity: 'SAO PAULO',
  basePrice: 30.00,
  bumpPrice: 9.90,
  hasBump: false,
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
        title: "Módulo 1: O Momento Certo e os Sinais de Prontidão",
        duration: "14 min de aula",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Aula 1: Identificando os sinais de prontidão e blindagem emocional",
        chapters: [
          { title: "1.1 A decisão é sua: Libertando-se da culpa e de palpites", content: "A amamentação é uma dança a dois: mãe e bebê. Para que ela continue sendo saudável, precisa ser boa para os dois. Quando a mãe se sente esgotada, sobrecarregada ou simplesmente sente que é a hora de fechar esse ciclo, essa decisão é legítima e merece ser respeitada." },
          { title: "1.2 Sinais de prontidão da mãe e do bebê", content: "Observe se o bebê já come alimentos sólidos com consistência, se já aceita água em copinho e se demonstra curiosidade pelo mundo ao redor. Para a mãe, o sinal principal é a exaustão física e emocional ou o desejo sincero de recuperar a autonomia do próprio corpo." },
          { title: "1.3 Os três tipos de desmame: Total, Noturno ou Diurno", content: "Você não precisa fazer tudo de uma vez. Muitas mães optam pelo desmame noturno primeiro (para voltar a dormir) mantendo o peito de dia. Outras preferem retirar o peito do dia a dia e manter a mamada antes de dormir." }
        ]
      },
      {
        id: 2,
        title: "Módulo 2: O Método dos 4 Pilares do Desmame Noturno e Respeitoso",
        duration: "18 min de aula",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Aula 2: Aplicando os 4 Pilares na prática diária com carinho e firmeza",
        chapters: [
          { title: "2.1 Pilar 1: Não Oferecer, Não Recusar", content: "A regra de ouro do pediatra e dos especialistas: nunca ofereça o peito por iniciativa própria ou para acalmar um tédio passageiro. Se o bebê pedir com insistência, acolha, mas comece a adiar sutilmente." },
          { title: "2.2 Pilar 2: Substituição de Afeto e Contato Físico", content: "O peito nunca é apenas leite: é colo, cheiro, aconchego e segurança. Ao retirar o peito, dobre a dose de carinho, massagens, beijos e olhares olho no olho." },
          { title: "2.3 Pilar 3: Diálogo Claro e Previsibilidade", content: "Mesmo bebês menores de 2 anos entendem a entonação e a intenção. Conte historinhas sobre o peito que vai descansar. Crie um ritual de despedida alegre." },
          { title: "2.4 Pilar 4: Envolvimento da Rede de Apoio", content: "Se houver parceiro(a) ou outra pessoa de confiança na casa, ela deve assumir o momento de acalmar e colocar para dormir nas primeiras noites." }
        ]
      },
      {
        id: 3,
        title: "Módulo 3: Método Noite de Paz - Os 6 Passos de Ouro do Desmame Noturno 🌙🤱🏻",
        duration: "22 min de aula",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Vídeo Oficial: Método Noite de Paz - Os 6 Passos Práticos do Desmame Noturno",
        goldenTips: [
          { step: "1️⃣", title: "Escolha por onde começar", desc: "Você pode começar retirando uma mamada de dia ou noturna por vez, em vez de tentar mudar toda a rotina de uma vez." },
          { step: "2️⃣", title: "Quando o bebê acordar, tente outras formas de acalmar", desc: "Colo, carinho, embalo, cafuné, água ou simplesmente ficar pertinho. 🥹🤍" },
          { step: "3️⃣", title: "Faça uma rotina antes de dormir", desc: "Banho + pijama + ambiente mais tranquilo + carinho. Repetir a rotina ajuda o bebê a entender que chegou a hora de dormir." },
          { step: "4️⃣", title: "Não ofereça o peito automaticamente ao primeiro despertar", desc: "Se ele acordar, espere um pouquinho e tente acalmar de outra forma primeiro." },
          { step: "5️⃣", title: "Seja consistente", desc: "Se decidiu retirar aquela mamada, tente manter a mudança. O bebê pode reclamar nos primeiros dias enquanto se adapta." },
          { step: "6️⃣", title: "Vá no ritmo de vocês", desc: "Se estiver muito difícil, dê mais tempo antes de retirar outra mamada. Desmame não precisa acontecer de um dia para o outro. 🤍" }
        ],
        chapters: [
          { title: "3.1 Desassociar o mamar do adormecer", content: "O maior desafio da noite é que a criança só sabe pegar no sono sugando. O segredo é mamar 20 minutos antes de dormir, com luz suave e ainda acordada. Coloque na cama/berço sonolento, com canções de ninar e cafuné." },
          { title: "3.2 Os despertares da madrugada: O que fazer no pico do choro", content: "Quando a criança acordar de madrugada procurando o peito, não acenda luzes nem converse alto. Mantenha o ambiente no escuro, pegue no colo, ofereça um gole de água num copinho e faça o shhh-shhh rítmico." },
          { title: "3.3 A técnica dos 7 dias para a noite inteira", content: "Em média, são necessárias de 5 a 7 noites consistentes para o cérebro da criança entender o novo padrão. A consistência é fundamental." }
        ]
      },
      {
        id: 4,
        title: "Módulo 4: O 7º Passo Especial - DESMAME NA PARTE DO DIA ☀️👶",
        duration: "16 min de aula",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Vídeo Oficial: O 7º Passo - Como Conduzir o Desmame Diurno com Amor e Praticidade",
        goldenTips: [
          { step: "7️⃣", title: "Desmame na Parte do Dia (Passo 7 Exclusivo)", desc: "Retire uma mamada diurna por vez a cada 3 a 5 dias. Mantenha garrafinha com água e lanchinhos visíveis, mude o sofá ou ambiente de costume e faça combinados claros e cheios de carinho." }
        ],
        chapters: [
          { title: "4.1 Passo a passo do desmame diurno gradual", content: "Comece retirando uma mamada do dia a cada 3 a 5 dias. Inicie pelas mamadas intermediárias e deixe a mamada antes da soneca diurna por último." },
          { title: "4.2 Lidando com a frustração e o apego durante o dia", content: "Substitua o seio por contato olho no olho, abraços apertados, cócegas e massagens. A criança aprende que o colo da mãe continua sendo o lugar mais seguro do mundo." }
        ]
      },
      {
        id: 5,
        title: "Módulo 5: Cuidados Físicos com o Corpo da Mãe 🤱",
        duration: "12 min de aula",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Aula 5: Saúde da Mãe - Prevenção de mastite, alívio e autocuidado emocional",
        chapters: [
          { title: "5.1 Alívio do empedramento e prevenção de mastite", content: "Ao diminuir as mamadas, a mama continuará produzindo leite por alguns dias. Nunca esvazie a mama completamente com bomba. Faça apenas 'ordenha de alívio' manual no chuveiro morno para tirar a pressão." },
          { title: "5.2 O luto da amamentação e o choque hormonal", content: "Com a redução da prolactina e oxitocina, é comum a mulher sentir melancolia e sensação de perda. Dê espaço para os seus sentimentos e celebre a linda jornada que você concluiu." }
        ]
      },
      {
        id: 6,
        title: "Módulo 6: Materiais Práticos, Tabela de 21 Dias e Bônus 🎁",
        duration: "10 min de aula",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Aula 6: Como usar o Calendário dos 21 Dias e Cardápios de Saciedade",
        chapters: [
          { title: "6.1 O Calendário dos 21 Dias do Desmame Suave", content: "Semana 1: Eliminação das mamadas de distração e tédio. Semana 2: Substituição da mamada antes do sono diurno (sonecas). Semana 3: Desmame noturno e celebração da conquista." },
          { title: "6.2 Cardápio Noturno de Saciedade", content: "Sugestões de jantares nutritivos ricos em triptofano (aveia, banana, abacate) que mantêm o bebê saciado por mais horas durante a noite sem desconforto digestivo." }
        ]
      }
    ];
    renderEbookModules(fallbackModules);
  }
}

function getModuleVideoUrl(moduleId, defaultUrl) {
  const custom = localStorage.getItem(`alan_video_mod_${moduleId}`);
  return custom ? custom : defaultUrl;
}

function parseVideoEmbedUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();

  // YouTube watch ou short link
  // Ex: https://www.youtube.com/watch?v=xyz ou https://youtu.be/xyz
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1` };
  }

  // Vimeo
  // Ex: https://vimeo.com/123456789
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[3]}` };
  }

  // Google Drive
  // Ex: https://drive.google.com/file/d/XXXX/view
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return { type: 'iframe', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  // Se já for um iframe embed ou se terminar em mp4
  if (trimmed.endsWith('.mp4') || trimmed.includes('.mp4?')) {
    return { type: 'video', src: trimmed };
  }

  // Default se for URL genérica
  return { type: 'iframe', src: trimmed };
}

function renderEbookModules(modules) {
  const container = document.getElementById('modulesContainer');
  if (!container) return;

  container.innerHTML = modules.map((mod, index) => {
    const currentVideoUrl = getModuleVideoUrl(mod.id, mod.videoUrl);
    const parsed = parseVideoEmbedUrl(currentVideoUrl);

    return `
      <div class="module-accordion-item ${index === 0 ? 'active' : ''}" id="moduleItem${mod.id}">
        <button class="module-accordion-trigger" type="button" onclick="toggleModule(${mod.id})">
          <div class="module-trigger-info">
            <span class="module-title-text">📖 ${mod.title}</span>
            <div class="module-badges-row">
              ${mod.duration ? `<span class="module-time-badge">⏱️ ${mod.duration}</span>` : ''}
              <span class="module-video-badge">▶️ Com Vídeo Aula</span>
            </div>
          </div>
          <span class="module-arrow-icon" id="moduleArrow${mod.id}">${index === 0 ? '▲' : '▼'}</span>
        </button>

        <div class="module-accordion-content" id="moduleContent${mod.id}">
          
          <!-- Seção de Vídeo Deste Módulo -->
          <div class="module-video-block">
            <div class="module-video-header">
              <div>
                <span class="module-video-tag">Vídeo Aula Prática</span>
                <h4 class="module-video-headline">${mod.videoTitle || `Aula Prática: ${mod.title}`}</h4>
              </div>
              <button type="button" class="btn-edit-module-video" onclick="handleEditModuleVideo(${mod.id}, '${mod.title.replace(/'/g, "\\'")}')" title="Configurar link do vídeo">
                ✏️ Alterar Vídeo
              </button>
            </div>

            <div class="module-player-wrapper" id="playerWrapper${mod.id}">
              ${parsed.type === 'video' ? `
                <video controls class="module-html5-video" poster="assets/images/ebook_cover.jpg">
                  <source src="${parsed.src}" type="video/mp4">
                  Seu navegador não suporta a tag de vídeo.
                </video>
              ` : `
                <iframe 
                  class="module-video-iframe" 
                  src="${parsed.src}" 
                  title="${mod.title}" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
                </iframe>
              `}
            </div>
            <div class="video-helper-tip">
              <span>💡 Dica: Aceita links do YouTube (listado ou não-listado), Vimeo, Google Drive ou arquivo .MP4 direto.</span>
            </div>
          </div>

          <!-- Dicas de Ouro Específicas do Módulo (ex: Desmame Noturno 6 passos) -->
          ${mod.goldenTips && mod.goldenTips.length ? `
            <div class="module-golden-tips-box">
              <div class="golden-tips-header">
                <span class="golden-tips-icon">✨</span>
                <div>
                  <h5>Dicas Rápidas de Aplicação Imediata</h5>
                  <p>Salva essas orientações para consultar no dia a dia:</p>
                </div>
              </div>
              <div class="golden-tips-list">
                ${mod.goldenTips.map(tip => `
                  <div class="golden-tip-item">
                    <div class="golden-tip-badge">${tip.step}</div>
                    <div class="golden-tip-body">
                      <strong>${tip.title}</strong>
                      <p>${tip.desc}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Capítulos Escritos do E-book -->
          <div class="module-chapters-area">
            <h5 class="chapters-area-title">Conteúdo Teórico & Aprofundamento Escrito:</h5>
            ${mod.chapters.map(chap => `
              <div class="chapter-block">
                <h6 class="chapter-title">${chap.title}</h6>
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
  updatePriceDisplay();
}

function getCurrentTotal() {
  return appState.hasBump ? (appState.basePrice + appState.bumpPrice) : appState.basePrice;
}

function updatePriceDisplay() {
  const total = getCurrentTotal();
  const formatted = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const displayPrice = document.getElementById('displayPrice');
  if (displayPrice) displayPrice.textContent = formatted;

  const pixModalAmount = document.getElementById('pixModalAmount');
  if (pixModalAmount) pixModalAmount.textContent = formatted;
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
      txId: 'DESMAME' + Math.floor(Math.random() * 89999 + 10000),
      description: appState.hasBump ? 'Desmame Noturno e Diurno' : 'Ebook Desmame Noturno'
    });
  } catch (e) {
    console.error('Erro gerando payload:', e);
    pixPayload = '00020126360014br.gov.bcb.pix0114+5519994744297520400005303986540530.005802BR5912ALAN RONALDO6009SAO PAULO62070503***6304ABCD';
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
  }
});

// Fechar ao clicar fora da caixa do modal (no fundo escuro)
window.addEventListener('click', (e) => {
  const modal = document.getElementById('pixModal');
  if (modal && e.target === modal) {
    handleClosePixModal();
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

  // Fecha o modal PIX
  handleClosePixModal();

  // Esconde a área de compra e exibe o curso desbloqueado
  checkUnlockStatus();

  // Rola a tela com suavidade até o vídeo do curso
  setTimeout(() => {
    const videoSection = document.getElementById('unlockedPortal');
    if (videoSection) {
      videoSection.scrollIntoView({ behavior: 'smooth' });
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
   PLAYER DE VÍDEO INTERATIVO
   ========================================================================== */
function handlePlayVideo() {
  const overlay = document.getElementById('videoOverlay');
  const video = document.getElementById('courseMainVideo');
  if (overlay) overlay.style.display = 'none';
  if (video) {
    video.play().catch(() => {
      // Caso não haja um source de mp4 local atribuído ainda, dá feedback claro
      console.log('Vídeo pronto para receber o arquivo do Alan.');
    });
  }
}

/* ==========================================================================
   PAINEL RÁPIDO DO ALAN
   ========================================================================== */
function toggleViewMode() {
  appState.isPaid = !appState.isPaid;
  localStorage.setItem('desmame_is_paid', String(appState.isPaid));
  checkUnlockStatus();
  alert(`Modo alterado para: ${appState.isPaid ? 'Área da Aluna (Curso Liberado)' : 'Página de Checkout Kiwify'}`);
}

function editPixKeyPrompt() {
  const currentKey = appState.pixKey;
  const newKey = prompt("Digite a sua Chave PIX (E-mail, CPF, Celular ou Aleatória):", currentKey);
  if (newKey && newKey.trim() !== "") {
    appState.pixKey = newKey.trim();
    localStorage.setItem('alan_pix_key', appState.pixKey);
    alert("Chave PIX atualizada para: " + appState.pixKey);
  }
}

function toggleAdminBar() {
  const bar = document.getElementById('alanAdminBar');
  if (bar) {
    bar.classList.toggle('expanded');
  }
}

