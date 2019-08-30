/*
Author: Anshu Krishna
Contact: anshu.krishna5@gmail.com
Date: 27-Aug-2019
*/
class Bindable {
	constructor(...elements) {
		let notEnum = {enumerable: false, writable: true};
		Object.defineProperties(this, {
			__values: notEnum,
			__targetStorage: notEnum,
			__targets: notEnum,
			__formatters: notEnum,
			__formatted: notEnum
		});
		this.__values = {};
		this.values = new Proxy(this.__values, {
			get: (obj, prop) => {
				if(typeof obj[prop] === 'undefined') {
					return prop;
				}
				return obj[prop];
			},
			set: (obj, prop, value) => {
				if(value === null) {
					delete obj[prop];
					delete this.__formatted[prop];
				} else {
					obj[prop] = value;
					delete this.__formatted[prop];
				}
				this.__updateValue(prop);
			}
		});
		this.__formatted = {};
		this.formatted = new Proxy(this.__formatted, {
			get: (obj, prop) => {
				if(typeof obj[prop] === 'undefined') {
					let val = this.values[prop];
					let formatter = this.formatters[prop];
					if(typeof formatter === 'function') {
						val = formatter(val);
					}
					obj[prop] = val;
				}
				return obj[prop];
			}
		});
		this.__formatters = {};
		this.formatters = new Proxy(this.__formatters, {
			get: (obj, prop) => {
				if(typeof obj[prop] === 'undefined') {
					return null;
				}
				return obj[prop];
			},
			set: (obj, prop, value) => {
				if(value === null) {
					delete obj[prop];
					delete this.__formatted[prop];
					this.__updateValue(prop);
				} else if(typeof value === 'function') {
					obj[prop] = value;
					delete this.__formatted[prop];
					this.__updateValue(prop);
				} else {
					console.error('Only functions can be assigned as formatter');
				}
			}
		});
		this.__targetStorage = [];
		this.__targets = new Proxy(this.__targetStorage, {
			get: (obj, prop) => {
				let ret = [];
				for(let t of obj) {
					if(t.depends.includes(prop)) {
						ret.push(t);
					}
				}
				return ret;
			}
		});
		this.nodes = new Proxy(this.__targetStorage, {
			get: (obj, prop) => {
				let ret = [];
				for(let t of obj) {
					if(t.depends.includes(prop)) {
						ret.push(t.node);
					}
				}
				return ret;
			}
		});
		this.bindElements(...elements);
	}
	bindElements(...elements) {
		for(let e of elements) {
			if(e instanceof HTMLElement) {
				this.__createTargets(e);
			} else {
				console.error('Only HTMLElements can be bound');
			}
		}
	}
	unbindElements(...elements) {
		for(let e of elements) {
			this.__destroyTargets(e);
		}
	}
	__updateValue(prop) {
		let targets = this.__targets[prop];
		for(let t of targets) {
			t.setValue(this);
		}
	}
	__destroyTargets(element) {
		let targetNodes = new Map(this.__targetStorage.map((v, i) => [v.node, i]));
		let indices = [];
		let indexFinder = (e) => {
			if(targetNodes.has(e)) {
				indices.push(targetNodes.get(e));
			}
			for(let n of e.childNodes) {
				if(n.nodeType !== 3) continue;
				if(targetNodes.has(n)) {
					indices.push(targetNodes.get(n));
				}
			}
			for(let attr of e.attributes) {
				if(targetNodes.has(attr)) {
					indices.push(targetNodes.get(attr));
				}
			}
			for(let c of e.children) {
				indexFinder(c);
			}
		};
		indexFinder(element);
		indices = indices.sort().reverse();
		for(let i of indices) {
			this.__targetStorage.splice(i, 1);
		}
		element.normalize();
	}
	__createTargets(element) {
		let nodes = element.childNodes;
		for(let n of nodes) {
			if(n.nodeType !== 3) continue;
			let parts = n.nodeValue.split(Bindable.__pattern);
			if(parts.length < 2) continue;
			parts.forEach((v, i) => {
				if (i % 2 == 0) {
					element.insertBefore(document.createTextNode(v), n);
				} else {
					let prop = v.slice(2, -2);
					let replaceable = document.createTextNode(prop);
					element.insertBefore(replaceable, n);
					let t = new Bindable.__Target(replaceable, [prop]);
					this.__targetStorage.push(t);
					t.setValue(this);
				}
			});
			element.removeChild(n);
		}
		for (let attr of element.attributes) {
			let parts = attr.value.split(Bindable.__pattern);
			if(parts.length < 2) continue;
			let depends = new Set();
			for(let i = 0, j = parts.length; i < j; i++) {
				if(i % 2 !== 0) {
					parts[i] = parts[i].slice(2, -2);
					depends.add(parts[i]);
				}
			}
			let t = new Bindable.__Target(attr, Array.from(depends), parts);
			this.__targetStorage.push(t);
			t.setValue(this);
		}

		for(let c of element.children) {
			this.__createTargets(c);
		}
	}
	setValues(obj) {
		if(typeof obj !== 'object') {
			console.error('Only an object should be passed here');
			return;
		}
		for(let key of Object.keys(obj)) {
			this.__values[key] = obj[key];
			delete this.__formatted[key];
			this.__updateValue(key);
		}
	}
	get keys() {
		return Object.keys(this.__values);
	}
}
Object.defineProperties(Bindable, {
	__pattern: {
		enumerable: false,
		writable: false,
		value: /({{[_a-zA-Z][_a-zA-Z0-9]*}})/
	},
	__valueToString: {
		enumerable: false,
		writable: false,
		value: function (value) {
			if(value === null) return '';
			switch(typeof value) {
				case 'string':
					return value;
				case 'object':
					return JSON.stringify(value);
				case 'function':
					return Bindable.__valueToString(value());
				default:
					return String(value);
			}
		}
	},
	__Target: {
		enumerable: false,
		writable: false,
		value: class {
			constructor(node, depends, structure = null) {
				this.node = node;
				this.depends = depends;
				this.str = structure;
			}
			setValue(bindable) {
				switch(this.node.nodeType) {
					case 2:
						let prop = new Map(this.depends.map(key => [key, Bindable.__valueToString(bindable.formatted[key])]));
						let val = this.str.map((v, i) => {
							if(i % 2 === 0) return v;
							return prop.get(v);
						}).join('');
						this.node.nodeValue = val;
						break;
					case 3:
					case 1:
						let replacement = bindable.formatted[this.depends[0]];
						if(replacement instanceof HTMLElement) {
							replacement = replacement.cloneNode(true);
						} else {
							replacement = document.createTextNode(Bindable.__valueToString(replacement));
						}
						this.node.parentNode.replaceChild(replacement, this.node);
						this.node = replacement;
						break;
				}
			}
		}
	}
});