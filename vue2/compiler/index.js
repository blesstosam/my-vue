
// （模板 => 渲染函数） 需要经过以下几个步骤
// 1. 将模板解析为AST(抽象语法树 Abstract Syntax Tree) => 解析器（html解析器，文本解析器，过滤器解析器）
// 2. 遍历AST标记静态节点（在更新节点时不会重新渲染，提高性能）=> 优化器
// 3. 使用AST生成渲染函数 => 代码生成器
import * as parser from './html-parser'
import * as optimize from './optimize'
import * as genRender from './gen-render'

export { parser, optimize, genRender }



