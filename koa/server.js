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

app.listen(3000);

// logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});


// response
app.use(async ctx => {
  ctx.body = 'Hello World';
});















 









