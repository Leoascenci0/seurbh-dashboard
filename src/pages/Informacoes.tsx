import { 
    Bell, 
    ExternalLink, 
    MessageCircle, 
    FileText, 
    Lightbulb, 
    Calendar, 
    ShieldAlert, 
    Globe, 
    Info,
    ChevronRight,
    Megaphone,
    BookOpen
} from 'lucide-react';

interface Notice {
    id: string;
    title: string;
    content: string;
    date: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    author: string;
}

const notices: Notice[] = [
    {
        id: '1',
        title: 'Atualização do Sistema SEI',
        content: 'O sistema SEI passará por manutençãoプログラム neste final de semana para atualização de segurança.',
        date: '10 Abr 2026',
        type: 'warning',
        author: 'TI Prefeitura'
    },
    {
        id: '2',
        title: 'Novos Modelos de Pranchas Disponíveis',
        content: 'Já estão disponíveis no diretório de modelos as novas pranchas padronizadas para Loteamentos.',
        date: '08 Abr 2026',
        type: 'success',
        author: 'Coord. Urbanismo'
    },
    {
        id: '3',
        title: 'Reunião de Alinhamento - PGD',
        content: 'Convocação para todos os analistas sobre as novas diretrizes do Plano de Gestão de Dados.',
        date: '05 Abr 2026',
        type: 'info',
        author: 'Diretoria SEURBH'
    }
];

const quickLinks = [
    { label: 'SEI Maringá', url: 'https://sei.maringa.pr.gov.br', icon: FileText, color: 'text-[#4a90d9]', bg: 'bg-[#eaf3fd]' },
    { label: 'GeoMaringá', url: 'http://geodados.maringa.pr.gov.br', icon: Globe, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Portal Habitação', url: 'https://maringa.pr.gov.br-habitacao', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Drive Institucional', url: 'https://drive.google.com', icon: ExternalLink, color: 'text-purple-600', bg: 'bg-purple-50' },
];

function NoticeCard({ notice }: { notice: Notice }) {
    const typeStyles = {
        info: 'border-blue-200 bg-blue-50/50 text-blue-700',
        warning: 'border-amber-200 bg-amber-50/50 text-amber-700',
        success: 'border-green-200 bg-green-50/50 text-green-700',
        alert: 'border-red-200 bg-red-50/50 text-red-700',
    };

    return (
        <div className={`p-5 rounded-2xl border ${typeStyles[notice.type]} transition-all hover:shadow-md group`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-white shadow-sm">
                        {notice.type === 'info' && <Info size={16} />}
                        {notice.type === 'warning' && <ShieldAlert size={16} />}
                        {notice.type === 'success' && <Lightbulb size={16} />}
                        {notice.type === 'alert' && <Megaphone size={16} />}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{notice.type}</span>
                </div>
                <span className="text-[10px] font-medium opacity-60 flex items-center gap-1">
                    <Calendar size={10} /> {notice.date}
                </span>
            </div>
            <h4 className="text-sm font-bold text-[#0f1f30] mb-1.5">{notice.title}</h4>
            <p className="text-xs text-[#4a6075] leading-relaxed mb-4">{notice.content}</p>
            <div className="flex items-center justify-between border-t border-black/5 pt-3">
                <span className="text-[10px] font-semibold text-[#8fa5b8]">Postado por: {notice.author}</span>
                <button className="text-[10px] font-bold text-[#4a90d9] flex items-center gap-1 group-hover:underline">
                    Ver detalhes <ChevronRight size={12} />
                </button>
            </div>
        </div>
    );
}

export function Informacoes() {
    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e2d40] to-[#2d4b73] p-8 text-white shadow-xl shadow-[#1e2d40]/20">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-bold mb-2">Central de Informações SEURBH</h2>
                    <p className="text-sm text-blue-100/80 leading-relaxed">
                        Acesse comunicados internos, ferramentas essenciais e orientações atualizadas para manter o fluxo de trabalho eficiente e transparente.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-semibold">Sistemas Operacionais</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
                            <Calendar size={14} className="text-blue-300" />
                            <span className="text-xs font-semibold">Sem pendências críticas</span>
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] left-[10%] w-48 h-48 bg-[#4a90d9]/20 rounded-full blur-3xl" />
                <Megaphone className="absolute right-8 bottom-8 text-white/5 w-32 h-32 -rotate-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Notices */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#0f1f30]">
                            <Bell size={18} className="text-[#4a90d9]" />
                            <h3 className="text-lg font-bold">Mural de Avisos</h3>
                        </div>
                        <button className="text-xs font-bold text-[#4a90d9] hover:underline">Ver arquivo completo</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notices.map(notice => (
                            <NoticeCard key={notice.id} notice={notice} />
                        ))}
                    </div>

                    <div className="bg-[#f8fafc] border border-[#dde3ee] rounded-2xl p-6 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <MessageCircle size={28} className="text-[#4a90d9]" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-[#0f1f30]">Sugestões ou Bugs?</h4>
                            <p className="text-xs text-[#8fa5b8] mt-1 leading-relaxed">
                                Notou algo errado no dashboard ou tem uma sugestão de melhoria? Entre em contato com o suporte técnico para registrarmos seu feedback.
                            </p>
                        </div>
                        <button className="ml-auto px-4 py-2 bg-[#4a90d9] text-white text-xs font-bold rounded-xl hover:bg-[#3a7bc8] transition-colors shadow-lg shadow-[#4a90d9]/20">
                            Enviar
                        </button>
                    </div>
                </div>

                {/* Sidebar: Quick Links & FAO */}
                <div className="space-y-8">
                    {/* Quick Access */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#4a6075] uppercase tracking-wider flex items-center gap-2">
                            <ExternalLink size={14} /> Acesso Rápido
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {quickLinks.map(link => (
                                <a 
                                    key={link.label}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 rounded-2xl border border-[#dde3ee] bg-white hover:border-[#4a90d9]/40 hover:shadow-lg transition-all group"
                                >
                                    <div className={`p-2.5 rounded-xl ${link.bg} ${link.color}`}>
                                        <link.icon size={18} />
                                    </div>
                                    <span className="text-sm font-bold text-[#0f1f30] flex-1">{link.label}</span>
                                    <ChevronRight size={14} className="text-[#8fa5b8] group-hover:translate-x-1 transition-transform" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* FAQ/Instructions */}
                    <div className="bg-[#1e2d40] rounded-2xl p-6 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                                <BookOpen size={18} className="text-[#4a90d9]" /> Base de Conhecimento
                            </h3>
                            <p className="text-[11px] text-blue-100/60 leading-relaxed mb-4">
                                Dúvidas sobre o fluxo de aprovação de loteamentos? Consulte nossos guias rápidos.
                            </p>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-xs text-blue-100 hover:text-white cursor-pointer transition-colors">
                                    <ChevronRight size={12} className="text-blue-400" /> Como anexar pranchas DXF
                                </li>
                                <li className="flex items-center gap-2 text-xs text-blue-100 hover:text-white cursor-pointer transition-colors">
                                    <ChevronRight size={12} className="text-blue-400" /> Prazos de análise SEURBH
                                </li>
                            </ul>
                            <button className="w-full py-2.5 bg-blue-500 rounded-xl text-xs font-bold hover:bg-blue-400 transition-colors">
                                Acessar Biblioteca
                            </button>
                        </div>
                        <Megaphone className="absolute right-[-20px] bottom-[-20px] text-white/5 w-24 h-24" />
                    </div>
                </div>
            </div>
        </div>
    );
}
