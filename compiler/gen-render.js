/**
 * 生成render函数 递归的调用下面的函数拼成字符串
 * _c => createElement 
 * _v => createTextVNode
 * _e => createEmptyNode 
 * _s => toString() 见html-parser的定义
 */
export function genNode(node, state) {
  if (node.type === 1) {
    // 元素节点
    return genElement(node, state)
  }
  if (node.type === 3 && node.isComment) {
    //注释
    return genComment(node)
  } else {
    // 文本
    return genText(node)
  }
}

// 生成标签
function genElement(el, state) {
  const data = el.plain ? undefined : genData(el, state)

  const children = genChildren(el, state)
  const code = `_c('${el.tag}'${data ? `,${data}` : ''}${children ? `,${children}` : ''})`
  return code
}

function genData(el, state) {
  let data = '{'
  if (el.key) {
    data += `key:${el.key},`
  }
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  if (el.pre) {
    data += `pre:true,`
  }
  if (el.attrs) {
    let attrsVal = '{'
    el.attrs.forEach(i => {
      attrsVal += `${JSON.stringify(i.name)}:${JSON.stringify(i.value)},`
    })
    attrsVal = attrsVal.replace(/,$/, '') + '}'
    data += `attrs:${attrsVal},`
  }
  data = data.replace(/,$/, '') + '}'
  return data
}

function genChildren(el, state) {
  const children = el.children
  if (children.length) {
    return `[${children.map(c => genNode(c, state)).join(',')}]`
  }
}

function genText(node) {
  // type === 2 表示带变量
  // JSON.stringify 可以包装一层字符串 'hello' => "'hello'"
  return `_v(${node.type === 2 ? node.expression : JSON.stringify(node.text)})`
}

function genComment(node) {
  return `_e(${JSON.stringify(node.text)})`
}

// 加上with
export function genWidth(ast) {
  return `with(this){return ${genNode(ast)}}`
}