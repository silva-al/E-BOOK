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
   - Preço base R$ 30,00 ou R$ 39,90 com adicional de dia.
   - QR Code em canvas e chave PIX direta com cópia em 1 clique.
   - Liberação instantânea na tela após confirmação do PIX.

7. **Publicação, Deploy e Cache-Busting**:
   - Incrementar versão (`?v=X.X`) em `index.html` a cada atualização de CSS ou JS.
   - Sempre sincronizar via `git push origin main` para deploy automático imediato na Vercel.
