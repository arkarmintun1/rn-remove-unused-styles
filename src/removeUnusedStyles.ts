import { TextDocument, TextEditor, TextEditorEdit, window } from 'vscode';
import { parse } from '@babel/parser';
import { File, ObjectExpression } from '@babel/types';

const removeUnusedStyles = (textEditor: TextEditor, edit: TextEditorEdit) => {
  const { document } = textEditor;
  const text = document.getText();

  try {
    const ast = parse(text, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties'],
    });
    const { styleName, styleNode } = getStyleName(ast);
    const lineRanges = getLineRanges(styleName, styleNode, text);
    deleteUnusedStyles(textEditor, document, lineRanges);
  } catch (error) {
    window.showInformationMessage('Error occurred!');
  }
};

const getStyleName = (ast: File) => {
  let styleName = '';
  let styleNode: ObjectExpression | null = null;

  ast.program.body.forEach((bodyNode) => {
    if (bodyNode.type === 'VariableDeclaration') {
      bodyNode.declarations?.forEach((declarationNode) => {
        if (declarationNode.type === 'VariableDeclarator') {
          const { id, init } = declarationNode;
          if (
            id.type === 'Identifier' &&
            init?.type === 'CallExpression' &&
            init.callee.type === 'MemberExpression' &&
            init.callee.object.type === 'Identifier' &&
            init.callee.object.name === 'StyleSheet' &&
            init.callee.property.type === 'Identifier' &&
            init.callee.property.name === 'create'
          ) {
            styleName = id.name;
            const args = init.arguments as ObjectExpression[];
            styleNode = args?.[0];
          }
        }
      });
    }
  });

  return { styleName, styleNode };
};

const getLineRanges = (styleName: string, styleNode: ObjectExpression | null, text: string) => {
  const lines: number[][] = [];

  if (styleNode) {
    const properties = styleNode.properties;
    properties.forEach((property) => {
      if (
        property.type === 'ObjectProperty' &&
        property.key.type === 'Identifier' &&
        text.indexOf(`${styleName}.${property.key.name}`) === -1 &&
        property.loc?.start.line &&
        property.loc?.end.line
      ) {
        lines.push([property.loc.start.line, property.loc.end.line]);
      }
    });
  }

  return lines;
};

const deleteUnusedStyles = (textEditor: TextEditor, document: TextDocument, lines: number[][]) => {
  let deletedLines = 0;
  textEditor.edit((edit) => {
    lines.forEach((line) => {
      for (let i = line[0]; i <= line[1]; i++) {
        const textLine = document.lineAt(i - 1);
        edit.delete(textLine.rangeIncludingLineBreak);
        deletedLines++;
      }
    });
  });
  window.showInformationMessage(`delete ${deletedLines} lines ^_^!`);
};

export default removeUnusedStyles;
