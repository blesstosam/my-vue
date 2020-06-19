function MyPromise(executor) {
  this.value = undefined
  this.status = 'pending'
  this.callbacks = []
  this.rejectCallbacks = []

  function resolve(data) {
    // 必须要加将函数放到宏任务里去执行
    setTimeout(() => {
      // tip resolved 和 rejected 只能执行一次
      if (this.status !== 'pending') return
      this.value = data
      this.status = 'resolved'

      this.callbacks.forEach((cb, index) => {
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
  // 将回调收集到数组里
  typeof onResolved === 'function' && this.callbacks.push(onResolved)
  typeof onRejected === 'function' && this.rejectCallbacks.push(onRejected)
  return this
}

MyPromise.prototype.catch = function (onRejected) {
  typeof onRejected === 'function' && this.rejectCallbacks.push(onRejected)
  return this
}

MyPromise.prototype.finally = function (cb) {
  // todo
}

// MyPromise.resolve(1).then(res => { console.log(res) })
// MyPromise.reject('error').catch(err => { console.log(err) })

var p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(1)
  }, 1000)
  // resolve(2)
})

console.log(p)
p.then(res => {
  console.log(res, 1)
}, (err) => {
  console.log(err, 'in then')
}).catch(err => {
  console.log(err, 'in catch');
}).then(res => {
  console.log(res, 2)
})