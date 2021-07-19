// 定义一个对象上的属性
export function def(obj, key, value, enumerable) {
  Object.defineProperty(obj, key, {
    value,
    enumerable: !!enumerable,
    configurable: true,
    writable: true
  })
}

// 判断对象是否是 ‘{}’ 或者 ‘new Object()’ 生成的
export function isPlainObject(obj) {
  const OP = Object.prototype
  return OP.toString.call(obj) === '[object Object]'
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}
