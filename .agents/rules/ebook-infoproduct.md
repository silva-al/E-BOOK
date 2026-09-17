# Diretrizes do Projeto E-Book & Infoproduto

1. **Estrutura de Ensino por Módulo**:
   - Todo módulo da área de alunas deve possuir uma vídeo-aula prática associada (com suporte a YouTube embed/não-listado, Vimeo, Google Drive preview e arquivos .MP4).
   - Permitir alteração rápida do link do vídeo diretamente na interface pelo criador do curso (persistido em LocalStorage e fallback em `content.json`).
   - Cada módulo deve combinar:
     - (a) Vídeo aula em destaque;
     - (b) Dicas rápidas / de ouro de aplicação imediata numeradas com ícones (ex: Desmame Noturno e Diurno);
     - (c) Texto aprofundado dos capítulos do e-book.

2. **Fluxo de Conversão e Pagamento**:
   - O checkout segue o padrão de alta conversão Kiwify (contador de urgência regressivo, selos de segurança, chave PIX direta com 1 clique para copiar e QR Code nativo oficial via BR Code com CRC16).
   - O botão flutuante de WhatsApp deve apontar para o número oficial configurado.

3. **Salvamento e Versionamento**:
   - Sempre manter todos os arquivos (`index.html`, `assets/`, `ebook/`, `.agents/`) versionados e com commits claros no Git para garantir que nenhum progresso seja perdido.
