const { parseToAST, parseText } = require('../compile/html-parser')

test('test `parseToAST` params => <div class="wrap"><span>hello {{name}}</span></div>', () => {
  const html = '<div class="wrap"><span>hello {{name}}</span></div>'

  // ast = {
  //   type: 1,
  //   tag: 'div',
  //   attrsList: [[]],
  //   parent: undefined,
  //   children: [
  //     {
  //       type: 1,
  //       tag: 'span',
  //       attrsList: [],
  //       parent: {type: 1, tag: 'div', /*...*/},
  //       children: [
  //         {
  //           type: 2,
  //           text: 'hello',
  //           expression: '"hello "+_s(name)'
  //         }
  //       ]
  //     }
  //   ],
  // }

  const ast = parseToAST(html)

  expect(ast.tag).toBe('div')
  expect(ast.children[0].tag).toBe('span')
  expect(ast.children[0].children[0].text).toBe('hello {{name}}')
  expect(ast.children[0].children[0].expression).toBe('"hello "+_s(name)')
})

test('test `parseText` params => 你好{{name}}', () => {
  expect(parseText('你好{{name}}')).toBe('"你好"+_s(name)')
})

test('test `parseText` params => 你好{{name}}，已经{{age}}岁了', () => {
  expect(parseText('你好{{name}}，已经{{age}}岁了')).toBe('"你好"+_s(name)+"，已经"+_s(age)+"岁了"')
})