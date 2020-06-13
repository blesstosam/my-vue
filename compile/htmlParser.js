const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)  // 以<开头

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

const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

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
function parseStartTag() {
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

var html = '<div class="xxx" id="22">111</div>'
const startTagMatch = parseStartTag()
if (startTagMatch) {
  // 将结果取出来调用钩子函数存到AST对象里
  handleStartTag(startTagMatch)
  continue
}

const endTagMatch = html.match(endTag)
if (endTagMatch) {
  html = html.substring(endTagMatch[0].length)
  // 调用钩子函数
  options.end(endTagMatch[1])
  continue
}