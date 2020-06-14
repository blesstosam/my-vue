
// var cls = [
//   'class-a',
//   {
//     'class-b': true,
//     'class-c': true
//   }
// ]

// function parse(cls) {
//   var str = '';
//   if (Array.isArray(cls)) {
//     cls.forEach(i => {
//       if (typeof i === 'string') {
//         str += `${i} `
//       } else {
//         str += parse(i) + ' '
//       }
//     })
//   } else if (typeof cls === 'object') {
//     Object.keys(cls).forEach(key => {
//       cls[key] && (str += `${key} `)
//     })
//   } else if (typeof cls === 'string') {
//     str += `${cls} `
//   }
//   return str
// }
// console.log(parse(cls));

// ---------------------------------------------------------------------------------------------



// import {h, init} from 'snabbdom'

// // init 方法用来创建 patch 函数
// const patch = init([])

// const MyComponent = props => h('h1', props.title)

// console.log(MyComponent({title: 'hah'}))

// const prevVnode = MyComponent({title: 'hah'});

// patch(document.body, prevVnode)

// // 数据变更，产出新的 VNode
// const nextVnode = MyComponent({ title: 'next' })
// // 通过对比新旧 VNode，高效地渲染真实 DOM
// patch(prevVnode, nextVnode)

// ---------------------------------------------------------------------------------------------

import { VNodeFlags, ChildrenFlags } from './flags'


export const Fragment = Symbol()
export const Portal = Symbol()

/**
 * 创建元素类型的VNode
 * @param {*} tag 
 * @param {*} data 
 * @param {*} children
 * @returns {VNode} 
 */
export function h(tag, data = null, children = null) {
  let flags = null
  if (typeof tag === 'string') {

    flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML

    // 序列化class
    if (data) data.class = normalizeClass(data.class)

  } else if (tag === Fragment) {

    flags = VNodeFlags.FRAGMENT

  } else if (tag === Portal) {

    flags = VNodeFlags.PORTAL
    tag = data && data.target

  } else {  // 组件类型
    // vue2的对象式组件
    if (tag !== null && typeof tag === 'object') {
      flags = tag.functional ? // functional 为true表示函数式组件
        VNodeFlags.COMPONENT_FUNCTIONAL :     // 函数式组件
        VNodeFlags.COMPONENT_STATEFUL_NORMAL  // 有状态组件
    } else if (typeof tag === 'function') {
      // vue3 的类组件
      // 在 Vue3 中，因为有状态组件会继承基类 (基类中有render函数)
      // 所以通过原型链判断其原型中是否有 render 函数的定义来确定该组件是否是有状态组件
      flags = tag.prototype && tag.prototype.render ?
        VNodeFlags.COMPONENT_STATEFUL_NORMAL :
        VNodeFlags.COMPONENT_FUNCTIONAL
    }

  }

  let childFlags = null
  if (Array.isArray(children)) {
    const { length } = children.length
    if (length === 0) {
      // 没有 children
      childFlags = ChildrenFlags.NO_CHILDREN
    } else if (length === 1) {
      // 单个子节点
      childFlags = ChildrenFlags.SINGLE_VNODE
      children = children[0]
    } else {
      // 多个子节点，且子节点使用key 如果没有key 会加一个默认的key
      childFlags = ChildrenFlags.KEYED_VNODES
      children = normalizeVNodes(children)
    }
  } else if (children == null) {
    // 没有 children
    childFlags = ChildrenFlags.NO_CHILDREN
  } else if (children._isVNode) {
    // 单个子节点
    childFlags = ChildrenFlags.SINGLE_VNODE
  } else {
    // 其他情况都作为文本节点处理，即单个子节点，会调用 createTextVNode 创建纯文本类型的 VNode
    childFlags = ChildrenFlags.SINGLE_VNODE
    children = createTextVNode(children + '')
  }

  return {
    _isVNode: true,
    flags,
    tag,
    data,
    children,
    childFlags,
    el: null
  }
}

export const createElement = h

function normalizeVNodes(children) {
  const newChildren = []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.ley == null) {
      // 如果原来的 VNode 没有key，则使用竖线(|)与该VNode在数组中的索引拼接而成的字符串作为key
      child.key = '|' + i
    }
    newChildren.push(child)
  }
  // 返回新的children，此时 children 的类型就是 ChildrenFlags.KEYED_VNODES
  return newChildren
}

/**
 * 创建文本节点的VNode
 * @param {*} text 
 * @returns {Vnode}
 */
export function createTextVNode(text) {
  return {
    _isVNode: true,
    // flags 是 VNodeFlags.TEXT
    flags: VNodeFlags.TEXT,
    tag: null,
    data: null,
    // 纯文本类型的 VNode，其 children 属性存储的是与之相符的文本内容
    children: text,
    // 文本节点没有子节点
    childFlags: ChildrenFlags.NO_CHILDREN,
    el: null
  }
}

/**
 * 序列化class
 * @param {*} classValue 
 * @returns {string}
 */
function normalizeClass(classValue) {
  let res = ''
  if (typeof classValue === 'string') {
    res = classValue
  } else if (Array.isArray(classValue)) {
    for (let i = 0; i < classValue.length; i++) {
      res += normalizeClass(classValue[i]) + ' '
    }
  } else if (typeof classValue === 'object') {
    for (const name in classValue) {
      if (classValue[name]) {
        res += name + ' '
      }
    }
  }
  return res.trim()
}

// const elementVNode = h('div', null, h('span'))
// console.log(elementVNode)

// const node1 = h(Fragment, null, [
//   h('td', null, [h('span'), h('span')]), h('td')
// ])
// console.log(node1)

// 函数式组件
// function MyFunctionComponent() { }
// const node2 = h(MyFunctionComponent, null, h('div'))
// console.log(node2)


// 有状态组件
// class Component {
//   render() {
//     throw '组件缺少 render 函数'
//   }
// }
// class MyStatefulComponent extends Component { }
// const node3 = h(MyStatefulComponent, null, h('div'))
// console.log(node3)



