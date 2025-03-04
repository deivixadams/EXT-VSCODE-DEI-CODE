// src/commands/pythonDesktopPrototype.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import { blinkStatusBarMessage } from '../utils/statusBarUtils';

const execAsync = promisify(exec);
// Se utiliza la carpeta temporal del sistema para almacenar el log
const LOG_FILE_PATH = path.join(os.tmpdir(), 'extension', 'extension.log');

/**
 * Escribe un mensaje en el log físico.
 * Asegura que el directorio exista y agrega el mensaje con salto de línea.
 * @param message Mensaje a escribir.
 */
function writeLogToFile(message: string) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
    fs.appendFileSync(LOG_FILE_PATH, message + os.EOL, { encoding: 'utf8' });
  } catch (err: any) {
    console.error("Error escribiendo el log físico:", err);
  }
}

/**
 * Clase que ejecuta el proceso completo para generar y, opcionalmente, ejecutar
 * un prototipo de Python Desktop usando PySide6 clonando un repositorio.
 */
export class PythonDesktopPrototypeRunner {
  private repoUrl: string = 'https://github.com/deivixadams/ProyectoPythonDesktop.git';
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Python Desktop Prototype");
  }

  public async run() {
    blinkStatusBarMessage("⚙️ Iniciando generación del prototipo...");
    this.log("Iniciando proceso de generación del prototipo de Python Desktop...");
    vscode.window.showInformationMessage("Generando estructura para Python Desktop con PySide6...");

    // 1. Solicitar al usuario que seleccione la carpeta de trabajo.
    const folderUris = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Seleccionar carpeta de trabajo'
    });

    if (!folderUris || folderUris.length === 0) {
      this.log("No se seleccionó ninguna carpeta. Operación cancelada.");
      vscode.window.showErrorMessage("No se ha seleccionado ninguna carpeta. Operación cancelada.");
      blinkStatusBarMessage("❌ Operación cancelada: no se seleccionó carpeta.");
      return;
    }

    const selectedFolder = folderUris[0];
    this.log(`Carpeta seleccionada: ${selectedFolder.fsPath}`);
    blinkStatusBarMessage(`📂 Carpeta seleccionada: ${selectedFolder.fsPath}`);

    // 2. Confirmar la carpeta seleccionada.
    const confirm = await vscode.window.showInformationMessage(
      `¿Deseas continuar con la carpeta: ${selectedFolder.fsPath}?`,
      { modal: true },
      "Sí", "No"
    );

    if (confirm !== "Sí") {
      this.log("Operación cancelada por el usuario.");
      vscode.window.showInformationMessage("Operación cancelada por el usuario.");
      blinkStatusBarMessage("❌ Operación cancelada por el usuario.");
      return;
    }

    // 3. Generar el nombre de la carpeta madre con fecha y hora.
    const now = new Date();
    const formattedDate = now.toISOString().replace(/[:.]/g, '-');
    const appFolderName = `MyPythonApp_${formattedDate}`;
    const appFolderUri = vscode.Uri.joinPath(selectedFolder, appFolderName);
    const appFolderPath = appFolderUri.fsPath;
    this.log(`Carpeta de destino generada: ${appFolderPath}`);
    blinkStatusBarMessage(`📁 Carpeta de destino: ${appFolderPath}`);

    try {
      // 4. Clonar el repositorio en la carpeta destino.
      this.log(`Clonando repositorio desde ${this.repoUrl}...`);
      blinkStatusBarMessage("🔄 Clonando repositorio...");
      await execAsync(`git clone ${this.repoUrl} "${appFolderPath}"`, { cwd: selectedFolder.fsPath });
      this.log("Repositorio clonado exitosamente.");
      blinkStatusBarMessage("✅ Repositorio clonado exitosamente.");

      // Mensaje resumen con información de la carpeta clonada
      const summary = `Se ha clonado el repositorio en la carpeta:
- Carpeta madre: ${appFolderName}

El repositorio ya contiene la estructura base para una aplicación de escritorio en Python usando PySide6.

Librerías a instalar:
- PySide6`;

      // 5. Preguntar si desea ejecutar la aplicación (junto con el summary).
      const runApp = await vscode.window.showInformationMessage(
        summary + "\n\n¿Deseas ejecutar la aplicación?",
        { modal: true },
        "Sí",
        "No"
      );

      if (runApp === "Sí") {
        this.log("El usuario eligió ejecutar la aplicación.");
        blinkStatusBarMessage("🚀 Ejecutando la aplicación...");
        await this.executeApplication(appFolderPath);
      } else {
        this.log("El usuario optó por no ejecutar la aplicación.");
        blinkStatusBarMessage("ℹ️ Aplicación no ejecutada por el usuario.");
      }

      // 6. Preguntar si desea abrir la carpeta clonada (después de preguntar por la ejecución).
      const openFolder = await vscode.window.showInformationMessage(
        "¿Deseas abrir la carpeta generada?",
        { modal: true },
        "Sí",
        "No"
      );

      if (openFolder === "Sí") {
        this.log("Abriendo la carpeta clonada...");
        blinkStatusBarMessage("📂 Abriendo carpeta clonada...");
        await vscode.commands.executeCommand('vscode.openFolder', appFolderUri, false);
      }
    } catch (err: any) {
      this.log(`Error durante la generación del prototipo: ${err.message || err}`);
      vscode.window.showErrorMessage(`Error generando el prototipo: ${err.message || err}`);
      blinkStatusBarMessage("❌ Error en la generación del prototipo.");
    }
  }

  /**
   * Ejecuta los comandos necesarios para crear el entorno virtual, instalar dependencias y lanzar la aplicación.
   * @param appFolderPath Ruta absoluta de la carpeta clonada.
   */
  private async executeApplication(appFolderPath: string) {
    this.log("Iniciando la creación del entorno virtual...");
    blinkStatusBarMessage("🔄 Creando entorno virtual...");
    // Crear el entorno virtual usando 'py -m venv venv'
    try {
      const { stdout, stderr } = await execAsync('py -m venv venv', { cwd: appFolderPath });
      this.log("Entorno virtual creado con 'py -m venv venv'.");
      if (stdout) this.log(`stdout: ${stdout}`);
      if (stderr) this.log(`stderr: ${stderr}`);
      blinkStatusBarMessage("✅ Entorno virtual creado.");
    } catch (err: any) {
      this.log("Error creando entorno virtual con 'py -m venv venv'.");
      vscode.window.showErrorMessage("Error creando el entorno virtual. Verifica que Python esté instalado.");
      blinkStatusBarMessage("❌ Error al crear el entorno virtual.");
      return;
    }

    // Instalar dependencias con pip install -r requirements.txt
    this.log("Instalando dependencias con 'pip install -r requirements.txt'...");
    blinkStatusBarMessage("🔄 Instalando dependencias...");
    try {
      const { stdout, stderr } = await execAsync('venv\\Scripts\\pip install -r requirements.txt', { cwd: appFolderPath });
      this.log("Dependencias instaladas correctamente.");
      if (stdout) this.log(`stdout: ${stdout}`);
      if (stderr) this.log(`stderr: ${stderr}`);
      blinkStatusBarMessage("✅ Dependencias instaladas.");
    } catch (err: any) {
      this.log("Error instalando dependencias: " + err);
      vscode.window.showErrorMessage("Error instalando dependencias. Verifica el archivo requirements.txt y tu conexión a internet.");
      blinkStatusBarMessage("❌ Error en la instalación de dependencias.");
      return;
    }

    // Ejecutar la aplicación en una ventana del shell de Windows (cmd.exe)
    this.log("Ejecutando la aplicación en una ventana de cmd...");
    blinkStatusBarMessage("🚀 Ejecutando la aplicación...");
    try {
      // Comando para abrir una nueva ventana de cmd que active el entorno y ejecute la aplicación
      const command = `cmd.exe /c start cmd.exe /k "venv\\Scripts\\activate && py src\\main.py"`;
      this.log(`Comando de ejecución: ${command}`);
      exec(command, { cwd: appFolderPath }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Error al ejecutar la aplicación: ${error.message}`);
          blinkStatusBarMessage("❌ Error al ejecutar la aplicación.");
          return;
        }
        if (stdout) this.log(`stdout: ${stdout}`);
        if (stderr) this.log(`stderr: ${stderr}`);
      });
    } catch (err: any) {
      this.log("Error al ejecutar la aplicación: " + err);
      blinkStatusBarMessage("❌ Error al ejecutar la aplicación.");
    }
  }

  /**
   * Registra un mensaje en el canal de salida y lo escribe en el archivo de log.
   * @param message Mensaje a registrar.
   */
  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    this.outputChannel.appendLine(logMessage);
    console.log(logMessage);
    writeLogToFile(logMessage);
  }
}

/**
 * Función exportada para iniciar el proceso.
 */
export async function generatePythonDesktopPrototype() {
  const runner = new PythonDesktopPrototypeRunner();
  await runner.run();
}
