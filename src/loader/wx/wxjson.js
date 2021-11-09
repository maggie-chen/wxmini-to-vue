/*
 * @Author: maggie 
 * @Date: 2021-11-08 20:00:00 
 * @Last Modified by: maggie
 * @Last Modified time: 2021-11-09 14:51:05
 * @Description: 解析 json ：组件引用
 */

const t = require('@babel/types');
const _ = require('lodash');
const defaultConfig = require('../../config/default');

/**
 *
 * @param {*} code
 * @param {*} options
 */
module.exports = (code, ast, options = defaultConfig) => {
    if (!code) {
        return ast;
    }
    const importBody = [];
    const componentsProperties = [];
    const jsonObject = JSON.parse(code);
    if (jsonObject.usingComponents) {
        for (let k in jsonObject.usingComponents) {
            const nameIdentifier = t.identifier(_.camelCase(k));
            importBody.push(t.importDeclaration([t.importDefaultSpecifier(nameIdentifier)], t.stringLiteral(jsonObject.usingComponents[k])));
            componentsProperties.push(t.objectProperty(nameIdentifier, nameIdentifier, false, true));
        }
    };
    const componentsProperty = t.objectProperty(t.identifier('components'), t.objectExpression(componentsProperties));

    // 插入 import 语句
    ast.program.body.unshift(...importBody);
    // 插入 components 引用
    const exportDefaultDeclaration = ast.program.body.find(e => e.type === 'ExportDefaultDeclaration')
    exportDefaultDeclaration.declaration.properties.unshift(componentsProperty);

    return ast;
}