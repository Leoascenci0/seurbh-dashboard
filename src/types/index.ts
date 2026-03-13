export type ProcessStatus =
    | 'Em Análise'
    | 'Aprovado'
    | 'Pendente'
    | 'Indeferido'
    | 'Arquivado';

export type ProcessCategory =
    | 'Alvará de Construção'
    | 'Habite-se'
    | 'Regularização'
    | 'Parcelamento'
    | 'Uso e Ocupação'
    | 'Impugnação'
    | 'Recurso';

export interface SeiProcess {
    id: string;
    seiNumber: string;
    requerente: string;
    cadastro: string;
    lote: string;
    gleba: string;
    assunto: string;
    category: ProcessCategory;
    status: ProcessStatus;
    responsavel: string;
    dataCriacao: string;
    dataAtualizacao: string;
    endereco: string;
    driveLink?: string;
    hasFiles: boolean;
    prioridade: 'Alta' | 'Normal' | 'Baixa';
}

export interface TeamMember {
    id: string;
    nome: string;
    cargo: string;
    setor: string;
    email: string;
    avatar?: string;
    processosSob: number;
    driveFolder?: string;
}

export interface NormativaItem {
    id: string;
    tipo: 'Lei' | 'Decreto' | 'Portaria' | 'Resolução' | 'Regulamentação' | 'Orientação' | 'Parecer';
    numero: string;
    titulo: string;
    data: string;
    ementa: string;
    driveLink?: string;
}
