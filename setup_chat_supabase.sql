-- ============================================================
--  SEURBH Dashboard — Script de Configuração do Chat Interno
--  Execute este script no painel do Supabase > SQL Editor
-- ============================================================

-- 1. Tabela de Canais
CREATE TABLE IF NOT EXISTS chat_channels (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type        text NOT NULL CHECK (type IN ('general', 'private', 'group')),
    name        text,
    created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  timestamptz DEFAULT now() NOT NULL
);

-- 2. Tabela de Membros dos Canais
CREATE TABLE IF NOT EXISTS chat_channel_members (
    channel_id  uuid REFERENCES chat_channels(id) ON DELETE CASCADE NOT NULL,
    user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at   timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (channel_id, user_id)
);

-- 3. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS chat_messages (
    id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id       uuid REFERENCES chat_channels(id) ON DELETE CASCADE NOT NULL,
    sender_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_name      text NOT NULL,
    sender_initials  text NOT NULL,
    content          text NOT NULL,
    read_by          uuid[] DEFAULT '{}' NOT NULL,
    created_at       timestamptz DEFAULT now() NOT NULL
);

-- 4. Criar o Canal Geral automático (roda apenas uma vez)
INSERT INTO chat_channels (type, name)
SELECT 'general', 'Geral'
WHERE NOT EXISTS (SELECT 1 FROM chat_channels WHERE type = 'general');

-- 5. Habilitar Realtime nas tabelas do chat (com verificação para evitar erro se já existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_channels') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_channel_members') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_channel_members;
    END IF;
END $$;

-- ============================================================
-- 6. Row Level Security (RLS)
-- ============================================================

ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_channels
DROP POLICY IF EXISTS "Authenticated can see channels" ON chat_channels;
CREATE POLICY "Authenticated can see channels" ON chat_channels
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            type = 'general'
            OR id IN (
                SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated can create channels" ON chat_channels;
CREATE POLICY "Authenticated can create channels" ON chat_channels
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para chat_channel_members
DROP POLICY IF EXISTS "Authenticated can see members" ON chat_channel_members;
CREATE POLICY "Authenticated can see members" ON chat_channel_members
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can join channels" ON chat_channel_members;
CREATE POLICY "Authenticated can join channels" ON chat_channel_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para chat_messages
DROP POLICY IF EXISTS "Members can see their messages" ON chat_messages;
CREATE POLICY "Members can see their messages" ON chat_messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            channel_id IN (SELECT id FROM chat_channels WHERE type = 'general')
            OR channel_id IN (SELECT channel_id FROM chat_channel_members WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Members can send messages" ON chat_messages;
CREATE POLICY "Members can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Members can update read_by" ON chat_messages;
CREATE POLICY "Members can update read_by" ON chat_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- Pronto! O chat está configurado.
-- ============================================================
COMMENT ON TABLE chat_messages IS 'Mensagens do chat interno SEURBH';
COMMENT ON TABLE chat_channels IS 'Canais do chat interno SEURBH (geral, privado, grupo)';
