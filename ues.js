//1.js中入口用require其他用define
require(['2.js'],function(A){
	//A得到的就是2.js模块的返回值
	//主要执行代码
	//2.js 3.js都加在完，才执行1.js这回调函数
})


//2.js中
define(['3.js','xxx.js'],functionA(B,C){
	//B得到的就是3.js模块的返回值，C是xxxx.js的
	return aaaa //2.js模块的返回值
})



//3,js中
define([],functionA(){
	return {}； //3.js模块返回值
})