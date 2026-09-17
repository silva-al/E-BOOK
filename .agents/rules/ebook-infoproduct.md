# Diretrizes do Projeto E-Book & Infoproduto

1. **Identidade do Produto & Metodologia**:
   - O nome oficial do produto é **Desmame Noturno** (não utilizar "Desmame Gentil").
   - O método principal de desmame noturno é composto estritamente pelos **5 Módulos de Ouro (1️⃣ a 5️⃣)**:
     - 1️⃣ Escolha por onde começar
     - 2️⃣ Quando o bebê acordar, tente outras formas de acalmar
     - 3️⃣ Crie uma rotina antes de dormir 🛁🌙
     - 4️⃣ Não ofereça o peito automaticamente ao primeiro despertar
     - 5️⃣ Seja consistente 🤍 (com gancho para o bônus diurno)
   - O **Desmame Durante o Dia ☀️👶** é tratado como um módulo complementar independente (opção de Order Bump adicional por + R$ 9,90), nunca misturado com as regras noturnas.
   - **Controle de Acesso ao Conteúdo Adicional (Módulo 7)**:
     - O Módulo 7 é estritamente restrito a alunas que adquiriram o adicional (`desmame_has_bump === 'true'`).
     - **Aluna sem adicional**: O módulo é renderizado bloqueado (`module-bump-locked`) com selo "🔒 Adicional Bloqueado", sem expor o texto no DOM. Ao expandir, exibe o card de oferta de upgrade com botão para abrir o modal PIX de R$ 9,90.
     - **Aluna com adicional**: O módulo exibe o selo VIP ("✨ Bônus VIP Liberado"), banner comemorativo e os capítulos detalhados com as dicas diurnas.
     - **Modal de Upgrade R$ 9,90**: Permite que alunas que não compraram no checkout possam adquirir o bônus a qualquer momento dentro da área de membros.
     - **Painel de Testes**: Manter botões no rodapé para alternar modo Visitante/Aluna (`toggleViewMode`) e Adicional Pago/Bloqueado (`toggleBumpMode`).

2. **Estrutura da Área de Membros (Alunas)**:
   - A área da aluna é 100% focada em leitura e texto (sem players ou dependência de vídeos).
   - O método e cada módulo combinam:
     - (a) O Método Noite de Paz com os 5 Módulos de Ouro práticos com ícones e listas;
     - (b) O Bônus Especial para o Desmame Durante o Dia (Adicional R$ 9,90);
     - (c) Resumos de objetivos claros por módulo;
     - (d) Texto aprofundado dos capítulos do e-book oficial com navegação por acordeão e estimativas de tempo de leitura.

3. **Formulário de Checkout e Preenchimento**:
   - Os campos de formulário (Nome, E-mail, WhatsApp) **devem iniciar sempre 100% zerados e limpos** para o cliente digitar seus próprios dados (sem dados fictícios pré-preenchidos como "Camila Silva Martins").
   - Manter `autocomplete="off"` e garantia via script de reset (`clearFormFields`) no carregamento da página.

4. **Exibição Dinâmica de Preços e Pagamento via PIX**:
   - Os valores devem estar visíveis de forma transparente tanto acima quanto abaixo do bloco de pagamento PIX (no cabeçalho do PIX, no resumo do pedido e no texto do botão de ação).
   - A seleção do adicional de dicas especiais (Order Bump) deve recalcular e atualizar dinamicamente todos os pontos da tela (de R$ 30,00 para R$ 39,90 em tempo real).
   - A tela de checkout deve oferecer opções diretas de pagamento via PIX:
     - (a) **QR Code gerado na hora na tela** com código oficial Copia e Cola atualizado para o valor correspondente;
     - (b) **Chave PIX Direta (Telefone)** com botão de cópia em 1 clique.
   - O fluxo de liberação é **instantâneo na tela** (Opção C: após a confirmação do PIX, a área do curso é liberada diretamente no navegador sem exigência de senha/login, persistida em `localStorage`).

5. **Publicação e Deploy (Vercel & Git)**:
   - Configuração de deploy em `vercel.json` mantida para URLs limpas e roteamento estático.
   - Sempre manter todos os arquivos versionados com commits claros e **imediatamente sincronizados via `git push origin main`** para que as atualizações na Vercel fiquem disponíveis nos testes online do usuário sem esperas.
