var modules={}, //存放所有文件模块的信息，每个js文件模块的信息
loadings=[];//存放所有已经加载了的文件模块的id，一旦该id的所有依赖都加载完，该id将会在数组中移除

//上面说了，每个文件模块都要有id，这个函数式返回当前运行的js文件的文件名，拿文件名作为对象的id
//比如，当前加载3.js后运行3.js name该函数返回的就是3.js
function getCurrentJs(){
	return document.currentScript.src
}
//创建节点
function createNode(){
	var node=document.createElement('script');
	node.type='text/javascript'
	node.async=true;
	return node;
}

//开始运行
function init(){
	//加载1.js
	loadJs('1.js');
}

//加载文件 插入dom中，如果传了回调函数，则onload后执行回调函数
function loadJs(url,callback){
	var node =createNode()
	node.src=url;
	node.setAttribute('data-id',url);
	node.addEventListener('load',function(evt){
		var e = evt.target
		setTimeout(()=>{//这里延迟一秒，只是让浏览器直观上看到每1秒加载出一个文件
			callback && callback(e)
		},1000)
	},false)
	document.body.appendChild(node)
}
//此时，loadJS(1.js)后，并没有传回调函数，所以1.js加载成功后只是自动运行1.js代码
//而1.js中，是require(['2.js','xxx.js'],functionA(B,C){})则执行require函数在下面
window.require=function(deps,callback){
	//deps就是对应['2.js','xxx.js']
	//callback就是对应的function
	//在这里，是不会运行callback的，即模块的运行，得等到所有依赖都加载完在运行
	//所以得有个地方把一个文件所有的信息都先存起来，尤其是deps和callback
	var id=getCurrentJs();
	if(!modules.id){
		modules[id]={//装载该模块信息
			id:id,
			deps:deps,
			callback:callback,
			exports:null, //该模块返回值return
			//就是functionA(B,C)运行后的返回值，仔细想想，在后面getExports中详细说明
			status:1,
		}
		loadings.unshift(id);//加入这个id，之后会循环loading数组，递归判断id所有依赖
	}
	loadDepsJs(id);//加载这个文件的所有依赖，即去加载[2.js]
}

function loadDepsJs(id){
	var module=modules[id];//获取这个文件模块对象
	//deps是[2.js]
	module.deps.map(item =>{
		id(!modules[i]){//如果这个文件没被加载过（加载过的就在modules中有了）
			loadJs(item,function(){//加载2.js并且传了个回调，准备要递归
				//2.js加载完后，执行了这个回调函数
				loadings.unshift(item);//此时里面有2个 1.js和2.js
				//递归处理3.js
				loadDepsJs(item);//item传的2.js 递归进来时，就去modules中去2.js的deps了
				//每次检查一下，是否都加载完了
				checkDeps();//循环loadings配合递归嵌套和modules信息，判断是否加载完了

			})

		}
	})
}
//上面加载2.js后会马上运行2.js  去执行define
window.define=function(deps,callback){
	var id=getCurrentJs();
	if(!modules.id){
		modules[id]={
			id:id,
			deps:getDepsId(deps),
			callback:callback,
			exports:null,
			status:1,
		}
	}
}
//注意，define运行的结果，只是在modules中添加了该模块的信息
//因为其实再说上面的loadDepsJs中已经实现做了loadings和递归de操作
//而且是一直不断的循环往复进行探查，所以define里面就不需要在像写require中loadDeps了
//循环loadings查看loadings里面的id，其所有依赖的所有层层嵌套的依赖模块是否都加载完了
function checkDeps(){
	for(var i=0,id;i<loadings.length;i++){
		id=loadings[i];
		if(!modules[id]) continue;

		var obj=modules[id];
		deps=obj.deps

		//下面为什么要执行checkCycle函数呢，checkDeps是循环loadings数组某块的id，而checkCycle是去判断该id即
		//checkDeps是广度的循环已经加载但依赖没完全加载完的id
		//checkCycle是深度的探查所有关联的依赖
		//还是举例把，例如除了1.js 2.js 3.js还有4.js依赖5.js那么
		//loadings可能是[1.js,4.js]
		//checkDeps1.js  4.js
		//checkCycle深入内部  1.js->2.js->3.js  4.js->5.js
		//一旦比如说1.js所有依赖2.js 3.js都加载完了，那么1.js就会在loadings中移出

		var flag=checkCycle(deps);
		if(flag){
			console.log(i,loadings[i],'全部依赖已经loaded');
			loadings.splice(i,1);
			//!!!运行模块，然后同时得到该模块的返回值！！！
			getExport(obj.id);
			//不断循环探查
			checkDeps()
		}
	}
}
//深层次的递归去判断，层次依赖是否都加载完了
//进入1js的依赖2js，在进入2js的依赖3js
function checkCycle(deps){
	var flag=true
	function cycle(deps){
		deps.forEach(item => {
			if(!modules[item] || modules[item].status == 1){
				flag=false
			}else if(modules[item].deps.length){
				console.log('inner deps',modules[item].deps);
				cycle(modules[item].deps);
			}
		})
	}
	cycle(deps);
	return flag;
}
/*
运行该id模块，同时得到模块返回值，modules[id].export
*/
function getExport(id){
	/*
先想一下，例如模块2js，这时id==2js
define(['3js','xxxjs'],functionA(B,C){
	//B得到的就是3.js模块的返回值，C是xxxxjs的
	return aaa //2.js 模块的返回值
})
所以：
1.运行模块就是运行functionA模块的callback
2.得到模块的返回值，就是functionA运行后的返回值 aaaa
问题：
1.运行functionA（B,c）BC是什么怎么来的？
2.有了BC，怎么运行functionA
	*/
	//解决问题 BC依赖模块depsp[3jsxxxjs]对应的返回值
	//那么循环deps得到依赖模块id，取模块export
	var params=[];
	var deps=modules[id].deps;

	for(var i=0;i<deps.length;i++){
		//取依赖模块的exports即模块返回值，注意不要害怕取不到，因为这个模块
		//都打算运行了，所有的依赖模块早都进行过运行完了
		let depId=deps[i];
		params.push(modules[depId].exports);
	}

//到这里params就是依赖模块的返回值数组，也就是BC对应的实参
//也就是params == [2js返回值，xxxjs返回值]
	if(!modules[id].exports){
		//解决问题2：callback(functionA)的执行，用apply，这也是为什么params是个数组
		//这行代码，及运行了该模块，同时也得到了模块的返回值export
		modules[id].exports = modules[id].callback.apply(global,params);
			}
}
