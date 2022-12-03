import * as vscode from 'vscode';
import removeUnusedStyles from './removeUnusedStyles';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerTextEditorCommand(
    'rn-remove-unused-styles.removeUnusedStyles',
    removeUnusedStyles
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
