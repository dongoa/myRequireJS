# CMD 
即Common Module Definition通用模块定义 seajs是他的实现，用法如下
```
define(function(){
	var a=require('2.js');
	console.log(333)
	var b=require('4.js');
	})

//2js
define(function(){
	var b=require('3.js')
	})

```
# AMD CMD区别 
执行机制不同，模块的加载时机是一样的  
AMD中callback早require中执行，CMD中在在define执行