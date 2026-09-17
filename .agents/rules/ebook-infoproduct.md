# Diretrizes do Projeto E-Book & Infoproduto

1. **Estrutura de Ensino por Módulo**:
   - Todo módulo da área de alunas deve possuir uma vídeo-aula prática associada (com suporte a YouTube embed/não-listado, Vimeo, Google Drive preview e arquivos .MP4).
   - Permitir alteração rápida do link do vídeo diretamente na interface pelo criador do curso (persistido em LocalStorage e fallback em `content.json`).
   - Cada módulo deve combinar:
     - (a) Vídeo aula em destaque;
     - (b) Dicas rápidas / de ouro de aplicação imediata numeradas com ícones;
     - (c) Texto aprofundado dos capítulos do e-book.

2. **Metodologia de Conteúdo Oficial**:
   - O vídeo principal de desmame noturno é o **"Método Noite de Paz"**, composto estritamente pelos **6 Passos de Ouro (1️⃣ a 6️⃣)**:
     - 1️⃣ Escolha por onde começar
     - 2️⃣ Quando o bebê acordar, tente outras formas de acalmar
     - 3️⃣ Faça uma rotina antes de dormir
     - 4️⃣ Não ofereça o peito automaticamente ao primeiro despertar
     - 5️⃣ Seja consistente
     - 6️⃣ Vá no ritmo de vocês
   - O **Desmame na Parte do Dia ☀️👶** deve ser mantido separadamente como o **7º Passo Especial**, nunca misturado com as regras noturnas.

3. **Fluxo de Conversão e Pagamento**:
   - O checkout segue o padrão de alta conversão Kiwify (contador de urgência regressivo, selos de segurança, chave PIX direta com 1 clique para copiar e QR Code nativo oficial via BR Code com CRC16).
   - O botão flutuante de WhatsApp deve apontar para o número oficial configurado.

4. **Publicação e Deploy (Vercel & Git)**:
   - Configuração de deploy em `vercel.json` mantida para URLs limpas e roteamento estático.
   - Sempre manter todos os arquivos versionados com commits claros e sincronizados com a branch `main` no GitHub.
