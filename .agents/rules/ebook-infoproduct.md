# Diretrizes do Projeto E-Book & Infoproduto

1. **Identidade do Produto & Metodologia**:
   - O nome oficial do produto é **Desmame Noturno** (não utilizar "Desmame Gentil").
   - O vídeo principal de desmame noturno é o **"Método Noite de Paz"**, composto estritamente pelos **6 Passos de Ouro (1️⃣ a 6️⃣)**:
     - 1️⃣ Escolha por onde começar
     - 2️⃣ Quando o bebê acordar, tente outras formas de acalmar
     - 3️⃣ Faça uma rotina antes de dormir
     - 4️⃣ Não ofereça o peito automaticamente ao primeiro despertar
     - 5️⃣ Seja consistente
     - 6️⃣ Vá no ritmo de vocês
   - O **Desmame Durante o Dia ☀️👶** é tratado como um módulo/passo complementar independente (**7º Passo Especial** e opção de Order Bump adicional por + R$ 9,90), nunca misturado com as regras noturnas.

2. **Estrutura da Área de Membros (Alunas)**:
   - Todo módulo da área de alunas deve possuir uma vídeo-aula prática associada (com suporte a YouTube embed/não-listado, Vimeo, Google Drive preview e arquivos .MP4).
   - Permitir alteração rápida do link do vídeo diretamente na interface pelo criador do curso (persistido em LocalStorage e fallback em `content.json`).
   - Cada módulo combina:
     - (a) Vídeo aula em destaque;
     - (b) Dicas rápidas / de ouro de aplicação imediata numeradas com ícones;
     - (c) Texto aprofundado dos capítulos do e-book.

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
