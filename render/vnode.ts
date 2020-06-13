// VNode 种类
enum VNodeFlags {
  // html 标签
  ELEMENT_HTML = 1,
  // SVG 标签
  ELEMENT_SVG = 1 << 1,

  // 普通有状态组件
  COMPONENT_STATEFUL_NORMAL = 1 << 2,
  // 需要被keepAlive的有状态组件
  COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE = 1 << 3,
  // 已经被keepAlive的有状态组件
  COMPONENT_STATEFUL_KEPT_ALIVE = 1 << 4,
  // 函数式组件
  COMPONENT_FUNCTIONAL = 1 << 5,

  // 纯文本
  TEXT = 1 << 6,
  // Fragment
  FRAGMENT = 1 << 7,
  // Portal
  PORTAL = 1 << 8
}

// html 和 svg 都是标签元素，可以用 ELEMENT 表示
VNodeFlags['ELEMENT'] = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG

// 普通有状态组件、需要被keepAlive的有状态组件、已经被keepAlice的有状态组件 都是“有状态组件” =>
// 统一用 COMPONENT_STATEFUL 表示
VNodeFlags['COMPONENT_STATEFUL'] =
  VNodeFlags.COMPONENT_STATEFUL_NORMAL |
  VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE |
  VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE

// 有状态组件 和  函数式组件都是“组件”，用 COMPONENT 表示
VNodeFlags['COMPONENT'] = VNodeFlags['COMPONENT_STATEFUL'] | VNodeFlags.COMPONENT_FUNCTIONAL

export interface VNode  {
  // _isVNode 属性在上文中没有提到，它是一个始终为 true 的值，有了它，我们就可以判断一个对象是否是 VNode 对象
  _isVNode: true,
  // el 属性在上文中也没有提到，当一个 VNode 被渲染为真实 DOM 之后，el 属性的值会引用该真实DOM
  el: Element | null,
  
  flags: number,
  tag: string | Function,
  data: {[key: string]: any},
  children: any,
  childFlags: number
}

