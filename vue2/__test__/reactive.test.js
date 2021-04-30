import { Watcher, initData } from '../observe/reactive';

test('test Watcher => to watch obj.c.cc', () => {
  let obj = { b: 'b', c: { cc: 'cc' }, arr: [1, 2, 3], d: 'd' }
  initData(obj)

  let flag = false
  let newCC = 'cc---new'
  new Watcher('c.cc', (newVal, oldVal) => {
    if (newVal === newCC && oldVal === 'cc') {
      flag = true
    }
  }, obj)

  obj.c.cc = newCC
  expect(flag).toBe(true)
})

test('test Watcher => to watch obj.b', () => {
  let obj = { b: 'b', c: { cc: 'cc' }, arr: [1, 2, 3], d: 'd' }
  initData(obj)

  let flag = false
  let newB = 'b---new'
  new Watcher('b', (newVal, oldVal) => {
    if (newVal === newB && oldVal === 'b') {
      flag = true
    }
  }, obj)

  obj.b = newB
  expect(flag).toBe(true)
})

test('test Watcher => to watch obj.arr', () => {
  let obj = { b: 'b', c: { cc: 'cc' }, arr: [1, 2, 3], d: 'd' }
  initData(obj)

  let flag = false
  new Watcher('arr', (newVal, oldVal) => {
    if (newVal[3] === 4 && oldVal[2] === 3) {
      flag = true
    }
  }, obj)

  obj.arr.push(4)
  expect(flag).toBe(true)
})
