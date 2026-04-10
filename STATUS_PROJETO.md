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
6. **[2026-04-09] Wizard de Novo Loteamento — `DynamicProcessForm.tsx` redesenhado:**
   - **O quê:** Reformulação completa da interface de cadastro de novo processo de parcelamento (loteamentos, desmembramentos, remembramentos, desdobros).
   - **Como ficou:** Wizard de 3 etapas: (1) Seleção visual por cards clicáveis com ícone + descrição, (2) Formulário dinâmico por categoria com validação inline, tooltips de ajuda e feedback visual por campo, (3) Tela de confirmação/resumo antes de salvar.
   - **Técnico:** Node.js LTS instalado no notebook via `winget`. Build executado com `npm install + npx tsc -b + npx vite build`. Servidor `serve.ps1` atualizado automaticamente.

7. **[2026-04-10] Implementação da Página de Informações Gerais:**
   - **O quê:** Criação de uma central de comando e avisos para a equipe.
   - **Detalhes:** Interface moderna com Hero Section (gradiente), Mural de Avisos (cards com tipos de alerta), Acesso Rápido a sistemas externos (SEI, GeoMaringá) e base de conhecimento.
   - **Técnico:** Componente funcional `Informacoes.tsx`, integrado às rotas no `App.tsx` e estilizado com Tailwind 4 e Lucide Icons.

8. **[2026-04-10] Chat Interno da Equipe — `ChatWidget.tsx` implementado:**
   - **O quê:** Sistema de mensagens em tempo real para servidores da SEURBH.
   - **Funcionalidades:** Canal Geral, Chat Privado 1-a-1, Grupos personalizados, Notificação sonora (Web Audio API) com toggle de ativação/desativação, confirmação de leitura (✓ enviado / ✓✓ visualizado), autocorretor em Português-BR nativo.
   - **Técnico:** Widget flutuante integrado ao layout principal (`App.tsx`), API em `chatApi.ts` usando Supabase Realtime (WebSocket). Script SQL de setup em `setup_chat_supabase.sql`.

9. **[2026-04-10] Sistema Funcional — Google Drive + Sheets v2.0:**
   - **Apps Script Reescrito (`GOOGLE_SHEETS_SCRIPT.js` v2.0):** Backend completo com ações: `init_infra`, `fetch_processos`, `save_process`, `fetch_normativas`, `save_normativa`, `fetch_equipe`, `save_membro`, `fetch_dados_cidade`, `save_dado_cidade`, `fetch_modelos`, `list_drive_folder`, `create_process_folder`. Cria automaticamente abas e subpastas no Drive na inicialização.
   - **sheetsApi.ts Reescrito:** Tipagem forte, todas as funções necessárias, suporte a ping, e função `initInfrastructure` com 3 parâmetros (apiUrl, sheetUrl, driveFolderId).
   - **Nova Página `Modelos.tsx`:** Biblioteca de pranchas, documentos e templates. Tabas por tipo, integração com Drive e Sheets, modo grid/lista.
   - **Nova Página `DadosCidade.tsx`:** Indicadores municipais por categoria (Urbanismo, Habitação, Ambiental, Social, Infraestrutura). Formulário inline para adicionar novos indicadores. Dados demo exibidos enquanto Sheets não está configurado.
   - **Contextos atualizados:** `ProcessosContext` e `NormativasContext` com flag `isMock`, recarregamento automático e feedback de erros.
   - **Chave Supabase:** Arquivo `.env` com credenciais reais criado no notebook. Build com chaves integradas gerado com sucesso.
   - **Porta:** Servidor local rodando na **porta 8002** (8001 bloqueada pelo sistema do Windows).

## 📋 Pendências e Próximos Passos

1. **[ALTA — MANUAL] Implantar Apps Script v2.0:** O usuário precisa:
   - Abrir a planilha Google Sheets (dentro da pasta-mãe do Drive)
   - Extensões → Apps Script → Colar o conteúdo do `GOOGLE_SHEETS_SCRIPT.js`
   - Implantar como Web App → copiar a URL
   - Colar a URL no sistema: Configurações → Apps Script URL
   - Clicar em "Inicializar" para criar abas e subpastas automaticamente

2. **[ALTA] Equipe → Sheets real:** Quando o Apps Script estiver ativo, habilitar carregamento da equipe pelo `fetch_equipe`.
3. **[MÉDIA] Chat → Executar SQL no Supabase:** `setup_chat_supabase.sql` precisa ser executado no painel do Supabase para ativar o chat em tempo real.
4. **[BAIXA] Busca Global:** Ajustar o Header para filtrar dados de acordo com a página ativa.

---

_Dica para o Antigravity (IA): Se o usuário solicitar continuar o trabalho, leia este arquivo para recuperar o contexto arquitetural e o que foi feito mais recentemente._

> **⚠️ INSTRUÇÃO CRÍTICA PARA A IA (ANTIGRAVITY):**

> Sempre que você finalizar uma nova tarefa, desenvolver uma nova funcionalidade, corrigir um bug importante ou antes de encerrar uma sessão de trabalho com o usuário, você **DEVE** atualizar este arquivo (`STATUS_PROJETO.md`). Documente resumidamente o que foi feito, as decisões tomadas e o estado atual do projeto para manter a memória sempre sincronizada no Google Drive. Não pergunte se deve atualizar, faça isso de forma proativa.
