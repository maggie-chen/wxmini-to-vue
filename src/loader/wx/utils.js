/*
 * @Author: bucai<1450941858@qq.com>
 * @Date: 2021-11-03 17:21:48
 * @LastEditors: maggiec
 * @LastEditTime: 2021-11-09 14:51:05
 * @Description: 
 */
const fs = require('fs');
const path = require('path');
const htmlparser2 = require("htmlparser2");
const FAKE_ROOT = Symbol.for('fake-root');

/**
 * 读取微信组件
 * @param {string} dir 入口目录
 */
function readWxComponents (dir) {
  const stat = fs.statSync(dir)
  if (!stat.isDirectory()) throw new Error("该路径错误或不存在")

  const fileList = fs.readdirSync(dir);

  const componentNameList = fileList
    .filter(item => /\.wxml$/.test(item))
    .map(item => item.replace('.wxml', ''));

  return componentNameList.map(name => {
    // 检测 wxml
    // 检测 wxss
    // 检测 wxjs
    // 检测 json
    const [wxml, wxss, wxjs, wxjson] = ['wxml', 'wxss', 'js', 'json'].map((type) => {
      const filePath = path.join(dir, name + '.' + type);
      // fix：允许文件结构不全，默认返回空字符
      try {
        const stat = fs.statSync(filePath)
        if (!stat.isFile()) return null;
        const code = fs.readFileSync(filePath).toString('utf-8')
        return code
      } catch (error) {
        return ''
      }
    });
    return {
      wxml,
      wxss,
      wxjs,
      wxjson,
      name
    };
  }).filter(({ wxml }) => wxml);
};

/**
 * 组装
 * @param {string} template
 * @param {string} js
 * @param {string} css
 */
function combination(template, js, css) {
  const code = `<template>\n${template}\n</template>\n<script>\n${js}\n</script>\n<style lang="scss" scoped>\n${css}\n</style>\n`;
  return code;
}

/**
 * 解析WXML
 * @param {*} doc 
 * @returns 
 */
const wxmlParser = (doc) => {
  const handler = new htmlparser2.DomHandler();
  const parser = new htmlparser2.Parser(handler, {
      xmlMode: false,
      lowerCaseAttributeNames: false,
      recognizeSelfClosing: true,
      lowerCaseTags: false
  });
  parser.end(doc);
  return {
      type: 'tag',
      name: FAKE_ROOT,
      attribs: {},
      children: Array.isArray(handler.dom) ? handler.dom : [handler.dom]
  }
}

module.exports = {
  readWxComponents,
  combination,
  wxmlParser
}