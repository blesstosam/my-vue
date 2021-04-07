import { h, Fragment, Portal } from './h.js'
import { render } from './render.js'

const elementVNode = h('div',
  {
    style: {
      height: '100px',
      width: '100px',
      background: 'red',
      position: 'relative'
    },
    class: [
      'cls-a',
      {
        'clas-b': true,
        'cls-c': false,
      },
      ['cls-d']
    ],
    onclick: function (e) {
      console.log(e)
    }
  },
  // h('div', {
  //   style: {
  //     height: '50px',
  //     width: '50px',
  //     background: 'green',
  //     position: 'absolute',
  //     top: '50%',
  //     left: '50%',
  //     transform: 'translate(-50%, -50%)'
  //   }
  // }, 'hah')
  // h(Fragment, null, [
  //   h('span', null, '我是标题1......'),
  //   h('span', null, '我是标题2......')
  // ]),
  h(Portal, { target: '#portal-box' }, [
    h('span', null, '我是标题1......'),
    h('span', null, '我是标题2......')
  ])
)
console.log(elementVNode, 11)
const elementVNode2 = h('input',
  {
    class: { 'cls-a': true },
    type: 'checkbox',
    checked: true,
    custom: '1'
  }
)
// console.log(elementVNode)

class MyComp {
  render() {
    return h(
      'div',
      {
        style: {
          background: 'green'
        }
      },
      [
        h('span', null, '我是组件的标题1......'),
        h('span', null, '我是组件的标题2......')
      ]
    )
  }
}
const compVnode = h(MyComp)

function MyFunctionalComponent() {
  // 返回要渲染的内容描述，即 VNode
  return h(
    'div',
    {
      style: {
        background: 'red'
      }
    },
    [
      h('span', null, '我是函数式组件......'),
      h('span', null, '我是函数式组件......')
    ]
  )
}

function MyFunctionalComponent2() {
  // 返回要渲染的内容描述，即 VNode
  return h(
    'div',
    {
      style: {
        background: 'yellow'
      }
    },
    [
      h('span', null, '我是函数式组件......'),
      h('span', null, '我是函数式组件......')
    ]
  )
}

const funVnode = h(MyFunctionalComponent)
const funVnode2 = h(MyFunctionalComponent2)
// console.log(funVnode, funVnode2)

// ***************************************************** 测试 新旧的 children 都是单个子节点时
// render(h('div', null,
//   h('p', {
//     style: {
//       width: '100px',
//       height: '100px',
//       background: 'red'
//     }
//   })
// ), document.querySelector('#app'))
// window.reRender = () => {
//   render(h('div', null,
//     h('p', {
//       style: {
//         width: '100px',
//         height: '100px',
//         background: 'green'
//       }
//     })
//   ), document.querySelector('#app'))
// }

// ***************************************************** 测试 新的 children 中没有子节点时，旧的是单个子节点
// render(h('div', null,
//   h('p', {
//     style: {
//       width: '100px',
//       height: '100px',
//       background: 'red'
//     }
//   })
// ), document.querySelector('#app'))
// window.reRender = () => {
//   render(h('div', null
//   ), document.querySelector('#app'))
// }

// ***************************************************** 测试  新的 children 是多个子节点，旧的是单个子节点
// render(h('div', null,
//   h('p', {
//     style: {
//       width: '100px',
//       height: '100px',
//       background: 'red'
//     }
//   })
// ), document.querySelector('#app'))
// window.reRender = () => {
//   render(h('div', null,
//     [
//       h('p', {
//         style: {
//           width: '50px',
//           height: '50px',
//           background: 'green'
//         }
//       }),
//       h('p', {
//         style: {
//           width: '50px',
//           height: '50px',
//           background: 'green'
//         }
//       })
//     ]
//   ), document.querySelector('#app'))
// }


// ***************************************************** 测试  patch文本
// render(h('div', null,
//   '旧文本'
// ), document.querySelector('#app'))
// window.reRender = () => {
//   render(h('div', null,
//   '新文本-----'
//   ), document.querySelector('#app'))
// }


// *****************************************************   测试  patch Fragment
// render(h(Fragment, null,
//   [
//     h('p', null, '旧片段子节点 1'),
//     h('p', null, '旧片段子节点 2')
//   ]
// ), document.querySelector('#app'))
// window.reRender = () => {
//   render(h(Fragment, null,
//     [
//       h('p', null, '新片段子节点 1'),
//       h('p', null, '新片段子节点 2')
//     ]
//   ), document.querySelector('#app'))
// }

// ***************************************************** 测试  patch Portal
// render(h(Portal,
//   { target: '#portal-box' },
//   h('p', null, '旧的 Portal')
// ), document.querySelector('#app'))
// window.reRender = () => {
//   render(h(Portal,
//     { target: '#portal-box-new' },
//     h('p', null, '新的 Portal')
//   ), document.querySelector('#app'))
// }


// ***************************************************** 测试  有状态组件 data更新
// class MyComponent {
//   // 自身状态 or 本地状态
//   constructor() {
//     this.localState = 'one'
//   }
//   // localState = 'one'

//   // mounted 钩子
//   mounted() {
//     // 两秒钟之后修改本地状态的值，并重新调用 _update() 函数更新组件
//     setTimeout(() => {
//       this.localState = 'two'
//       this._update()
//     }, 3000)
//   }

//   render() {
//     return h('div', null, this.localState)
//   }
// }
// render(h(MyComponent), document.querySelector('#app'))


// ***************************************************** 测试  有状态组件 props更新
// 子组件类
class ChildComponent {
  render() {
    // 子组件中访问外部状态：this.$props.text
    return h('div', null, this.$props.text)
  }
}
// 父组件类
class ParentComponent {
  constructor() {
    this.localState = 'one'
  }

  mounted() {
    // 两秒钟后将 localState 的值修改为 'two'
    setTimeout(() => {
      this.localState = 'two'
      this._update()
    }, 2000)
  }

  render() {
    return h(ChildComponent, {
      // 父组件向子组件传递的 props
      text: this.localState
    })
  }
}
render(h(ParentComponent), document.querySelector('#app'))







