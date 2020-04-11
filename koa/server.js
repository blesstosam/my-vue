// const EventEmitter = require('events');

// class MyEmitter extends EventEmitter {}

// const myEmitter = new MyEmitter();
// myEmitter.on('event', () => {
//   console.log('an event occurred!');
// });
// myEmitter.emit('event');


/********************* 测试 koa-compose **************************/
// const compose = require('koa-compose')

// const middleware = []
// middleware.push(function(ctx, next) {
// 	console.log(1)
// 	next()
// 	console.log(2)
// })

// middleware.push(function(ctx, next) {
// 	console.log(3)
// 	next()
// 	console.log(4)
// })

// middleware.push(function() {
// 	console.log(5)
// })

// const fn = compose(middleware)

// console.log(fn)

// fn()

// const f = () => {console.log(1)}
// Promise.resolve(f())


/********************* 测试 koa **************************/
const Koa = require('koa');
const app = new Koa();

app.listen(6001, () => {console.log('listen 6000')});

// logger
app.use(async (ctx, next) => {
  ctx.respond=false
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(ctx.response, '---', ctx.res.getHeader('Content-Type'), 222)
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});


// response
app.use(async ctx => {
  // console.log(ctx.response)
  ctx.body = 'Hello World';
  // ctx.type="application/json"
  ctx.res.end('Hello World')
});















 









