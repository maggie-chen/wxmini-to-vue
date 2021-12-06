/*
 * @Author: bucai
 * @Date: 2021-02-04 15:05:58
 * @LastEditors: maggiec
 * @LastEditTime: 2021-11-09 14:51:05
 * @Description:
 */

const generator = require("@babel/generator").default;
const beautify = require('js-beautify');
const { readWxComponents, combination, wxmlParser } = require('./utils');

const wxjs = require('./wxjs')
const wxml = require('./wxml')
const wxs = require('./wxs')
const wxss = require('./wxss')
const wxjson = require('./wxjson')

const transform = {
  wxjs,
  wxml,
  wxs,
  wxss,
  wxjson
};

/**
 * 小程序转换
 * @param {string} dir 组件目录
 * @param {object} options 配置
 * @returns {{name: string; code:string;}[]}
 */
module.exports = function (dir, options) {
  const components = readWxComponents(dir)
  return components.map(({ wxml, wxjs, wxss, wxjson, name }) => {
    // 解析 wxml 输出 nodeTree
    const nodeTree = wxmlParser(wxml || '');
    // 解析 js 输出 ast
    const jsAST = transform.wxjs(wxjs || '', options);
    // 解析 wxml 中的 wxs
    transform.wxs(nodeTree, jsAST, options);
    // 解析 json 输出组件引用
    transform.wxjson(wxjson || '', jsAST, options);
    const outputTemplate = transform.wxml(nodeTree || '', options);
    const outputJs = generator(jsAST).code;
    const outputCss = transform.wxss(wxss || '', options);
    // TODO: 额外加一层避免多层情况，后续再改动
    const html = beautify.html(`<div>${outputTemplate}</div>`);
    const js = beautify.js(outputJs);
    const css = beautify.css(outputCss);
    const code = combination(html, js, css);
    return {
      name,
      code,
      other: {
        wxml, wxjs, wxss
      }
    };
  });
}

module.exports.transform = transform;