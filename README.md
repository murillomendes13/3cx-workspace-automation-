# 3CX Workspace Automation

Automação para sincronização e validação de usuários entre o 3CX e o Google Workspace usando Google Apps Script.

##  Funcionalidades

* Integração com API do 3CX
* Validação de usuários no Google Workspace
* Identificação de contas suspensas ou inexistentes
* Sugestão automática de ações (manter ou excluir)
* Interface integrada ao Google Sheets

##  Tecnologias

* Google Apps Script
* JavaScript (ES6)
* 3CX API
* Google Admin SDK

##  Configuração

1. Configure o `CLIENT_SECRET` via Script Properties:

   * Apps Script → Project Settings → Script Properties

2. Ative a API:

   * Admin SDK (Google Workspace)

3. Crie uma aba chamada `validação` na planilha

##  Uso

* Abra a planilha vinculada ao script
* Clique em **⚙️ Atualizar Base 3CX**
* Execute **Sincronizar e Validar Usuários**

##  Segurança

Credenciais sensíveis não são armazenadas no código.

## Environment Variables

Configure as seguintes variáveis no Apps Script:

- FQDN
- CLIENT_SECRET

##  Objetivo

Automatizar a governança de usuários entre sistemas, reduzindo inconsistências e melhorando a gestão de acessos.
