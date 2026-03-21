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
2. **Integração e Armazenamento (MinIO / Supabase / Drive):**
   - **NOVO:** Integrado Supabase Auth para gerenciar Autenticação de Usuários, Permissões baseadas em Cargos (Role-Based Access Control) e Perfis. Criação do `AuthContext` e `LoginPage`.
   - Setup das tabelas `profiles` e `atividades` via script `setup_supabase.sql`.
   - **Estratégia Híbrida:** O banco de informações em massa de `Processos`, `Normativas` e uploads de arquivos continuam usando a infraestrutura Zero-DB via Google Sheets/Google Drive, enquanto apenas a camada de Segurança da Interface consome o Supabase (`supabaseApi.ts`).
3. **Visualizador DXF:** Implementação e debug para renderização correta de arquivos de geometria/desenhos diretamente no dashboard.
4. **Google Sheets Integration:**
   - O script `GOOGLE_SHEETS_SCRIPT.js` atua como backend serverless para gerenciar Processos. Possui função de Criar Pastas automaticamente ao mudar o status para "Concluído".
   - `ConfigContext` gerencia URLs e IDs dinamicamente. Modal de Drive permite vinculação rápida (Plug&Play).
5. **Diretório Corporativo (Equipe):** Inicialmente estático/mockado, o `EquipeContext` foi redesenhado para suportar integração futura com o Supabase quando as informações dos servidores precisarem ser recuperadas dinamicamente.

---

_Dica para o Antigravity (IA): Se o usuário solicitar continuar o trabalho, leia este arquivo para recuperar o contexto arquitetural e o que foi feito mais recentemente._

> **⚠️ INSTRUÇÃO CRÍTICA PARA A IA (ANTIGRAVITY):**
> Sempre que você finalizar uma nova tarefa, desenvolver uma nova funcionalidade, corrigir um bug importante ou antes de encerrar uma sessão de trabalho com o usuário, você **DEVE** atualizar este arquivo (`STATUS_PROJETO.md`). Documente resumidamente o que foi feito, as decisões tomadas e o estado atual do projeto para manter a memória sempre sincronizada no Google Drive. Não pergunte se deve atualizar, faça isso de forma proativa.
