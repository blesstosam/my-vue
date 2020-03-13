import { def, isPlainObject } from '../util'

var obj = { b: 1, c: { cc: 2 }, arr: [1, 2, 3], d: 'dd' }


class Dep {
	constructor() {
		this.subs = []
	}
	depend() {
		console.log('push dep', Dep.target)
		if (Dep.target) {
			this.subs.push(Dep.target)
		}
	}
	notify(newVal, oldVal) {
		for (let i = 0; i < this.subs.length; i++) {
			const fn = this.subs[i].fn
			fn(newVal, oldVal)
		}
	}
}
Dep.target = null
function pushTarget(watch) {
	Dep.target = watch
}


class Watch {
	constructor(exp, fn, data) {
		this.exp = exp
		this.fn = fn
		pushTarget(this)

		// 触发getter 用于收集依赖 包括数组的依赖
		data[exp]
	}
}



/**
 * Observer 将data劫持成getter和setter
 */
class Observer {
	constructor(data) {
		this.value = data
		// 这个dep专门用来收集数组的依赖
		// 每个数组都会带一个observer 这个observer
		this.dep = new Dep()
		// 将 这个observer 挂在每个数组和对象下面
		// 如果是数组可以通过d.__ob__.dep.depend() 来收集依赖 见 dependArray
		def(data, '__ob__', this)

		if (Array.isArray(data)) {
			// var data = {
			// 	arr: [
			// 		{
			// 			a: 1,
			// 			b: 2, 
			// 			c: [1, 2, 3]
			// 		}
			// 	],
			// 	a: 1
			// }
			// 改写该数组的原型方法
			overrideArrayProto(data)
			this.observeArray(data)
		} else {
			this.walk(data);
		}
	}

	// 遍历data对象进行数据劫持
	walk(data) {
		Object.keys(data).forEach(key => {
			defineReactive(data, key)
		})
	}


	// 对数组进行劫持
	observeArray(arr) {
		// 如果元素不是对象或者数组 则不需要继续observe
		// 如果有元素是对象或数组 递归observe每个数组的元素
		for (let i = 0, l = arr.length; i < l; i++) {
			observe(arr[i])
		}
	}

}

function observe(data) {
	if (isPlainObject(data) || Array.isArray(data)) {
		const ob = new Observer(data)
		return ob
	}
	return null
}

// new Vue 的时候传进来的对象
function initData(data) {
	if (!isPlainObject(data)) {
		console.error('This parameter must be an object' + data);
		return
	}
	observe(data)
}

// 用来对object劫持成响应式数据
function defineReactive(data, key) {
	// new dep
	let dep = new Dep()

	// 注意用一个变量来缓存该变量
	// 不能在get中直接返回 => return obj[key] 这里的obj[key]同样会触发getter 会导致死循环
	var oldVal = data[key]

	// var a = {a: 1, b: {bb: 1}}
	// 递归进行劫持子对象
	// 是不是对象或数组在函数里面已经判断
	const childOb = observe(oldVal)

	Object.defineProperty(data, key, {
		configurable: true,
		enumerable: true,
		get() {
			// collect dep
			// 保证target是一个watch 而不是null
			if (Dep.target) {
				// 对象的属性用该函数里的闭包对象来收集
				dep.depend();

				if (childOb) {
					// childOb.dep.depend()
					if (Array.isArray(oldVal)) {
						// 如果是数组 通过 data[exp] 也会触发依赖收集
						// 但是数组的依赖要用 data.__ob__.dep 来收集
						console.log(oldVal, Dep.target, 'klkl')
						dependArray(oldVal)
						oldVal.__ob__.dep.depend()
					}
				}
			}

			return oldVal
		},
		set(newVal) {
			if (newVal !== oldVal) {
				if (isPlainObject(newVal) || Array.isArray(newVal)) {
					observe(newVal)
				}

				// notify dep
				dep.notify(newVal, oldVal)

				// 因为get是返回oldVal 所以这里要手动赋值
				oldVal = newVal
			}
		}
	})
}

function dependArray(value) {
	for (let e, i = 0, l = value.length; i < l; i++) {
		e = value[i]
		e && e.__ob__ && e.__ob__.dep.depend()
		if (Array.isArray(e)) {
			dependArray(e)
		}
	}
}

/**
 * 对原型上的方法进行改写
 * @param {*} array 
 */
function overrideArrayProto(array) {
	/*
	 *  需要重写的数组方法 OAR 是 overrideArrayMethod 的缩写
	 */
	const OAM = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

	// 保存原始 Array 原型
	var originalProto = Array.prototype,
		// 通过 Object.create 方法创建一个对象，该对象的原型就是Array.prototype
		overrideProto = Object.create(Array.prototype),
		result;
	// 遍历要重写的数组方法
	Object.keys(OAM).forEach(function (key, index, array) {
		var method = OAM[index],
			oldArray = [];
		// 使用 Object.defineProperty 给 overrideProto 添加属性，属性的名称是对应的数组函数名，值是函数
		Object.defineProperty(overrideProto, method, {
			value: function () {
				oldArray = this.slice(0);

				var arg = [].slice.apply(arguments);

				// 调用原始 原型 的数组方法
				result = originalProto[method].apply(this, arg);

				// 对新的数组进行监测
				overrideArrayProto(this);

				// 执行watcher的回调
				const ob = this.__ob__
				console.log(ob.dep.subs.length)
				ob.dep.notify(this, oldArray)

				return result;
			},
			writable: true,
			enumerable: false,
			configurable: true
		});
	});

	// 最后 让该数组实例的 __proto__ 属性指向 假的原型 overrideProto
	array.__proto__ = overrideProto;
}




/************************************************ test */
window.doSet = function () {
	obj.b = 2
	obj.d = 'hah'
	obj.arr.push(11)

	// todo 怎么解析这种不止一层的路径？ 数组还是
	obj.c.cc = 'new'

}

window.doGet = function () {
	obj.b
}

initData(obj);
console.log(obj)

new Watch('b', (newVal, oldVal) => {
	console.log(`b ${oldVal} changed ${newVal}`)
}, obj)

new Watch('d', (newVal, oldVal) => {
	console.log(`d ${oldVal} change to ${newVal}`)
}, obj)

new Watch('arr', (newVal, oldVal) => {
	console.log(`arr ${oldVal} change to ${newVal}`)
}, obj)


































