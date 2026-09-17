# Diretrizes do Projeto E-Book & Infoproduto

1. **Identidade do Produto & Metodologia**:
   - O nome oficial do produto é **Desmame Noturno** (não utilizar "Desmame Gentil").
   - Links oficiais de produção:
     - **Vendas / Divulgação**: `https://desmame-noturno.vercel.app`
     - **Painel de Testes (Admin)**: `https://desmame-noturno.vercel.app?admin=1`
     - **Reset de Sessão**: `https://desmame-noturno.vercel.app?reset=1`
   - O método principal de desmame noturno é composto estritamente pelos **5 Módulos de Ouro (1️⃣ a 5️⃣)**:
     - 1️⃣ **Escolha por onde começar**: Uma mudança de cada vez (dia ou noite), hábito vs. fome e sem pressa.
     - 2️⃣ **Quando o bebê acordar, tente outras formas de acalmar**: Aconchego e acolhimento (colo, carinho, balançar no peito, cafuné).
     - 3️⃣ **Crie uma rotina antes de dormir 🛁🌙**: Sequência previsível diária (banho + pijama + ambiente tranquilo + som de chuva).
     - 4️⃣ **Não ofereça o peito automaticamente ao primeiro despertar**: Quebra de associação, espera e acolhimento no colo.
     - 5️⃣ **Seja consistente 🤍**: Manutenção da decisão com paciência e gancho direto com botão de desbloqueio para o guia diurno.
   - O **Desmame Durante o Dia ☀️👶** é um **Bônus Especial Adicional** (R$ 9,90 via Order Bump ou modal pós-login), mantido sempre em seção separada.

2. **Seção Separada do Bônus Especial Diurno (Passos Individuais)**:
   - Apresentado em container próprio e separado (`#bonusAccessBox`), nunca misturado na mesma lista dos módulos noturnos.
   - **Aluna sem adicional**: O container exibe card com selo "🔒 Adicional Bloqueado", lista dos 6 passos práticos e botão de upgrade para modal PIX de R$ 9,90.
   - **Aluna com adicional**: Exibe selo VIP ("✨ Bônus VIP Liberado") e **6 módulos individuais separados em acordeões (Passos 01 a 06)**, idênticos ao formato do noturno.

3. **Ocultação de Painel de Testes & Mecanismo de Reset**:
   - As ferramentas do rodapé (`footer-admin-tools`) ficam **ocultas por padrão** para visitantes e clientes.
   - Só devem ser exibidas se a URL contiver `?admin=1`.
   - Inclui as ações de alternância rápida (`toggleViewMode`, `toggleBumpMode`, `editPixKeyPrompt`) e o botão `🔄 Resetar para Novo Visitante` (`resetBuyerSession()`).
   - Acesso via `?reset=1` limpa automaticamente `desmame_is_paid` e `desmame_has_bump`, retornando imediatamente para a tela de vendas.

4. **Invariante de Dados e Fallback (content.json x app.js)**:
   - Os textos oficiais dos módulos residem em `ebook/content.json` (dividido em `modules` para noturno e `bonus_diurno.modules` para diurno).
   - O arquivo `assets/js/app.js` **deve manter o array de fallback rigorosamente sincronizado** para garantir exibição local ou offline.

5. **Formulário de Checkout e Preenchimento**:
   - Campos (Nome, E-mail, WhatsApp) iniciam sempre 100% zerados e limpos, com `autocomplete="off"`.

6. **Exibição Dinâmica de Preços e Pagamento via PIX**:
   - Preço base R$ 30,00 ou R$ 39,90 com adicional de dia (R$ 1,00 durante homologação/testes).
   - **Checkout Direto e Objetivo na Tela (Sem Modais Intermediários)**:
     - O QR Code dinâmico e o botão de "COPIAR CÓDIGO PIX (COPIA E COLA)" devem ser carregados e exibidos diretamente na página (`.direct-checkout-box`), sem exigir abertura de modais ou submissão prévia de formulário.
     - Ao marcar/desmarcar o Order Bump diurno, o valor e a cobrança PIX do Mercado Pago se regeneram automaticamente.
   - **Integração Mercado Pago (API de Orders & Polling)**:
     - `api/create-pix.js`: gera cobrança PIX oficial via `POST /v1/orders` no Mercado Pago com credencial oficial de Produção.
     - `api/check-payment.js`: consulta status da ordem via `GET /v1/orders/{id}`.
     - **UX de Notificação e Liberação Automática**: Ao aprovar o pagamento (polling a cada 2s), o sistema emite sinal sonoro, exibe banner verde "PAGAMENTO CONFIRMADO! ✅ STATUS: PAGO", faz contagem regressiva de 3s e desbloqueia o portal `#unlockedPortal`.
     - **Botão de Contingência Imediata**: Manter sempre o botão `⚡ Já realizei o pagamento (Liberar Agora)` para validação e desbloqueio instantâneo sem atrito.
     - **Integridade do DOM**: O portal `#unlockedPortal` deve ser elemento irmão de primeiro nível, sem modais fantasmas ao redor.
     - **Conteúdo Exclusivo Diurno**: O bônus diurno (`#bonusAccessBox`) possui fluxo próprio de upgrade (R$ 9,90) e acordeões dinâmicos dos Passos 01 a 06 totalmente funcionais.

7. **Publicação, Deploy e Cache-Busting**:
   - Incrementar versão (`?v=X.X`) em `index.html` a cada atualização de CSS ou JS.
   - **REGRA OBRIGATÓRIA**: Sempre que qualquer alteração for realizada em qualquer arquivo do projeto, ela deve ser IMEDIATAMENTE commitada e enviada via `git push origin main` para que a Vercel atualize o site no ar sem intervenção manual do usuário.

8. **Identidade Visual Materna & Feminina Unificada (Checkout + Portal)**:
   - **Paleta Oficial**: Tons *Twilight Rose & Maternal Berry* (`#be185d`, `#9d174d`, `#831843`, `#f43f5e`), fundo acolhedor `#fdf8f9`, bordas rosadas `#fce7f3` e acentos âmbar/pêssego suaves para o bônus diurno (`#fffbeb`, `#fed7aa`, `#f97316`).
   - **Proibição de Cores Desarmônicas**: Não utilizar verdes de conversão genéricos (`#10b981`, `#28b463`) ou gradientes vermelhos/laranjas agressivos no checkout.
   - **Tipografia**: Padronizada com **Plus Jakarta Sans** em toda a aplicação.
   - **Estrutura dos Cards**: Bordas arredondadas (18px a 20px), fundo branco, bordas `1.5px solid #fce7f3` e sombras suaves rosadas.

9. **Cabeçalho de Checkout Limpo**:
   - O cabeçalho de vendas (`site-header-nav`) NÃO deve exibir botão ou card de "Entrar / Login".
   - Deve conter apenas a identidade oficial materna centralizada com avatar 🌸, kicker "MÉTODO EXCLUSIVO" e título "Método Desmame Noturno".

10. **Design dos Módulos da Área de Membros (Clean & Objetivo)**:
   - Manter foco estrito no conteúdo dos 5 passos noturnos e no bônus diurno.
   - Widgets extras (checklist de ritual noturno, card circular de evolução, banner roxo de boas-vindas) foram removidos para evitar poluição visual.
   - Cada módulo possui botão de ação direta de 1-clique (`btn-module-open`) para expandir/recolher o passo com clareza.
   - Badges dos módulos simplificados para `PASSO 01` a `PASSO 05` para perfeita visualização mobile sem quebras de texto.

11. **Garantia de Não-Cache Mobile**:
   - Carregamento de `ebook/content.json` com cache-busting dinâmico (`?v=` + `Date.now()`) e `{ cache: 'no-store' }`.

12. **Restrições de Ferramental**:
   - **JAMAIS utilizar `browser_subagent` ou abrir janelas de navegador**: O usuário realiza todos os testes diretamente no próprio smartphone. Validações externas devem usar `read_url_content` silencioso.

13. **Módulo Desmame Diurno — Sempre Liberado e em Primeiro Lugar**:
   - O módulo **Desmame Durante o Dia ☀️👶** é um módulo **especial desbloqueado universalmente** (`appState.hasBump = true` por padrão).
   - Ele deve aparecer **ACIMA** do módulo Desmame Noturno na área de membros (`#unlockedPortal`), ou seja: Diurno → Noturno (nessa ordem).
   - No `app.js`, a função de renderização dos módulos deve garantir que os passos diurnos (Passos 01–06) sejam renderizados primeiro, seguidos dos 5 passos noturnos (1️⃣–5️⃣).
   - A identidade visual do título deve refletir **"Desmame Diurno e Noturno"** em todos os cabeçalhos (checkout, portal, meta tags, `content.json`).

14. **Áudio Ambiente — Chuva Suave (Web Audio API)**:
   - O som de chuva suave é sintetizado puramente via `AudioContext` (sem arquivos externos) em `assets/js/app.js`.
   - **Parâmetros corretos**: Pink noise (técnica de integração browniana) com filtro passa-banda entre **160 Hz e 2200 Hz** para permitir o "repique" das gotas (não apenas ruído abafado).
   - Adicionar um **segundo oscilador de tremolo** (LFO a ~8 Hz, profundidade ~20%) para criar variação rítmica natural.
   - O volume deve ser perceptível porém suave: `gainNode.gain.value = 0.28` (não abaixar de 0.20 — causará som inaudível).
   - A síntese anterior com `biquadFilter.type = 'lowpass'` em 650 Hz estava "muito fechada" — não regredir para esse modelo.

15. **Pagamento via Cartão de Crédito — Campos Antifraude Obrigatórios**:
   - Em `api/create-card-payment.js`, o payload enviado ao Mercado Pago **deve sempre incluir**:
     - `payer.phone` (área + número, extraído do campo WhatsApp do formulário).
     - `additional_info.items` (array com `id`, `title`, `description`, `quantity`, `unit_price`).
     - `additional_info.payer` com `first_name`, `last_name`, `phone` e `registration_date`.
   - Esses campos reduzem a probabilidade de rejeição `cc_rejected_high_risk` pelo motor antifraude do Mercado Pago.
   - Sempre exibir botão de **fallback imediato para PIX** quando o cartão for recusado (classe `.card-fallback-pix`), sem recarregar a página.

