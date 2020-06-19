function MyPromise(executor) {
  this.value = undefined
  this.status = 'pending'
  this.resolveCallbacks = []
  this.rejectCallbacks = []

  function resolve(data) {
    // 必须要加将函数放到宏任务里去执行
    setTimeout(() => {
      console.log(this.status, this.resolveCallbacks)
      // tip resolved 和 rejected 只能执行一次
      if (this.status !== 'pending') return
      this.value = data
      this.status = 'resolved'

      this.resolveCallbacks.forEach((cb, index) => {
        cb(this.value)
        // tip 只要回调处理过 value 就重新置为 undefined
        if (index === 0) this.value = undefined
      })
    })
  }

  function reject(reason) {
    setTimeout(() => {
      if (this.status !== 'pending') return
      this.value = reason
      this.status = 'rejected'

      // tip 如果没有注册回调处理reject就抛出错误
      if (this.rejectCallbacks.length === 0) {
        throw this.value
      }

      this.rejectCallbacks.forEach((cb, index) => {
        cb(this.value)
        // tip 只要回调处理过 value 就重新置为 undefined
        //     并且状态改为resolved
        if (index === 0) {
          this.value = undefined
          this.status = 'resolved'
        }
      })
    })
  }

  // try...catch 可以捕获回调里报错并抛出
  try {
    executor(resolve.bind(this), reject.bind(this))
  } catch (e) {
    reject(e)
  }
}

MyPromise.resolve = function (res) {
  return new MyPromise(resolve => {
    resolve(res)
  })
}

MyPromise.reject = function (res) {
  return new MyPromise((_, reject) => {
    reject(res)
  })
}

MyPromise.all = function () {
  // todo
}

MyPromise.race = function () {
  // todo
}

// then 的作用是注册回调函数
// 支持链式调用
MyPromise.prototype.then = function (onResolved, onRejected) {
  let self = this
  onResolved = typeof onResolved === 'function' ? onResolved : function (v) { return v }
  onRejected = typeof onRejected === 'function' ? onRejected : function (r) { return r }

  // 按照标准这里应该返回一个新的promise 所以必须 new Promise()
  // Promise 的状态和值取决于上一个promise是什么状态
  // 例如以下代码 
  //   如果promise1被resolved了，那么promise2的值为4，状态为resolved
  //   如果promise1被rejected了，那么promise2的值为err，状态为rejected
  // const promise2 = promise1.then((res) => {
  //   return 4
  // }, (err) => {
  //   throw err
  // })
  if (self.status === 'resolved') {
    return new Promise((resolve, reject) => {
      // todo 什么情况会出现
    })
  }

  if (self.status === 'rejected') {
    return new Promise((resolve, reject) => {
      // todo 什么情况会出现
    })
  }

  // 将回调函数包装一下收集到数组里
  if (self.status === 'pending') {
    return new Promise((resolve, reject) => {
      self.resolveCallbacks.push(() => {
        // 此时self.value已经被设置好了
        const result = onResolved(self.value);
        if (result instanceof MyPromise) {
          result.then(resolve, reject);
        } else {
          // result 为promise1返回的值 作为下个promise的值处理
          resolve(result);
        }
      })

      self.rejectCallbacks.push(() => {
        const result = onRejected(self.value);
        if (result instanceof MyPromise) {
          result.then(resolve, reject);
        } else {
          reject(result);
        }
      })
    })
  }

}

// 注册catch回调等于是调用了then方法传递了第二个参数
// 所以reject后执行then里onRejected还是catch里的回调取决于谁先注册
MyPromise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

MyPromise.prototype.finally = function (cb) {
  // todo
}

module.exports = MyPromise

var p = new MyPromise((resolve, reject) => {
  // setTimeout(() => {
  //   resolve(1)
  // }, 1000)
  reject(2)
})
p.then(res => {
  console.log(res, 1)
}, (err) => {
  console.log(err)
}).catch(e => {
  console.log(e)
})