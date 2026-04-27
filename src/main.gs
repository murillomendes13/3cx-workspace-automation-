// ============================================================
// CONFIGURAÇÕES
// ============================================================
const CONFIG_3CX = {
  FQDN: PropertiesService.getScriptProperties().getProperty('FQDN'),
  CLIENT_ID: 'googlesheets',
  CLIENT_SECRET: PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET')
};

/**
 * Cria o menu personalizado ao abrir a planilha
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Atualizar Base 3CX')
    .addItem('Sincronizar e Validar Usuários', 'sincronizarEValidar3CX')
    .addToUi();
}

/**
 * Função Principal
 */
function sincronizarEValidar3CX() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaValidacao = ss.getSheetByName("validação") || ss.getSheetByName("Validação");

  if (!abaValidacao) {
    throw new Error("Aba 'validação' não encontrada.");
  }

  try {
    ss.toast("Conectando ao 3CX...", "Aguarde");

    const usuarios3CX = buscarUsuarios3CX();
    const workspaceStatusMap = buscarStatusWorkspace();

    const dados = [
      ["Ramal", "Nome Completo", "Email", "Status Google Workspace", "Ação Sugerida"]
    ];

    usuarios3CX.forEach(user => {
      const email = (user.EmailAddress || "").toLowerCase().trim();
      const ramal = user.Number || "-";
      const nome = ((user.FirstName || "") + " " + (user.LastName || "")).trim();

      if (!email) return;

      const statusGW = workspaceStatusMap[email] || "Não encontrado no Workspace";

      let acao = "Manter";
      if (statusGW === "Suspenso" || statusGW === "Não encontrado no Workspace") {
        acao = "EXCLUIR DO 3CX";
      }

      dados.push([ramal, nome, email, statusGW, acao]);
    });

    // Limpa e escreve
    abaValidacao.clear();
    abaValidacao
      .getRange(1, 1, dados.length, dados[0].length)
      .setValues(dados);

    formatarPlanilha(abaValidacao);

    ss.toast("Sincronização concluída!", "Sucesso");

  } catch (e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert("Erro: " + e.message);
  }
}

/**
 * Busca usuários no 3CX
 */
function buscarUsuarios3CX() {
  const token = obterToken3CX();

  const url = `https://${CONFIG_3CX.FQDN}/xapi/v1/Users`;

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/json"
    },
    muteHttpExceptions: true
  });

  const content = response.getContentText();

  if (!content) {
    throw new Error("Resposta vazia do 3CX.");
  }

  try {
    const json = JSON.parse(content);
    return json.value || [];
  } catch (e) {
    throw new Error("Erro ao parsear usuários do 3CX.");
  }
}

/**
 * Autenticação 3CX
 */
function obterToken3CX() {
  if (!CONFIG_3CX.CLIENT_SECRET) {
    throw new Error("CLIENT_SECRET não configurado no Script Properties.");
  }

  const url = `https://${CONFIG_3CX.FQDN}/connect/token`;

  const payload = {
    grant_type: "client_credentials",
    client_id: CONFIG_3CX.CLIENT_ID,
    client_secret: CONFIG_3CX.CLIENT_SECRET
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    payload: payload,
    muteHttpExceptions: true
  });

  const data = JSON.parse(response.getContentText());

  if (!data.access_token) {
    throw new Error("Erro na autenticação 3CX.");
  }

  return data.access_token;
}

/**
 * Busca usuários do Google Workspace
 */
function buscarStatusWorkspace() {
  const map = {};
  let pageToken;

  try {
    do {
      const response = AdminDirectory.Users.list({
        customer: 'my_customer',
        maxResults: 500,
        pageToken: pageToken
      });

      if (response.users) {
        response.users.forEach(user => {
          map[user.primaryEmail.toLowerCase()] =
            user.suspended ? "Suspenso" : "Ativo";
        });
      }

      pageToken = response.nextPageToken;

    } while (pageToken);

  } catch (e) {
    throw new Error("Erro ao acessar Google Workspace (Admin SDK).");
  }

  return map;
}

/**
 * Formatação da planilha
 */
function formatarPlanilha(sheet) {
  sheet.getRange(1, 1, 1, 5)
    .setFontWeight("bold")
    .setBackground("#444")
    .setFontColor("#fff");

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 5);
}
