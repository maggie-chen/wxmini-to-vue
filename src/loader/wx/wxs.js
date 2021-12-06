/*
 * @Author: maggie 
 * @Date: 2021-11-04 16:10:05 
 * @Last Modified by: maggie
 * @Last Modified time: 2021-11-10 16:52:36
 * @Description: 解析 wxml 中的 wxs 
 */

const htmlparser2 = require("htmlparser2");
const parser = require("@babel/parser");
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const _ = require('lodash');
const defaultConfig = require('../../config/default');


function createComputedItem(name, body, _return) {
    const computedItem = t.objectMethod('method', t.identifier(name), [], t.blockStatement([
        ...body,
        t.returnStatement(_return)
    ], []))
    return computedItem;
}

function parseWxsCode(name, code) {
    const returnObjectExpression = t.objectExpression([]); // computed return 对象表达式
    const ast = parser.parse(code)
    traverse(ast, {
        MemberExpression(path) {
            const { node, parent } = path
            // 查找所有 module.exports 
            if (t.isIdentifier(node.object) && node.object.name === 'module' && t.isIdentifier(node.property) && node.property.name === 'exports') {
                if (t.isAssignmentExpression(parent) && t.isObjectExpression(parent.right)) { // module.exports = {}
                    returnObjectExpression.properties.push(...parent.right.properties);
                } else if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) { // module.exports.xxx = any
                    const assignmentParent = path.findParent(e => t.isAssignmentExpression(e.node));
                    if (assignmentParent) {
                        returnObjectExpression.properties.push(t.objectProperty(parent.property, assignmentParent.node.right))
                    }
                }
            }
        }
    })
    const body = ast.program.body.filter(e => !t.isExpressionStatement(e))
    return createComputedItem(name, body, returnObjectExpression)
}

module.exports = (tree, ast, options = defaultConfig) => {
    // 解掉wxs标签
    const wxsNodes = htmlparser2.DomUtils.getElementsByTagName('wxs', tree.children);
    const importBody = [];
    const compoutedProperties = [];
    wxsNodes.map(node => {
        if (node.attribs.module) {
            const name = _.camelCase(node.attribs.module);
            const nameIdentifier = t.identifier(name);
            if (node.attribs.src) {
                importBody.push(t.importDeclaration([t.importDefaultSpecifier(nameIdentifier)], t.stringLiteral(node.attribs.src.replace(/\.wxs$/, '.js'))));
                compoutedProperties.push(createComputedItem(name, [], nameIdentifier))
            } else if (node.children[0] && node.children[0].type === 'text' && node.children[0].data) {
                compoutedProperties.push(parseWxsCode(name, node.children[0].data))
            }
        }
        htmlparser2.DomUtils.removeElement(node)
    })

    // 插入 import 语句
    ast.program.body.unshift(...importBody);

    // 插入 computed 属性
    const exportDefaultDeclaration = ast.program.body.find(e => e.type === 'ExportDefaultDeclaration')
    exportDefaultDeclaration.declaration.properties.push(
        t.objectProperty(t.identifier('computed'), t.objectExpression(compoutedProperties))
    )

}
