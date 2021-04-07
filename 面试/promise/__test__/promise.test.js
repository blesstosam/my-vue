const MyPromise = require('../index')

test('test `MyPromise` resolve(1)', (done) => {
  const p = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve(1)
    }, 1000)
  })


  p.then(res => {
    expect(res).toBe(1)
    // 异步函数必须调用done方法
    done()
  })
    .then(res1 => {
      // 前面的then调用后value变为undefined
      expect(res1).toBe(undefined)
    })
})

test('test `MyPromise` reject("err")', (done) => {
  var p = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      reject('err')
    }, 1000)
  })

  p.then(res => {

  }, (err) => {
    expect(err).toBe('err')
    done()
  }).catch(err => {
    expect(err).toBe(undefined)
    done()
  })
})

test('test `MyPromise` return 10', (done) => {
  var p = new MyPromise((resolve, reject) => {
    resolve(1)
  })

  p.then(res => {
    return 10
  }).then(res1 => {
    expect(res1).toBe(10)
    done()
  })
})


// MyPromise.resolve(1).then(res => { console.log(res) })
// MyPromise.reject('error').catch(err => { console.log(err) })