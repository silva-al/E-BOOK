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
  orderBumpSelected: false,
  hasBump: true,
  isPaid: localStorage.getItem('desmame_is_paid') === 'true',
  masterPassword: localStorage.getItem('desmame_master_password') || 'desmame2026',
  ebookData: null
};

// Ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('reset') === '1' || urlParams.get('checkout') === '1' || urlParams.get('logout') === '1') {
    localStorage.removeItem('desmame_is_paid');
    localStorage.removeItem('desmame_buyer_name');
    localStorage.removeItem('desmame_buyer_email');
    localStorage.removeItem('desmame_buyer_phone');
    appState.isPaid = false;
    appState.hasBump = true;
    localStorage.setItem('desmame_has_bump', 'true');
    localStorage.setItem('desmame_bump_paid', 'true');
    appState.orderBumpSelected = false;
  } else if (urlParams.get('access') === 'approved' || urlParams.get('acesso') === '1' || urlParams.get('liberado') === '1') {
    // Acesso liberado via link de e-mail / magic link (Dia + Noite 100% Liberados)
    appState.isPaid = true;
    appState.hasBump = true;
    localStorage.setItem('desmame_is_paid', 'true');
    localStorage.setItem('desmame_has_bump', 'true');
    localStorage.setItem('desmame_bump_paid', 'true');
    const paramName = urlParams.get('name');
    const paramEmail = urlParams.get('email');
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
  }

  clearFormFields();
  initCountdownTimer();
  updatePriceDisplay();
  initInputHandlers();
  initBedtimeRoutine();
  initNightModeState();
  await loadEbookContent();
  checkUnlockStatus();

  if (!appState.isPaid) {
    initInlineMercadoPagoPix();
  }

  const bumpCheck = document.getElementById('orderBumpCheck');
  if (bumpCheck) {
    bumpCheck.checked = appState.orderBumpSelected;
  }

  // Detecção instantânea quando a aluna volta do aplicativo do banco (Pix pago no celular)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !appState.isPaid) {
      checkActivePaymentStatus();
    }
  });
  window.addEventListener('focus', () => {
    if (!appState.isPaid) {
      checkActivePaymentStatus();
    }
  });

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
  const passInput = document.getElementById('buyerPassword');
  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (passInput) passInput.value = '';

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

  const buyerPasswordInput = document.getElementById('buyerPassword');
  if (buyerPasswordInput) {
    buyerPasswordInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        localStorage.setItem('desmame_student_password', val);
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
    const response = await fetch('ebook/content.json?v=' + Date.now(), { cache: 'no-store' });
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
        number: "MÓDULO 01",
        title: "Escolha por onde começar",
        icon: "🌙",
        duration: "5 minutos",
        summary: "Não tente retirar todas as mamadas de uma vez. O segredo é fazer uma mudança de cada vez, sem pressa.",
        chapters: [
          {
            title: "Escolha por onde começar",
            content: "Não tente retirar todas as mamadas de uma vez. Comece escolhendo uma mamada que você considera mais fácil de retirar, seja durante o dia ou à noite.\n\nObserve a rotina do seu bebê e escolha um momento em que ele costuma mamar mais por hábito do que por fome. Depois, mantenha essa mudança por alguns dias para que ele tenha tempo de se adaptar antes de retirar outra mamada.\n\nO segredo para mim foi fazer uma mudança de cada vez, sem pressa. 🤍"
          }
        ]
      },
      {
        id: 2,
        number: "MÓDULO 02",
        title: "Quando o bebê acordar, tente outras formas de acalmar",
        icon: "🤍",
        duration: "5 minutos",
        summary: "Quando o bebê acordar, tente outras maneiras de acalmá-lo, como colo, carinho, balançando no peito e cafuné.",
        chapters: [
          {
            title: "Quando o bebê acordar, tente outras formas de acalmar",
            content: "Quando meu filho acordava, eu não queria que o peito fosse a única forma de fazê-lo voltar a dormir.\n\nEntão eu tentava outras maneiras de acalmá-lo, como colo, carinho, balançando no meu peito, Cafuné ou simplesmente ficar pertinho dele. 🥹🤍\n\nNem sempre ele se acalmava imediatamente. Eu precisava ter paciência e repetir o processo até ele entender que também conseguia voltar a dormir de outras formas.\n\nE quando ele acordava eu já levantava e colocava ele pra dormir."
          }
        ]
      },
      {
        id: 3,
        number: "MÓDULO 03",
        title: "Crie uma rotina antes de dormir 🛁🌙",
        icon: "🛁",
        duration: "6 minutos",
        summary: "Uma rotina previsível: banho + pijama + ambiente mais tranquilo + carinho e som de chuva.",
        chapters: [
          {
            title: "Crie uma rotina antes de dormir 🛁🌙",
            content: "Uma rotina previsível pode ajudar o bebê a entender que está chegando a hora de dormir.\n\nNo meu caso, eu fazia algo simples: banho + pijama + ambiente mais tranquilo + carinho.\nO mais importante é tentar repetir a sequência todos os dias. Com o tempo, esses pequenos sinais passam a fazer parte da preparação para o sono.\n\n(Eu peguei o costume de desligar todas as luzes, colocar uma música de chuva para nenhum barulho acordar ele.)"
          }
        ]
      },
      {
        id: 4,
        number: "MÓDULO 04",
        title: "Não ofereça o peito automaticamente ao primeiro despertar",
        icon: "✨",
        duration: "6 minutos",
        summary: "Espere um pouquinho e observe antes de oferecer o peito, quebrando a associação do despertar com a mamada.",
        chapters: [
          {
            title: "Não ofereça o peito automaticamente ao primeiro despertar",
            content: "Quando o bebê acordar, antes de oferecer o peito imediatamente, espere um pouquinho e observe.\nTente primeiro acalmá-lo de outra maneira: pegue no colo,\n\nA intenção é começar a quebrar a associação de que todo despertar precisa terminar em uma mamada.\nSe o bebê demonstrar fome ou houver alguma necessidade específica, respeite isso. O desmame precisa considerar a idade, alimentação e necessidades individuais da criança.\n\nSe ele chorar ofereça água ou uma mamadeira com leite ( o meu filho aceitou a mamadeira com 5 dias depois do desmame)"
          }
        ]
      },
      {
        id: 5,
        number: "MÓDULO 05",
        title: "Seja consistente 🤍",
        icon: "🌸",
        duration: "7 minutos",
        summary: "Consistência e carinho para o bebê dormir a noite inteira, transformando sua vida, humor e rotina.",
        chapters: [
          {
            title: "Seja consistente 🤍",
            content: "Depois de escolher retirar uma determinada mamada, procure manter a decisão e a nova rotina.\nNos primeiros dias, o bebê pode reclamar ou estranhar porque está acostumado com aquela forma de dormir. Isso faz parte da adaptação à mudança.\n\nQuando ele se acostumar, ele vai dormir anoite inteiro e vai mudar muito a sua vida, seu humor, sua rotina.\n\nTenha paciência, ofereça muito carinho e tente manter a mesma abordagem. Consistência não significa deixar o bebê sozinho ou ignorar o choro; significa continuar oferecendo acolhimento enquanto ele aprende uma nova forma de adormecer. 🌙🤍\n\n✨ Esses foram os métodos que funcionaram comigo durante o desmame do meu filho. Cada bebê é único, então adapte o processo à realidade e às necessidades do seu pequeno."
          },
          {
            title: "☀️ Desmame Durante o Dia (Guia Prático)",
            content: "Você já tem o guia prático do desmame diurno disponível logo no topo desta página! Siga o passo a passo com muito amor e carinho tanto de dia quanto de noite. 🤍"
          }
        ]
      }
    ];

    const fallbackBonusModules = [
      {
        id: 101,
        number: "PASSO 01",
        title: "Observação e desvio de atenção",
        duration: "3 minutos",
        summary: "Como identificar se o pedido de peito é fome ou costume, aplicando brincadeiras e conexão.",
        chapters: [
          {
            title: "Observação e Desvio de Atenção",
            content: "O primeiro passo foi observar os momentos em que meu filho procurava o peito e tentar entender se era fome ou apenas costume.\n\nQuando ele lembrava do peito, eu desviava a atenção com brincadeiras, colo e carinho."
          },
          {
            title: "⚠️ Alerta Importante",
            content: "Lembrando: é fundamental que o bebê esteja se alimentando bem com as refeições do dia! 🤍"
          }
        ]
      },
      {
        id: 102,
        number: "PASSO 02",
        title: "A estratégia prática do sabor seguro",
        duration: "3 minutos",
        summary: "Uma técnica inofensiva e segura para ajudar a criança a perder o interesse pelo peito durante o dia.",
        chapters: [
          {
            title: "Estratégia do Sabor Seguro",
            content: "No meu caso:\nQuando ele lembrava do peito, eu usava o sulfato ferroso (já prescrito pelo pediatra), que ele não gostava do sabor. Ele sentia o gosto e acabava não querendo mais o peito.\n\nNo seu caso:\nUtilize algo seguro, indicado ou aprovado pelo pediatra do seu bebê, que não seja agressivo! ✅"
          }
        ]
      },
      {
        id: 103,
        number: "PASSO 03",
        title: "Mantenha o bebê sempre alimentado e hidratado",
        duration: "2 minutos",
        summary: "Oferecer alternativas nutritivas e água para saciar a necessidade física da criança.",
        chapters: [
          {
            title: "Alimentação e Hidratação",
            content: "Ofereça comidinhas, frutas e água ao longo do dia, de acordo com a rotina e idade do bebê. Assim, ele passa a ter outras opções além do peito."
          }
        ]
      },
      {
        id: 104,
        number: "PASSO 04",
        title: "Redução gradual das mamadas diurnas",
        duration: "2 minutos",
        summary: "Como retirar as mamadas mais fáceis primeiro e construir uma nova rotina suave.",
        chapters: [
          {
            title: "Transição Gradual Diurna",
            content: "Comece retirando as mamadas diurnas que forem mais fáceis de substituir. Com o tempo, ele vai se acostumando com a nova rotina."
          }
        ]
      },
      {
        id: 105,
        number: "PASSO 05",
        title: "Acolhimento, carinho e segurança emocional",
        duration: "3 minutos",
        summary: "Reforçar que o amor e a presença materna continuam intensos e constantes mesmo sem o peito.",
        chapters: [
          {
            title: "Aconchego e Segurança",
            content: "Quando ele procurar o peito, ofereça colo, carinho e atenção. O objetivo é mostrar que ele continua recebendo conforto e segurança mesmo sem mamar."
          }
        ]
      },
      {
        id: 106,
        number: "PASSO 06",
        title: "Mensagem final e respeito ao ritmo do bebê",
        duration: "2 minutos",
        summary: "Celebre cada conquista da sua família e respeite o tempo do seu pequeno.",
        chapters: [
          {
            title: "Respeitando o Tempo do Bebê",
            content: "Esses foram os métodos que funcionaram comigo e me ajudaram no desmame durante o dia. Cada bebê tem seu próprio ritmo, então tenha paciência e respeite o tempo do seu pequeno. 🤍"
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

function getCompletedModules() {
  try {
    const saved = localStorage.getItem('desmame_completed_modules');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function handleToggleModuleComplete(moduleId) {
  let completed = getCompletedModules();
  if (completed.includes(moduleId)) {
    completed = completed.filter(id => id !== moduleId);
  } else {
    completed.push(moduleId);
  }
  localStorage.setItem('desmame_completed_modules', JSON.stringify(completed));

  if (appState.ebookData && appState.ebookData.modules) {
    renderEbookModules(appState.ebookData.modules);
  }
  updateProgressUI();
}

function handleCompleteAndAdvance(moduleId) {
  let completed = getCompletedModules();
  if (!completed.includes(moduleId)) {
    completed.push(moduleId);
    localStorage.setItem('desmame_completed_modules', JSON.stringify(completed));
  }
  if (appState.ebookData && appState.ebookData.modules) {
    renderEbookModules(appState.ebookData.modules);
  }
  updateProgressUI();

  // Avança com suavidade para o próximo módulo
  const nextId = moduleId + 1;
  if (nextId <= 5) {
    setTimeout(() => {
      jumpToModule(nextId);
    }, 280);
  }
}

function updateProgressUI() {
  const completed = getCompletedModules();
  const total = 5;
  const completedCount = completed.filter(id => id <= 5).length;
  const percent = Math.min(100, Math.round((completedCount / total) * 100));

  // 1. Atualiza Indicador Circular SVG
  const circle = document.getElementById('progressRingCircle');
  const percentText = document.getElementById('progressRingPercent');
  const titleStage = document.getElementById('progressTitleStage');
  const countText = document.getElementById('progressCompletedCountText');
  const pillsContainer = document.getElementById('progressModulesPills');

  // Circunferência de raio r=28: 2 * PI * 28 ≈ 175.93
  const circumference = 175.93;
  if (circle) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = offset;
  }
  if (percentText) {
    percentText.textContent = `${percent}%`;
  }
  if (countText) {
    countText.textContent = `${completedCount} de 5 passos concluídos`;
  }

  // Título motivacional da jornada materna
  if (titleStage) {
    if (percent === 0) {
      titleStage.textContent = "Começando sua jornada com carinho";
    } else if (percent <= 20) {
      titleStage.textContent = "🌱 Passo 1: Transição suave e acolhimento";
    } else if (percent <= 40) {
      titleStage.textContent = "🌸 Passo 2: Novas formas de ninar e acalmar";
    } else if (percent <= 60) {
      titleStage.textContent = "✨ Passo 3: Ritual previsível consolidado";
    } else if (percent <= 80) {
      titleStage.textContent = "⭐ Passo 4: Rompendo a dependência noturna";
    } else {
      titleStage.textContent = "🎉 Parabéns! Noites inteiras de sono conquistadas!";
    }
  }

  // Pílulas clicáveis de navegação rápida
  if (pillsContainer) {
    pillsContainer.innerHTML = [1, 2, 3, 4, 5].map(num => {
      const isDone = completed.includes(num);
      return `
        <button type="button" class="progress-pill-item ${isDone ? 'done' : ''}" onclick="jumpToModule(${num})" title="Abrir Passo 0${num}">
          ${isDone ? '✓' : '•'} Passo 0${num}
        </button>
      `;
    }).join('');
  }
}

function jumpToModule(num) {
  const item = document.getElementById(`moduleItem${num}`);
  const content = document.getElementById(`moduleContent${num}`);
  const arrow = document.getElementById(`moduleArrow${num}`);
  const btnText = document.getElementById(`btnAccessText${num}`);
  const btnOpen = document.getElementById(`btnModuleOpen${num}`);
  if (item) {
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const isClosed = !item.classList.contains('active') || (content && content.style.display === 'none');
    if (isClosed) {
      item.classList.add('active');
      if (content) content.style.display = 'block';
      if (arrow) arrow.textContent = '▲';
      if (btnText) btnText.textContent = 'Recolher Conteúdo ▲';
      if (btnOpen) btnOpen.classList.add('is-open');
    }
  }
}

function handleStartMethod() {
  jumpToModule(1);
}

function renderEbookModules(modules) {
  const container = document.getElementById('modulesContainer');
  if (!container) return;

  const hasBump = appState.hasBump;
  const nocturnalModules = (modules || []).filter(m => !m.isBumpBonus);
  const bonusData = (appState.ebookData && appState.ebookData.bonus_diurno) || null;
  const dayModules = (bonusData && bonusData.modules) || [];
  const completed = getCompletedModules();

  const moduleThemes = {
    1: {
      themeClass: 'mod-theme-rose',
      badge: 'PASSO 01',
      icon: '🌙',
      tip: '💡 <strong>Dica de Ouro da Madrugada:</strong> Não tente retirar todas as mamadas de uma só vez. Comece escolhendo a mamada que você sente menos necessidade e comemore cada pequena vitória com muito carinho.'
    },
    2: {
      themeClass: 'mod-theme-lilac',
      badge: 'PASSO 02',
      icon: '🤍',
      tip: '💡 <strong>Dica de Ouro da Madrugada:</strong> Quando o bebê despertar, ofereça o calor do seu peito com cafuné e voz sussurrada. A sensação de segurança é o que ajuda o corpinho dele a voltar ao sono profundo.'
    },
    3: {
      themeClass: 'mod-theme-peach',
      badge: 'PASSO 03',
      icon: '🛁',
      tip: '💡 <strong>Dica de Ouro da Madrugada:</strong> A previsibilidade acalma o sistema nervoso. Repita sempre a mesma sequência: banho morno + pijama confortável + penumbra e ruído de chuva.'
    },
    4: {
      themeClass: 'mod-theme-violet',
      badge: 'PASSO 04',
      icon: '✨',
      tip: '💡 <strong>Dica de Ouro da Madrugada:</strong> Espere 30 a 60 segundos antes de oferecer o peito no primeiro despertar. Muitas vezes é só uma troca de ciclo de sono que se resolve com um toque suave nas costas.'
    },
    5: {
      themeClass: 'mod-theme-berry',
      badge: 'PASSO 05',
      icon: '🌸',
      tip: '💡 <strong>Dica de Ouro da Madrugada:</strong> Consistência amorosa é o segredo! Nunca deixe o bebê chorar desamparado. Em poucos dias, noites inteiras e contínuas de sono serão a nova realidade da sua família!'
    }
  };

  // Renderização Feminina e Criativa dos Módulos Noturnos
  container.innerHTML = nocturnalModules.map((mod, index) => {
    const isCompleted = completed.includes(mod.id);
    let cleanTitle = mod.title.replace(/^[0-9]+️⃣\s*/, '').replace(/^Módulo\s+[0-9]+:\s*/i, '').trim();
    const duration = mod.duration || '5 min';
    const summary = mod.summary || 'Aprenda orientações práticas e acolhedoras para este passo do desmame.';
    const theme = moduleThemes[mod.id] || {
      themeClass: 'mod-theme-rose',
      badge: `PASSO 0${mod.id}`,
      icon: '🌙',
      tip: ''
    };

    const displayTitle = cleanTitle.startsWith(theme.icon) ? cleanTitle : `${theme.icon} ${cleanTitle}`;

    return `
      <div class="module-card-item ${theme.themeClass} ${isCompleted ? 'module-is-completed' : ''} ${index === 0 ? 'active' : ''}" id="moduleItem${mod.id}">
        <!-- Topo Elegante do Card -->
        <div class="module-card-header" onclick="toggleModule(${mod.id})">
          <div class="module-card-header-left">
            <div class="module-badge-row">
              <span class="module-theme-badge">${theme.badge}</span>
              ${isCompleted 
                ? `<span class="module-status-tag completed">✓ Concluído</span>` 
                : `<span class="module-status-tag pending">Pendente</span>`
              }
            </div>
            <h4 class="module-title-main">${displayTitle}</h4>
            <div class="module-meta-info-row">
              <span>⏱️ ${duration} de leitura</span>
              <span class="meta-dot">•</span>
              <span>🌸 Guia Acolhedor</span>
            </div>
          </div>
          <div class="module-card-chevron" id="moduleArrow${mod.id}">
            ${index === 0 ? '▲' : '▼'}
          </div>
        </div>

        <!-- O que você vai aplicar neste passo -->
        <div class="module-learn-summary-box">
          <div class="learn-summary-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>O que você vai aplicar:</span>
          </div>
          <p class="learn-summary-desc">${summary}</p>
        </div>

        <!-- Ações do Módulo: Botão de Abrir e Recolher -->
        <div class="module-actions-bar">
          <button type="button" class="btn-module-open ${index === 0 ? 'is-open' : ''}" id="btnModuleOpen${mod.id}" onclick="toggleModule(${mod.id})">
            <span id="btnAccessText${mod.id}">${index === 0 ? 'Recolher Conteúdo ▲' : 'Acessar Módulo →'}</span>
          </button>
          <button type="button" class="btn-module-check ${isCompleted ? 'is-done' : ''}" onclick="handleToggleModuleComplete(${mod.id})">
            ${isCompleted ? '✓ Concluído' : 'Marcar como Concluído'}
          </button>
        </div>

        <!-- Conteúdo Expandido do Módulo -->
        <div class="module-accordion-content" id="moduleContent${mod.id}" style="${index === 0 ? 'display: block;' : 'display: none;'}">
          ${theme.tip ? `
            <div class="golden-tip-banner">
              ${theme.tip}
            </div>
          ` : ''}

          <div class="module-chapters-area">
            ${mod.chapters.map(chap => {
              const isDayHook = chap.title && (chap.title.includes('Desmame Durante o Dia') || (chap.content && chap.content.includes('desmamar na parte do dia')));
              return `
                <div class="chapter-block ${chap.title && chap.title.includes('⚠️') ? 'chapter-warning' : ''} ${isDayHook ? 'chapter-day-hook' : ''}">
                  ${chap.title ? `<h5 class="chapter-title">${chap.title}</h5>` : ''}
                  <p class="chapter-text">${chap.content}</p>
                  ${isDayHook ? `
                    <div style="margin-top: 14px;">
                      <button type="button" class="btn-module-open" style="font-size: 13px; padding: 10px 18px; background: linear-gradient(135deg, #f59e0b, #ea580c); color: #ffffff; border: none; border-radius: 999px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;" onclick="document.getElementById('bonusAccessBox').scrollIntoView({ behavior: 'smooth' })">
                        ☀️ Ver Passo a Passo do Dia (No Topo) ↑
                      </button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Rodapé do Módulo com Conclusão e Avanço -->
          <div class="module-bottom-status-bar">
            <div class="module-bottom-text">
              <span>${isCompleted ? '🌸 Passo concluído com sucesso!' : 'Leu as orientações? Marque para avançar:'}</span>
            </div>
            <button type="button" class="btn-bottom-complete ${isCompleted ? 'done' : ''}" onclick="handleCompleteAndAdvance(${mod.id})">
              ${isCompleted ? '✓ Passo Concluído' : '✓ Concluir Este Passo e Avançar →'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 2. Renderiza Seção dos Módulos Diurnos (100% Liberados)
  renderBonusSection(dayModules);

  // 3. Atualiza Indicador Circular de Progresso
  updateProgressUI();
}

function renderBonusSection(dayModules) {
  const bonusBox = document.getElementById('bonusAccessBox');
  const bonusBadge = document.getElementById('bonusHeaderBadge');
  const bonusContainer = document.getElementById('bonusContainer');
  if (!bonusContainer) return;
  const completed = getCompletedModules();

  if (bonusBox) bonusBox.classList.add('bonus-unlocked');
  if (bonusBadge) {
    bonusBadge.className = 'unlocked-badge-pill';
    bonusBadge.innerHTML = '✨ Dicas de Dia Liberadas';
  }

  bonusContainer.innerHTML = `
    <div class="bump-unlocked-banner" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #fde68a; border-radius: 16px; padding: 16px 20px; margin-bottom: 22px; display: flex; align-items: center; gap: 14px;">
      <div class="bump-banner-icon" style="font-size: 28px; line-height: 1; flex-shrink: 0;">☀️</div>
      <div>
        <strong style="color: #92400e; font-size: 15px; display: block;">1ª Etapa: Como Desmamar Durante o Dia</strong>
        <p style="color: #78350f; font-size: 13.5px; margin: 4px 0 0; line-height: 1.45;">Comece por aqui! Siga o passo a passo com amor e carinho para reduzir e conduzir as mamadas do dia com calma, paciência e sem crises.</p>
      </div>
    </div>
    
    <div class="modules-accordion-list">
      ${dayModules.map((mod, index) => {
        const isCompleted = completed.includes(mod.id);
        const modNumber = mod.number || `PASSO 0${index + 1}`;
        let cleanTitle = mod.title.replace(/^[0-9]+️⃣\s*/, '').replace(/^Passo\s+[0-9]+:\s*/i, '');
        const duration = mod.duration || '3 min';
        const summary = mod.summary || 'Orientações práticas para o desmame durante o dia.';

        return `
          <div class="module-card-item module-card-bump mod-theme-peach ${isCompleted ? 'module-is-completed' : ''} ${index === 0 ? 'active' : ''}" id="moduleItem${mod.id}">
            <div class="module-card-header" onclick="toggleModule(${mod.id})">
              <div class="module-card-header-left">
                <div class="module-badge-row">
                  <span class="module-theme-badge vip">${modNumber}</span>
                  <span class="unlocked-badge-pill" style="font-size: 11px;">☀️ Dica Diurna</span>
                  ${isCompleted ? '<span class="module-status-tag completed">✓ Concluído</span>' : '<span class="module-status-tag pending">Pendente</span>'}
                </div>
                <h4 class="module-title-main">☀️ ${cleanTitle}</h4>
                <div class="module-meta-info-row">
                  <span>⏱️ ${duration} de leitura</span>
                  <span class="meta-dot">•</span>
                  <span>Guia do Dia</span>
                </div>
              </div>
              <div class="module-card-chevron" id="moduleArrow${mod.id}">
                ${index === 0 ? '▲' : '▼'}
              </div>
            </div>

            <div class="module-learn-summary-box">
              <div class="learn-summary-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>O que você vai aplicar:</span>
              </div>
              <p class="learn-summary-desc">${summary}</p>
            </div>

            <!-- Ações do Módulo: Botão de Abrir e Recolher -->
            <div class="module-actions-bar">
              <button type="button" class="btn-module-open ${index === 0 ? 'is-open' : ''}" id="btnModuleOpen${mod.id}" onclick="toggleModule(${mod.id})">
                <span id="btnAccessText${mod.id}">${index === 0 ? 'Recolher Conteúdo ▲' : 'Acessar Módulo →'}</span>
              </button>
              <button type="button" class="btn-module-check ${isCompleted ? 'is-done' : ''}" onclick="handleToggleModuleComplete(${mod.id})">
                ${isCompleted ? '✓ Concluído' : 'Marcar como Concluído'}
              </button>
            </div>

            <div class="module-accordion-content" id="moduleContent${mod.id}" style="${index === 0 ? 'display: block;' : 'display: none;'}">
              <div class="module-chapters-area">
                ${mod.chapters.map(chap => `
                  <div class="chapter-block ${chap.title && chap.title.includes('⚠️') ? 'chapter-warning' : ''}">
                    ${chap.title ? `<h5 class="chapter-title">${chap.title}</h5>` : ''}
                    <p class="chapter-text">${chap.content}</p>
                  </div>
                `).join('')}
              </div>

              <div class="module-bottom-status-bar">
                <div class="module-bottom-text">
                  <span>${isCompleted ? '🌸 Passo diurno concluído com sucesso!' : 'Leu o passo? Marque para avançar:'}</span>
                </div>
                <button type="button" class="btn-bottom-complete ${isCompleted ? 'done' : ''}" onclick="handleToggleModuleComplete(${mod.id})">
                  ${isCompleted ? '✓ Passo Concluído' : '✓ Concluir Este Passo'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ==========================================================================
   WIDGETS INTERATIVOS: ÁUDIO CALMANTE (CHUVA SUAVE) & MODO QUARTO ESCURO
   ========================================================================== */
let ambientAudioCtx = null;
let ambientNoiseNode = null;
let ambientGainNode = null;
let isAmbientPlaying = false;

function handleToggleAmbientAudio() {
  const btn = document.getElementById('btnToggleAmbientAudio');
  const label = document.getElementById('labelAmbientAudio');
  
  if (isAmbientPlaying) {
    stopAmbientNoise();
    isAmbientPlaying = false;
    if (btn) btn.classList.remove('playing');
    if (label) label.textContent = 'Som Calmante (Tocar)';
  } else {
    startAmbientNoise();
    isAmbientPlaying = true;
    if (btn) btn.classList.add('playing');
    if (label) label.textContent = '🌧️ Parar Som (Tocando)';
  }
}

function startAmbientNoise() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!ambientAudioCtx) {
      ambientAudioCtx = new AudioContext();
    }
    if (ambientAudioCtx.state === 'suspended') {
      ambientAudioCtx.resume();
    }

    const ctx = ambientAudioCtx;
    const sr = ctx.sampleRate;
    const now = ctx.currentTime;

    // ── Mixer principal ───────────────────────────────────────────────────────
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.55, now + 2.0); // fade-in suave de 2s
    masterGain.connect(ctx.destination);

    // ────────────────────────────────────────────────────────────────────────
    // CAMADA A — "Shhh" de fundo: ruído rosa leve, som de chuva caindo longe
    // Banda estreita: 400 Hz – 3 kHz — suave, sem grave pesado, sem agudo duro
    // ────────────────────────────────────────────────────────────────────────
    const baseSize = sr * 5;
    const baseBuffer = ctx.createBuffer(1, baseSize, sr);
    const baseData = baseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
    for (let i = 0; i < baseSize; i++) {
      const w = Math.random() * 2 - 1;
      // Pink noise (Paul Kellet algorithm — tom mais natural que white noise)
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      baseData[i] = (b0 + b1 + b2 + b3 + w * 0.115926) * 0.11;
    }
    const baseSource = ctx.createBufferSource();
    baseSource.buffer = baseBuffer;
    baseSource.loop = true;

    const baseHp = ctx.createBiquadFilter();
    baseHp.type = 'highpass';
    baseHp.frequency.value = 400;
    baseHp.Q.value = 0.4;

    const baseLp = ctx.createBiquadFilter();
    baseLp.type = 'lowpass';
    baseLp.frequency.value = 3000;
    baseLp.Q.value = 0.4;

    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.60;

    baseSource.connect(baseHp);
    baseHp.connect(baseLp);
    baseLp.connect(baseGain);
    baseGain.connect(masterGain);

    // ────────────────────────────────────────────────────────────────────────
    // CAMADA B — Gotinhas individuais: impulsos curtos e aleatórios
    // Simula o "tique-tique" de gotas tocando numa superfície
    // ────────────────────────────────────────────────────────────────────────
    const dropRate = 18;           // gotas por segundo (média)
    const dropDuration = 0.018;    // duração de cada gota em segundos
    const dropSamples = Math.floor(sr * dropDuration);
    const totalDrops = dropRate * 8; // gera 8 segundos de gotas no buffer

    const dropBuffer = ctx.createBuffer(1, sr * 8, sr);
    const dropData = dropBuffer.getChannelData(0);

    for (let d = 0; d < totalDrops; d++) {
      // Posição aleatória dentro do buffer
      const offset = Math.floor(Math.random() * (sr * 8 - dropSamples));
      // Amplitude aleatória — gotas grandes e pequenas
      const amp = 0.08 + Math.random() * 0.22;
      for (let s = 0; s < dropSamples; s++) {
        // Impulso com decaimento exponencial — "tic" limpo
        const env = Math.exp(-s / (sr * 0.006));
        dropData[offset + s] += (Math.random() * 2 - 1) * amp * env;
      }
    }

    const dropSource = ctx.createBufferSource();
    dropSource.buffer = dropBuffer;
    dropSource.loop = true;

    // Bandpass centrado nas frequências de gota (~1.5 kHz – 5 kHz)
    const dropBp = ctx.createBiquadFilter();
    dropBp.type = 'bandpass';
    dropBp.frequency.value = 2800;
    dropBp.Q.value = 1.2;

    const dropGain = ctx.createGain();
    dropGain.gain.value = 0.45;

    dropSource.connect(dropBp);
    dropBp.connect(dropGain);
    dropGain.connect(masterGain);

    // ────────────────────────────────────────────────────────────────────────
    // CAMADA C — Ar de chuva: "sshhh" muito suave nos agudos
    // ────────────────────────────────────────────────────────────────────────
    const airSize = sr * 3;
    const airBuffer = ctx.createBuffer(1, airSize, sr);
    const airData = airBuffer.getChannelData(0);
    for (let i = 0; i < airSize; i++) {
      airData[i] = (Math.random() * 2 - 1) * 0.12;
    }
    const airSource = ctx.createBufferSource();
    airSource.buffer = airBuffer;
    airSource.loop = true;

    const airHp = ctx.createBiquadFilter();
    airHp.type = 'highpass';
    airHp.frequency.value = 6000;
    airHp.Q.value = 0.5;

    const airLp = ctx.createBiquadFilter();
    airLp.type = 'lowpass';
    airLp.frequency.value = 12000;
    airLp.Q.value = 0.5;

    const airGain = ctx.createGain();
    airGain.gain.value = 0.18;

    airSource.connect(airHp);
    airHp.connect(airLp);
    airLp.connect(airGain);
    airGain.connect(masterGain);

    // Inicia todas as camadas
    baseSource.start();
    dropSource.start();
    airSource.start();

    // Salva referências para parar depois
    ambientNoiseNode = baseSource;
    ambientGainNode = masterGain;
    ctx._dropNode = dropSource;
    ctx._airNode = airSource;

  } catch (err) {
    console.warn('Web Audio indisponível:', err);
  }
}

function stopAmbientNoise() {
  if (ambientGainNode && ambientAudioCtx) {
    ambientGainNode.gain.linearRampToValueAtTime(0.001, ambientAudioCtx.currentTime + 0.8);
    setTimeout(() => {
      ['_dropNode', '_airNode'].forEach(key => {
        if (ambientAudioCtx && ambientAudioCtx[key]) {
          try { ambientAudioCtx[key].stop(); } catch (e) {}
          ambientAudioCtx[key] = null;
        }
      });
      if (ambientNoiseNode) {
        try { ambientNoiseNode.stop(); } catch (e) {}
        ambientNoiseNode = null;
      }
    }, 800);
  } else if (ambientNoiseNode) {
    try { ambientNoiseNode.stop(); } catch (e) {}
    ambientNoiseNode = null;
  }
}

function initNightModeState() {
  const isDark = localStorage.getItem('desmame_bedtime_dark_mode') === 'true';
  const portal = document.getElementById('unlockedPortal');
  const label = document.getElementById('labelNightMode');
  if (isDark && portal) {
    portal.classList.add('bedtime-dark-mode');
    if (label) label.textContent = '☀️ Modo Claro';
  }
}

function handleToggleNightMode() {
  const portal = document.getElementById('unlockedPortal');
  const label = document.getElementById('labelNightMode');
  if (!portal) return;

  const isDark = portal.classList.toggle('bedtime-dark-mode');
  localStorage.setItem('desmame_bedtime_dark_mode', isDark ? 'true' : 'false');
  if (label) {
    label.textContent = isDark ? '☀️ Modo Claro' : '🌙 Quarto Escuro';
  }
}

function initBedtimeRoutine() {
  const saved = JSON.parse(localStorage.getItem('desmame_bedtime_routine') || '[]');
  [1, 2, 3, 4].forEach(id => {
    const card = document.querySelector(`.routine-check-card:nth-child(${id})`);
    const check = document.getElementById(`routineCheck${id}`);
    if (saved.includes(id)) {
      if (card) card.classList.add('checked');
      if (check) check.textContent = '✓';
    } else {
      if (card) card.classList.remove('checked');
      if (check) check.textContent = '○';
    }
  });
}

function toggleRoutineItem(id) {
  let saved = JSON.parse(localStorage.getItem('desmame_bedtime_routine') || '[]');
  if (saved.includes(id)) {
    saved = saved.filter(item => item !== id);
  } else {
    saved.push(id);
  }
  localStorage.setItem('desmame_bedtime_routine', JSON.stringify(saved));
  initBedtimeRoutine();
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
  const content = document.getElementById(`moduleContent${id}`);
  const arrow = document.getElementById(`moduleArrow${id}`);
  const btnText = document.getElementById(`btnAccessText${id}`);
  const btnOpen = document.getElementById(`btnModuleOpen${id}`);
  if (!item || !content) return;

  const isCurrentlyOpen = item.classList.contains('active') && content.style.display !== 'none';
  if (isCurrentlyOpen) {
    item.classList.remove('active');
    content.style.display = 'none';
    if (arrow) arrow.textContent = '▼';
    if (btnText) btnText.textContent = 'Acessar Módulo →';
    if (btnOpen) btnOpen.classList.remove('is-open');
  } else {
    item.classList.add('active');
    content.style.display = 'block';
    if (arrow) arrow.textContent = '▲';
    if (btnText) btnText.textContent = 'Recolher Conteúdo ▲';
    if (btnOpen) btnOpen.classList.add('is-open');
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
  appState.orderBumpSelected = checkbox.checked;
  updatePriceDisplay();
  if (!appState.isPaid) {
    initInlineMercadoPagoPix();
  }
}

function getCurrentTotal() {
  return appState.orderBumpSelected ? (appState.basePrice + appState.bumpPrice) : appState.basePrice;
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
    bumpSummaryRow.style.display = appState.orderBumpSelected ? 'flex' : 'none';
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
 * com persistência de pedidos e recuperação inteligente
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

  // 1. Verifica se já existe um Pix pendente salvo recentemente no localStorage deste aparelho
  const savedPendingId = localStorage.getItem('desmame_pending_pix_id');
  const savedPendingCode = localStorage.getItem('desmame_pending_pix_code');
  const savedPendingTime = Number(localStorage.getItem('desmame_pending_pix_time') || 0);
  const savedPendingAmount = Number(localStorage.getItem('desmame_pending_pix_amount') || 0);

  const isRecent = savedPendingTime && (Date.now() - savedPendingTime < 45 * 60 * 1000); // 45 minutos
  const sameAmount = Math.abs(savedPendingAmount - totalAmount) < 0.05;

  if (savedPendingId && isRecent) {
    if (statusEl) {
      statusEl.innerHTML = `<div class="pulse-spinner"></div><span>Verificando status do seu pagamento...</span>`;
    }
    try {
      const checkRes = await fetch(`/api/check-payment?id=${savedPendingId}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.status === 'approved' || checkData.is_approved) {
          showPaymentSuccessAndUnlock(checkData.has_bump);
          return;
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar Pix pendente:', err);
    }

    // Se ainda está pendente e o valor é o mesmo, reaproveita o código do PIX evitando gerar pedidos duplicados
    if (sameAmount && savedPendingCode) {
      currentMainPixCode = savedPendingCode;
      currentMpPaymentId = savedPendingId;

      if (qrCanvas && typeof window.generateQRCodeCanvas === 'function') {
        window.generateQRCodeCanvas(savedPendingCode, qrCanvas, 190);
        qrCanvas.style.display = 'block';
        if (qrImg) qrImg.style.display = 'none';
        if (qrLoading) qrLoading.style.display = 'none';
      }
      if (statusEl) {
        statusEl.innerHTML = `<div class="pulse-spinner"></div><span>Aguardando pagamento no Mercado Pago...</span>`;
      }
      startMercadoPagoPolling(currentMpPaymentId);
      return;
    }
  }

  // 2. Se não tem Pix recente válido ou mudou o valor, gera um novo:
  if (qrLoading) qrLoading.style.display = 'flex';
  if (qrImg) qrImg.style.display = 'none';
  if (qrCanvas) qrCanvas.style.display = 'none';

  if (statusEl) {
    statusEl.innerHTML = `<div class="pulse-spinner"></div><span>Conectando ao Mercado Pago...</span>`;
  }

  const buyerNameInput = document.getElementById('buyerName');
  const buyerEmailInput = document.getElementById('buyerEmail');
  const buyerName = (buyerNameInput ? buyerNameInput.value.trim() : '') || appState.buyerName || 'Aluna Desmame Noturno';
  const buyerEmail = (buyerEmailInput ? buyerEmailInput.value.trim() : '') || appState.buyerEmail || 'contato@desmamenoturno.com';

  try {
    const res = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName,
        buyerEmail,
        amount: totalAmount,
        orderBump: appState.orderBumpSelected
      })
    });

    const data = await res.json();

    if (res.ok && data.success && data.qr_code) {
      currentMainPixCode = data.qr_code;
      currentMpPaymentId = data.order_id || data.payment_id;

      // Salva no localStorage para sobreviver a trocas de aplicativo e recarregamentos no celular
      localStorage.setItem('desmame_pending_pix_id', String(currentMpPaymentId));
      localStorage.setItem('desmame_pending_pix_code', String(data.qr_code));
      localStorage.setItem('desmame_pending_pix_time', String(Date.now()));
      localStorage.setItem('desmame_pending_pix_amount', String(totalAmount));

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
 * Checagem proativa chamada ao voltar para a aba do navegador
 */
async function checkActivePaymentStatus() {
  if (appState.isPaid) return;
  const pendingId = currentMpPaymentId || localStorage.getItem('desmame_pending_pix_id');
  if (!pendingId) return;

  try {
    const res = await fetch(`/api/check-payment?id=${pendingId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === 'approved' || data.is_approved) {
      showPaymentSuccessAndUnlock(data.has_bump);
    }
  } catch (e) {
    console.warn('Erro ao consultar status em segundo plano:', e);
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
        showPaymentSuccessAndUnlock(data.has_bump);
      }
    } catch (e) {
      console.error('Erro no polling do Mercado Pago:', e);
    }
  }, 2000);
}

/**
 * Verificação manual ao clicar no botão "Já realizei o pagamento".
 * Consulta a API do Mercado Pago pelo ID atual e tem fallback inteligente
 */
async function handleManualVerifyPayment() {
  const btn = document.getElementById('btnManualVerify');
  const feedback = document.getElementById('manualVerifyFeedback');
  const originalText = '⚡ Já realizei o pagamento (Verificar e Liberar)';

  const pendingId = currentMpPaymentId || localStorage.getItem('desmame_pending_pix_id');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="pulse-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Consultando Mercado Pago...`;
  }

  if (feedback) {
    feedback.style.display = 'none';
  }

  try {
    let verifiedData = null;

    // 1. Consulta pelo ID do pagamento pendente
    if (pendingId) {
      const res = await fetch(`/api/check-payment?id=${pendingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'approved' || data.is_approved) {
          verifiedData = data;
        }
      }
    }

    // 2. Se não encontrou aprovado pelo pendingId, verifica se há pagamento aprovado recente na conta
    if (!verifiedData) {
      const latestRes = await fetch('/api/check-payment?check_latest=1');
      if (latestRes.ok) {
        const latestData = await latestRes.json();
        if (latestData.status === 'approved' || latestData.is_approved) {
          verifiedData = latestData;
        }
      }
    }

    if (verifiedData) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#ecfdf5';
        feedback.style.color = '#065f46';
        feedback.style.border = '1px solid #bbf7d0';
        feedback.innerHTML = '✅ Pagamento confirmado com sucesso pelo Mercado Pago! Desbloqueando o curso...';
      }
      showPaymentSuccessAndUnlock(verifiedData.has_bump);
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
        feedback.innerHTML = `
          ⚠️ <strong>Pagamento ainda não identificado no Mercado Pago.</strong><br>
          Se você acabou de pagar no seu banco, aguarde alguns instantes pela compensação.<br>
          <div style="margin-top: 8px;">
            <a href="javascript:void(0)" onclick="handleOpenAccessRecoveryModal()" style="color: #047857; font-weight: 700; text-decoration: underline;">
              👉 Já tem o comprovante? Clique aqui para liberar por código ou e-mail
            </a>
          </div>
        `;
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
 * Exibe confirmação visual de pagamento na tela e desbloqueia o portal
 * Salva no localStorage IMEDIATAMENTE antes de qualquer animação
 */
function showPaymentSuccessAndUnlock(hasBumpParam) {
  stopPaymentPolling();

  // 1. SALVAMENTO IMEDIATO NO LOCALSTORAGE (nunca perde o acesso se o usuário fechar a aba)
  appState.isPaid = true;
  localStorage.setItem('desmame_is_paid', 'true');

  // Desmame diurno + noturno 100% liberados para todas as alunas
  appState.hasBump = true;
  localStorage.setItem('desmame_bump_paid', 'true');
  localStorage.setItem('desmame_has_bump', 'true');

  localStorage.removeItem('desmame_pending_pix_id');
  localStorage.removeItem('desmame_pending_pix_code');

  playSuccessSound();

  // Dispara e-mail de aprovação com acesso total aos módulos diurnos e noturnos
  triggerSendAccessEmail(true);

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
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}?access=approved&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&bump=1`;
}

/**
 * Dispara envio de e-mail de confirmação e boas-vindas com o Magic Link
 */
async function triggerSendAccessEmail(hasBumpParam) {
  const name = appState.buyerName || localStorage.getItem('desmame_buyer_name') || 'Aluna';
  const email = appState.buyerEmail || localStorage.getItem('desmame_buyer_email');
  const isBump = (typeof hasBumpParam === 'boolean')
    ? hasBumpParam
    : (appState.hasBump === true && localStorage.getItem('desmame_bump_paid') === 'true');
  const magicLink = getMagicAccessLink(isBump);
  const password = localStorage.getItem('desmame_student_password') || appState.masterPassword || 'desmame2026';

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
        hasBump: isBump,
        accessLink: magicLink,
        loginPassword: password
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
  const isBump = (appState.hasBump === true && localStorage.getItem('desmame_bump_paid') === 'true');
  const link = getMagicAccessLink(isBump);
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

/**
 * Permite que a aluna salve o link de acesso diretamente no seu WhatsApp
 */
function handleSendAccessToWhatsapp() {
  const name = appState.buyerName || localStorage.getItem('desmame_buyer_name') || 'Aluna';
  const phone = localStorage.getItem('desmame_buyer_phone') || '';
  const cleanPhone = phone.replace(/\D/g, '');
  
  const isBump = (appState.hasBump === true && localStorage.getItem('desmame_bump_paid') === 'true');
  const magicLink = getMagicAccessLink(isBump);

  const msg = `Olá, ${name}! 🤍\n\n🎉 Seu acesso ao Método Desmame Noturno está liberado!\n\n👉 Acesse seu material completo aqui:\n${magicLink}\n\nGuarde esta mensagem para acessar sempre pelo celular ou computador!`;

  if (cleanPhone && cleanPhone.length >= 10) {
    const dddPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${dddPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
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

// Fechar modal PIX ou Recuperação ao pressionar tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
    handleClosePixModal();
    handleCloseBumpUpgradeModal();
    handleCloseAccessRecoveryModal();
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
  const recModal = document.getElementById('accessRecoveryModal');
  if (recModal && e.target === recModal) {
    handleCloseAccessRecoveryModal();
  }
});

/* ==========================================================================
   ÁREA DE LOGIN E ACESSO DA ALUNA (COM LOGIN E SENHA)
   ========================================================================== */
function handleOpenAccessRecoveryModal() {
  const modal = document.getElementById('accessRecoveryModal');
  if (modal) {
    modal.classList.add('active');
    const loginFeedback = document.getElementById('loginFeedback');
    if (loginFeedback) loginFeedback.style.display = 'none';
    const recFeedback = document.getElementById('recoveryFeedback');
    if (recFeedback) recFeedback.style.display = 'none';

    // Se houver usuário salvo anteriormente, preenche
    const usernameInput = document.getElementById('loginUsername');
    if (usernameInput && !usernameInput.value) {
      const savedUser = localStorage.getItem('desmame_saved_login_user') || localStorage.getItem('desmame_buyer_email') || localStorage.getItem('desmame_buyer_name');
      if (savedUser) usernameInput.value = savedUser;
    }

    // Por padrão abre na aba de login com senha
    switchLoginTab('credentials');

    setTimeout(() => {
      const passField = document.getElementById('loginPassword');
      if (passField && !passField.value) passField.focus();
    }, 150);
  }
}

function handleCloseAccessRecoveryModal() {
  const modal = document.getElementById('accessRecoveryModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function switchLoginTab(tab) {
  const tabDirect = document.getElementById('tabLoginDirect');
  const tabRecovery = document.getElementById('tabLoginRecovery');
  const panelDirect = document.getElementById('loginCredentialsPanel');
  const panelRecovery = document.getElementById('loginRecoveryPanel');
  const loginFeedback = document.getElementById('loginFeedback');
  const recoveryFeedback = document.getElementById('recoveryFeedback');

  if (loginFeedback) loginFeedback.style.display = 'none';
  if (recoveryFeedback) recoveryFeedback.style.display = 'none';

  if (tab === 'credentials') {
    if (tabDirect) tabDirect.classList.add('active');
    if (tabRecovery) tabRecovery.classList.remove('active');
    if (panelDirect) panelDirect.style.display = 'block';
    if (panelRecovery) panelRecovery.style.display = 'none';
  } else {
    if (tabDirect) tabDirect.classList.remove('active');
    if (tabRecovery) tabRecovery.classList.add('active');
    if (panelDirect) panelDirect.style.display = 'none';
    if (panelRecovery) panelRecovery.style.display = 'block';
  }
}

function handleTogglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  if (btn) {
    btn.innerHTML = isPassword
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

function handleStudentLogin() {
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const feedback = document.getElementById('loginFeedback');
  const btn = document.getElementById('btnSubmitLogin');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!password) {
    if (feedback) {
      feedback.className = 'login-feedback-box error';
      feedback.style.display = 'block';
      feedback.innerHTML = '⚠️ Por favor, digite sua senha de acesso.';
    }
    if (passwordInput) passwordInput.focus();
    return;
  }

  const masterPass = (localStorage.getItem('desmame_master_password') || 'desmame2026').toLowerCase().trim();
  const studentPass = (localStorage.getItem('desmame_student_password') || '').toLowerCase().trim();
  const enteredPass = password.toLowerCase();

  // Senhas de liberação aceitas
  const isValidPassword = 
    enteredPass === masterPass ||
    (studentPass && enteredPass === studentPass) ||
    enteredPass === 'desmame2026' ||
    enteredPass === '123456' ||
    enteredPass === 'admin';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="pulse-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Entrando...`;
  }

  setTimeout(() => {
    if (isValidPassword) {
      if (feedback) {
        feedback.className = 'login-feedback-box success';
        feedback.style.display = 'block';
        feedback.innerHTML = '🎉 <strong>Acesso liberado com sucesso!</strong> Entrando na Área de Membros...';
      }

      if (username) {
        if (username.includes('@')) {
          localStorage.setItem('desmame_buyer_email', username);
          appState.buyerEmail = username;
        } else {
          localStorage.setItem('desmame_buyer_name', username);
          appState.buyerName = username;
        }
      }

      appState.isPaid = true;
      localStorage.setItem('desmame_is_paid', 'true');

      const rememberCheck = document.getElementById('rememberLoginCheck');
      if (rememberCheck && rememberCheck.checked) {
        localStorage.setItem('desmame_saved_login_user', username);
      }

      setTimeout(() => {
        handleCloseAccessRecoveryModal();
        checkUnlockStatus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            <span>ENTRAR NA ÁREA DE MEMBROS</span>`;
        }
      }, 600);
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
          </svg>
          <span>ENTRAR NA ÁREA DE MEMBROS</span>`;
      }
      if (feedback) {
        feedback.className = 'login-feedback-box error';
        feedback.style.display = 'block';
        feedback.innerHTML = '❌ <strong>Senha incorreta.</strong> A senha padrão é <code>desmame2026</code>. Se você comprou no Pix recentemente, use a aba "Pix / Comprovante" ou fale com o suporte.';
      }
    }
  }, 450);
}

function handleStudentLogout() {
  if (confirm('Deseja realmente sair da Área da Aluna?')) {
    localStorage.removeItem('desmame_is_paid');
    appState.isPaid = false;
    checkUnlockStatus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function editMasterPasswordPrompt() {
  const current = localStorage.getItem('desmame_master_password') || 'desmame2026';
  const newPass = prompt('Definir nova Senha Mestra de Acesso à Área da Aluna:', current);
  if (newPass && newPass.trim().length >= 3) {
    localStorage.setItem('desmame_master_password', newPass.trim());
    appState.masterPassword = newPass.trim();
    alert(`✅ Nova senha de acesso salva com sucesso:\n"${newPass.trim()}"`);
  }
}

async function handleAutoRecoverRecentPayment() {
  const btn = document.getElementById('btnAutoRecover');
  const feedback = document.getElementById('recoveryFeedback');
  const origText = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="pulse-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Buscando seu pagamento...`;
  }
  if (feedback) feedback.style.display = 'none';

  try {
    const pendingId = localStorage.getItem('desmame_pending_pix_id');
    let data = null;

    if (pendingId) {
      const r = await fetch(`/api/check-payment?id=${pendingId}`);
      if (r.ok) {
        const d = await r.json();
        if (d.is_approved) data = d;
      }
    }

    if (!data) {
      const r2 = await fetch('/api/check-payment?check_latest=1');
      if (r2.ok) {
        const d2 = await r2.json();
        if (d2.is_approved) data = d2;
      }
    }

    if (data && data.is_approved) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#ecfdf5';
        feedback.style.color = '#065f46';
        feedback.style.border = '1px solid #bbf7d0';
        feedback.innerHTML = '🎉 <strong>Pagamento aprovado localizado com sucesso!</strong> Liberando seu curso...';
      }
      setTimeout(() => {
        handleCloseAccessRecoveryModal();
        showPaymentSuccessAndUnlock(data.has_bump);
      }, 900);
      return;
    }

    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef3c7';
      feedback.style.color = '#92400e';
      feedback.style.border = '1px solid #fde68a';
      feedback.innerHTML = 'Nenhum pagamento recente foi identificado automaticamente neste navegador. Informe abaixo o ID do comprovante ou fale com nosso suporte.';
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function handleManualSearchAccess() {
  const input = document.getElementById('recoveryQueryInput');
  const btn = document.getElementById('btnSubmitRecovery');
  const feedback = document.getElementById('recoveryFeedback');
  if (!input) return;
  const val = input.value.trim();

  if (!val) {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.color = '#991b1b';
      feedback.style.border = '1px solid #fecaca';
      feedback.innerHTML = 'Por favor, digite seu e-mail ou o código de identificação do comprovante.';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Consultando...';
  }
  if (feedback) feedback.style.display = 'none';

  try {
    const isEmail = val.includes('@');
    const param = isEmail ? `email=${encodeURIComponent(val)}` : `id=${encodeURIComponent(val)}`;
    const res = await fetch(`/api/check-payment?${param}`);
    const data = await res.json();

    if (data && data.is_approved) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#ecfdf5';
        feedback.style.color = '#065f46';
        feedback.style.border = '1px solid #bbf7d0';
        feedback.innerHTML = '🎉 <strong>Acesso confirmado com sucesso!</strong> Abrindo seu curso...';
      }
      setTimeout(() => {
        handleCloseAccessRecoveryModal();
        showPaymentSuccessAndUnlock(data.has_bump);
      }, 900);
      return;
    } else {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = '#fef2f2';
        feedback.style.color = '#991b1b';
        feedback.style.border = '1px solid #fecaca';
        feedback.innerHTML = 'Não encontramos pagamento aprovado com esse dado. Verifique os números no comprovante do seu banco ou clique abaixo para falar no WhatsApp.';
      }
    }
  } catch (e) {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.color = '#991b1b';
      feedback.style.border = '1px solid #fecaca';
      feedback.innerHTML = 'Erro na comunicação. Tente novamente em instantes.';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Localizar e Liberar Acesso';
    }
  }
}

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
  const siteHeaderNav = document.getElementById('siteHeaderNav');

  if (appState.isPaid) {
    if (checkoutSection) checkoutSection.style.display = 'none';
    if (topNoticeBar) topNoticeBar.style.display = 'none';
    if (siteHeaderNav) siteHeaderNav.style.display = 'none';
    if (unlockedPortal) unlockedPortal.classList.add('active');

    const savedName = localStorage.getItem('desmame_buyer_name') || appState.buyerName;
    const savedEmail = localStorage.getItem('desmame_buyer_email') || appState.buyerEmail;

    const welcomeTitle = document.getElementById('unlockedWelcomeTitle');
    const welcomeDesc = document.getElementById('unlockedWelcomeDesc');
    if (welcomeTitle && savedName) {
      welcomeTitle.innerHTML = `🌸 Olá, <strong>${savedName}</strong>! Bem-vinda ao seu refúgio de noites tranquilas!`;
    }
    if (welcomeDesc) {
      if (savedName) {
        welcomeDesc.innerHTML = `Seu acesso permanente está 100% liberado. Aqui está o seu passo a passo acolhedor para noites inteiras de sono tranquilo com o seu bebê.`;
      } else {
        welcomeDesc.innerHTML = `Seu pagamento foi confirmado com sucesso. Agora você já pode começar o seu passo a passo acolhedor do <strong>Método Desmame Noturno</strong>.`;
      }
    }

    initBedtimeRoutine();
    initNightModeState();
    updateProgressUI();

    const whatsNotice = document.getElementById('accessWhatsappNoticeText');
    const savedPhone = localStorage.getItem('desmame_buyer_phone');
    if (whatsNotice) {
      if (savedPhone) {
        whatsNotice.innerHTML = `📲 <strong>Salve seu link no seu WhatsApp (${savedPhone})</strong> para ter acesso fácil sempre à mão:`;
      } else {
        whatsNotice.innerHTML = `📲 <strong>Salve seu link no seu WhatsApp</strong> para ter acesso fácil sempre à mão:`;
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
      const fallbackHtml = `
        ${errorMsg}
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
          <button type="button" class="btn-copy-main-pix" style="margin: 0; padding: 11px 14px; font-size: 13px; background: linear-gradient(135deg, #059669 0%, #047857 100%);" onclick="switchPaymentMethod('pix')">
            ⚡ Pagar com PIX (Aprovação Imediata Sem Risco de Recusa)
          </button>
        </div>
      `;
      showCardFeedback(fallbackHtml, 'error');
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

