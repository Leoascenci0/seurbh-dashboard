/**
 * ============================================================
 *  SEURBH DASHBOARD — Google Apps Script (Backend Completo)
 *  Versão: 2.0 — Sistema Funcional
 * ============================================================
 *
 *  INSTALAÇÃO:
 *  1. Abra o Google Sheets (planilha dentro da pasta-mãe do Drive)
 *  2. Extensões → Apps Script → Apague tudo → Cole este código
 *  3. Clique em Implantar → Nova implantação → App da Web
 *  4. Executar como: Eu | Acesso: Qualquer pessoa
 *  5. Copie a URL gerada e cole no sistema (Configurações → Apps Script URL)
 * ============================================================
 */

// ─── Configuração ─────────────────────────────────────────────
const CONFIG = {
  sheets: {
    processos:   'Processos',
    normativas:  'Normativas',
    equipe:      'Equipe',
    dadosCidade: 'Dados Cidade',
    modelos:     'Modelos',
  },
  driveFolders: {
    processos:   'Processos',
    normativas:  'Normativas',
    modelos:     'Modelos',
    dadosCidade: 'Dados da Cidade',
  }
};

// ─── CORS Helper ───────────────────────────────────────────────
function corsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data) {
  return corsResponse({ status: 'success', data: data || null });
}

function err(msg) {
  return corsResponse({ status: 'error', message: String(msg) });
}

// ─── doPost — entrada principal ────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'init_infra')         return actionInitInfra(body);
    if (action === 'fetch_processos')    return actionFetchProcessos(body);
    if (action === 'save_process')       return actionSaveProcess(body);
    if (action === 'delete_process')     return actionDeleteProcess(body);
    if (action === 'fetch_normativas')   return actionFetchNormativas(body);
    if (action === 'save_normativa')     return actionSaveNormativa(body);
    if (action === 'fetch_equipe')       return actionFetchEquipe(body);
    if (action === 'save_membro')        return actionSaveMembro(body);
    if (action === 'delete_membro')      return actionDeleteMembro(body);
    if (action === 'fetch_dados_cidade') return actionFetchDadosCidade(body);
    if (action === 'save_dado_cidade')   return actionSaveDadoCidade(body);
    if (action === 'fetch_modelos')      return actionFetchModelos(body);
    if (action === 'list_drive_folder')  return actionListDriveFolder(body);
    if (action === 'create_process_folder') return actionCreateProcessFolder(body);
    if (action === 'ping')               return ok({ pong: true, timestamp: new Date().toISOString() });

    return err('Ação desconhecida: ' + action);
  } catch (ex) {
    return err('Exceção: ' + ex.toString());
  }
}

// Compatibilidade com GET para ping/debug
function doGet(e) {
  return ok({ service: 'SEURBH Apps Script v2.0', status: 'online' });
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: INICIALIZAR INFRAESTRUTURA
// Cria abas obrigatórias na planilha e pastas no Drive
// ══════════════════════════════════════════════════════════════
function actionInitInfra(body) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const results = { sheets: {}, folders: {} };

    // — Criar abas com cabeçalhos se não existirem —
    const sheetDefs = {
      [CONFIG.sheets.processos]: [
        'ID', 'N° DO PROCESSO', 'TIPO DE PROCESSO', 'SETOR', 'CADASTRO', 'LOTE',
        'GLEBA', 'REQUERENTE', 'SITUAÇÃO', 'ANALISTA / DESENHISTA',
        'DATA DE ABERTURA', 'OBSERVAÇÃO', 'LINK DRIVE', 'PRIORIDADE'
      ],
      [CONFIG.sheets.normativas]: [
        'ID', 'TIPO', 'NUMERO', 'TITULO', 'EMENTA', 'DATA', 'STATUS',
        'LINK_DOC', 'LINK_DRIVE', 'AREA'
      ],
      [CONFIG.sheets.equipe]: [
        'ID', 'NOME_COMPLETO', 'CARGO', 'EMAIL', 'RAMAL', 'SETOR',
        'STATUS', 'DATA_ENTRADA', 'FOTO_URL'
      ],
      [CONFIG.sheets.dadosCidade]: [
        'ID', 'CATEGORIA', 'INDICADOR', 'VALOR', 'UNIDADE',
        'DATA_REFERENCIA', 'FONTE', 'OBSERVACAO'
      ],
      [CONFIG.sheets.modelos]: [
        'ID', 'TIPO', 'NOME', 'DESCRICAO', 'DRIVE_FILE_ID',
        'DRIVE_URL', 'VERSAO', 'DATA_CRIACAO'
      ],
    };

    for (const [sheetName, headers] of Object.entries(sheetDefs)) {
      let sheet = doc.getSheetByName(sheetName);
      if (!sheet) {
        sheet = doc.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length)
          .setBackground('#1e2d40')
          .setFontColor('#ffffff')
          .setFontWeight('bold');
        results.sheets[sheetName] = 'criada';
      } else {
        results.sheets[sheetName] = 'existente';
      }
    }

    // — Criar pastas no Drive se driveFolderId fornecido —
    const driveFolderId = body.driveFolderId;
    if (driveFolderId) {
      const rootFolder = DriveApp.getFolderById(driveFolderId);

      for (const [key, folderName] of Object.entries(CONFIG.driveFolders)) {
        const sub = getOrCreateSubfolder(rootFolder, folderName);
        results.folders[key] = sub.getUrl();

        // Sub-subpastas para Normativas
        if (key === 'normativas') {
          const normSubFolders = ['Leis', 'Decretos', 'Portarias', 'Resoluções', 'Regulamentações', 'Orientações', 'Pareceres'];
          normSubFolders.forEach(n => getOrCreateSubfolder(sub, n));
        }
        // Sub-subpastas para Modelos
        if (key === 'modelos') {
          ['Pranchas', 'Documentos', 'Templates'].forEach(n => getOrCreateSubfolder(sub, n));
        }
      }
    }

    return ok(results);
  } catch (ex) {
    return err('init_infra: ' + ex.toString());
  }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: BUSCAR PROCESSOS
// ══════════════════════════════════════════════════════════════
function actionFetchProcessos(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.processos);
    if (!sheet) return err("Aba 'Processos' não encontrada. Execute a inicialização primeiro.");
    return ok(sheetToObjects(sheet));
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: SALVAR PROCESSO (INSERT ou UPDATE)
// ══════════════════════════════════════════════════════════════
function actionSaveProcess(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.processos);
    if (!sheet) throw new Error("Aba 'Processos' não encontrada.");

    const data = body.processData || body;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Gerar ID se não existir
    if (!data['ID']) {
      data['ID'] = 'PROC-' + new Date().getTime();
    }
    if (!data['DATA DE ABERTURA']) {
      data['DATA DE ABERTURA'] = new Date().toLocaleDateString('pt-BR');
    }

    // Criar pasta no Drive automaticamente
    const driveFolderId = body.driveFolderId || data['DRIVE_ROOT_ID'];
    if (driveFolderId) {
      try {
        const rootFolder = DriveApp.getFolderById(driveFolderId);
        const procFolder = getOrCreateSubfolder(rootFolder, CONFIG.driveFolders.processos);
        const sei = data['N° DO PROCESSO'] || data['ID'];
        const cad = data['CADASTRO'] || '';
        const nome = sei + (cad ? ' — ' + cad : '');
        const subFolder = procFolder.createFolder(nome);
        data['LINK DRIVE'] = subFolder.getUrl();
      } catch (e) {
        // Drive opcional — não bloqueia o salvamento
        Logger.log('Drive folder error: ' + e.toString());
      }
    }

    // Verificar se processo já existe (UPDATE)
    const id = data['ID'];
    const rows = sheet.getDataRange().getValues();
    let foundRow = -1;
    const idColIndex = headers.indexOf('ID');
    if (idColIndex >= 0) {
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idColIndex]) === String(id)) {
          foundRow = i + 1; break;
        }
      }
    }

    const newRow = headers.map(h => (data[h] !== undefined ? data[h] : ''));

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }

    return ok({ id: id, driveLink: data['LINK DRIVE'] || null });
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: DELETAR PROCESSO
// ══════════════════════════════════════════════════════════════
function actionDeleteProcess(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.processos);
    if (!sheet) throw new Error("Aba 'Processos' não encontrada.");
    const deleted = deleteRowById(sheet, body.id);
    return deleted ? ok({ deleted: body.id }) : err('Processo não encontrado: ' + body.id);
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: BUSCAR NORMATIVAS
// ══════════════════════════════════════════════════════════════
function actionFetchNormativas(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.normativas);
    if (!sheet) return err("Aba 'Normativas' não encontrada. Execute a inicialização primeiro.");
    return ok(sheetToObjects(sheet));
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: SALVAR NORMATIVA
// ══════════════════════════════════════════════════════════════
function actionSaveNormativa(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.normativas);
    if (!sheet) throw new Error("Aba 'Normativas' não encontrada.");

    const data = body.normativaData || body;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (!data['ID']) data['ID'] = 'NORM-' + new Date().getTime();
    if (!data['DATA']) data['DATA'] = new Date().toISOString().split('T')[0];

    // Criar subpasta no Drive por tipo
    const driveFolderId = body.driveFolderId;
    if (driveFolderId && data['TIPO']) {
      try {
        const root = DriveApp.getFolderById(driveFolderId);
        const normFolder = getOrCreateSubfolder(root, CONFIG.driveFolders.normativas);
        const tipoFolder = getOrCreateSubfolder(normFolder, data['TIPO']);
        const nomePasta = (data['NUMERO'] || data['ID']) + ' — ' + (data['TITULO'] || '');
        const sub = tipoFolder.createFolder(nomePasta.substring(0, 100));
        data['LINK_DRIVE'] = sub.getUrl();
      } catch (e) { Logger.log('Normativa folder error: ' + e); }
    }

    const newRow = headers.map(h => (data[h] !== undefined ? data[h] : ''));
    sheet.appendRow(newRow);

    return ok({ id: data['ID'] });
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: BUSCAR EQUIPE
// ══════════════════════════════════════════════════════════════
function actionFetchEquipe(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.equipe);
    if (!sheet) return err("Aba 'Equipe' não encontrada. Execute a inicialização primeiro.");
    return ok(sheetToObjects(sheet));
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: SALVAR MEMBRO DA EQUIPE
// ══════════════════════════════════════════════════════════════
function actionSaveMembro(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.equipe);
    if (!sheet) throw new Error("Aba 'Equipe' não encontrada.");

    const data = body.membroData || body;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (!data['ID']) data['ID'] = 'MBR-' + new Date().getTime();
    if (!data['DATA_ENTRADA']) data['DATA_ENTRADA'] = new Date().toLocaleDateString('pt-BR');
    if (!data['STATUS']) data['STATUS'] = 'Ativo';

    // UPDATE se existir
    const rows = sheet.getDataRange().getValues();
    const idColIndex = headers.indexOf('ID');
    let foundRow = -1;
    if (idColIndex >= 0) {
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idColIndex]) === String(data['ID'])) {
          foundRow = i + 1; break;
        }
      }
    }

    const newRow = headers.map(h => (data[h] !== undefined ? data[h] : ''));
    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }

    return ok({ id: data['ID'] });
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: DELETAR MEMBRO
// ══════════════════════════════════════════════════════════════
function actionDeleteMembro(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.equipe);
    if (!sheet) throw new Error("Aba 'Equipe' não encontrada.");
    const deleted = deleteRowById(sheet, body.id);
    return deleted ? ok({ deleted: body.id }) : err('Membro não encontrado.');
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: BUSCAR DADOS DA CIDADE
// ══════════════════════════════════════════════════════════════
function actionFetchDadosCidade(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.dadosCidade);
    if (!sheet) return err("Aba 'Dados Cidade' não encontrada. Execute a inicialização primeiro.");
    return ok(sheetToObjects(sheet));
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: SALVAR DADO DA CIDADE
// ══════════════════════════════════════════════════════════════
function actionSaveDadoCidade(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.dadosCidade);
    if (!sheet) throw new Error("Aba 'Dados Cidade' não encontrada.");

    const data = body.dadoData || body;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (!data['ID']) data['ID'] = 'DC-' + new Date().getTime();
    if (!data['DATA_REFERENCIA']) data['DATA_REFERENCIA'] = new Date().toLocaleDateString('pt-BR');

    // UPDATE se existir
    const rows = sheet.getDataRange().getValues();
    const idColIndex = headers.indexOf('ID');
    let foundRow = -1;
    if (idColIndex >= 0) {
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idColIndex]) === String(data['ID'])) {
          foundRow = i + 1; break;
        }
      }
    }

    const newRow = headers.map(h => (data[h] !== undefined ? data[h] : ''));
    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }

    return ok({ id: data['ID'] });
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: BUSCAR MODELOS (da aba + links do Drive)
// ══════════════════════════════════════════════════════════════
function actionFetchModelos(body) {
  try {
    const doc = getSheetDoc(body);
    const sheet = doc.getSheetByName(CONFIG.sheets.modelos);
    if (!sheet) return err("Aba 'Modelos' não encontrada. Execute a inicialização primeiro.");
    return ok(sheetToObjects(sheet));
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: LISTAR PASTA DO DRIVE
// ══════════════════════════════════════════════════════════════
function actionListDriveFolder(body) {
  try {
    const folderId = body.folderId;
    if (!folderId) return err('folderId não informado.');

    const folder = DriveApp.getFolderById(folderId);
    const items = [];

    // Subpastas
    const subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      const f = subFolders.next();
      items.push({
        id: f.getId(),
        name: f.getName(),
        type: 'folder',
        url: f.getUrl(),
        updatedAt: f.getLastUpdated().toISOString(),
      });
    }

    // Arquivos
    const files = folder.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      items.push({
        id: f.getId(),
        name: f.getName(),
        type: 'file',
        mimeType: f.getMimeType(),
        url: f.getUrl(),
        size: f.getSize(),
        updatedAt: f.getLastUpdated().toISOString(),
      });
    }

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return ok({ folderName: folder.getName(), items: items });
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// AÇÃO: CRIAR PASTA DE PROCESSO
// ══════════════════════════════════════════════════════════════
function actionCreateProcessFolder(body) {
  try {
    const parentFolderId = body.parentFolderId || body.driveFolderId;
    const folderName = body.folderName;
    if (!parentFolderId || !folderName) return err('parentFolderId e folderName são obrigatórios.');

    const parent = DriveApp.getFolderById(parentFolderId);
    const folder = parent.createFolder(folderName);

    return ok({
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      folderName: folder.getName(),
    });
  } catch (ex) { return err(ex.toString()); }
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

/** Converte uma aba em array de objetos usando a primeira linha como keys */
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] !== '' ? row[i] : null; });
      return obj;
    });
}

/** Deleta uma linha pelo ID na primeira coluna */
function deleteRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIndex = headers.indexOf('ID');
  if (idColIndex < 0) return false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/** Pega ou cria uma subpasta pelo nome */
function getOrCreateSubfolder(parentFolder, name) {
  const subs = parentFolder.getFoldersByName(name);
  if (subs.hasNext()) return subs.next();
  return parentFolder.createFolder(name);
}

/**
 * Retorna o spreadsheet correto:
 * - Se body.sheetUrl for fornecido, abre por URL
 * - Caso contrário usa o spreadsheet ativo (onde o script está instalado)
 */
function getSheetDoc(body) {
  if (body && body.sheetUrl && body.sheetUrl.includes('spreadsheets')) {
    try {
      const match = body.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) return SpreadsheetApp.openById(match[1]);
      return SpreadsheetApp.openByUrl(body.sheetUrl);
    } catch (e) {
      throw new Error("Não foi possível acessar a planilha vinculada: " + body.sheetUrl + " - Detalhes: " + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}
