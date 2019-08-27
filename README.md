# One-way DOM Binder
#### Version 2.0
##### This version is not compatible with the older versions

This library provides a class called ```Bindable``` which facilitates an easy way for one-way DOM binding. It allows us to specify the binding sites using a *moustache* like template.

## Properties

```Bindable``` has 4 properties.

1. ```values``` : Used to get and set bindable values.\
	eg:
	```html
	<div id="mydiv" class="{{css_class}}">{{msg}}</div>
	```
	```javascript
	let b = new Bindable(document.querySelector('#mydiv'));
	b.values.msg = 'Hello world';
	b.values.css_class = 'bold red';
	```
	Result:
	```html
	<div id="mydiv" class="bold red">Hello world</div>
	```
2. ```formatters``` : Used to set a pre-formatter function for a bindable value. If it is set then the value is formatted before its assignment in the DOM.
	eg:
	```html
	<div id="mydiv">{{date}}</div>
	```
	```javascript
	let b = new Bindable(document.querySelector('#mydiv'));

	b.formatters.date = (value) => {
		let d = Date.parse(value);
		if(isNaN(d)) {
			d = new Date();
		}
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(d);
	};

	b.values.date = '2019-06-05';
	```
	Result:
	```html
	<div id="mydiv">05 Jun 2019</div>
	```

3. ```nodes``` : Provides references to all the nodes binded to a property.\
	eg:
	```html
	<div id="mydiv" class="{{css_class}}">
		<span>{{msg}}</span>
		<span>{{msg}}</span>
	</div>
	```
	```javascript
	let b = new Bindable(document.querySelector('#mydiv'));
	b.values.msg = 'Hello world';
	b.values.css_class = 'bold red';
	
	console.log(b.nodes.msg);
	// Logs an array containing both the textNodes with the message

	console.log(b.nodes.css_class);
	//Logs an array containing the div's class attribute node
	```

4. ```keys``` : Used for getting a list of all the properties binded by the ```Bindable```.\
	eg:
	```html
	<div id="mydiv" class="{{css_class}}">{{msg}}</div>
	```
	```javascript
	let b = new Bindable(document.querySelector('#mydiv'));
	b.values.msg = 'Hello world';
	b.values.css_class = 'bold red';
	
	console.log(b.keys);
	// Logs: ["msg", "css_class"]
	```

## Methods

1. ```constructor(...elements)```

	Create a bindable. Optionally bind one or more elements to the binder.

2. ```bindElements(...elements)```

	Bind one or more elements to the binder.

3. ```unbindElements(...elements)```

	Unbind one or more elements from the binder.

4. ```setValues(obj)```

	Set multiple values in the binder. It is same as assigning values to different properties individually one by one using the ```values``` property.


## Examples
1. Binding general data (text, numbers etc.)
	```html
	<div id="mydiv">
		Name: {{name}}; DOB: {{dob}};
		<div>
			Name: <b>{{name}}</b>; DOB: <b>{{dob}}</b>;
		</div>
		<div>
			Name: {{name}}; DOB: {{dob}};
		</div>
		<div data-info="Name: {{name}}; DOB: {{dob}};"></div>
		<span data-name="{{name}}" data-age="{{dob}}"></span>
	</div>
	```
	```javascript
	let b = new Bindable(document.querySelector('#mydiv'));
	b.values.name = 'Krishna';
	b.values.dob = '5 Jun'; 
	```
	Result:
	```html
	<div id="mydiv">
		Name: Krishna; DOB: 5 Jun;
		<div>
			Name: <b>Krishna</b>; DOB: <b>5 Jun</b>;
		</div>
		<div>
			Name: Krishna; DOB: 5 Jun;
		</div>
		<div data-info="Name: Krishna; DOB: 5 Jun;"></div>
		<span data-name="Krishna" data-age="5 Jun"></span>
	</div>
	```

2. Binding HTML elements
	```html
	<div id="mydiv">{{spacer}} {{content}} {{spacer}}</div>
	```
	```javascript
	let b = new Bindable(document.querySelector('#mydiv'));
	
	let span = document.createElement('span');
	span.innerHTML = `Hello world`;
	b.values.content = span;

	b.values.spacer = document.createElement('hr');
	```
	Result:
	```html
	<div id="mydiv"><hr /> <span>Hello world</span> <hr /></div>
	```