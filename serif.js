function serifJs(container, options){
  var cloneStack = [],
      timer = null,
      pause = null,
      curSerif = null,
      curMargin = 0,
      thres = 0,
      crLength = 0,
      contHeight = 0,
      pauseFlg = false,
      nextSerifNum = -1,
      options = options || {},
      rate = options.rate - 0 || 40,
      tickRate = options.tickRate || 500,
      ticker = document.createElement("span");

  var s = container.currentStyle || document.defaultView.getComputedStyle(container, '');
  contHeight = parseInt(s.height);
  if(!options.threshold || !options.crLength){
    !options.threshold && (thres = parseInt(s.height));
    !options.crLength && (crLength = parseInt(s.fontSize));
  }

  ticker.className = options.tickerClass ||"serifjs_ticker";

  for(i=0,l=container.children.length;i<l;i++){
    container.children[i].style.display = "none";
  }
  container.style.overflow = "hidden";

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

  function slideSerif(margin, next){
    var d = margin,
        total = 0;
    var slideTimer = setInterval(function(){
      d = d/2;
      total = total + d;
      curSerif.style.marginTop = (-1*curMargin - total) + "px";
      if(d<1){
        curMargin = curMargin + margin;
        clearInterval(slideTimer);
        (next == "restart") ? restart() : play(true);
      }
    }, rate);
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

  function checkThres(){
    if(parseInt(curSerif.scrollHeight) > thres + curMargin){
      return true;
    }else{
      return false;
    }
  }

  function write(node, index){
    var nextNode = null,
        process = checkProcess(node, index);

    switch(process){
      case "appendText":
        var text = document.createTextNode(node.nodeValue.charAt(index));
        cloneStack[0].insertBefore(text, ticker);
        if(checkThres()){
          stop();
          slideSerif(crLength, "restart");
        }
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
        nextNode = traceNode(node.parentNode);
        break;
      case "appendElement":
        var copy = node.cloneNode(false);
        cloneStack[0].appendChild(copy);
        if(String.hasOwnProperty.call(copy, "canHaveChildren")){
          if(copy.canHaveChildren){
            ticker = copy.appendChild(ticker);
          }
        }else{
          ticker = copy.appendChild(ticker);
        }
        cloneStack.unshift(copy);
        index = 0;
        if(node.childNodes.length > 0){
          nextNode = node.childNodes[0];
        }else{
          index = 0;
          nextNode = traceNode(node);
        }
        break;
    }
    
    if(pauseFlg){
      pause = [nextNode, index];
    }else if(cloneStack.length > 0){
      timer = setTimeout(function(){
        write(nextNode, index);
      }, rate);
    }else{
      setTimeout(tick, tickRate);
      timer = null;
      options.callback && options.callback();
    }

    function traceNode(n){
      var next = null
      while(!next){
        next = n.nextSibling;
        cloneStack.shift();
        n = n.parentNode;
      }
      if(cloneStack.length > 0){
        cloneStack[0].appendChild(ticker);
      }
      return next;
    }
  }

  function play(isSlide){
    if(!curSerif || isSlide){

      curSerif && container.removeChild(curSerif);
      curMargin = 0;
      if(nextSerifNum+1 > container.children.length - 1){
        //todo:loop
        //nextSerifNum = 0;
        return;
      }else{
        nextSerifNum++;
      }
      curSerif = container.children[nextSerifNum].cloneNode(false);
      curSerif.style.display = "";
      curSerif.className = options.serifClass ? options.serifClass : "";
      container.appendChild(curSerif);
      cloneStack = [container.children[container.children.length-1]];

      var node = container.children[nextSerifNum].childNodes[0];
      if(node.nodeType == 3){
        ticker = curSerif.appendChild(ticker);
      }
      write(node, 0);
    }else{
      slideSerif(contHeight);
    }
  }

  function restart(){
    pauseFlg = false;
    var p0 = pause[0], p1 = pause[1];
    pause = null;
    write(p0, p1);
  }

  function stop(){
    if(timer){
      pauseFlg = true;
    }
  }

  function getNext(){
    return nextSerifNum;
  }

  function insertSerif(data){
    //todo:check data (htmlelement or not).
    data.style.display = "none";
    curSerif && container.insertBefore(data, curSerif);
  }

  return {
    play: play,
    restart: restart,
    current: getNext,
    insert: insertSerif,
    stop: stop
  };
}
