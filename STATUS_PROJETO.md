# Memória do Projeto: SEURBH Dashboard

Este documento serve como um registro do estado atual do projeto para facilitar a transição de trabalho entre diferentes ambientes (ex: casa e trabalho) via Google Drive.

## 📌 Informações Gerais

- **Projeto:** seurbh-dashboard
- **Caminho Local (Drive):** `h:\Meu Drive\0_PROJETO PREFEITURA DIGITAL\seurbh-dashboard`
- **Stack Tecnológico:** React 19, TypeScript, Vite, Tailwind CSS 4, Lucide React.
- **⚠️ Restrições de Ambiente (MUITO IMPORTANTE):** O usuário trabalha em dois ambientes via Google Drive:
  - **Casa:** Ambiente completo, pode instalar pacotes, rodar servidores de desenvolvimento (Node/Vite) e usar o terminal livremente. Aqui a pasta `dist` é gerada.
  - **Trabalho (Prefeitura):** PC com restrições severas. **NÃO PODE** instalar nada (sem Node, npm, executáveis, etc). O usuário apenas escreve e edita o código pelo Drive.
  - **Solução Atual de Servidor:** O script `serve.ps1` foi configurado para funcionar nos dois ambientes. Na ausência da pasta `dist` (como no serviço), ele serve automaticamente a página estática `index-dev.html` via CDN para testes básicos da API de Drive na porta 8001. Quando a `/dist` existe, ele carrega o painel completo.
  - **Ação para a IA:** Todas as soluções propostas devem ser puramente baseadas em código fonte ou serviços em nuvem gerenciados. Se o painel precisar de atualizações visuais para o serviço, oriente o usuário a realizar um `npm run build` quando estiver no PC de Casa.

## 🏗️ Estrutura Atual e Componentes Principais

### `src/components/`

- **Header.tsx:** Cabeçalho principal da aplicação.
- **Sidebar.tsx:** Menu lateral de navegação (com integração e separação de setores).
- **ProcessTable.tsx:** Tabela para exibição e listagem de processos.
- **NewProcessModal.tsx:** Modal para criação/edição de novos processos.
- **ThemeCustomizer.tsx:** Componente para personalização de tema.
- **UploadZone.tsx:** Área de upload de arquivos (integrada com a lógica de storage).

### `src/pages/`

- **Dashboard.tsx:** Painel principal com métricas e visão geral.
- **ProcessosSEI.tsx:** Interface de integração/exibição de dados do sistema SEI.
- **Equipe.tsx:** Página de gestão da equipe administrativa.
- **Normativas.tsx:** Página para exibição de documentos ou normas.
- **Placeholder.tsx:** Página base/genérica para rotas em construção.

### Trabalhos Recentes e Focos (Baseado no histórico do Antigravity)

1. **Arquitetura de Separação de Setores:** Refatoração do layout principal (`MainLayout`, `Header`, `App.tsx`) para suportar múltiplos setores administrativos (ex: Urbanismo, Saúde, Fazenda), cada um com menus e componentes específicos.
2. **Integração e Armazenamento (MinIO / Supabase):**
   - Configuração de buckets locais/cloud (`processos-prefeitura`).
   - Resolução de labels do menu (Storage / Armazenamento).
   - Implementação de File Uploader e BYOK.
3. **Visualizador DXF:** Implementação e debug para renderização correta de arquivos de geometria/desenhos diretamente no dashboard.
4. **Interface SEI (Sistema Eletrônico de Informações):** Trabalhos de redesenho da interface SEI utilizando um tema mais moderno (variáveis dinâmicas de CSS, tons pastéis) e possivelmente criação de extensões para injetar estes temas.
5. **Google Sheets Integration:**

- `ProcessosContext` pulls/pushes to Google Sheets via `sheetsApi.ts`.
- The script acts as a zero-DB backend that supports creating processes and retrieving data by reading the first row as columns dynamically.
- O script foi aprimorado para **Criar Pastas no Google Drive** automaticamente ao mudar o status de um processo para "Concluído", salvando a URL gerada de volta na planilha. Ele agora suporta IDs de pastas dinâmicos enviados pelo frontend.
- **Configuração Dinâmica (Plug & Play):** Implementado `ConfigContext` para gerenciar URLs do Google Apps Script e IDs do Drive via `localStorage`.
- **Interface de Configuração:** Modal de Drive expandido para permitir vinculação rápida de APIs de Sheets.
- **Recursos Técnicos:** Botão "Copiar Código do Script" adicionado ao modal para facilitar a instalação em novas planilhas pela equipe administrativa.
- **Frontend Process Management:** Integrated context with `/processos-sei` and `/dashboard` tables for live editing/reading. Botão 1-click para concluir e gerar pasta adicionado na tabela.
- **Diretório Corporativo (Equipe):** A página estática `Equipe.tsx` foi redesenhada para suportar a criação de perfis dinâmicos de membros da equipe (mockados em memória), incluindo modal de cadastro com validações visuais e novo design de exibição em grid com menu de ações.

---

_Dica para o Antigravity (IA): Se o usuário solicitar continuar o trabalho, leia este arquivo para recuperar o contexto arquitetural e o que foi feito mais recentemente._

> **⚠️ INSTRUÇÃO CRÍTICA PARA A IA (ANTIGRAVITY):**
> Sempre que você finalizar uma nova tarefa, desenvolver uma nova funcionalidade, corrigir um bug importante ou antes de encerrar uma sessão de trabalho com o usuário, você **DEVE** atualizar este arquivo (`STATUS_PROJETO.md`). Documente resumidamente o que foi feito, as decisões tomadas e o estado atual do projeto para manter a memória sempre sincronizada no Google Drive. Não pergunte se deve atualizar, faça isso de forma proativa.
