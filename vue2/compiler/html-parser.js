const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 以<开头

/**
 * ^    匹配一个输入或一行的开头
 * \s   匹配一个空白字符
 * *    匹配前面元字符0次或多次
 * (x)  匹配x保存x在名为$1...$9的变量中
 * \/   匹配/
 * ?    匹配前面元字符0次或1次
 */
const startTagClose = /^\s*(\/?)>/

// 匹配属性
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

// 匹配结束标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

const comment = /^<!--/

const conditionalComment = /^<!\[/

const doctype = /^<!DOCTYPE [^>]+>/i

let html,
  // 存放开始标签节点的栈
  stack = []

// _s 函数的定义
function toString(val) {
  return val == null ? '' : typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
}

// 去掉前面匹配过的字符串
function advance(n) {
  html = html.substring(n)
}

/**
 * 解析开始标签分为三部分
 * 1. 解析标签名
 * 2. 解析属性
 * 3. 解析结尾
 * @returns {tagName: string; attrs: []; unarySlash: '/'|''}
 */
export function parseStartTag() {
  // 解析标签名 判断模板是否符合开始标签的特征
  const start = html.match(startTagOpen)
  // 如果是以开始标签开头
  if (start) {
    const match = {
      tagName: start[1],
      attrs: []
    }
    advance(start[0].length)

    // 解析标签属性
    let end, attr
    while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
      advance(attr[0].length)
      match.attrs.push(attr)
    }

    // 解析道结束标签 并判断是否是自闭合标签 unarySlash 为 / 为自闭合标签
    if (end) {
      match.unarySlash = end[1]
      advance(end[0].length)
      return match
    }
  }
}

export function parseHtml(template, options) {
  html = template

  function isPlainTextElement(lastTag) {
    return ['script', 'style', 'textarea'].indexOf(lastTag) >= 0
  }

  while (html) {
    // 首先判断父元素是否为正常元素 lastTag 表示父元素 也就是 栈顶元素
    // 如果父元素不存在 或者不是纯文本元素则为正常元素
    // todo 维护一个栈 从栈里取出lastTag
    const lastTag = stack[stack.length - 1]
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // 父元素为正常元素
      // 所有类型
      // 文本
      // 注释
      // 条件注释
      // DOCTYPE
      // 结束标签
      // 开始标签

      // 除了文本类型 其他类型都是以标签形式存在的 都以<开头 所以先判断是否是文本
      let textEnd = html.indexOf('<')
      // 如果开头为标签
      if (textEnd === 0) {
        // 注释部分
        if (comment.test(html)) {
          const commentEnd = html.indexOf('-->')
          if (commentEnd >= 0) {
            // 可以配置保留注释或不保留
            if (options.shouldKeepComment) {
              options.comment(html.substring(4, commentEnd))
            }
            html = html.substring(commentEnd + 3)
            continue
          }
        }

        // 条件注释 不需要触发钩子函数
        if (conditionalComment.test(html)) {
          const conditionalEnd = html.indexOf(']>')
          if (conditionalEnd >= 0) {
            // 在vuejs里条件注释直接被去掉了 写了也白写
            html = html.substring(conditionalEnd + 2)
            continue
          }
        }

        // doctype 不需要触发钩子函数
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          html = html.substring(doctypeMatch[0].length)
          continue
        }

        // 结束标签
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          html = html.substring(endTagMatch[0].length)
          // 调用钩子函数
          options.end(endTagMatch[1])
          continue
        }

        // 开始标签
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
          // 将结果取出来调用钩子函数存到AST对象里
          options.start(startTagMatch.tagName, startTagMatch.attrs, startTagMatch.unarySlash)
          continue
        }
      }

      // 如果是文本
      // 截取文本 只需要判断第一个字符不是 < 那么一定是文本标签
      // 并且需要找到下一个 < 的位置 这个 < 之前的字符都是文本
      let text, rest, next
      if (textEnd >= 0) {
        rest = html.slice(textEnd)
        // 如果剩下的html里不是上面类型中的任何一种 并且里面还有<的话视为纯文本
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        }
        text = html.substring(0, textEnd)
        html = html.substring(textEnd)
      }

      // 如果找不到< 则全部是文本
      if (textEnd < 0) {
        text = html
        html = ''
      }
      if (options.chars && text) {
        options.chars(text)
      }
    } else {
      // 父元素为script, style, textarea
      // 纯文本的元素的处理
      // script, style, textarea 这三个标签里的内容当作纯文本处理
      const stackedTag = lastTag.toLowerCase()
      const reStackedTag =
        reCache[stackedTag] ||
        (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      const rest = html.replace(reStackedTag, function (all, text) {
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      html = rest
      options.end(stackedTag)
    }
  }
}

// 解析文本 普通文本和带变量的文本
export function parseText(text) {
  const tagRE = /\{\{((?:.|\n)+?)\}\}/g
  // 如果是纯文本 直接返回
  if (!tagRE.test(text)) {
    return
  }

  const tokens = []
  let lastIndex = (tagRE.lastIndex = 0)
  let match, index
  while ((match = tagRE.exec(text))) {
    index = match.index

    if (index > lastIndex) {
      tokens.push(JSON.stringify(text.slice(lastIndex, index)))
    }

    tokens.push(`_s(${match[1].trim()})`)

    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    tokens.push(JSON.stringify(text.slice(lastIndex)))
  }
  return tokens.join('+')
}

/**
 * 将模板转换为ast 递归的截取模板 每次截取到对应的字符串 通过钩子函数存到对象里
 * 节点的父子关系通过一个栈来维护 栈顶的元素是当前节点的父元素
 * @param {*} html 模板
 * @returns {Tree}
 *  type: 1-标签  2-带变量的文本  3-不带变量的文本或注释
 */
export function parseToAST(html) {
  let root = null

  parseHtml(html, {
    // 每次有开始标签触发
    start(tag, attrs, unary) {
      const currentParent = stack[stack.length - 1]
      let element = createASTElement(tag, attrs, currentParent)
      stack.push(element)

      // 如果是根节点就保存起来
      if (!currentParent) {
        root = element
      } else {
        // 如果有父节点 就保存到其children里
        currentParent.children.push(element)
      }
      function createASTElement(tag, attrs, parent) {
        return {
          type: 1,
          tag,
          attrsList: attrs,
          attrs: attrs.map((i) => {
            return { name: i[1], value: i[3] }
          }),
          plain: attrs.length === 0, // 表示标签是否有属性
          parent,
          children: []
        }
      }
    },
    // 每次有结束标签触发
    end(tag) {
      stack.pop()
    },
    // 每次有文本触发
    chars(text) {
      text = text.trim()
      if (text) {
        const currentParent = stack[stack.length - 1]
        const children = currentParent.children
        let expression
        if ((expression = parseText(text))) {
          children.push({
            type: 2,
            expression,
            text
          })
        } else {
          children.push({
            type: 3,
            text
          })
        }
      }
    },
    comment(text) {
      // 每次有注释触发
      const currentParent = stack[stack.length - 1]
      currentParent.children.push({ type: 3, text, isComment: true })
    }
  })

  console.log(root.attrs)

  return root
}
