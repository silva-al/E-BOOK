# Diretrizes do Projeto E-Book & Infoproduto

1. **Identidade do Produto & Metodologia**:
   - O nome oficial do produto é **Desmame Noturno** (não utilizar "Desmame Gentil").
   - O método principal de desmame noturno é composto estritamente pelos **5 Módulos de Ouro (1️⃣ a 5️⃣)**:
     - 1️⃣ **Escolha por onde começar**: Uma mudança de cada vez (dia ou noite), observando o hábito vs. fome e mantendo sem pressa.
     - 2️⃣ **Quando o bebê acordar, tente outras formas de acalmar**: Formas de aconchego (colo, carinho, balançar no peito, cafuné, ficar pertinho 🥹🤍) e paciência no processo de adormecer.
     - 3️⃣ **Crie uma rotina antes de dormir 🛁🌙**: Sequência previsível diária (banho + pijama + ambiente tranquilo + carinho + som de chuva).
     - 4️⃣ **Não ofereça o peito automaticamente ao primeiro despertar**: Quebra de associação automática, esperar e acolher no colo, oferecendo água ou mamadeira com leite quando necessário.
     - 5️⃣ **Seja consistente 🤍**: Manutenção da decisão com acolhimento e gancho explicativo para o desmame diurno.
   - **Gancho Interativo do Módulo 5**:
     - No final do Módulo 5, o texto convida para o guia completo diurno.
     - Se a aluna não adquiriu o adicional, deve ser exibido um botão direto de desbloqueio (`handleOpenBumpUpgradeModal()`) para o adicional de R$ 9,90.
   - O **Desmame Durante o Dia ☀️👶** é um **Bônus Especial Adicional (Módulo 7)** (Order Bump por + R$ 9,90), nunca misturado na contagem dos módulos noturnos.

2. **Controle de Acesso ao Bônus Especial Diurno (Seção Separada)**:
   - Apresentado em seu próprio container independente (`#bonusAccessBox`), visualmente separado dos 5 Módulos Noturnos.
   - **Aluna sem adicional**: Exibe o card de oferta com selo "🔒 Adicional Bloqueado", resumo dos benefícios dos passos diurnos e botão para abrir o modal PIX de R$ 9,90.
   - **Aluna com adicional**: Exibe o selo VIP ("✨ Bônus VIP Liberado"), banner e todos os passos diurnos **separados em módulos/acordeões individuais (Passos 01 a 06)**, idênticos à experiência do noturno.
   - **Modal de Upgrade R$ 9,90**: Permite comprar o bônus tanto no checkout quanto após o login na área de membros.
   - **Painel de Testes no Rodapé**: Manter botões de alternância rápida (`toggleViewMode`, `toggleBumpMode` e edição de chave PIX), visíveis exclusivamente com `?admin=1`.

3. **Invariante de Dados e Fallback (content.json x app.js)**:
   - Os textos oficiais dos módulos residem em `ebook/content.json`.
   - O array `fallbackModules` em `assets/js/app.js` **deve ser mantido rigorosamente sincronizado** com `content.json` para suportar visualização local em navegadores que bloqueiem `fetch` local.

4. **Formulário de Checkout e Preenchimento**:
   - Os campos (Nome, E-mail, WhatsApp) **devem iniciar sempre 100% zerados e limpos**, com `autocomplete="off"` e reset forçado no carregamento.

5. **Exibição Dinâmica de Preços e Pagamento via PIX**:
   - Valores transparentes em múltiplos pontos (R$ 30,00 base ou R$ 39,90 com order bump).
   - QR Code oficial em canvas e Chave PIX direta com cópia em 1 clique.
   - Liberação instantânea na tela após confirmação do PIX (persistida em `localStorage`).

6. **Publicação, Deploy e Cache-Busting**:
   - Sempre incrementar a versão de cache (`?v=X.X`) em `index.html` ao alterar CSS ou JS.
   - Sempre sincronizar via `git push origin main` para deploy automático imediato na Vercel.
