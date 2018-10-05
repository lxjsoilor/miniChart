function HcChart(opts) {
    this.opts = opts;
    this.ctx = opts.dom.getContext("2d");
    this.ctxTop = 50
    this.paddingLR = 20 ;  // 设定左右留白区域
    this.isShowOriginal = true;
    this.ctx.translate(0.5,0.5);  // 使1px线变细
    this.init();
}

var HcChartProto = HcChart.prototype;

HcChartProto.init = function(){
    this.extendOpts();
    this.drawMain();	
};

HcChartProto.publicFn = {
    // 生成随机颜色，返回的数组，数组中有两个颜色值
    makeColor: function(){
        var arr = [];
        var a = Math.floor(Math.random()*256);
        var b = Math.floor(Math.random()*256);
        var c = Math.floor(Math.random()*256);
        var color1 = '#'+ fill2(a.toString(16))+fill2(b.toString(16))+fill2(c.toString(16));
        arr.push(color1)
        var color2 = 'rgba('+a+', '+b+', '+c+', .5)';
        arr.push(color2);

        function fill2(str){
            if (str.length === 1) {
                str = '0'+str;
            }

            return str;
        }
        
        return arr;
    },
    // data为三维数组，获得所有数据中的最大值
    getMaxNum: function (data){
        var max = 0;
        for(var i = 0, len = data.length; i < len; i++){
            for(var j = 0, lenj = data[i]['data'].length; j < lenj; j++){

                if (data[i]['data'][j] > max) {
                    max = data[i]['data'][j];
                }
            }
        }

        return max;
    },
    //  a为默认参数对象，b为传递进来的参数对象
    extendObj: function (a, b){  
        var str = JSON.stringify(a);
        var newobj = JSON.parse(str)
        for(key in b){
            if(newobj.hasOwnProperty(key)){
                newobj[key] = b[key];
            }else{
                newobj[key] = b[key];
                console.log('传入的参数'+key+'原本没有！');
            }
        }
        return newobj;
    },
    xAxisToSeries: function (xAxis) {
        var series = [{data:[]}]
        for (var i = 0; i < xAxis.length; i++) {
            series[0].data.push(xAxis[i].data)
        }
        return series
    },
}
HcChartProto.drawContent = function(){
    this.drawCS();
    this.drawGraph();
}

HcChartProto.countBl = function(){
    var csYOneLen = this.opts.style.csYOneLen || 1;  // 纵坐标每个间距的值，由用户控制
    var arr = this.series;
    var maxNum = this.maxNum = this.publicFn.getMaxNum(arr);  // 数据中的最大值
    var yCopies = 0;  // 设置默认将y轴分为3分
    // 计算y轴刻度最小的值直接从0开始算
    var csYMin = this.cs.csYMin = 0; 
    var diff = Math.floor(maxNum/0.9 - csYMin);  // 差值
    if (diff < 5) {
        diff = maxNum/0.9 - csYMin;
        var n1 = diff/5;
        var n2 = n1.toString();
        var i = 0;
        var maxI = 0;
        while(i >= 0){
            if (n2.charAt(2+i) !== '0' ) {
                break;
            }
            i++;
        }
        var divisor = 1;
        while(i >= 0){
            divisor = divisor*10;  // 计算n1要除的整数
            i--;
        }
        var n3 = n1*divisor;
        if (n3 < 1.4) {
            csYOneLen = 1/divisor;
        }else if(n3 < 2.5){
            csYOneLen = 2/divisor;
        }else if(n3 < 7.5){
            csYOneLen = 5/divisor;
        }else{
            csYOneLen = 10/divisor;
        }
    }else{
        var n1 = Math.ceil(diff/10);  // 将差值除以5，取整
        var n2 = n1.toString().length;  // 取得n1整数位的长度
        var i = n2 -1;
        var divisor = 1;
        while(i > 0){
            divisor = divisor*10;  // 计算n1要除的整数
            i--;
        }
        var n3 = n1/divisor;
        if (n3 < 1.4) {
            csYOneLen = 1*divisor;
        }else if(n3 < 2.5){
            csYOneLen = 2*divisor;
        }else if(n3 < 7.5){
            csYOneLen = 5*divisor;
        }else{
            csYOneLen = 10*divisor;
        }
    }

    yCopies = Math.ceil(diff/csYOneLen);
    var diff = yCopies*csYOneLen;  // 最终的跨度
    this.cs.yCopies = yCopies; 
    this.bl = this.cs.csHeight/diff;  // 比例
    this.cs.csYOneLen = csYOneLen;
    setYAxis.call(this);
    function setYAxis(){
        var yAxis = this.yAxis = []; 
        for(var j = 0; j <= yCopies; j++ ){
            var y = csYMin + csYOneLen*(yCopies*1000000-j*1000000)/1000000;	
            yAxis.push(y);			
        }
    }
}

HcChartProto.drawCS = function(){
    var opts = this.opts;
    
    var ctx = this.ctx;
    
    // 
    if(!!opts.rotate) {
        var tempWidth = ctx.canvas.width
        ctx.canvas.width = ctx.canvas.height
        ctx.canvas.height = tempWidth
        ctx.translate(ctx.canvas.width,0)
        // ctx.translate(0,ctx.canvas.height)
        ctx.rotate(90*Math.PI/180);
    }
    // 
    var series = this.series;
    var style = this.opts.style;
    var unit = this.opts.unit || '万'
    this.cs = {};
    var csLeft = this.cs.csLeft = this.content.conLeft + this.opts.style.csYTxtLen;
    var csTop = this.cs.csTop = this.content.conTop + 10;
    var csWidth = this.cs.csWidth = this.content.conWidth - this.opts.style.csYTxtLen;
    var csHeight = this.cs.csHeight = this.content.conHeight - this.opts.style.csXTxtLen - 10;
    var csXLen = opts.xAxis.length ;  // 横坐标需要绘制多少个值,根据数组长度决定
    var csXOneLen = this.cs.csXOneLen = csWidth/csXLen;   // 每一个横坐标的间距
    var xAxis = this.xAxis;
    var series = this.series;
    this.countBl();
    // 横坐标横线绘制
    ctx.beginPath();
    ctx.strokeStyle = style.csXLineColor;
    ctx.lineWidth = style.csXlineWidth;  // 线条宽度
    var bl = this.bl;
    var csYOneLen = this.cs.csYOneLen;
    var yCopies = this.cs.yCopies;
    var csYMin = this.cs.csYMin;
    var yAxis = this.yAxis;
    csYOneLenCanvas = bl*csYOneLen; // 跨度比例转换为canvas宽度
    // 绘制纵坐标
    ctx.strokeStyle = style.csYLineColor;
    ctx.fillStyle = style.csYfontColor;
    ctx.lineWidth = style.csYlineWidth;
    ctx.textAlign = "left";
    for(var j = 0; j <= yCopies; j++ ){
        ctx.moveTo(csLeft - 10, csTop + csYOneLenCanvas*j);  
        ctx.lineTo( csLeft + csWidth,  csTop + csYOneLenCanvas*j );
        ctx.font = style.csYfont;  // 字号 字体
        ctx.fillText(yAxis[j], csLeft + style.csYfontLeft, csTop + csYOneLenCanvas*j + style.csYfontTop );  // 内容 起始位置 
    }
    ctx.textAlign="left";  
    ctx.fillText('单位：' + unit, csLeft + style.csYfontLeft, csTop + csYOneLenCanvas*(j-1) + style.csYfontTop + 20 );  // 内容 起始位置
    // 对外输出图例的左上坐标 
    this.drawCutLineLeft = csLeft + style.csYfontLeft
    this.drawCutLineTop = csTop + csYOneLenCanvas*(j) + style.csYfontTop

    ctx.stroke();
    // 根据数值、比例、坐标系top值、坐标系高度 ，返回所需的在canvas顶部值和高度值
    function toCSNum(data, bl, t, h, min){
        return t + (h - (data-min)*bl);
    }

}

HcChartProto.drawMain = function(){
    var dom = this.opts.dom;
    var width = this.width = dom.width = dom.offsetWidth ;  // canvas宽
    var height = this.height = dom.height = dom.offsetHeight;  // canvas高
    this.ctx.clearRect( 0, 0, width, height);
    this.chartInit();
}

// 参数填充
HcChartProto.extendOpts = function(){
    var opts = this.opts;
    var dom = opts.dom;
    this.xAxis = JSON.parse(JSON.stringify(opts.xAxis));
    this.series = this.publicFn.xAxisToSeries(this.xAxis)
    this.showXAxis = true;
    if(opts.showXAxis != 'undefind'){
        this.showXAxis = opts.showXAxis;
    }
    // 坐标系样式信息
    this.opts.style = HcChartDefault.style

}
HcChartProto.chartInit = function(){
    this.addColor()
    this.confirmContentRegion();
    this.drawContent();
    this.drawCutLine();
    
}
HcChartProto.addColor = function () {
    var dif = this.xAxis.length - HcChartDefault.colors.length
    for (var i = 0; i < dif; i++) {
        HcChartDefault.colors.push(this.publicFn.makeColor())
    }
}

HcChartProto.confirmContentRegion = function(){
    // 	确定需要给坐标预留的空间
    // var title = this.title;
    var width = this.width;
    var height = this.height;
    var ctxTop = this.ctxTop;
    var paddingLR = this.paddingLR;
    var content = this.content = {};
    content.conTop = ctxTop;
    content.conHeight = height - ctxTop;
    content.conLeft = paddingLR;
    content.conWidth = width -paddingLR*2;
}

HcChartProto.drawGraph = function(){
    var ctx = this.ctx;
    var cs = this.cs;
    var series = this.series;
    var csXOneLen = cs.csXOneLen;
    var csLeft = cs.csLeft;
    var csLeft = cs.csLeft + 10;
    var csTop = cs.csTop;
    var csWidth = cs.csWidth;
    var csHeight = cs.csHeight;
    var mScale = 0.12;  // 区块内柱形图的左右留白比例
    var data = []
    var columnW = csXOneLen*(1- mScale*3);  // 单个柱子的宽度
    for(var i = 0 ;i < this.xAxis.length; i ++) {
        data.push(this.xAxis[i].data)
    }
    var csYMin = this.cs.csYMin;
    for (var i = 0, len = data.length; i < len; i++) {
        ctx.fillStyle = HcChartDefault.colors[i][0]
        var columnH = (data[i] - csYMin)*this.bl;
        ctx.beginPath();
        ctx.textAlign = "center";
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.xAxis[i].data, csLeft + (i+mScale)*csXOneLen + columnW / 2, csTop + csHeight - columnH);
        ctx.fillRect(csLeft + (i+mScale)*csXOneLen, csTop + csHeight - columnH, columnW, columnH - 1);   // 减1的目的是不遮挡x轴
    }
}
// 图例
HcChartProto.drawCutLine = function() {
    var ctx = this.ctx;	
    var arr = this.xAxis;
    // 配置
    var boxW = 14;  // 小区块的宽
    var boxH = 14;   // 小区块的高
    var boxMargin  = 8;  // 小区块右的留白
    var fontSize = 12;
    var fontColor = '#000';
    ctx.font = fontSize + 'px Arial';
    ctx.textAlign = "left";
    ctx.textBaseline = 'top';
    var disTop = 24
    var index = 0
    if (!!this.opts.rotate) {
        
        for (var i = 0; i < arr.length; i++) {
            arr[i].name = this.cutTextLength(arr[i].name)
            if(i % 3 == 0) {
                ctx.beginPath();
                ctx.fillStyle = HcChartDefault.colors[i][0]
                ctx.rect(this.drawCutLineLeft, this.drawCutLineTop + disTop * index , boxW, boxH);
                ctx.fill();
                ctx.fillStyle= '#000';
                ctx.fillText(arr[i].name, this.drawCutLineLeft + boxW + boxMargin, this.drawCutLineTop + disTop * index);
            }else if (i % 3 == 1) {
                ctx.beginPath();
                ctx.fillStyle = HcChartDefault.colors[i][0]
                ctx.rect(ctx.canvas.width/3, this.drawCutLineTop + disTop * index , boxW, boxH);
                ctx.fill();
                ctx.fillStyle= '#000';
                ctx.fillText(arr[i].name, ctx.canvas.width/3 + boxW + boxMargin, this.drawCutLineTop + disTop * index);
            }else {
                ctx.beginPath();
                ctx.fillStyle = HcChartDefault.colors[i][0]
                ctx.rect((ctx.canvas.width/3) * 2, this.drawCutLineTop + disTop * index , boxW, boxH);
                ctx.fill();
                ctx.fillStyle= '#000';
                ctx.fillText(arr[i].name, (ctx.canvas.width/3) * 2 + boxW + boxMargin, this.drawCutLineTop + disTop * index);
                index += 1
            }
        }
    }else {
        for (var i = 0; i < arr.length; i++) {
            arr[i].name = this.cutTextLength(arr[i].name)
            if(i % 2 == 0) {
                ctx.beginPath();
                ctx.fillStyle = HcChartDefault.colors[i][0]
                ctx.rect(this.drawCutLineLeft, this.drawCutLineTop + disTop * index , boxW, boxH);
                ctx.fill();
                ctx.fillStyle= '#000';
                ctx.fillText(arr[i].name, this.drawCutLineLeft + boxW + boxMargin, this.drawCutLineTop + disTop * index);
            }else {
                ctx.beginPath();
                ctx.fillStyle = HcChartDefault.colors[i][0]
                ctx.rect(ctx.canvas.width/2, this.drawCutLineTop + disTop * index , boxW, boxH);
                ctx.fill();
                ctx.fillStyle= '#000';
                ctx.fillText(arr[i].name, ctx.canvas.width/2 + boxW + boxMargin, this.drawCutLineTop + disTop * index);
                index += 1
            }
        }
    }

    
    this.convertCanvasToImage(ctx.canvas)
} 
HcChartProto.cutTextLength = function(txt, omit) {
    var ctx = this.ctx;
    var txtWidth = ctx.measureText(txt).width
    if(!!this.opts.rotate) {
        var maxWidth = (ctx.canvas.width / 10 ) * 2
    }else {
        var maxWidth = (ctx.canvas.width / 6 ) * 2
    }
    if(txtWidth > maxWidth) {
        var tempArr = txt.split('')
        tempArr.splice(-1, 1)
        txt = tempArr.join('')
        return this.cutTextLength(txt, true)
    }else {
        if(!!omit) {
            return txt + '...'
        }else {
            return txt
        }
    }
}
// 转化成图片
HcChartProto.convertCanvasToImage = function(canvas) {
	var image = new Image();
    image.src = canvas.toDataURL("image/png");
    this.opts.callBack(image)
	return image;
}



var HcChartDefault = {
    colors: [
        ['#35A5ED', 'rgba(53, 165, 237, .5)'], 
        ['#D7BB6A', 'rgba(221, 192, 93, .5)'], 
        ['#4EC56D', 'rgba(86, 180, 118, .5)'], 
        ['#B293E3', 'rgba(193, 157, 235, .5)'],
        ['#14446A', 'rgba(20, 60,106, .5)'],
        ['#D51a21', 'rgba(213, 26, 33, .5)']
    ],
    style: {
        csYTxtLen: 0,  // 设置y轴的数据预留宽度
        csXTxtLen: 300,

        csXLineColor :'#aaa',  // 坐标轴X的颜色
        csXlineWidth: 0.1,  // 坐标轴X线条的宽度
        csXEveLen: 5,  // 横坐标小短横的长度
        csXfont: "10px Arial",  // 横坐标参数的 字号 字体
        csXfontColor: "#000",  // 横坐标参数的颜色
        csXfontTop: 15,  // 横坐标参数距小短横的上位置

        csYLineColor: '#aaa',  // 坐标轴Y的颜色
        csYlineWidth: .2,  // 坐标轴Y线条的宽度
        csYfont: "12px Arial",  // 纵坐标参数的 字号 字体
        csYfontColor: "#000",  // 纵坐标参数的颜色
        csYfontLeft: -10,  // 纵坐标参数距当前长横的左位置
        csYfontTop: -5  // 纵坐标参数距当前长横的上位置
    }
}