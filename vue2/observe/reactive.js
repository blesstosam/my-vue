/**
 * 数组的 observe 通过改写数组的原型方法
 * 数组的依赖收集在读取数组触发的getter阶段 依赖收集器在array.__ob__.dep 依赖触发是在改写的原型方法里
 * （依赖收集器放在 Observer 实例上，是为了在getter和改写的原型方法里同时能访问到）
 * -------------------------------
 * 对象的 observe 通过getter和setter
 * 对象的依赖收集在读取对象属性的getter阶段 依赖收集器在函数内的局部变量里 依赖触发是在setter阶段
 */

import { def, isPlainObject } from './util'

class Dep {
	constructor() {
		this.subs = []
	}
	depend() {
		// console.log('push dep', Dep.target)
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

/**
 * watcher是一个中介角色 数据发生变化时通知watcher watcher再去通知其他地方
 */
export class Watcher {
	constructor(exp, fn, data) {
		this.data = data
		this.fn = fn
		// getter 函数返回一个函数可以通过exp的路径来读取obj上的值
		this.getter = parsePath(exp)
		// 调用get函数收集依赖
		this.value = this.get()
	}

	get() {
		// 将watcher暴露出来
		Dep.target = this

		// 读取data上的值 从而收集依赖 对象和数组都在getter里收集
		let value = this.getter(this.data)

		// 每次收集完之后重置target
		Dep.target = null

		return value
	}
}
// 解析路径读取值
export function parsePath(path) {
	const bailRE = /[^\w.$]/
	if (bailRE.test(path)) {
		return
	}
	const segments = path.split('.')
	return function (obj) {
		// 循环读取obj的值 直到找到
		for (let i = 0; i < segments.length; i++) {
			if (!obj) return
			obj = obj[segments[i]]
		}
		return obj
	}
}


/**
 * Observer 将data劫持成getter和setter
 */
class Observer {
	constructor(data) {
		this.value = data
		// 这个dep专门用来收集数组的依赖 每个数组都会带一个observer
		this.dep = new Dep()
		// 将这个 observer 挂在每个数组和对象下面
		// 如果是数组可以通过d.__ob__.dep.depend() 来收集依赖
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
			// 改写该数组的原型方法 对数组本身进行observe
			overrideArrayProto(data)
			// 对数组里的数据进行observe
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

	observeArray(arr) {
		// 如果有元素是对象或数组 递归observe每个数组的元素
		for (let i = 0, l = arr.length; i < l; i++) {
			observe(arr[i])
		}
	}

}

function observe(data) {
	// 数组和对象都会 new 一个 observe 来观察数据
	if (isPlainObject(data) || Array.isArray(data)) {
		const ob = new Observer(data)
		return ob
	}
	return null
}

// new Vue 调用的函数
export function initData(data) {
	if (!isPlainObject(data)) {
		console.error('This parameter must be an object' + data);
		return
	}
	observe(data)
}

/**
 * 将object劫持成响应式数据
 * 在getter阶段收集依赖，在setter阶段触发依赖
 * 依赖收集器 dep 用局部变量保存 在getter和setter阶段都可以访问
 * @param {*} data 
 * @param {*} key 
 */
function defineReactive(data, key) {
	// 新建依赖收集实例 是一个必包 所以不需要额外的变量来存储该dep 这是与 vue3 响应式的区别之一
	let dep = new Dep()

	// 注意用一个变量来缓存该变量
	// 不能在get中直接返回 => return obj[key] 这里的obj[key]同样会触发getter 会导致死循环
	let oldVal = data[key]

	// var a = {a: 1, b: {bb: 1}， arr: [1,2,3, arr_1: [1,2,3]]}
	// 递归进行劫持子对象
	const childOb = observe(oldVal)

	Object.defineProperty(data, key, {
		configurable: true,
		enumerable: true,
		get() {
			// 收集依赖
			// 保证target是一个watcher 而不是null
			if (Dep.target) {
				// 对象的属性用该函数里的局部变量来收集
				// 这里也会收集数组的依赖， 这个依赖的触发是由于直接替换该数组 而不是对数组的操作 比如：
				// const obj = {arr: [1,2,3]} => obj.arr = 1
				dep.depend();

				if (childOb) {
					// 如果是对象,在dep里多收集了一次依赖 但是这个依赖不会触发 因为对象的触发是在setter里调用闭包里的依赖

					// 如果是数组 通过 data[exp] 也会触发依赖收集
					// 这里收集对数组的依赖 但是数组的依赖要用 data.__ob__.dep 来收集
					// =>  等同于oldVal.__ob__.dep.depend()
					childOb.dep.depend()

					// todo ? 为什么需要这一步
					if (Array.isArray(oldVal)) {
						dependArray(oldVal)
					}
				}
			}

			return oldVal
		},
		set(newVal) {
			// 对象里对新的值进行劫持
			if (newVal !== oldVal) {
				if (isPlainObject(newVal) || Array.isArray(newVal)) {
					observe(newVal)
				}

				// 触发依赖
				dep.notify(newVal, oldVal)

				// 更新值
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
 * 对数组原型上的方法进行改写
 * @param {*} array 
 */
function overrideArrayProto(array) {
	/*
	 *  需要重写的数组方法 OAM 是 overrideArrayMethod 的缩写
	 */
	const OAM = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

	// 保存原始 Array 原型
	var originalProto = Array.prototype,
		// 通过 Object.create 方法创建一个对象，该对象的原型就是Array.prototype
		overrideProto = Object.create(Array.prototype),
		result;
	// 遍历要重写的数组方法
	OAM.forEach(function (method) {
		let oldArray = [];
		// 使用 Object.defineProperty 覆盖 overrideProto 的属性，属性的名称是对应的数组函数名，值是函数
		Object.defineProperty(overrideProto, method, {
			value: function () {
				// 谁调用了这个方法 谁就是this 当调用数组的方法 比如 [1].push(2) 时 this就是[1] 
				oldArray = this.slice(0);

				// 复制参数 arg 是一个数组
				var arg = [].slice.apply(arguments);

				// 调用原始 原型 的数组方法
				result = originalProto[method].apply(this, arg);

				// 执行watcher的回调
				const ob = this.__ob__

				let inserted
				switch (method) {
					case 'push':
					case 'unshift':
						inserted = arg
						break;
					case 'splice':
						inserted = arg.slice(2)
						break;
				}
				// 对新的数组进行监测
				if (inserted) ob.observeArray(inserted)

				// console.log(ob.dep.subs.length)

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


/************************ test ***************/
window.doSet = function () {
	obj.b = 2
	obj.d = 'hah'
	// obj.arr.push(11)
	// obj.arr = 1

	obj.c.cc = obj.c.cc + '---new'

	// obj.c = { ccc: '---new' }

}
window.doGet = function () {
	obj.b
}






