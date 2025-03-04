import * as vscode from 'vscode';

/**
 * Hace que un mensaje en la barra de estado de VS Code parpadee.
 * @param message Mensaje a mostrar.
 * @param duration Duración total en milisegundos (default 4000ms).
 * @param interval Tiempo de parpadeo en milisegundos (default 500ms).
 */
export function blinkStatusBarMessage(message: string, duration: number = 4000, interval: number = 500) {
    let isVisible = true;
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    
    statusBarItem.text = message;
    statusBarItem.show();

    const blinkInterval = setInterval(() => {
        isVisible ? statusBarItem.hide() : statusBarItem.show();
        isVisible = !isVisible;
    }, interval);

    setTimeout(() => {
        clearInterval(blinkInterval);
        statusBarItem.dispose();
    }, duration);
}
