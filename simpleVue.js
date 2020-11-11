/*
 * @Author: HAYWAEL
 * @Date: 2020-11-09 17:16:06
 * @LastEditTime: 2020-11-11 10:43:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /test/simpleVue.js
 */
class Vue{
    constructor(options){
        this.$options=options||{}
        this.$data=options.data||{}
        this.$el=typeof options.el==='string'?document.querySelector(options.el):options.el;
        this._proxyData(this.$data)
        new Observer(this.$data);
        new Complier(this)
    }
    _proxyData(data){
        Object.keys(data).forEach(key=>{
            Object.defineProperty(this,key,{
                enumerable:true,
                configurable:true,
                get(){
                    return data[key]
                },
                set(newValue){
                    if(data[key]===newValue) return;
                    console.log('_proxyData',newValue)
                    data[key]=newValue
                }
            })
        })
        // const hander={
        //     get(){
        //         return data[key]
        //     },
        //     set(newValue){
        //         if(data[key]===newValue) return;
        //         data[key]=newValue
        //     }
        // }
        // this=new Proxy(this,hander)
        
    }
}

// 负责把data选项中的属性转换成响应式数据
// data中的某个属性也是对象,把该属性转换成响应式数据
// 数据变化发送通知
class Observer{
    constructor(data){
        this.walk(data)
    }
    walk(data){
        if(!data||typeof data !=='object'){
            return
        }
        Object.keys(data).forEach(key=>{
            this.defineRecative(data,key,data[key])
        })
    }
    defineRecative(obj,key,val){
        let that=this;
        let dep=new Dep()
        this.walk(val)
        Object.defineProperty(obj,key,{
            enumerable:true,
            configurable:true,
            get(){
                console.log('Dep.target',Dep.target)
                dep.target&&dep.addSub(Dep.target)
                return val
            },
            set(newValue){
                if(newValue===val){
                    return
                }
                console.log('Observer',newValue)
                val=newValue;
                that.walk(newValue)
                dep.notify()
            }
        })
    }
}

// + el
// + vm
// + compile(el) 编译模板, 处理文本节点和元素节点
// + compileElement(node) 编译元素节点, 出来指令
// + compileText(node) 编译文本节点，出来插值表达式
// + isDirective(arrrNode) 判断元素属性是否是指令
// + isTextNode(node) 判断节点是否是文本节点
// + isElementNode(node) 判读节点是否是元素节点


class Complier{ 
    constructor(vm){
        this.$el=vm.$el;
        this.vm=vm;
        this.compile(this.$el)
    }
    compile(el){
        let childNodes=el.childNodes;
        Array.from(childNodes).forEach(node=>{
            if(this.isTextNode(node)){
                this.compileText(node)
            }else if(this.isElementNode(node)){
                this.compileElement()
            }
            if(node.childNodes&&node.childNodes.length){
                this.compile(node)
            }
        })
    }
    compileElement(node){
        Array.from(node.attributes).forEach(attr=>{
            let attrName=attr.name;
            if(this.isDirective(attrName)){
                arrtName=attrName.substr(2);
                let key=attr.value;
                this.update(node,key,attrName)
            }
        })
    }
    update(node,key,attrName){
        let updateFn=this[attrName+'Updater'];
        updateFn&&updateFn.call(this,node,this.vm[key],key)
    }
    compileText(node){
        let reg=/\{\{(.+?)\}\}/;
        let value=node.textContent;
        if(reg.test(value)){
            console.log(reg)
            let key=RegExp.$1.trim();
            node.textContent=node.textContent.replace(key,this.vm[key])//多级时候是不是还有其他操作 例如a['b.c']=a[b][c]
            new Watcher(this.vm,key,(newValue)=>{
                //TODO这个地方的一个问题 会全部更新掉
                node.textContent=newValue
            })
        }
    }
    // v-text
    textUpdeter(node,value,key){
        node.textContent=value;
        new Watcher(this.vm,key,newValue=>{
            node.textContent=newValue;
        })
    }
    //v-model
    nodeUpdater(node,value,key){
        node.value=value;
        new Watcher(this.vm,key,newValue=>{
            node.textContent=newValue;
        })
    }
    isDirective(arrNode){
        return arrNode.srartWith('v-')
    }
    isTextNode(node){
        return node.nodeType===3
    }
    isElementNode(node){
        return node.nodeType===1
    }
}

// 功能

// 收集依赖,添加观察者
// 通知所有观察者
// Dep结构

// + subs
// + addSubs(sub)
// + notify


class Dep{
    constructor(){
        this.subs=[]
    }
    addSub(sub){
        if(sub&&sub.update){
            this.subs.push(sub)
        }
    }
    notify(){
        console.log('Dep',this.subs)
        this.subs.forEach(sub=>{
            sub.update()
        })
    }
}


// 功能

// 当数据变化出发依赖,dep通知所有的Watcher实例更新试图
// 自身实例化的时候往dep对象中添加自己
// Watcher

// + vm
// + key
// + cb
// + oldValue
// + update

class Watcher{
    constructor(vm,key,cb){
        this.vm=vm;
        this.key=key;
        this.cb=cb;
        Dep.target=this;
        this.oldValue=vm[key];
        Dep.target=null
    }
    update(){
        let newValue=this.vm[this.key];
        console.log('Watcher',newValue,this.oldValue)
        if(this.oldValue===newValue){
            return
        }
        //本来缺少对oldValue的重新赋值
        this.oldValue=newValue;
        this.cb(newValue)
    }
}