// Nombre del archivo: AiIntegration.ts



// Nombre del archivo: AiIntegration.ts

import * as vscode from 'vscode';
import { AiModelClient } from './AiModelClient';

/**
 * Limpia delimitadores Markdown de bloques de código, dejando solo el contenido puro.
 */
function cleanCodeBlock(code: string): string {
  const regex = /^```(?:\w+)?\n([\s\S]*?)\n```$/;
  const match = code.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return code.replace(/^`+/, '').replace(/`+$/, '').trim();
}

export class AiIntegration {
  private client: AiModelClient;

  constructor() {
    this.client = new AiModelClient();
  }

  /**
   * Envía un prompt al modelo de IA, con spinner visible.
   * @param userInput Texto a enviar como entrada al modelo.
   * @param responseType "plain_text" | "json" | "script"
   * @param callback Función a ejecutar con la respuesta procesada.
   */
  public sendPromptToAiWithSpinner(
    userInput: string,
    responseType: string = "plain_text",
    callback: (response: any) => void
  ): void {
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;

    statusBar.text = `Consultando AI-Model ${frames[index]}`;
    statusBar.show();

    const interval = setInterval(() => {
      index = (index + 1) % frames.length;
      statusBar.text = `Consultando AI-Model ${frames[index]}`;
    }, 100);

    (async () => {
      try {
        const raw = await this.client.sendPrompt(userInput, responseType.toUpperCase());

        clearInterval(interval);
        statusBar.dispose();

        if (typeof raw !== 'string') {
          callback({ error: "Respuesta vacía o no procesable." });
          return;
        }

        if (responseType === 'json') {
          try {
            const json = JSON.parse(raw);
            callback(json);
            return;
          } catch (e) {
            callback({ error: "❌ La respuesta no es JSON válido." });
            return;
          }
        }

        if (responseType === 'script') {
          callback({ type: "script", content: cleanCodeBlock(raw) });
          return;
        }

        callback({ type: "plain_text", content: raw.trim() });
      } catch (error: any) {
        clearInterval(interval);
        statusBar.dispose();
        callback({ error: error.message || "❌ Error desconocido." });
      }
    })();
  }
}
