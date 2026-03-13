/**
 * SCRIPT PARA INTEGRAÇÃO DO GOOGLE SHEETS COM O SEURBH DASHBOARD
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Abra sua planilha de controle no Google Sheets.
 * 2. Crie uma aba (página principal) chamada "Processos" (ou mude a variável SHEET_NAME abaixo).
 * 3. Na primeira linha (Cabeçalho), coloque os nomes das colunas exatamente como no sistema (ex: ID, Titulo, Requerente, Data, Status, Setor).
 * 4. Vá em "Extensões" > "Apps Script".
 * 5. Apague tudo e cole todo este código lá.
 * 6. Clique em "Implantar" (Deploy) > "Nova implantação".
 * 7. Escolha "App da Web" (Ícone de engrenagem).
 * 8. Configuração: Executar como "Eu", Quem tem acesso: "Qualquer pessoa".
 * 9. Clique em Implantar, autorize os acessos e copie o "URL do app da Web".
 * 10. No seu painel (Dashboard), você ou a IA poderá colocar essa URL para conectar os dados!
 */

const SHEET_NAME = "Processos";
const PARENT_FOLDER_ID = "1KqdLroB-US8i-xB_8_vVTaBv0ThDsxBD"; // Fallback caso não venha ID dinâmico

function doGet(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Aba '" + SHEET_NAME + "' não encontrada.");

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      let rowData = {};
      for (let j = 0; j < headers.length; j++) {
        rowData[headers[j]] = rows[i][j];
      }
      data.push(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: data
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Aba '" + SHEET_NAME + "' não encontrada.");

    const parsedData = JSON.parse(e.postData.contents);
    const action = parsedData.action;

    // ======== AÇÃO: SALVAR (INSERIR NOVA LINHA) ========
    if (action === "save") {
      const headers = sheet.getDataRange().getValues()[0];
      const newRow = [];

      for (let j = 0; j < headers.length; j++) {
        let columnName = headers[j];
        newRow.push(parsedData[columnName] !== undefined ? parsedData[columnName] : "");
      }

      const driveRootId = parsedData['DRIVE_ROOT_ID'];
      if (driveRootId && driveRootId.trim() !== "") {
        try {
          const sei = parsedData['N° DO PROCESSO'] || "PROC-NOVO";
          const req = parsedData['CADASTRO'] || "";
          const folderName = sei + (req ? " - " + req : "");

          const parent = DriveApp.getFolderById(driveRootId);
          const folder = parent.createFolder(folderName);
          const folderUrl = folder.getUrl();

          const colLinkIndex = headers.indexOf('LINK DRIVE');
          if (colLinkIndex !== -1) {
            newRow[colLinkIndex] = folderUrl;
          } else {
            sheet.getRange(1, headers.length + 1).setValue('LINK DRIVE');
            headers.push('LINK DRIVE');
            newRow.push(folderUrl);
          }
        } catch (e) { }
      }

      sheet.appendRow(newRow);

      return ContentService
        .createTextOutput(JSON.stringify({ status: "success", message: "Salvo com sucesso." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ======== AÇÃO: CONCLUIR PROCESSO E CRIAR PASTA ========
    if (action === "concluir_processo") {
      const rawData = sheet.getDataRange().getValues();
      const headers = rawData[0];

      const paramSeiNumber = parsedData['N° DO PROCESSO'];
      if (!paramSeiNumber) throw new Error("Parâmetro 'N° DO PROCESSO' ausente.");

      const colSeiIndex = headers.indexOf('N° DO PROCESSO');
      const colStatusIndex = headers.indexOf('SITUAÇÃO');
      let colLinkIndex = headers.indexOf('LINK DRIVE');
      const colRequerenteIndex = headers.indexOf('CADASTRO');

      if (colSeiIndex === -1) throw new Error("Coluna 'N° DO PROCESSO' não encontrada.");
      if (colStatusIndex === -1) throw new Error("Coluna 'SITUAÇÃO' não encontrada.");

      if (colLinkIndex === -1) {
        colLinkIndex = headers.length;
        sheet.getRange(1, colLinkIndex + 1).setValue('LINK DRIVE');
      }

      let foundRowIndex = -1;
      let folderName = paramSeiNumber;

      for (let i = 1; i < rawData.length; i++) {
        if (String(rawData[i][colSeiIndex]) === String(paramSeiNumber)) {
          foundRowIndex = i + 1;
          const requerente = colRequerenteIndex !== -1 ? rawData[i][colRequerenteIndex] : '';
          folderName = `${paramSeiNumber} - ${requerente}`;
          break;
        }
      }

      if (foundRowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Não encontrado." })).setMimeType(ContentService.MimeType.JSON);
      }

      let folder;
      const specificDriveId = parsedData['DRIVE_ROOT_ID'] || PARENT_FOLDER_ID;

      if (specificDriveId && specificDriveId.trim() !== "") {
        try {
          const parent = DriveApp.getFolderById(specificDriveId);
          folder = parent.createFolder(folderName);
        } catch (e) {
          folder = DriveApp.createFolder(folderName);
        }
      } else {
        folder = DriveApp.createFolder(folderName);
      }

      const folderUrl = folder.getUrl();
      sheet.getRange(foundRowIndex, colStatusIndex + 1).setValue("Concluído");
      sheet.getRange(foundRowIndex, colLinkIndex + 1).setValue(folderUrl);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Concluído.",
        folderUrl: folderUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Ação inválida." })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
