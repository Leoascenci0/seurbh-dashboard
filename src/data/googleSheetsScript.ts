export const APPS_SCRIPT_CODE = `/**
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
const PARENT_FOLDER_ID = ""; // Deixe vazio para usar a pasta definida no Dashboard

function doGet(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = e.parameter.sheet || SHEET_NAME;
    const sheet = doc.getSheetByName(sheetName);
    if (!sheet) throw new Error("Aba '" + sheetName + "' não encontrada.");

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
        } catch (e) {}
      }

      sheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Salvo." })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "save_normativa") {
      const sheetNorma = doc.getSheetByName("Normativas");
      if (!sheetNorma) throw new Error("Aba 'Normativas' não encontrada. Crie uma aba com este nome.");

      const headers = sheetNorma.getDataRange().getValues()[0];
      const newRow = [];

      for (let j = 0; j < headers.length; j++) {
        let columnName = headers[j];
        newRow.push(parsedData[columnName] !== undefined ? parsedData[columnName] : "");
      }

      const normativeRootId = parsedData['NORMATIVA_ROOT_ID'];
      if (normativeRootId) {
        try {
          const type = parsedData['TIPO'] || "Outros";
          const number = parsedData['N° DO PROCESSO'] || "";
          const cadastrador = parsedData['CADASTRO'] || "";
          
          const rootFolder = DriveApp.getFolderById(normativeRootId);
          let typeFolder;
          const subfolders = rootFolder.getFolders();
          while (subfolders.hasNext()) {
            const folder = subfolders.next();
            if (folder.getName().toLowerCase() === type.toLowerCase()) {
              typeFolder = folder;
              break;
            }
          }
          if (!typeFolder) typeFolder = rootFolder.createFolder(type);

          const folderName = number + " - " + title;
          const finalFolder = typeFolder.createFolder(folderName);
          const folderUrl = finalFolder.getUrl();

          const colLinkIndex = headers.indexOf('LINK DRIVE');
          if (colLinkIndex !== -1) {
            newRow[colLinkIndex] = folderUrl;
          }
        } catch (e) {}
      }

      sheetNorma.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Normativa salva." })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "concluir_processo") {
      const rawData = sheet.getDataRange().getValues();
      const headers = rawData[0];
      const paramSeiNumber = parsedData['N° DO PROCESSO'];
      if (!paramSeiNumber) throw new Error("Número SEI ausente.");

      const colSeiIndex = headers.indexOf('N° DO PROCESSO');
      const colStatusIndex = headers.indexOf('SITUAÇÃO');
      let colLinkIndex = headers.indexOf('LINK DRIVE');
      const colRequerenteIndex = headers.indexOf('CADASTRO');

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
          folderName = paramSeiNumber + (requerente ? " - " + requerente : "");
          break;
        }
      }

      if (foundRowIndex === -1) throw new Error("Processo não encontrado.");

      let folder;
      const specificDriveId = parsedData['DRIVE_ROOT_ID'] || PARENT_FOLDER_ID;
      if (specificDriveId) {
        try {
          folder = DriveApp.getFolderById(specificDriveId).createFolder(folderName);
        } catch (e) {
          folder = DriveApp.createFolder(folderName);
        }
      } else {
        folder = DriveApp.createFolder(folderName);
      }

      const folderUrl = folder.getUrl();
      sheet.getRange(foundRowIndex, colStatusIndex + 1).setValue("Concluído");
      sheet.getRange(foundRowIndex, colLinkIndex + 1).setValue(folderUrl);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", folderUrl: folderUrl })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Ação inválida." })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
