import { VNodeFlags, ChildrenFlags } from './flags'
import { createTextVNode } from './h.js'

/**
 * 渲染器，将vnode 渲染成真正的html
 * 1. 如果新老vnode都存在，将新vnode和老的做比对，将两者不同的部分更新到dom里，叫做patch（打补丁）
 * 2. 如果只有新的vnode，则直接将新的vnode挂载到容器上，叫做mount（挂载）
 * @param {*} vnode
 * @param {*} container
 */
export function render(vnode, container) {
  const prevVNode = container.vnode
  // undefined or null
  if (prevVNode == null) {
    if (vnode) {
      // 没有旧的 VNode，使用 `mount` 函数挂载全新的 VNode
      mount(vnode, container)
      // 将新的 VNode 添加到 container.vnode 属性下，这样下一次渲染时旧的 VNode 就存在了
      container.vnode = vnode
    }
  } else {
    if (vnode) {
      // 有旧的 VNode，则调用 `patch` 函数打补丁
      patch(prevVNode, vnode, container)
      container.vnode = vnode
    } else {
      // 有旧的 VNode 但是没有新的 VNode，这说明应该移除 DOM，在浏览器中可以使用 removeChild 函数。
      container.removeChild(prevVNode.el)
      container.vnode = null
    }
  }
}

function mount(vnode, container) {
  const { flags } = vnode
  const { ELEMENT, COMPONENT, TEXT, FRAGMENT, PORTAL } = VNodeFlags
  if (flags & ELEMENT) {
    mountElement(vnode, container)
  } else if (flags & COMPONENT) {
    mountComponent(vnode, container)
  } else if (flags & TEXT) {
    mountText(vnode, container)
  } else if (flags & FRAGMENT) {
    mountFragment(vnode, container)
  } else if (flags & PORTAL) {
    mountPortal(vnode, container)
  }
}

const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/
/**
 * 挂载普通标签
 * @param {*} vnode
 * @param {*} container
 * @param {*} isSVG
 */
function mountElement(vnode, container, isSVG) {
  // 4. 处理svg标签
  // 因为 svg 的书写总是以 <svg> 标签开始的，所有其他 svg 相关的标签都是 <svg> 标签的子代元素
  // 在 mountElement 函数中一旦 isSVG 为真，那么后续创建的所有子代元素都会被认为是 svg 标签
  isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
  const el = isSVG
    ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
    : document.createElement(vnode.tag)

  // 1. 将dom挂载到vnode上，这样用vnode就能引用真实的dom
  vnode.el = el

  // 2. 遍历data的属性，将这些属性，样式，事件添加到真实的dom上
  const { data } = vnode
  if (data) {
    for (let key in data) {
      patchData(el, key, null, data[key])
      // switch (key) {
      //   case 'style':
      //     for (let k in data.style) {
      //       el.style[k] = data.style[k]
      //     }
      //     break
      //   case 'class':
      //     // data.class = 'class-a class-b'
      //     data.class && (el.className = data.class)
      //     break
      //   default:
      //     // 处理dom事件
      //     if (key[0] === 'o' && key[1] === 'n') {
      //       el.addEventListener(key.slice(2), data[key])
      //     }
      //     // 几个特定的属性 只能用这种方法赋值
      //     if (domPropsRE.test(key)) {
      //       // 当作 DOM Prop 处理
      //       el[key] = data[key]
      //     } else {
      //       // 其他的标准属性和自定义属性都可以用setAttribute
      //       el.setAttribute(key, data[key])
      //     }
      //     break
      // }
    }
  }

  // 3. 递归地挂载子节点
  const { childFlags, children } = vnode
  const { NO_CHILDREN, SINGLE_VNODE, MULTIPLE_VNODES } = ChildrenFlags
  if (childFlags !== NO_CHILDREN) {
    if (childFlags & SINGLE_VNODE) {
      // 如果是单个子节点则调用 mount 函数挂载
      // 这里需要把 isSVG 传递下去
      mount(children, el, isSVG)
    } else if (childFlags & MULTIPLE_VNODES) {
      // 如果是单多个子节点则遍历并调用 mount 函数挂载
      for (let i = 0; i < children.length; i++) {
        // 这里需要把 isSVG 传递下去
        mount(children[i], el, isSVG)
      }
    }
  }

  container.appendChild(el)
}

/**
 * 挂载文本节点
 * @param {*} vnode
 * @param {*} container
 */
function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children)
  vnode.el = el
  container.appendChild(el)
}

function mountFragment(vnode, container, isSVG) {
  const { childFlags, children } = vnode
  const { NO_CHILDREN, SINGLE_VNODE, MULTIPLE_VNODES } = ChildrenFlags

  if (childFlags & SINGLE_VNODE) {
    mount(children, container, isSVG)
    // 单个子节点，就指向该节点
    vnode.el = children.el
  } else if (childFlags & NO_CHILDREN) {
    // 如果没有子节点，等价于挂载空片段，会创建一个空的文本节点占位
    const placeholder = createTextVNode('')
    mountText(placeholder, container)
    // 没有子节点指向占位的空文本节点
    vnode.el = placeholder.el
  } else if (childFlags & MULTIPLE_VNODES) {
    // 多个子节点，遍历挂载之
    for (let i = 0; i < children.length; i++) {
      mount(children[i], container, isSVG)
    }
    // 多个子节点，指向第一个子节点
    vnode.el = children[0].el
  }
}

function mountPortal(vnode, container) {
  const { tag, children, childFlags } = vnode

  // 获取挂载点
  const target = typeof tag === 'string' ? document.querySelector(tag) : tag
  if (childFlags & ChildrenFlags.SINGLE_VNODE) {
    // 将 children 挂载到 target 上，而非 container
    mount(children, target)
  } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
    for (let i = 0; i < children.length; i++) {
      // 将 children 挂载到 target 上，而非 container
      mount(children[i], target)
    }
  }

  // 占位的空文本节点
  const placeholder = createTextVNode('')
  // 将该节点挂载到 container 中
  mountText(placeholder, container, null)
  // el 属性引用该节点
  vnode.el = placeholder.el
}

function mountComponent(vnode, container, isSVG) {
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    mountStatefulComponent(vnode, container, isSVG)
  } else {
    mountFunctionalComponent(vnode, container, isSVG)
  }
}

/**
 * 挂载有状态的组件
 * @param {*} vnode
 * @param {*} container
 * @param {*} isSVG
 */
function mountStatefulComponent(vnode, container, isSVG) {
  // 创建组件实例
  // const instance = new vnode.tag()
  // 我们之所以能够通过 VNode 的 children 属性来读取组件实例，例如上面代码中的 prevVNode.children，
  // 是因为每个类型为有状态组件的 VNode，在挂载期间我们都会让其 children 属性引用组件的实例，
  // 以便能够通过 VNode 访问组件实例对象。

  // 这样我们在 patchComponent 函数中就能够通过 VNode 拿到组件实例了，
  // 这里我们再次强调：VNode 的 children 属性本应该用来存储子节点，
  // 但是对于组件类型的 VNode 来说，它的子节点都应该作为插槽存在，
  // 并且我们选择将插槽内容存储在单独的 slots 属性中，而非存储在 children 属性中，这样 children 属性就可以用来存储组件实例了
  const instance = (vnode.children = new vnode.tag())

  // 初始化 props
  // 我们知道 VNodeData 中的数据并不全是 props，其中还包含事件以及其他重要的信息，
  // 所以在真正的实现中，我们会从 VNodeData 中提取 props
  instance.$props = vnode.data

  instance._update = function () {
    // 如果 instance._mounted 为真，说明组件已挂载，应该执行更新操作
    if (instance._mounted) {
      // 1、拿到旧的 VNode
      const prevVNode = instance.$vnode
      // 2、重渲染新的 VNode
      const nextVNode = (instance.$vnode = instance.render())
      // 3、patch 更新 container 为 prevVNode.el.parentNode
      patch(prevVNode, nextVNode, prevVNode.el.parentNode)
      // 4、更新 vnode.el 和 $el
      instance.$el = vnode.el = instance.$vnode.el
    } else {
      // 1. 渲染VNode
      instance.$vnode = instance.render()
      // 2. 挂载
      mount(instance.$vnode, container, isSVG)
      // 3、组件已挂载的标识
      instance._mounted = true
      // el 属性值 和 组件实例的 $el 属性都引用组件的根DOM元素
      instance.$el = vnode.el = instance.$vnode.el
      // 5、调用 mounted 钩子
      instance.mounted && instance.mounted()
    }
  }

  instance._update()
}

/**
 * 挂载函数式组件
 * @param {*} vnode
 * @param {*} container
 * @param {*} isSVG
 */
function mountFunctionalComponent(vnode, container, isSVG) {
  // 获取 VNode
  const $vnode = vnode.tag()
  // 挂载
  mount($vnode, container, isSVG)
  // el 元素引用该组件的根元素
  vnode.el = $vnode.el
}

// --------------------------------------- patch ---------------------------------------
function patch(prevVNode, nextVNode, container) {
  // 分别拿到新旧 VNode 的类型，即 flags
  const nextFlags = nextVNode.flags
  const prevFlags = prevVNode.flags

  // 检查新旧 VNode 的类型是否相同，如果类型不同，则直接调用 replaceVNode 函数替换 VNode
  // 如果新旧 VNode 的类型相同，则根据不同的类型调用不同的比对函数
  if (prevFlags !== nextFlags) {
    replaceVNode(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.ELEMENT) {
    patchElement(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.COMPONENT) {
    patchComponent(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.TEXT) {
    patchText(prevVNode, nextVNode)
  } else if (nextFlags & VNodeFlags.FRAGMENT) {
    patchFragment(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.PORTAL) {
    patchPortal(prevVNode, nextVNode)
  }
}

function replaceVNode(prevVNode, nextVNode, container) {
  // 将旧的 VNode 所渲染的 DOM 从容器中移除
  container.removeChild(prevVNode.el)
  // 再把新的 VNode 挂载到容器中
  mount(nextVNode, container)
}

function patchElement(prevVNode, nextVNode, container) {
  // 如果新旧 VNode 描述的是不同的标签，则调用 replaceVNode 函数，使用新的 VNode 替换旧的 VNode
  if (prevVNode.tag !== nextVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container)
    return
  }

  // 拿到 el 元素，注意这时要让 nextVNode.el 也引用该元素
  const el = (nextVNode.el = prevVNode.el)
  const prevData = prevVNode.data
  const nextData = nextVNode.data

  if (nextVNode) {
    for (let key in nextData) {
      const prevValue = prevData[key]
      const nextValue = nextData[key]
      patchData(el, key, prevValue, nextValue)
    }
  }

  if (prevData) {
    for (let key in prevData) {
      const prevValue = prevData[key]
      if (prevValue && !nextData.hasOwnProperty(key)) {
        // 第四个参数为 null，代表移除数据
        patchData(el, key, prevValue, null)
      }
    }
  }

  // 调用 patchChildren 函数递归地更新子节点
  patchChildren(
    prevVNode.childFlags, // 旧的 VNode 子节点的类型
    nextVNode.childFlags, // 新的 VNode 子节点的类型
    prevVNode.children, // 旧的 VNode 子节点
    nextVNode.children, // 新的 VNode 子节点
    el // 当前标签元素，即这些子节点的父节点
  )
}

/**
 * 更新dom的数据
 * @param {*} el
 * @param {*} key
 * @param {*} prevValue
 * @param {*} nextValue
 */
function patchData(el, key, prevValue, nextValue) {
  switch (key) {
    case 'style':
      for (let k in nextValue) {
        el.style[k] = nextValue[k]
      }
      // 移除旧元素
      for (let k in prevValue) {
        if (!nextValue.hasOwnProperty(k)) {
          el.style[k] = ''
        }
      }
      break
    case 'class':
      // nextValue 有值或者为空字符串都可以
      el.className = nextValue
      break
    default:
      // 处理dom事件
      if (key[0] === 'o' && key[1] === 'n') {
        // 移除新事件
        if (prevValue) {
          el.removeEventListener(key.slice(2), prevValue)
        }
        // 添加新事件
        if (nextValue) {
          el.addEventListener(key.slice(2), nextValue)
        }
      }
      // 几个特定的属性 只能用这种方法赋值
      if (domPropsRE.test(key)) {
        // 当作 DOM Prop 处理
        el[key] = nextValue
      } else {
        // 其他的标准属性和自定义属性都可以用setAttribute
        el.setAttribute(key, nextValue)
      }
      break
  }
}

/**
 * 更新子节点 - 需要递归调用
 * @param {*} prevChildFlags
 * @param {*} nextChildFlags
 * @param {*} prevChildren
 * @param {*} nextChildren
 * @param {*} container
 */
function patchChildren(prevChildFlags, nextChildFlags, prevChildren, nextChildren, container) {
  switch (prevChildFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新旧的 children 都是单个子节点时，会执行该 case 语句块
          // 此时 prevChildren 和 nextChildren 都是 VNode 对象 递归地调用 patch 即可
          patch(prevChildren, nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点时，旧的是单个子节点，会执行该 case 语句块
          // 直接删除该子节点
          // todo 如果prevChildren是Fragment需要加个处理
          container.removeChild(prevChildren.el)
          break
        default:
          // 新的 children 是多个子节点，旧的是单个子节点，会执行该 case 语句块
          // 移除旧的单个子节点
          container.removeChild(prevChildren.el)
          // 遍历新的多个子节点，逐个挂载到容器中
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
      break
    case ChildrenFlags.NO_CHILDREN:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 是单个子节点时，旧的没有子节点 会执行该 case 语句块
          mount(nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点时，旧的没有子节点 会执行该 case 语句块
          break
        default:
          // 新的 children 中有多个子节点时，旧的没有子节点 会执行该 case 语句块
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
      break
    default:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 是单个子节点时，旧的是多个子节点 会执行该 case 语句块
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          mount(nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点时，旧的是多个子节点 会执行该 case 语句块
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          break
        default:
          // 新的 children 中有多个子节点时，旧的是多个子节点 会执行该 case 语句块
          // 遍历旧的子节点，将其全部移除
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          // 遍历新的子节点，将其全部添加
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
      break
  }
}

function patchText(prevVNode, nextVNode) {
  // 拿到文本元素 el，同时让 nextVNode.el 指向该文本元素
  const el = (nextVNode.el = prevVNode.el)
  // 只有当新旧文本内容不一致时才有必要更新
  if (nextVNode.children !== prevVNode.children) {
    // 更新文本内容
    el.nodeValue = nextVNode.children
  }
}

function patchFragment(prevVNode, nextVNode, container) {
  // 直接调用 patchChildren 函数更新 新旧片段的子节点即可
  patchChildren(
    prevVNode.childFlags, // 旧片段的子节点类型
    nextVNode.childFlags, // 新片段的子节点类型
    prevVNode.children, // 旧片段的子节点
    nextVNode.children, // 新片段的子节点
    container
  )

  switch (nextVNode.childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      nextVNode.el = nextVNode.children.el
      break
    case ChildrenFlags.NO_CHILDREN:
      nextVNode.el = prevVNode.el
      break
    default:
      nextVNode.el = nextVNode.children[0].el
  }
}

function patchPortal(prevVNode, nextVNode) {
  patchChildren(
    prevVNode.childFlags,
    nextVNode.childFlags,
    prevVNode.children,
    nextVNode.children,
    prevVNode.tag // 注意容器元素是旧的 container
  )

  // 让 nextVNode.el 指向 prevVNode.el
  // 该节点始终是一个文本占位节点
  nextVNode.el = prevVNode.el

  // 如果新旧容器不同，才需要搬运
  if (nextVNode.tag !== prevVNode.tag) {
    // 获取新的容器元素，即挂载目标
    const container =
      typeof nextVNode.tag === 'string' ? document.querySelector(nextVNode.tag) : nextVNode.tag

    switch (nextVNode.childFlags) {
      case ChildrenFlags.SINGLE_VNODE:
        // 如果新的 Portal 是单个子节点，就把该节点搬运到新容器中
        container.appendChild(nextVNode.children.el)
        break
      case ChildrenFlags.NO_CHILDREN:
        // 新的 Portal 没有子节点，不需要搬运
        break
      default:
        // 如果新的 Portal 是多个子节点，遍历逐个将它们搬运到新容器中
        for (let i = 0; i < nextVNode.children.length; i++) {
          container.appendChild(nextVNode.children[i].el)
        }
        break
    }
  }
}

function patchComponent(prevVNode, nextVNode, container) {
  // 检查组件是否是有状态组件
  if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    // 1、获取组件实例
    const instance = (nextVNode.children = prevVNode.children)
    // 2、更新 props
    instance.$props = nextVNode.data
    // 3、更新组件
    instance._update()
  }
}
