Array.prototype.contains = function (e){    
    var i = this.length;  
    while (i--) {  
        if (this[i] == e) {  
            return true;  
        }  
    }  
    return false; 
};
Array.prototype.unique = function (){  
    var newArray=[],provisionalTable = {};
    for (var i = 0, item; (item= this[i]) != null; i++) {
        if (!provisionalTable[item]) {
            newArray.push(item);
            provisionalTable[item] = true;
        }
    }
    return newArray;
};
Array.prototype.del = function(index){
    return this.slice(0,index).concat(this.slice(index+1,this.length));            
};
Function.prototype.Apply = function(thisObj){
    var _method = this;
    return function(data)
    {
        return _method.apply(thisObj,[data]);
    };
};
var record=function(sgf){
    this.init.apply(this,arguments);
};
record.prototype={
    playStart : 0,
    playEnd : 0,//需要board.play的个数
    putCount : 0,//摆子的个数，不计入总步数
    seq : [],//sequence
    add : function(arr){
        for(var i=0;i<arr.length;i++){
            this.seq.push(arr[i]);
        }
        this.playEnd = this.seq.length;
        this.playStart = -arr.length;
    },
    get : function(){//返回需要下子的序列
        return this.seq.slice(this.playStart,this.playEnd);
    },
    init : function(sgf){
        this.text=sgf;
        if(this.text==undefined) this.text='';
        var sgfCheck=this.text.substring(0,1)=='A'?1:0;//write the check code!!
        if(this.text=='') return ;
        this.seq=this.seq.concat(this.toSeq(sgfCheck,this.text));
        this.playEnd = this.seq.length;
        this.playStart = 0;
        return this.seq;
    },

    toSeq : function(hasputted,text){
        var x,y,comment='',moves=text.split(';'),seq=[];
        if (hasputted){
            var putted=moves.shift().split('A');
            putted.shift();
            for (var i=0,puttedL=putted.length;i<puttedL;i++) {
                switch (putted[i].substring(0,1)) {
                    case 'B':
                        var temp_a=putted[i].slice(1).split(']');
                        temp_a.pop();
                        for(var j=0,temp_aL=temp_a.length;j<temp_aL;j++){
                            x = temp_a[j].charCodeAt(1)-97;
                            y = temp_a[j].charCodeAt(2)-97;
                            this.putCount++;
                            seq.push([-1,x,y,1]);
                        }
                        break;
                    case 'W':
                        var temp_a=putted[i].slice(1).split(']');
                        temp_a.pop();
                        for(var j=0,temp_aL=temp_a.length;j<temp_aL;j++){
                            x = temp_a[j].charCodeAt(1)-97;
                            y = temp_a[j].charCodeAt(2)-97;
                            this.putCount++;
                            seq.push([1,x,y,1]);
                        }
                        break;
                    case 'V':
                        var temp_a=putted[i].slice(1).split(']');
                        temp_a.pop();
                        for(var j=0,temp_aL=temp_a.length;j<temp_aL;j++){
                            x = temp_a[j].charCodeAt(1)-97;
                            y = temp_a[j].charCodeAt(2)-97;
                            this.putCount++;
                            seq.push([2,x,y,2]);//alien weiqi
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        for (var i=0,movesL=moves.length;i<movesL;i++) {
            if (moves[i].substring(5,6)=='C') {
                comment=moves[i].slice(7,-2);
                moves[i]=moves[i].slice(0,4);
            }
            else if (moves[i].substring(3,4)=='C'){
                comment=moves[i].slice(5,-2);
                moves[i]=moves[i].slice(0,2);
            }else {
                comment='';
            }
            if(moves[i].length==5){
                var x = moves[i].charCodeAt(2)-97,y = moves[i].charCodeAt(3)-97;
            }else if(moves[i].length==3){
                x=-1;
                y=-1;
            }
            switch (moves[i].substring(0,1)) {//old versions ie not support moves[i][0]
                case 'B':
                    seq.push([-1,x,y,0,comment]);
                    break;
                case 'W':
                    seq.push([1,x,y,0,comment]);
                    break;
                default:
                    break;
            }
        }
        return seq;
    }
};
var Board=function(sgf){
    this.init.apply(this,arguments);
};
Board.prototype={
    comment : '',
    currentPosition : undefined,
    current : 0,
    cache : [],
    forbidSame : [],
    lastMove : -1*first,
    lock : 0,
    end : 0,//0 normal playing,1 endding
    komi : 7.5,
    suicide : suicide,
    boardSize : boardSize,
    init : function(sgf){
        this.record = new record(sgf);
    },
    pointsCopy : function(){
        var arr=board.generateBoardPoints();
        for(var i=0;i<this.boardSize;i++){
            for(var j=0;j<this.boardSize;j++){
                arr[i][j]=this.boardPoints[i][j];
            }
        }
        return arr;
    },
    back : function(){
        //@back to the previous move
        if(this.record.playEnd>0&&!this.end&&this.record.playEnd!=this.record.putCount){
            this.lock = 1;
            if(this.record.playEnd>this.record.putCount){
                arguments[0]==0?this.record.playEnd=this.record.putCount:this.record.playEnd-=1;
            }
            this.record.playStart=0;
            this.play();
        }
    },
    forward : function(){
        //@forward to the next move
        if(this.record.playEnd<this.record.seq.length&&!this.end){
            this.record.playEnd+=1;
            this.record.playStart=0;
            if(this.record.playEnd==this.record.seq.length){
                this.lock = 0;
            }
            this.play();
        }
    },
    reset : function(){
        if(!this.end) {
            this.record.playEnd = this.record.seq.length;
            this.record.playStart = 0;
            this.lock = 0;                    
            this.play();
        }
    },
    unPlay : function(){
        if(!this.lock&&!this.end){
            this.clear();
            if(this.record.seq.length>this.record.putCount){
                this.record.seq.pop();
            }
            this.record.playEnd = this.record.seq.length;
            this.record.playStart = 0;
            this.play();
        }
    },
    clear : function(){
        //clear the board propeties
        this.boardPoints = this.generateBoardPoints();
        this.comment = '';
        this.currentPosition = undefined;
        this.forbidSame = [];
        this.lastMove = -1*first;
        this.suicide = suicide;
        this.current = 0;
        this.cache = [];
    },
    count : function(){
        this.end=1;
        this.lock=1;
        var bs=ws=0;
        for(var y=0;y<this.boardSize;y++){
            for(var x=0;x<this.boardSize;x++){
                switch (this.boardPoints[x][y]) {
                    case -1:
                        ++bs;
                        break;
                    case 1:
                        ++ws;
                        break;
                    case 2:
                        break;
                    default:
                        bs+=0.5;
                        ws+=0.5;
                        break;
                }
            }
        }
        this.result=[bs,ws];
    },
    checkForbids : function(x,y){
        if (this.boardPoints[x,y]==2) {return [2,[]];}//alian weiqi ,no need to caculate qi
        var deads=this.checkMove(x,y),forbidPos=[1,deads];//已方没无气子，没产生禁入点，提对方的子 
        if(deads.contains(x+y*this.boardSize)){//产生的死子是刚下的子，造成了已方有无气子
            var self_dead=0;
            for(var i=0,deadsL=deads.length;i<deadsL;i++){
                var tx=deads[i]%this.boardSize,ty=(deads[i]-tx)/this.boardSize;
                if(this.boardPoints[x][y]==this.boardPoints[tx][ty]){//已方无气的子的数，
                    self_dead+=1;
                }
            }
            if(self_dead==deads.length) forbidPos=[0,deads];//产生已方没气的点，也没提了对方的子，自杀了
        }
        return forbidPos;
    },
    checkMove : function(x,y) {
        var deads=[],temp=[];
        for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(!dx|!dy){
            //本点和其他的点都遍历到,空位不去算它的死串
            if(!(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize) && this.boardPoints[x+dx][y+dy]!=0){
                temp = this.findDeads(x+dx,y+dy);
                if(temp.length){
                    deads=deads.concat(temp);
                }
            }
        }
        return deads.unique();
    },
    fillConnects : function(color,block){
        for(var i =0,blockL=block.length;i<blockL;i++){
            var x=block[i]%this.boardSize,y=(block[i]-x)/this.boardSize;
            this.boardPoints[x][y]=color;
        }
    },
    fillVoids : function(){
        var voidCount=[];
        for (var y = 0; y < this.boardSize; y++) {
            for (var x = 0; x <this.boardSize; x++) {
                if(this.boardPoints[x][y]==0){
                    //数过的点不要再数了
                    if(voidCount.contains(x+y*this.boardSize)){ continue;}
                    var block=this.findConnectsVoid(x,y),color=block.pop();
                    voidCount=block.concat(voidCount);
                    if(color==undefined) continue;
                    this.fillConnects(color,block);
                }
            }
        }
    },
    findConnects : function(x,y){
        //查出（x,y）所在棋子连接空位到另一同色棋子串的所有点
        var block=[],stack=[x+y*this.boardSize],color=this.boardPoints[x][y];
        while(stack.length){
            var x=stack.slice(-1)%this.boardSize,y=(stack.slice(-1)-x)/this.boardSize,colorConnect=[];
            for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(!dx^!dy){
                //if(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize) continue;
                if(!(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize || this.boardPoints[x+dx][y+dy]==2)) {
                if(this.boardPoints[x+dx][y+dy]==color
                        ||this.boardPoints[x+dx][y+dy]==0
                  ){
                      colorConnect.push(x+dx+(y+dy)*this.boardSize);
                  }
                }
            }
            var colorConnectCount=0;
            for(var i=0,colorConnectL=colorConnect.length;i<colorConnectL;i++){
                if(block.contains(colorConnect[i])){
                    colorConnectCount++;
                }else{//优化
                    colorConnectCount=-1;
                    break;
                }

            }
            if(colorConnectCount==colorConnect.length){//此子四周已数过
                stack.pop();
            }
            for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(!dx^!dy){
                if(!(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize)){
                    if(this.boardPoints[x+dx][y+dy]==color
                            ||this.boardPoints[x+dx][y+dy]==0
                      ){
                          if(!block.contains(x+dx+(y+dy)*this.boardSize)){
                              stack.push(x+dx+(y+dy)*this.boardSize);
                              block.push(x+dx+(y+dy)*this.boardSize);
                          }
                      }
                }
            }
        }
        for(var i=0;i<block.length;i++) {
            var x=block[i]%this.boardSize,y=(block[i]-x)/this.boardSize;
            if (this.boardPoints[x][y]!=color) {
                block=block.del(i);
                i--;//important
            }
        }
        return block;
    },
    findConnectsVoid : function(x,y){
        //查出（x,y）所在棋子连接空位到另一同色棋子串的所有点
        var block=[],stack=[x+y*this.boardSize],ownd=undefined,owndCount=0;
        while(stack.length){
            var x=stack.slice(-1)%this.boardSize,y=(stack.slice(-1)-x)/this.boardSize,colorConnect=[];
            for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(!dx^!dy){
                //if(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize) continue;
                if(!(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize || this.boardPoints[x+dx][y+dy]==2)) {
                if(this.boardPoints[x+dx][y+dy]==0
                  ){
                      colorConnect.push(x+dx+(y+dy)*this.boardSize);
                  }
                }
            }
            var colorConnectCount=0;
            for(var i=0,colorConnectL=colorConnect.length;i<colorConnectL;i++){
                if(block.contains(colorConnect[i])){
                    colorConnectCount++;
                }else{//优化
                    colorConnectCount=-1;
                    break;
                }

            }
            if(colorConnectCount==colorConnect.length){//此子四周已数过
                stack.pop();
            }
            for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(!dx^!dy){
                if(!(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize)){
                    if(owndCount==0){
                        if(this.boardPoints[x+dx][y+dy]==-1){
                            ownd=-1;
                        }else if(this.boardPoints[x+dx][y+dy]==1){
                            ownd=1;
                        }
                        owndCount=(ownd==undefined)?0:1;
                    }else if(owndCount==1){
                        if(this.boardPoints[x+dx][y+dy]!=ownd
                                &&this.boardPoints[x+dx][y+dy]!=0
                                &&this.boardPoints[x+dx][y+dy]!=2
                          ){
                              ownd=undefined;
                              owndCount=2;
                          }
                    }
                    if(this.boardPoints[x+dx][y+dy]==0
                      ){
                          if(!block.contains(x+dx+(y+dy)*this.boardSize)){
                              stack.push(x+dx+(y+dy)*this.boardSize);
                              block.push(x+dx+(y+dy)*this.boardSize);
                          }
                      }
                }
            }
            if(!block.length){
                block.push(x+y*this.boardSize);
            }
        }
        for(var i=0;i<block.length;i++) {
            var x=block[i]%this.boardSize,y=(block[i]-x)/this.boardSize;
            if (this.boardPoints[x][y]!=0) {
                block=block.del(i);
                i--;
            }
        }
        block.push(ownd);
        return block;
    },
    findDeads : function(x,y){
        //查出（x,y）所在棋子串有无气
        //无气就返回串
        //有气就返回空串
        var block=[],stack=[x+y*this.boardSize],colorSame=[],colorSameCount=0,x,y;
        if(this.boardPoints[x][y]==2) {return block;}
        while(stack.length){
            x=stack.slice(-1)%this.boardSize,y=(stack.slice(-1)-x)/this.boardSize;
            colorSame=[];
            for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(!dx^!dy){
                if(!(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize || this.boardPoints[x+dx][y+dy]==2)) {
                    if(this.boardPoints[x][y]==this.boardPoints[x+dx][y+dy]){
                        colorSame.push(x+dx+(y+dy)*this.boardSize);
                    }
                }
            }
            colorSameCount=0;
            for(var i=0,colorSameL=colorSame.length;i<colorSameL;i++){
                if(block.contains(colorSame[i])){
                    colorSameCount++;
                }else{//优化
                    colorSameCount=-1;
                    break;
                }
            }
            if(colorSameCount==colorSame.length){//此子四周已数过
                stack.pop();
            }
            for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(!dx^!dy){
                if(!(x+dx<0 || x+dx>=this.boardSize || y+dy<0 || y+dy>=this.boardSize)){
                    if(this.boardPoints[x+dx][y+dy]==0){
                        //棋子周边有空位，显然是有气的，清空block,返回
                        block=[];
                        return block;
                    }
                    //无空位，是同色的点
                    if(this.boardPoints[x][y]==this.boardPoints[x+dx][y+dy]&&this.boardPoints[x+dx][y+dy]!=2){
                        if(!block.contains(x+dx+(y+dy)*this.boardSize)){
                            stack.push(x+dx+(y+dy)*this.boardSize);
                            block.push(x+dx+(y+dy)*this.boardSize);
                        }
                    }
                }
            }
            if(!block.length){
                block.push(x+y*this.boardSize);
                return block;
            }
        }
        return block;
    },
    generateBoardPoints : function(){
        var parray=[];
        for(var x=0;x<this.boardSize;x++) parray.push(Array(this.boardSize));
        for(var i=0;i<this.boardSize;i++) for(var j=0;j<this.boardSize;j++) parray[i][j]=0;
        return parray;
    },
    play : function(){
        /*
         * NO support for trees
         */
        if (this.cache.length==this.record.seq.length) {
            //recoveries for backward,forward,and reset;
            var sign = this.current==this.record.playEnd?0:(this.current>this.record.playEnd?-1:1);
            while(this.current!=this.record.playEnd){
                var index = this.current+(sign==0||sign==-1?-1:0);
                this.current+=sign;
                var cache=this.cache[index];
                var x=cache[0][1],y=cache[0][2];
                if(!sign) break;
                this.boardPoints[x][y]=sign==-1?0:(!cache[3]&&this.suicide?0:cache[0][0]);//recover current move
                for (var j=0;j<cache[1].length;j++) {
                    var tx=cache[2][j]%this.boardSize,ty=(cache[2][j]-tx)/this.boardSize;
                    if((tx^x||ty^y)&&(this.boardPoints[tx][ty]!=cache[0][0]||(!cache[3]&&this.suicide))){
                        this.boardPoints[tx][ty]=(sign==-1?cache[1][j]:0);
                    }
                }
                var mx=x,my=y,flag=cache[0][3];
                if(sign==-1&&index>0){
                    mx=this.cache[index-1][0][1],my=this.cache[index-1][0][2],flag=this.cache[index-1][0][3];
                }
                if(!flag){
                    this.currentPosition = mx+my*this.boardSize;
                }else{
                    this.currentPosition = undefined;
                }
                this.lastMove = -1*this.lastMove;
            }
            return 1;
        }
        var moves = this.record.get();
        if(moves.length==0) return 1;
        for(var i=0,movesL=moves.length;i<movesL;i++){
            var move=moves[i],x = move[1],y = move[2];
            if(x==-1||y==-1) {//虚着
                var strBoard=move[0]+this.boardPoints.toString();
                if (this.forbidSame.contains(strBoard)) {
                    return -2; //全局有同
                }else if(move[3]==0){//正常下子，非摆子/则计入全局同
                    if (this.forbidSame.length==forbidSameNum){
                        this.forbidSame.shift();
                    }
                    this.forbidSame.push(strBoard);
                    this.cache.push([move,[],[],1]);
                }
                continue;
            }
            //已经有子，不能下这
            if (this.boardPoints[x][y]){
                return -1;
            }
            switch (move[0]) {
                case -1:
                    this.boardPoints[x][y] = -1;
                    break;
                case 1:
                    this.boardPoints[x][y] = 1;
                    break;
                case 2:
                    this.boardPoints[x][y] = 2;
                    break;
                default:
                    break;
            }
            var forbid=this.checkForbids(x,y);
            if (forbid[0]==1) {
                var deadsColor=[];
                for (var j=0,forbidL=forbid[1].length;j<forbidL;j++) {
                    var tx=forbid[1][j]%this.boardSize,ty=(forbid[1][j]-tx)/this.boardSize;
                    deadsColor.push(this.boardPoints[tx][ty]);
                    if(this.boardPoints[tx][ty]!=this.boardPoints[x][y]){
                        this.boardPoints[tx][ty]=0;
                    }
                }
                var strBoard=move[0]+this.boardPoints.toString();
                if (!this.forbidSame.contains(strBoard)) {//全局无同
                    if(move[3]==0){//正常下子，非摆子/则计入全局同
                        if (this.forbidSame.length==forbidSameNum){
                            this.forbidSame.shift();
                        }
                        this.forbidSame.push(strBoard);
                    }
                    this.cache.push([move,deadsColor,forbid[1],forbid[0]]);
                }else{
                    this.boardPoints[x][y]=0;//还原操作
                    for (var j=0;j<forbid[1].length;j++) {
                        var tx=forbid[1][j]%this.boardSize,ty=(forbid[1][j]-tx)/this.boardSize;
                        (tx^x||ty^y)?this.boardPoints[tx][ty]=deadsColor[j]:0;
                    }
                    return -2; 
                }
            }else if(forbid[0]==0) {
                if (!this.suicide) {//不可自杀
                    this.boardPoints[x][y] = 0;//这点是非劫禁入点，清空这步
                    return -1;
                    //return 1;
                }
                else {//可自杀
                    var deadsColor=[];
                    for(var j=0,forbidL=forbid[1].length;j<forbidL;j++){
                        var tx=forbid[1][j]%this.boardSize,ty=(forbid[1][j]-tx)/this.boardSize;
                        deadsColor.push(this.boardPoints[tx][ty]);
                        this.boardPoints[tx][ty]=0;
                        //把自杀的子清掉
                    }
                    var strBoard=move[0]+this.boardPoints.toString();
                    if (!this.forbidSame.contains(strBoard)) {
                        if(move[3]==0){//正常下子，非摆子/则计入全局同
                            if (this.forbidSame.length==forbidSameNum){
                                this.forbidSame.shift();
                            }
                            this.forbidSame.push(strBoard);
                        }
                        this.cache.push([move,deadsColor,forbid[1],forbid[0]]);
                    }
                    else{
                        this.boardPoints[x][y]=0;//还原操作
                        for (var j=0;j<forbid[1].length;j++) {
                            var tx=forbid[1][j]%this.boardSize,ty=(forbid[1][j]-tx)/this.boardSize;
                            (tx^x||ty^y)?this.boardPoints[tx][ty]=deadsColor[j]:0;
                        }
                        return -2; //全局有同
                    }
                }
            }else if(forbid[0]==2){
                ///to do ..
            }
            if(move[3]==0&&forbid[0]==1){
                this.currentPosition = x+y*this.boardSize;
            }else if(move[3]) this.currentPosition = undefined;
            if(move.length==5){
                this.comment=move[5];
            }
        }
        this.lastMove = move[0]==2?this.lastMove:move[0];
        this.current = this.record.playEnd;
        return 1;
    },
    boardPoints : function(){
        var parray=[];
        for(var x=0;x<this.boardSize;x++) parray.push(Array(this.boardSize));
        for(var i=0;i<this.boardSize;i++) for(var j=0;j<this.boardSize;j++) parray[i][j]=0;
        return parray;
    }()
};

var Data=function(board){
    this.init.apply(this,arguments);
};
Data.prototype={
    address:"http:\/\/localhost\/PGOP\/",
    gameID:1,
    board:undefined,
    sendInfo:undefined,
    receive:undefined,
    status:undefined,
    success:undefined,
    init:function(board){
        this.board=board;
    },
    send:function(){
        $.ajaxSetup({
            async: false
        }); 
        $.post(this.address+"command.php",this.sendInfo,this.setReceive.Apply(this));
        if(this.receive){
            this.success=this.receive.success;
        }
    },
    update:function(){
        this.sendInfo={'game_id':this.gameID,'command':'get&#160;'+count};
        this.send();
    },
    setReceive:function(data){
        if (data.match("^\{(.+:.+,*){1,}\}$"))
        {
            this.receive=$.parseJSON(data);
        }else{
            this.receive={success:0};
        }
    }
};
var Show=function(qipu){
    this.init.apply(this,arguments);
};
Show.prototype={
    board:undefined,
    data:undefined,
    boardSize : boardSize,
    init:function(board,data){
        this.board=new Board(qipu);
        this.board.play();
        this.create();
        this.flush();
        this.data=new Data(board);
    },
    create : function(){
        var $bar=$("<a>").addClass("BAR").attr("href","#");
        $bar.clone().attr("id","START").bind("click",this,function(event){event.data.board.back(0);event.data.flush();return false;}).html("|&lt;").appendTo("body");

        $bar.clone().attr("id","BACK").bind("click",this,function(event){event.data.board.back();event.data.flush();return false;}).html("&lt;").appendTo("body");

        $bar.clone().attr("id","PASS").bind("click",this,function(event){
            if(!event.data.board.lock){
                event.data.board.record.add([[event.data.board.lastMove*(-1),-1,-1,0]]);
                var flag = event.data.board.play();
                if(flag!=1){
                    event.data.board.unPlay();
                    alert('You can\'t pass now!');
                }
                event.data.flush();
            }else{
                alert('Board locked,can\'t play now!');
            }
            return false;
        }
        ).html("P").appendTo("body");
        $bar.clone().attr("id","DELETE").bind("click",this,function(event){event.data.board.unPlay();event.data.flush();return false;}).html("X").appendTo("body");
        $bar.clone().attr("id","FORWARD").bind("click",this,function(event){event.data.board.forward();event.data.flush();return false;}).html("&gt;").appendTo("body");
        $bar.clone().attr("id","RESET").bind("click",this,function(event){event.data.board.reset();event.data.flush();return false;}).html("&gt;|").appendTo("body");
        $bar.clone().attr("id","END").bind("click",this,function(event){event.data.board.end=event.data.board.end^1;event.data.board.lock=event.data.board.end==1?1:0;return false;}).html("E").appendTo("body");
        $bar.clone().attr("id","COUNT").bind("click",this,function(event){event.data.board.fillVoids();event.data.flush();event.data.board.count();alert(event.data.board.result);return false;}).html("C").appendTo("body");
        $("<span>").addClass("BAR").attr("id","NEXT").text(this.board.lastMove==1?"●":"○").appendTo("body");
        this.boardDiv=$("<div>").addClass("board").appendTo("body");
        var $me = $("<div>").addClass("BOARD");
        for(var y=0;y<this.boardSize;y++){
            for(var x=0;x<this.boardSize;x++){
                var s = ((x-9)%9?0:(x-9)/9)+1+(((y-9)%9?0:(y-9)/9)+1)*3;
                $me.clone().addClass("B" + ((s==4&&(x/3)%2==1&&(y/3)%2==1) ? "X" : s)).attr("id",x+y*this.boardSize).css("margin",(y*23+"px "+x*23+"px")).appendTo(this.boardDiv);
            }
        }
        $('.BOARD').bind("click",this,function(event){
            if(!event.data.board.lock){
                var x=this.id%event.data.boardSize,y=(this.id-x)/event.data.boardSize;
                event.data.board.record.add([[event.data.board.lastMove*(-1),x,y,0]]);
                var flag = event.data.board.play();
                if(flag!=1){
                    event.data.board.unPlay();
                    alert("You can\'t play at this position!");
                }else{
                    //event.data.data.sendInfo={'game_id':event.data.gameID,'command':'xia&#160;'+String.fromCharCode(x+97)+(y+1)};
                    //event.data.data.send();
                    //if(event.data.data.success==1){
                    event.data.flush();
                    //    event.data.data.success=0;
                    //}else{
                    //event.data.board.unPlay();
                    //alert("You can\'t play at this position!");
                    //event.data.flush();
                    //}
                }
            }else{
                alert("Board locked,can\'t put stone!");
            }
            return false;
        }
        );
    },
    putStone : function(x,y,color){
        var $me = $("<div>").css("margin",(color!="CV"?(y*23):(y*23))+"px "+(color!="CV"?(x*23):(x*23))+"px").addClass("POINT "+color).attr("id",x+"v"+y).appendTo(this.boardDiv);
    },
    flush : function(){
        //update the information
        $(".POINT").remove();
        if(this.board.currentPosition==undefined)
        {
            var tx=-1,ty=-1;
        }else
        {
            var tx=this.board.currentPosition%this.boardSize,ty=(this.board.currentPosition-tx)/this.boardSize;
        }
        for(var y=0;y<this.boardSize;y++){
            for(var x=0;x<this.boardSize;x++){
                switch (this.board.boardPoints[x][y]) {
                    case -1:
                        this.putStone(x,y,(tx^x||ty^y)?"B":"BC");
                        break;
                    case 1:
                        this.putStone(x,y,(tx^x||ty^y)?"W":"WC");
                        break;
                    case 2:
                        this.putStone(x,y,"CV");
                        break;
                    default:
                        break;
                }
            }
        }
        $("#NEXT").text(this.board.lastMove==1?"●":"○");
        $('.POINT').bind("click",this,function(event){
            if(event.data.board.end){
                var pos=this.id.split("v");
                event.data.board.fillConnects(0,event.data.board.findConnects(Number(pos[0]),Number(pos[1])));
                event.data.flush();
            }
            return false;
        }
        );
    }
};
