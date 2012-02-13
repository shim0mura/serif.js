function serifJs(container, options){
  var cloneStack = [],
      timer = pause = prevSerif = null,
      pauseFlg = false,
      nextSerifNum = -1,
      options = options || {},
      rate = options.rate - 0 || 40,
      tickRate = options.tickRate || 500,
      ticker = document.createElement("span");

  ticker.className = options.tickerClass || "serifjs_ticker";

  for(i=0,l=container.children.length;i<l;i++){
    container.children[i].style.display = "none";
  }

  function setSerif(){
    prevSerif = container.children[nextSerifNum].cloneNode(false);
    prevSerif.style.display = "";
    if(options.serifClass){
      prevSerif.className = options.serifClass;
    }
    container.appendChild(prevSerif);
  }

  function next(){
    prevSerif && container.removeChild(prevSerif);
    if(++nextSerifNum > container.children.length - 1){
      nextSerifNum = 0;
    }
    setSerif();
    cloneStack = [container.children[container.children.length-1]];
  }

  function tick(){
    var style = ticker.style;
    if(style.display == "none"){
      style.display = "";
    }else{
      style.display = "none";
    }
    
    if(!timer){
      setTimeout(tick, tickRate);
    }
  }
  
  function checkProcess(node, index){
    var process = null;
    if(node.nodeType==3){
      if(node.nodeValue.charAt(index)){
        process = "appendText";
      }else if(node.nextSibling){
        process = "endTextNode";
      }else{
        process = "traceParent";
      }
    }else{
      process = "appendElement";
    }
  
    return process;
  }

  function write(node, index){
    var nextNode = null,
        process = checkProcess(node, index);

    switch(process){
      case "appendText":
        var text = document.createTextNode(node.nodeValue.charAt(index));
        cloneStack[0].insertBefore(text, ticker);
        index++;
        nextNode = node;
        break;
      case "endTextNode":
        index = 0;
        cloneStack[0].removeChild(cloneStack[0].lastChild);
        nextNode = node.nextSibling;
        break;
      case "traceParent":
        index = 0;
        var par = node.parentNode;
        while(!nextNode){
          nextNode = par.nextSibling;
          cloneStack.shift();
          par = par.parentNode;
        }
        if(cloneStack.length > 0){
          cloneStack[0].appendChild(ticker);
        }
        break;
      case "appendElement":
        var copy = node.cloneNode(false);
        ticker = copy.appendChild(ticker);
        cloneStack[0].appendChild(copy);
        cloneStack.unshift(copy);
        index = 0;
        nextNode = node.childNodes[0];
        break;
    }
    
    if(pauseFlg){
      pause = [nextNode, index];
    }else if(cloneStack.length > 0){
      timer = setTimeout(function(){
        write(nextNode, index);
      }, rate);
    }else{
      options.callback && options.callback();
      setTimeout(tick, tickRate);
      timer = null;
    }
  }

  function play(){
    if(!timer){
      next();
      write(container.children[nextSerifNum].childNodes[0], 0);
    }else if(pauseFlg){
      pauseFlg = false;
      write(pause[0], pause[1]);
      pause = null;
    }
  }

  function stop(){
    if(timer){
      pauseFlg = true;
    }
  }

  return {
    play: play,
    stop: stop
  };
}

var a = serifJs(document.getElementById("ticker"), {
  callback: function(){
    //element.animate(margin-top...., function(){
    //  a.play();
    //})
    //serifが切り替えアニメーションを提供はしない
    //callbackで指定
    //ただしアニメーションの際にdisplay:blockとなっているものはアクセスできる必要がある
  }

});
a.play();

document.getElementById("test2").addEventListener("click", function(){
  a.play();
}, false);
document.getElementById("stop").addEventListener("click", function(){
  a.stop();
}, false);
