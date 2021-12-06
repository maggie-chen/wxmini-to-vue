/*
 * @Author: bucai
 * @Date: 2021-02-04 17:24:15
 * @LastEditors: maggiec
 * @LastEditTime: 2021-11-10 14:51:05
 * @Description:
 */
const generator = require("@babel/generator").default;
const wxjs = require('../../../src/loader/wx/wxjs')

describe('loader/wx/wxjs', () => {

  test('检测转换', () => {
    const ast1 = wxjs('Page({})')
    const code1 = generator(ast1).code
    expect(typeof ast1).toBe('object')
    expect(/export default/.test(code1)).toBe(true)
    const ast2 = wxjs('Page({onLoad(){ console.log(1) }})')
    const code2 = generator(ast2).code
    expect(/created/.test(code2)).toBe(true)
    const ast3 = wxjs('import utils from \'util\';')
    const code3 = generator(ast3).code
    expect(/import utils from \'util\';/.test(code3)).toBe(true)
  });

});