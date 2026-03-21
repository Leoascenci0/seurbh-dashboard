import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { ProcessosSEI } from './pages/ProcessosSEI';
import { Normativas } from './pages/Normativas';
import { Equipe } from './pages/Equipe';
import { Placeholder } from './pages/Placeholder';
import { LoginPage } from './pages/LoginPage';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { ProcessosProvider } from './context/ProcessosContext';
import { NormativasProvider } from './context/NormativasContext';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EquipeProvider } from './context/EquipeContext';
import { Loader2 } from 'lucide-react';

type Section =
  | 'dashboard'
  | 'dados-cidade'
  | 'normativas'
  | 'normativas-leis'
  | 'normativas-decretos'
  | 'normativas-portarias'
  | 'normativas-resolucoes'
  | 'normativas-regulamentacoes'
  | 'normativas-orientacoes'
  | 'normativas-pareceres'
  | 'equipe'
  | 'processos-sei'
  | 'modelos'
  | 'modelos-pranchas'
  | 'modelos-documentos'
  | 'modelos-templates'
  | 'informacoes';

const sectionTitles: Record<Section, { title: string; breadcrumb?: string }> = {
  'dashboard': { title: 'Dashboard' },
  'dados-cidade': { title: 'Dados da Cidade', breadcrumb: '00' },
  'normativas': { title: 'Normativas', breadcrumb: '01' },
  'normativas-leis': { title: 'Leis', breadcrumb: '01 › Normativas' },
  'normativas-decretos': { title: 'Decretos', breadcrumb: '01 › Normativas' },
  'normativas-portarias': { title: 'Portarias', breadcrumb: '01 › Normativas' },
  'normativas-resolucoes': { title: 'Resoluções', breadcrumb: '01 › Normativas' },
  'normativas-regulamentacoes': { title: 'Regulamentações', breadcrumb: '01 › Normativas' },
  'normativas-orientacoes': { title: 'Orientações', breadcrumb: '01 › Normativas' },
  'normativas-pareceres': { title: 'Pareceres', breadcrumb: '01 › Normativas' },
  'equipe': { title: 'Equipe', breadcrumb: '02' },
  'processos-sei': { title: 'Processos SEI', breadcrumb: '03' },
  'modelos': { title: 'Modelos', breadcrumb: '04' },
  'modelos-pranchas': { title: 'Pranchas', breadcrumb: '04 › Modelos' },
  'modelos-documentos': { title: 'Documentos', breadcrumb: '04 › Modelos' },
  'modelos-templates': { title: 'Templates', breadcrumb: '04 › Modelos' },
  'informacoes': { title: 'Informações Gerais', breadcrumb: '05' },
};

function renderContent(section: Section, searchQuery: string, onNavigate: (id: string) => void) {
  switch (section) {
    case 'dashboard':
      return <Dashboard onNavigate={onNavigate} />;
    case 'processos-sei':
      return <ProcessosSEI searchQuery={searchQuery} />;
    case 'normativas':
      return <Normativas searchQuery={searchQuery} />;
    case 'normativas-leis':
      return <Normativas tipo="lei" searchQuery={searchQuery} />;
    case 'normativas-decretos':
      return <Normativas tipo="decreto" searchQuery={searchQuery} />;
    case 'normativas-portarias':
      return <Normativas tipo="portaria" searchQuery={searchQuery} />;
    case 'normativas-resolucoes':
      return <Normativas tipo="resolução" searchQuery={searchQuery} />;
    case 'normativas-regulamentacoes':
      return <Normativas tipo="regulamentação" searchQuery={searchQuery} />;
    case 'normativas-orientacoes':
      return <Normativas tipo="orientação" searchQuery={searchQuery} />;
    case 'normativas-pareceres':
      return <Normativas tipo="parecer" searchQuery={searchQuery} />;
    case 'equipe':
      return <Equipe />;
    case 'dados-cidade':
      return (
        <Placeholder
          title="Dados da Cidade"
          description="Esta área conterá informações gerais, relatórios e dados estatísticos do município de Maringá relacionados à urbanismo e habitação."
        />
      );
    case 'modelos':
    case 'modelos-pranchas':
    case 'modelos-documentos':
    case 'modelos-templates':
      return (
        <Placeholder
          title={sectionTitles[section].title}
          description="Biblioteca de modelos padronizados de pranchas, documentos e templates para uso nos processos SEI da SEURBH."
        />
      );
    case 'informacoes':
      return (
        <Placeholder
          title="Informações Gerais"
          description="Central de informações, comunicados internos e avisos relevantes para a equipe da SEURBH."
        />
      );
    default:
      return <Dashboard onNavigate={onNavigate} />;
  }
}

/** Conteúdo principal — só renderiza após autenticação */
function AppContent() {
  const { session, isLoading, isSupabaseReady } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading inicial enquanto verifica sessão
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f0f4f8',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color="#3b5fa0" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p style={{ color: '#6b7a8d', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            Verificando sessão...
          </p>
        </div>
      </div>
    );
  }

  // Se Supabase está configurado e usuário não está autenticado → login
  if (isSupabaseReady && !session.isAuthenticated) {
    return <LoginPage />;
  }

  // App principal (autenticado OU Supabase não configurado ainda)
  const info = sectionTitles[activeSection] || { title: 'SEURBH' };

  const handleNavigate = (id: string) => {
    setActiveSection(id as Section);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar activeSection={activeSection} onSectionChange={handleNavigate} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pageTitle={info.title}
          pageBreadcrumb={info.breadcrumb}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent(activeSection, searchQuery, handleNavigate)}
        </main>
      </div>
      <ThemeCustomizer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AuthProvider>
          <ProcessosProvider>
            <NormativasProvider>
              <EquipeProvider>
                <AppContent />
              </EquipeProvider>
            </NormativasProvider>
          </ProcessosProvider>
        </AuthProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
