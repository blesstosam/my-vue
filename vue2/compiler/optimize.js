// 1. 在ast中找到所有静态节点并标记     添加 static 属性
// 2. 在ast中找到所有静态根节点并标记    添加 staticRoot 属性

/**
 * 优化器
 * @param {*} root ast 根节点
 */
export function optimize(root) {
  if (!root) return

  makeStatic(root)

  makeStaticRoots(root)

  // 递归处理每个节点
  function makeStatic(node) {
    node.static = isStatic(node)

    // 标签节点才有子节点
    if (node.type === 1) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        makeStatic(child)

        // 如果一旦有某个子节点为动态 那么父节点也要改成动态
        if (!child.static) {
          node.static = false
        }
      }
    }
  }

  function isStatic(node) {
    if (node.type === 2) return false
    if (node.type === 3) return true

    return !!(node.pre || (
      !node.hasBindings &&  // 没有动态绑定
      !node.if &&  // 没有v-if v-else
      !node.for && // 没有v-for
      !isBuiltInTag(node.tag) && // 不是内置标签 如 slot component
      isPlatformReservedTag(node.tag) &&  // 不是组件
      !isDirectChildOfTemplateFor(node) &&  // 不带 v-for指令的template标签
      Object.keys(node).every(isStaticKey)  // 属性不存在动态节点才有的属性
    ))
  }

  function makeStaticRoots(node) {
    if (node.type === 1) {
      // 节点必须有子节点 所以type只能为1
      // 并且子节点不能只是一个静态文本的子节点 否则优化成本收益不大
      if (node.static && node.children.length &&
        !(node.children.length === 1 && node.children[0].type === 3)) {
        node.staticRoot = true
        // 第一个找到的标记为静态根节点 下面的子节点不需要再判断
        return
      } else {
        node.staticRoot = false
      }
      // 如果没找到 继续往下找
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          makeStaticRoots(child)
        }
      }
    }
  }
}