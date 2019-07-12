///区别在于define函数
window.define=function(callback){
	var id=getCurrentJs()
	var depsInit=s.parseDependencies(callback.toString());
	var a=depsInit.map(item => basepath + item)
	//和requirejs的define相比 就多了上面的2行代码
	//1.把传进来函数给转换字符串，‘function(){var a=require('2.js')}’
	//2.利用一个正则函数，取出字符串require中2，js最后拼成一个数组['2.js']返回来
	//2.其他和requrejs一样了

	if(!modules[id]){
		modules[id]={
			id:id,
			status:1,
			callback:callback,
			deps:a,
			exports:null
		}
	}

	s.loadDepsJs(id)
}