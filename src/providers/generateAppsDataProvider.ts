// src/providers/generateAppsDataProvider.ts
import * as vscode from 'vscode';

export class GenerateAppsDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  onDidChangeTreeData?: vscode.Event<void | vscode.TreeItem | null | undefined>;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) {
      // Ítem para "Escoger prototipo a generar..."
      const selectPrototypeItem = new vscode.TreeItem('Escoger prototipo a generar...', vscode.TreeItemCollapsibleState.None);
      selectPrototypeItem.command = {
        command: 'ai-prog.openPrototypeSelector',
        title: 'Seleccionar prototipo'
      };
  
      // Ítem para "Editar aplicación con IA"
      const editAppItem = new vscode.TreeItem('Editar aplicación con IA', vscode.TreeItemCollapsibleState.None);
      editAppItem.command = {
        command: 'ai-prog.editAppWithIA',
        title: 'Editar aplicación con IA'
      };
  
      return [selectPrototypeItem, editAppItem];
    }
    return [];
  }
  
}
