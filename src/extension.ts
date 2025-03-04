/**
 * @file extension.ts
 * Punto de entrada de la extensión. Registra los comandos, el TreeDataProvider
 * para la vista "Mis Aplicaciones" y el comando que abre el webview para seleccionar prototipo.
 */

/* importanciones para websockets dei */
import * as fs from 'fs';
import * as path from 'path';
import * as ws from 'ws';  // Importa WebSocket


import { AiIntegration } from './utils/AiIntegration';

import * as vscode from 'vscode';
import { GenerateAppsDataProvider } from './providers/generateAppsDataProvider';
import { COMMANDS } from './commands';
import { copyToClipboardHandler } from './commands/clipboardCommands';

// Importamos las funciones de generación de prototipos
import { generateReactFlaskPrototype } from './commands/reactFlaskPrototype';
import { generatePythonDesktopPrototype } from './commands/pythonDesktopPrototype';

export function activate(context: vscode.ExtensionContext) {
  // 1) Registrar el comando "ai-prog.copyToClipboard" para múltiples archivos.
  const copyCmd = vscode.commands.registerCommand(
    'ai-prog.copyToClipboard',
    (clickedUri: vscode.Uri, selectedUris: vscode.Uri[]) => {
      copyToClipboardHandler(clickedUri, selectedUris);
    }
  );
  context.subscriptions.push(copyCmd);

  // 2) Registrar el resto de los comandos definidos en commands/index.ts.
  COMMANDS.filter(cmd => cmd.name !== 'ai-prog.copyToClipboard').forEach(({ name, callback }) => {
    const disposable = vscode.commands.registerCommand(name, callback);
    context.subscriptions.push(disposable);
  });

  // 3) Registrar el TreeDataProvider para la vista "generateAppsView".
  const treeDataProvider = new GenerateAppsDataProvider();
  vscode.window.registerTreeDataProvider('generateAppsView', treeDataProvider);

  // 4) Registrar el comando que abre el webview para seleccionar el prototipo.
  const openPrototypeSelector = vscode.commands.registerCommand('ai-prog.openPrototypeSelector', () => {
    createPrototypeSelectorPanel(context);
  });
  context.subscriptions.push(openPrototypeSelector);

  // 5) Registrar el comando que abre el webview para editar la aplicación con IA.
    const editAppCmd = vscode.commands.registerCommand('ai-prog.editAppWithIA', () => {
      createEditAppPanel(context);
    });
    context.subscriptions.push(editAppCmd);

}

export function deactivate() {
  // Limpieza si es necesario
}

/**
 * Crea un Webview Panel que muestra la interfaz para escoger el prototipo.
 */
function createPrototypeSelectorPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'prototypeSelector', // Identificador interno
    'Escoger prototipo', // Título del panel
    vscode.ViewColumn.One,
    { enableScripts: true } // Permite la ejecución de scripts en el webview
  );

  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

  // Escucha los mensajes enviados desde el webview.
  panel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.command) {
        case 'proceed':
          const selection = message.selection;
          panel.dispose(); // Cerramos el panel tras recibir la selección
          switch (selection) {
            case 'web':
              generateWebPrototype();
              break;
            case 'reactFlask':
              generateReactFlaskPrototype();
              break;
            case 'pythonDesktop':
              generatePythonDesktopPrototype();
              break;
            default:
              vscode.window.showErrorMessage("Opción no reconocida");
          }
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}


/**
 * Crea un Webview Panel para "Editar aplicación con IA".
 */

function createEditAppPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'editAppWithIA',            // Identificador interno
    'Editar aplicación con IA', // Título del panel
    vscode.ViewColumn.One,      // Editor column
    { enableScripts: true }     // Permitir scripts en el webview
  );

  panel.webview.html = getEditAppWithIAContent(panel.webview, context.extensionUri);

  panel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.command) {
        case 'create':
          const aiIntegration = new AiIntegration();
          // Aquí se utiliza la función que muestra el spinner en la barra de estado
          aiIntegration.sendPromptToAiWithSpinner(message.text, "plain_text", (response: any) => {
            if (response.error) {
              vscode.window.showErrorMessage(`Error en AI-Model: ${response.error}`);
            } else {
              vscode.window.showInformationMessage(`Respuesta de AI-Model: ${response.content}`);
            }
          });
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}



/**
 * Retorna el HTML para el webview "Editar aplicación con IA".
 */
function getEditAppWithIAContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <!-- Agregamos nonce al bloque de estilos -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <style nonce="${nonce}">
    body {
      font-family: sans-serif;
      margin: 0; padding: 0;
      background-color:rgb(29, 29, 27); /* Color base de VS Code */
    }
    .container {
      padding: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #666;
      margin-bottom: 1rem;
    }
    .input-area {
      width: 100%;
      height: 150px;
      padding: 0.5rem;
      font-size: 2rem;
      margin-bottom: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: vertical;
      color: rgba(11, 76, 228, 0.8);
      background: rgba(175, 175, 73, 0.96);
    }
    .button {
      background-color: #007acc;
      color: white;
      padding: 0.7rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .button:hover {
      background-color: #005f9e;
    }
    .icon {
      font-size: 1.2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="icon">✏️</span>
      <span>Prompt:</span>
    </div>
    <div class="subtitle">Describir con precisión el cambio que desea generar en la aplicación</div>
    <textarea class="input-area" id="ia-content" placeholder="Escribir aquí..."></textarea>
    <br>
    <button class="button" id="createBtn">Proceder</button>
  </div>
  
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const createBtn = document.getElementById('createBtn');
    const contentField = document.getElementById('ia-content');
    
    createBtn.addEventListener('click', () => {
      vscode.postMessage({
        command: 'create',
        text: contentField.value
      });
    });

  </script>
</body>
</html>`
}




/**
 * Genera el contenido HTML para el webview.
 */
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escoger prototipo</title>
        <style nonce="${nonce}">
          
      body {
        font-family: sans-serif;
        padding: 20px;
        background-color: #1e1e1e; /* Fondo similar a VS Code */
        color: #ddd;
        display: flex;
        justify-content: center; /* Centrar todo */
      }

      .container {
        width: 80%; /* Aumentar solo el fondo A */
        max-width: 700px; /* Ampliar el fondo A */
        margin: 20px auto;
        padding: 20px;
        background: #2e2e2e; /* Recuadro oscuro */
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        text-align: left;
      }

      h1 {
        font-size: 22px;
        text-align: center;
        margin-bottom: 15px;
        color: #f0f0f0;
      }

      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        background: #3a3a3a;
        border-radius: 6px;
        width: 60%; /* No ampliar los cuadros B */
        margin: 0 auto; /* Mantener centrado dentro del contenedor */
      }

      .radio-group label {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: #444;
        border-radius: 4px;
        transition: 0.3s;
        cursor: pointer;
        color: #ddd;
        width: 100%;
        box-sizing: border-box;
      }

      .radio-group input[type="radio"] {
        margin: 0;
        transform: scale(1.2);
      }

      .radio-group label:hover {
        background: #007acc;
        color: white;
      }

      .button {
        display: block;
        width: 100%;
        margin-top: 15px;
        background-color: #007acc;
        color: white;
        padding: 12px;
        border: none;
        cursor: pointer;
        border-radius: 4px;
        font-size: 16px;
      }

      .button:hover {
        background-color: #005f9e;
      }

      .button {
        display: block;
        width: 200px; /* Tamaño estándar */
        margin: 20px auto; /* Centrar el botón horizontalmente */
        background-color: #007acc;
        color: white;
        padding: 12px;
        border: none;
        cursor: pointer;
        border-radius: 4px;
        font-size: 16px;
        text-align: center;
        transition: 0.3s;
      }

      .button:hover {
        background-color: #005f9e;
      }




        </style>
      </head>
          <body>
          <div class="container">
        <h1>Escoger prototipo</h1>
        <div class="radio-group">
          <label for="web">
            <input type="radio" id="web" name="prototype" value="web" checked>
            <span>Página web</span>
          </label>
          <label for="reactFlask">
            <input type="radio" id="reactFlask" name="prototype" value="reactFlask">
            <span>React/Flask</span>
          </label>
          <label for="pythonDesktop">
            <input type="radio" id="pythonDesktop" name="prototype" value="pythonDesktop">
            <span>Python desktop</span>
          </label>
        </div>
        <button class="button" id="proceed">Proceder</button>
      </div>
        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            const proceedButton = document.getElementById('proceed');
            proceedButton.addEventListener('click', () => {
              // Obtiene el valor del radio seleccionado
              const selectedRadio = document.querySelector('input[name="prototype"]:checked');
              const selection = selectedRadio ? selectedRadio.value : 'web';
              vscode.postMessage({ command: 'proceed', selection: selection });
            });
        </script>

          </body>
      </html>`;
}

/**
 * Función auxiliar para generar un nonce aleatorio.
 */
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


/**
 * Genera la estructura básica para una aplicación web.
 * Crea archivos: index.html, style.css y script.js en la carpeta raíz del workspace.
 */


/*
Esto tiene que morir pues debe venir como pytohon desde un repositorio de github

*/
function generateWebPrototype() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("Abre una carpeta en el espacio de trabajo para generar el prototipo.");
    return;
  }
  const folderUri = workspaceFolders[0].uri;
  
  const indexPath = vscode.Uri.joinPath(folderUri, "index.html");
  const stylePath = vscode.Uri.joinPath(folderUri, "style.css");
  const scriptPath = vscode.Uri.joinPath(folderUri, "script.js");
  
  const indexContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mi Página Web</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Bienvenido a mi página web</h1>
  <script src="script.js"></script>
</body>
</html>`;
  const styleContent = `body { font-family: Arial, sans-serif; margin: 0; padding: 0; }`;
  const scriptContent = `console.log('Hola, mundo!');`;

  vscode.workspace.fs.writeFile(indexPath, Buffer.from(indexContent));
  vscode.workspace.fs.writeFile(stylePath, Buffer.from(styleContent));
  vscode.workspace.fs.writeFile(scriptPath, Buffer.from(scriptContent));

  vscode.window.showInformationMessage("Prototipo de Página Web generado correctamente.");
}
