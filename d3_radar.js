var Radar_Chart = function(opt) {
    this.cfData = opt.cfData;
    this.dim = opt.dim;
    this.data = opt.cfData;
    this.element = opt.element;
    this.id = opt.id;
    this.orientation = opt.orientation;
    this.width = opt.width;
    this.height = opt.height;
    this.r = opt.circleRadius;
    this.padding = opt.padding;
    this.speed = opt.speed;
    this.optionalColorPalette = opt.colorPalette;
    this.xTicksNum = opt.xTicksNum;
    this.yTicksNum = opt.yTicksNum;
    this.barPaddingInner = opt.barPaddingInner;
    this.fontSize = opt.fontSize;
    this.maxWidth = opt.maxWidth;
    this.viewBoxOverwrite = opt.viewBoxOverwrite;
    this.startingRadian = Math.PI/2;
  
    this.draw();
  
  };


Radar_Chart.prototype.generatePolarScale = function(){
    
    this.dataMaxValue = d3.max(this.data, function(d) {
        return d.value ;
      });

    this.dimensionCount = this.data.length;
    this.dimensionRadianSpacing = (2*Math.PI)/this.dimensionCount;

    //normalize the data to the max of the values in the set
    this.yScale = d3.scaleLinear()
        .domain([0,this.dataMaxValue]) 
        .range([0,this.r]);
    

    //map the dimensions to [0,dimensionCount] to create spacing 2*PI/dimensionCount in the chart
    this.xScale = d3.scaleOrdinal()
    .domain(this.data.map(function(d){return d.key}))
    .range(d3.range(0,this.dimensionCount,1));

    //using [-r,r] as the domain
    this.polarYScale = d3.scaleLinear()
      .domain([-this.r,this.r])
      .range([this.height - 2 * this.padding, 0]);


    this.polarXScale = d3.scaleLinear()
    .domain([-this.r,this.r])
    .range([0, this.width - 2 * this.padding]);
    

    this.yAxis = d3.axisLeft().ticks(3).scale(this.polarYScale);
    this.xAxis = d3.axisBottom().ticks(3).scale(this.polarXScale);
};

Radar_Chart.prototype.draw = function() {

    var svg = d3.select(this.element).append('svg')
    .attr("id",this.id)
    .attr("padding",this.padding)
    .attr('viewBox',"0 0 "+ this.width+" "+this.height)
    .attr("preserveAspectRatio","xMinYMin")
    .style("max-width",this.maxWidth)
  
    this.plot = svg.append('g')
      .attr('class', 'Rader_Chart_holder')
      .attr('transform', "translate(" + this.padding + "," + this.padding + ")");
  
    this.generatePolarScale();
    //this.addAxis();
    this.drawShape();
    this.drawLines();
    this.addButtons();
  
  };


Radar_Chart.prototype.addAxis = function() {
    this.plot.append("g")
      .attr("id", "x-axisGroup")
      .attr("class", "x-axis")
      .attr("transform", "translate(" + "0" + "," + (this.height - 2 * this.padding) + ")");
  
    this.plot.select(".x-axis")
      .transition()
      .duration(1000)
      .call(this.xAxis);
  
    this.plot.append("g")
      .attr("id", "y-axisGroup")
      .attr("class", "y-axis")
      .attr("transform", "translate(0,0)");
  
    this.plot.select(".y-axis")
      .transition()
      .duration(1000)
      .call(this.yAxis);
  
  };


Radar_Chart.prototype.drawShape = function(){

    var that = this;

    //create chart reference point at center

    this.plot.append("circle")
    .attr("class",".chartCenter")
    .attr("cx",function(d){
        var r = 0
        return that.polarXScale(r);
    })
    .attr("cy",function(d){
        var r = 0
        return that.polarYScale(r);
    })
    .attr("r",2)
    .attr("fill","#000000");

    //find the vertices for the shape of the data

    var vertices = this.plot.selectAll(".chartVertex")
        .data(this.data,function(d){return d.key});

    var spokes = this.plot.selectAll(".chartSpokes")
        .data(this.data,function(d){return d.key});

    //remove any elements that don't have data
    vertices.exit().remove();
    spokes.exit().remove();
    
    
    //update any elements that have new data

    vertices
        .transition()
        .duration(this.speed)
        .attr("transform",function(d){
            var r = that.yScale(that.dataMaxValue);
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
            return "translate("+that.polarXScale(r*Math.cos(theta))+","+that.polarYScale(r*Math.sin(theta))+")";
        });
    
    vertices
        .selectAll("text")
        .transition().duration(1000)
        .attr("text-anchor",function(d){
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);

            if(Math.cos(theta)<0){
                var text_anchor = "end"
            }else{
                var text_anchor = "start"
            };
            return text_anchor;
        })

    spokes
        .transition()
        .duration(this.speed)
        .attr("x2",function(d){
            var r = that.yScale(10);
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
            return that.polarXScale(r*Math.cos(theta));
        })
        .attr("y2",function(d){
            var r = that.yScale(10);
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
            return that.polarYScale(r*Math.sin(theta));
        });


    //add new elements
    
    verticesGroups = vertices.enter()
        .append("g")
        .attr("class","chartVertex")
        .attr("transform",function(d){
            var r = that.yScale(that.dataMaxValue);
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
            return "translate("+that.polarXScale(r*Math.cos(theta))+","+that.polarYScale(r*Math.sin(theta))+")";
        });

    verticesGroups.append("circle")
        .attr("class","chartVertex")
        .attr("r",1)
        .attr("fill","#ababab");

    verticesGroups.append("text")
        .text(function(d){return d.key})
        .attr("text-anchor",function(d){
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);

            if(Math.cos(theta)<0){
                var text_anchor = "end"
            }else{
                var text_anchor = "start"
            };
            return text_anchor;
        })
        .attr("font-size",5)

    spokes.enter().append("line")
        .attr("class","chartSpokes")
        .attr("x1",this.polarXScale(0))
        .attr("y1",this.polarYScale(0))
        .attr("x2",function(d){
            var r = that.yScale(10);
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
            return that.polarXScale(r*Math.cos(theta));
        })
        .attr("y2",function(d){
            var r = that.yScale(10);
            var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
            return that.polarYScale(r*Math.sin(theta));
        })
        .style("stroke-width",1)
        .style("stroke","#DCDCDC")
        .style("stroke-dasharray", ("1, 1"));
        
};

Radar_Chart.prototype.drawLines = function(){

    var that = this;

    var outlineHalfFunction = d3.line()
    .x(function(d){            
        var r = that.yScale(that.dataMaxValue/2);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarXScale(r*Math.cos(theta));
    })
    .y(function(d){            
        var r = that.yScale(that.dataMaxValue/2);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarYScale(r*Math.sin(theta));
    })
    .curve(d3.curveLinearClosed)

    var outlineFullFunction = d3.line()
    .x(function(d){            
        var r = that.yScale(that.dataMaxValue);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarXScale(r*Math.cos(theta));
    })
    .y(function(d){            
        var r = that.yScale(that.dataMaxValue);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarYScale(r*Math.sin(theta));
    })
    .curve(d3.curveLinearClosed)

    var lineFunction = d3.line()
    .x(function(d){            
        var r = that.yScale(d.value);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarXScale(r*Math.cos(theta));
    })
    .y(function(d){            
        var r = that.yScale(d.value);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarYScale(r*Math.sin(theta));
    })
    .curve(d3.curveLinearClosed)

    this.plot.append("path")
        .attr("class","radarPath")
        .attr("d",lineFunction(this.data))
        .attr("fill","none")
        .attr("stroke","#a7a7a7")
        .attr("stroke-width",1);

    this.plot.append("path")
        .attr("class","outlineHalfPath")
        .attr("d",outlineHalfFunction(this.data))
        .attr("fill","none")
        .attr("stroke","#DCDCDC")
        .attr("stroke-width",1)
        .style("stroke-dasharray", ("3, 3"));

        this.plot.append("path")
        .attr("class","outlineFullPath")
        .attr("d",outlineFullFunction(this.data))
        .attr("fill","none")
        .attr("stroke","#DCDCDC")
        .attr("stroke-width",1)
        .style("stroke-dasharray", ("3, 3"));


};

Radar_Chart.prototype.updateLines = function(){

    var that = this;

    var outlineHalfFunction = d3.line()
    .x(function(d){            
        var r = that.yScale(that.dataMaxValue/2);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarXScale(r*Math.cos(theta));
    })
    .y(function(d){            
        var r = that.yScale(that.dataMaxValue/2);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarYScale(r*Math.sin(theta));
    })
    .curve(d3.curveLinearClosed);

    var outlineFullFunction = d3.line()
    .x(function(d){            
        var r = that.yScale(that.dataMaxValue);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarXScale(r*Math.cos(theta));
    })
    .y(function(d){            
        var r = that.yScale(that.dataMaxValue);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarYScale(r*Math.sin(theta));
    })
    .curve(d3.curveLinearClosed);

    var lineFunction = d3.line()
    .x(function(d){            
        var r = that.yScale(d.value);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarXScale(r*Math.cos(theta));
    })
    .y(function(d){            
        var r = that.yScale(d.value);
        var theta = (that.dimensionRadianSpacing*that.xScale(d.key) + that.startingRadian) % (2*Math.PI);
        return that.polarYScale(r*Math.sin(theta));
    })
    .curve(d3.curveLinearClosed);

    this.plot.select(".radarPath")
        .transition().duration(1000)
        .attr("d",lineFunction(this.data));

    this.plot.select(".outlineHalfPath")
        .transition().duration(1000)
        .attr("d",outlineHalfFunction(this.data));

    this.plot.select(".outlineFullPath")
        .transition().duration(1000)
        .attr("d",outlineFullFunction(this.data));

};

Radar_Chart.prototype.addButtons = function(){

    var that = this;

    d3.select(".button-container").append("button")
        .text("Add New Data")
        .on("click",function(){
            that.addData()
        });
        
};

Radar_Chart.prototype.addData = function(){

    var newData = 
        {
        key:"Dimension" + (this.dimensionCount + 1),
        value:Math.floor(Math.random() * 10) + 1
        }
    
    this.data.push(newData);
    
    console.log(this.data);

    this.generatePolarScale();
    this.drawShape();
    this.updateLines();
        
};