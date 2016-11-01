var w = 750,
    h = 450,
    r = 120;

var width = 300,
    height = 200,
    dragbarw = 20;

top_fixed = true;
bottom_fixed = true;
left_fixed = true;
right_fixed = true;

var drag = d3.behavior.drag()
    .origin(Object)
    .on("drag", dragmove);

var dragright = d3.behavior.drag()
    .origin(Object)
    .on("drag", rdragresize);

var dragleft = d3.behavior.drag()
    .origin(Object)
    .on("drag", ldragresize);

var dragtop = d3.behavior.drag()
    .origin(Object)
    .on("drag", tdragresize);

var dragbottom = d3.behavior.drag()
    .origin(Object)
    .on("drag", bdragresize);

var svg = d3.select("body").append("svg")
    .attr("width", w)
    .attr("height", h);

var newg = svg.append("g")
    .data([{x: width / 2, y: height / 2}]);

var dragrect = newg.append("rect")
    .attr("id", "active")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("height", height)
    .attr("width", width)
    .attr("fill-opacity", .1)
    .attr("cursor", "move")
    .call(drag);

var dragbarleft = newg.append("circle")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y + (height/2); })
    .attr("id", "dragleft")
    .attr("r", dragbarw/2)
    .attr("fill", "lightblue")
    .attr("fill-opacity", .5)
    .attr("cursor", "ew-resize")
    .call(dragleft)
    .on("contextmenu", rclick_left);

var dragbarright = newg.append("circle")
    .attr("cx", function(d) { return d.x + width; })
    .attr("cy", function(d) { return d.y + height/2; })
    .attr("id", "dragright")
    .attr("r", dragbarw/2)
    .attr("fill", "lightblue")
    .attr("fill-opacity", .5)
    .attr("cursor", "ew-resize")
    .call(dragright)
    .on("contextmenu", rclick_right);


var dragbartop = newg.append("circle")
    .attr("cx", function(d) { return d.x + width/2; })
    .attr("cy", function(d) { return d.y ; })
    .attr("r", dragbarw/2)
    .attr("id", "dragleft")
    .attr("fill", "lightgreen")
    .attr("fill-opacity", .5)
    .attr("cursor", "ns-resize")
    .call(dragtop)
    .on("contextmenu", rclick_top);


var dragbarbottom = newg.append("circle")
    .attr("cx", function(d) { return d.x + (width/2); })
    .attr("cy", function(d) { return d.y + height; })
    .attr("id", "dragright")
    .attr("r", dragbarw/2)
    .attr("fill", "lightgreen")
    .attr("fill-opacity", .5)
    .attr("cursor", "ns-resize")
    .call(dragbottom)
    .on("contextmenu", rclick_bottom);


set_edges();

function rclick_left(){
    left_fixed = !left_fixed;
    set_edges();
    return false;
}
function rclick_right(){
    right_fixed = !right_fixed;
    set_edges();
}
function rclick_top(){
    top_fixed = !top_fixed;
    set_edges();
}
function rclick_bottom(){
    bottom_fixed = !bottom_fixed;
    set_edges();
}

function dragmove(d) {
    dragrect
        .attr("x", d.x = Math.max(0, Math.min(w - width, d3.event.x)));
    dragbarleft
        .attr("cx", function(d) { return d.x; });
    dragbarright
        .attr("cx", function(d) { return d.x + width; });
    dragbartop
        .attr("cx", function(d) { return d.x + (width/2); });
    dragbarbottom
        .attr("cx", function(d) { return d.x + (width/2); });

    dragrect
        .attr("y", d.y = Math.max(0, Math.min(h - height, d3.event.y)));
    dragbarleft
        .attr("cy", function(d) { return d.y + (height/2); });
    dragbarright
        .attr("cy", function(d) { return d.y + (height/2); });
    dragbartop
        .attr("cy", function(d) { return d.y; });
    dragbarbottom
        .attr("cy", function(d) { return d.y + height; });
}

function ldragresize(d) {
    var oldx = d.x;
    //Max x on the right is x + width - dragbarw
    //Max x on the left is 0 - (dragbarw/2)
    d.x = Math.max(0, Math.min(d.x + width - (dragbarw / 2), d3.event.x));
    width = width + (oldx - d.x);
    dragbarleft
        .attr("cx", function(d) { return d.x; });

    dragrect
        .attr("x", function(d) { return d.x; })
        .attr("width", width);

    dragbartop
        .attr("cx", function(d) { return d.x + (width/2); })
        .attr("width", width - dragbarw);

    dragbarbottom
        .attr("cx", function(d) { return d.x + (width/2); })
        .attr("width", width - dragbarw);

    set_edges();
}

function rdragresize(d) {
    //Max x on the left is x - width
    //Max x on the right is width of screen + (dragbarw/2)
    var dragx = Math.max(d.x + (dragbarw/2), Math.min(w, d.x + width + d3.event.dx));

    //recalculate width
    width = dragx - d.x;

    //move the right drag handle
    dragbarright
        .attr("cx", function(d) { return dragx  });

    //resize the drag rectangle
    //as we are only resizing from the right, the x coordinate does not need to change
    dragrect
        .attr("width", width);

    dragbartop
        .attr("cx", function(d) { return d.x + (width/2); })
        .attr("width", width - dragbarw);

    dragbarbottom
        .attr("cx", function(d) { return d.x + (width/2); })
        .attr("width", width - dragbarw);

    set_edges();
}

function tdragresize(d) {

    var oldy = d.y;
    //Max x on the right is x + width - dragbarw
    //Max x on the left is 0 - (dragbarw/2)
    d.y = Math.max(0, Math.min(d.y + height - (dragbarw / 2), d3.event.y));
    height = height + (oldy - d.y);

    dragbartop
        .attr("cy", function(d) { return d.y; });

    dragrect
        .attr("y", function(d) { return d.y; })
        .attr("height", height);

    dragbarleft
        .attr("cy", function(d) { return d.y + (height/2); })
        .attr("height", height - dragbarw);
    dragbarright
        .attr("cy", function(d) { return d.y + (height/2); })
        .attr("height", height - dragbarw);

    set_edges();
}

function bdragresize(d) {
    //Max x on the left is x - width
    //Max x on the right is width of screen + (dragbarw/2)
    var dragy = Math.max(d.y + (dragbarw/2), Math.min(h, d.y + height + d3.event.dy));

    //recalculate width
    height = dragy - d.y;

    //move the right drag handle
    dragbarbottom
        .attr("cy", function(d) { return dragy });

    //resize the drag rectangle
    //as we are only resizing from the right, the x coordinate does not need to change
    dragrect
        .attr("height", height);

    dragbarleft
        .attr("cy", function(d) { return d.y + (height/2); })
        .attr("height", height - dragbarw);
    dragbarright
        .attr("cy", function(d) { return d.y + (height/2); })
        .attr("height", height - dragbarw);

    set_edges();
}

function set_edges() {

    dragrect.style("stroke", "black");

    // Edging goes top, right, bottom, left
    // As a rectangle has 4 sides, there are 2^4 = 16 cases to handle.

    // 4 edges:
    if (top_fixed && bottom_fixed && left_fixed && right_fixed) {
        dragrect.style("stroke-dasharray", [width + height + width + height].join(','));
    }

    // 3 edges
    else if (top_fixed && bottom_fixed && right_fixed) {
        dragrect.style("stroke-dasharray", [width + height + width, height].join(','));
    } else if (top_fixed && bottom_fixed && left_fixed) {
        dragrect.style("stroke-dasharray", [width, height, width + height].join(',') );
    } else if (top_fixed && left_fixed && right_fixed) {
        dragrect.style("stroke-dasharray", [width + height, width, height].join(',') );
    } else if (bottom_fixed && left_fixed && right_fixed) {
        dragrect.style("stroke-dasharray", [0, (width), height + width + height].join(','));
    }

    // 2 edges
    else if (top_fixed && bottom_fixed) {
        dragrect.style("stroke-dasharray", [width, height, width, height].join(','));
    }  else if (top_fixed && left_fixed) {
        dragrect.style("stroke-dasharray", [width, height + width, height].join(','));
    }   else if (top_fixed && right_fixed) {
        dragrect.style("stroke-dasharray", [width + height, width + height].join(','));
    }   else  if (bottom_fixed && left_fixed) {
        dragrect.style("stroke-dasharray", [0, width + height, width + height].join(','));
    } else  if (bottom_fixed && right_fixed) {
        dragrect.style("stroke-dasharray", [0, width, height + width, height].join(','));
    }  else  if (left_fixed && right_fixed) {
        dragrect.style("stroke-dasharray", [width, height + width, height].join(','));
    }

    // 1 edges
    else if (top_fixed) {
        dragrect.style("stroke-dasharray", [width, (height + width + height)].join(','));
    }
    else if (bottom_fixed) {
        dragrect.style("stroke-dasharray", [0, (width + height), width, height].join(','));
    }
    else if (left_fixed) {
        dragrect.style("stroke-dasharray", [0, (width + height + width), height].join(','));
    }
    else if (right_fixed){
        dragrect.style("stroke-dasharray", [0, (width + height + width), height].join(','));
    }

    // 0 edges
    else {
        dragrect.style("stroke-dasharray", [0, width + height + width + height].join(','));
    }
}