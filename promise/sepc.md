# Promise/A+规范

## 1. 术语

1.1 `promise` 是一个对象或者函数并带有 then 方法  
1.2 `thenable` 是表示一个对象或函数已经定义了 then 方法
1.3 `value` 是任何合法的数据类型（包括 undefined，thenable，promise）  
1.4 `exception` 是用 throw 来抛出的错误  
1.5 `reason` 是 promise 被 reject 的原因

## 2. 要求

### 2.1 Promise 状态

promise 的状态一定是 pending, fulfilled, or rejected 三者中的一个

2.1.1 当 pending 时  
&nbsp;&nbsp;2.1.1.1 会转换到 fulfilled 或者 rejected
2.1.2 当 fulfilled 时  
&nbsp;&nbsp;2.1.1.1 不能转成其他状态
&nbsp;&nbsp;2.1.1.2 要有一个 value，且 value 不可更改
2.1.3 当 rejected 时  
&nbsp;&nbsp;2.1.1.1 不能转成其他状态
&nbsp;&nbsp;2.1.1.2 要有一个 value，且 value 不可更改

Here, “must not change” means immutable identity (i.e. ===), but does not imply deep immutability.

### 2.2 then 方法

promise 必须提供一个 then 方法 来访问当亲或最终的 value 或 reason
then 方法接受两个参数

```js
promise.then(onFulfilled, onRejected);
```

2.2.1 onFulfilled 和 onRejected 都是可选项

&nbsp;&nbsp;2.2.1.1 如果 onFulfilled 不是函数就忽略
&nbsp;&nbsp;2.2.1.2 如果 onRejected 不是函数就忽略

2.2.2 如果 onFulfilled 为函数

&nbsp;&nbsp;2.2.2.1 其应当在 promise 为 fulfilled 之后被执行，并且将 value 最为其第一个参数传入  
&nbsp;&nbsp;2.2.2.2 其不能在 promise fulfilled 之前被执行  
&nbsp;&nbsp;2.2.2.3 其不能被调用超过一次

2.2.3 如果 onRejected 为函数

&nbsp;&nbsp;2.2.3.1 其应当在 promise 为 rejected 之后被执行，并且将 reason 最为其第一个参数传入  
&nbsp;&nbsp;2.2.3.2 其不能在 promise rejected 之前被执行  
&nbsp;&nbsp;2.2.3.3 其不能被调用超过一次

2.2.4 onFulfilled or onRejected must not be called until the execution context stack contains only platform code. [3.1]  
这句话表示 onFulfilled 或 onRejected 要被异步执行，在 then 方法被调用后的事件循环（Event Loop）之后。  
（并且文档提到实现这种效果，可以使用宏任务如 setTimeout setImmediate，或者微任务 MutationObserver 或 process.nextTick，或者自己实现一个任务队列来调度）

2.2.5 onFulfilled and onRejected must be called as functions (i.e. with no this value). [3.2]  
这句话表示在严格模式下 函数内部的 this 为 undefined，非严格模式下，this 为全局对象

2.2.6 then 可以被相同的 promise 调用多次
&nbsp;&nbsp;2.2.6.1 当 promise fulfilled 后 所有的 onFulfilled 必须按顺序执行
&nbsp;&nbsp;2.2.6.2 当 promise rejected 后 所有的 onRejected 必须按顺序执行

2.2.7 then 必须返回一个 promise

```js
promise2 = promise1.then(onFulfilled, onRejected);
```

&nbsp;&nbsp;2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x)
