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


function setup(){
    set_edges();
    describe_constraint();

}

// Handle right-clicks on control points
function rclick_left(){
    left_fixed = !left_fixed;

    if (!left_fixed){
        ldragresize_inner( dragrect.attr("x"), 0);
    }

    set_edges();
    return false;
}
function rclick_right(){
    right_fixed = !right_fixed;
    if (!right_fixed){
        rdragresize_inner(dragrect.attr("x"), w);
    }
    set_edges();
}
function rclick_top(){
    top_fixed = !top_fixed;
    if (!top_fixed){
        tdragresize_inner(dragrect.attr("y"), 0);
    }
    set_edges();
}
function rclick_bottom(){
    bottom_fixed = !bottom_fixed;
    if (!bottom_fixed){
        bdragresize_inner(dragrect.attr("y"), h);
    }
    set_edges();
}


// Handle dragging and resizing
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

    // resize so edges remain on axes if necessary
    if (!left_fixed){
        ldragresize_inner( dragrect.attr("x"), 0);
    }
    if (!right_fixed){
        rdragresize_inner(dragrect.attr("x"), w);
    }
    if (!top_fixed){
        tdragresize_inner(dragrect.attr("y"), 0);
    }
    if (!bottom_fixed){
        bdragresize_inner(dragrect.attr("y"), h);
    }

    update_text();
}

function ldragresize(d) {
    var oldx = d.x;
    //Max x on the right is x + width - dragbarw
    //Max x on the left is 0 - (dragbarw/2)
    d.x = Math.max(0, Math.min(d.x + width - (dragbarw / 2), d3.event.x));

    ldragresize_inner(oldx, d.x);
}

function ldragresize_inner(oldx, newx) {
    width = width + (oldx - newx);

    dragbarleft
        .attr("cx", function(d) { return newx; });

    dragrect
        .attr("x", function(d) { return newx; })
        .attr("width", width);

    dragbartop
        .attr("cx", function(d) { return newx + (width/2); })
        .attr("width", width - dragbarw);

    dragbarbottom
        .attr("cx", function(d) { return newx + (width/2); })
        .attr("width", width - dragbarw);

    set_edges();
    update_text();
}


function rdragresize(d) {
    //Max x on the left is x - width
    //Max x on the right is width of screen + (dragbarw/2)
    var dragx = Math.max(d.x + (dragbarw/2), Math.min(w, d.x + width + d3.event.dx));

    rdragresize_inner(d.x ,dragx);
}

function rdragresize_inner(oldx, dragx) {

    //recalculate width
    width = dragx - oldx;

    //move the right drag handle
    dragbarright
        .attr("cx", function(d) { return dragx  });

    //resize the drag rectangle
    //as we are only resizing from the right, the x coordinate does not need to change
    dragrect
        .attr("width", width);

    dragbartop
        .attr("cx", function(d) { return oldx + (width/2); })
        .attr("width", width - dragbarw);

    dragbarbottom
        .attr("cx", function(d) { return oldx + (width/2); })
        .attr("width", width - dragbarw);

    set_edges();
    update_text();
}


function tdragresize(d) {
    var oldy = d.y;
    //Max x on the right is x + width - dragbarw
    //Max x on the left is 0 - (dragbarw/2)

    d.y = Math.max(0, Math.min(d.y + height - (dragbarw / 2), d3.event.y));
    tdragresize_inner(oldy, d.y);
}

function tdragresize_inner(oldy, newy) {

    //Max x on the right is x + width - dragbarw
    //Max x on the left is 0 - (dragbarw/2)
    height = height + (oldy - newy);

    dragbartop
        .attr("cy", function(d) { return newy; });

    dragrect
        .attr("y", function(d) { return newy; })
        .attr("height", height);

    dragbarleft
        .attr("cy", function(d) { return newy + (height/2); })
        .attr("height", height - dragbarw);
    dragbarright
        .attr("cy", function(d) { return newy + (height/2); })
        .attr("height", height - dragbarw);

    set_edges();
    update_text();
}


function bdragresize(d) {
    //Max x on the left is x - width
    //Max x on the right is width of screen + (dragbarw/2)
    var dragy = Math.max(d.y + (dragbarw/2), Math.min(h, d.y + height + d3.event.dy));

    bdragresize_inner(d.y, dragy);
}

function bdragresize_inner(oldy, newy) {
    //Max x on the left is x - width
    //Max x on the right is width of screen + (dragbarw/2)

    //recalculate width
    height = newy - oldy;

    //move the right drag handle
    dragbarbottom
        .attr("cy", function(d) { return newy });

    //resize the drag rectangle
    //as we are only resizing from the right, the x coordinate does not need to change
    dragrect
        .attr("height", height);

    dragbarleft
        .attr("cy", function(d) { return oldy + (height/2); })
        .attr("height", height - dragbarw);
    dragbarright
        .attr("cy", function(d) { return oldy + (height/2); })
        .attr("height", height - dragbarw);

    set_edges();
    update_text();
}



// Shading edges

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
        dragrect.style("stroke-dasharray", [0, width, height , width, height].join(','));
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

    update_text();
}


// Describing selected region
function get_time_option_box(choice){

    if (choice == "between times"){
        return '<select><option>between times</option><option>after</option><option>before</option><option>always</option><option>unconstrained</option></select>';
    } else if (choice == "after"){
        return '<select><option>between times</option><option selected=true">after</option><option>before</option><option>always</option><option>unconstrained</option></select>';
    } else if (choice == "before"){
        return '<select><option>between times</option><option>after</option><option selected=true">before</option><option>always</option><option>unconstrained</option></select>';
    } else if (choice == "always"){
        return '<select><option>between times</option><option>after</option><option>before</option><option selected=true">always</option><option>unconstrained</option></select>';
    } else if (choice == "unconstrained"){
        return '<select><option>between times</option><option>after</option><option>before</option><option>always</option><option selected="true">unconstrained</option></option></select>';
    }

}

function get_y_option_box(choice){

    if (choice == "between"){
        return '<select><option selected=true">between</option><option>below</option><option>above</option><option>unconstrained</option></select>';
    } else if (choice == "below"){
        return '<select><option>between</option><option selected=true">below</option><option>above</option><option>unconstrained</option></select>';
    } else if (choice == "above"){
        return '<select><option>between</option><option>below</option><option selected=true">above</option><option>unconstrained</option></select>';
    } else if (choice == "unconstrained"){
        return '<select><option>between</option><option>below</option><option>above</option><option selected=true">unconstrained</option></select>';
    }

}



function describe_y(){
    y_upper = parseInt(dragrect.attr("y"));
    y_lower = y_upper + parseInt(dragrect.attr("height"));

    // 2 bounds
    if (top_fixed && bottom_fixed) {
        return get_y_option_box("between") + "<input id='y_1' value='" + y_lower + "'/>" + " and " + "<input id='y_2' value='" + y_upper + "'/>";
    }

    // 1 bound
    else if (top_fixed) {
        return get_y_option_box("below") + "<input id='y_1' value='" + y_upper + "'/>";
    }
    else if (bottom_fixed) {
        return get_y_option_box("above") + "<input id='y_1' value='" + y_lower + "'/>";
    }

    // 0 bounds
    else {
        // Don't convert, but keep as an easily checkable sentinel value
        return "unconstrained";
    }
}

function describe_constraint(){
    var y_constraint = describe_y();

    if (y_constraint == "unconstrained"){
        return get_y_option_box("unconstrained");
    }

    x_lower = parseInt(dragrect.attr("x"));
    x_upper = x_lower + parseInt(dragrect.attr("width"));

    // 2 bounds
    if (left_fixed && right_fixed){
        return y_constraint + ", " + get_time_option_box("between times")  + "<input id='time_1' value='" + x_lower + "'/>" + " and " + "<input id='time_2' value='" + x_upper + "'/>";
    }

    // 1 bound
    else if (left_fixed){
        return y_constraint + get_time_option_box("after") +  "<input id='time_1' value='" + x_lower + "'/>"
    }
    else if (right_fixed){
        return y_constraint + get_time_option_box("before") + "<input id='time_1' value='" + x_upper + "'/>"
    }

    // 0 bounds
    else {
        return y_constraint + get_time_option_box("always")
    }
}

function update_text(){
    var msg = describe_constraint();
    document.getElementById("placeholder").innerHTML = msg;
}