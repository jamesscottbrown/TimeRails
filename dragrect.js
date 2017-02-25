function imposeLimits(lower, upper, val){
    return Math.max(lower, Math.min(upper, val));
}

function setup(div_name, index) {

    var w = 750,
        h = 450,
        r = 120;

    var width = 300 * 0.75,
        height = 200 * 0.75,
        dragbarw = 20;

    var vertical_padding = 30;
    var horizontal_padding = 30;
    var track_padding = 10;

    var top_fixed = true;
    var bottom_fixed = true;
    var left_fixed = true;
    var right_fixed = true;

    var timing_parent_bar = false;

    var drag = d3.behavior.drag()
        .origin(Object)
        .on("drag", dragmove);

    var dragright = d3.behavior.drag()
        .origin(Object)
        .on("drag", drag_resize_right);

    var dragleft = d3.behavior.drag()
        .origin(Object)
        .on("drag", drag_resize_left);

    var dragtop = d3.behavior.drag()
        .origin(Object)
        .on("drag", drag_resize_top);

    var dragbottom = d3.behavior.drag()
        .origin(Object)
        .on("drag", drag_resize_bottom);

    var svg = d3.select(div_name).append("svg")
        .attr("width", w)
        .attr("height", h);

    var xRange = [0, 100];
    var xScale = d3.scale.linear()
        .domain(xRange)
        .range([vertical_padding, w - horizontal_padding]);

    var xAxis =  d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    svg.append("g")
        .call(xAxis)
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - vertical_padding) + ")");

    var yRange = [100, 0];
    var yScale = d3.scale.linear()
        .domain(yRange)
        .range([vertical_padding, h - vertical_padding]);

    var yAxis =  d3.svg.axis()
        .scale(yScale)
        .orient("left");

    svg.append("g")
        .call(yAxis)
        .attr("class", "axis")
        .attr("transform", "translate(" + (horizontal_padding) + ", " + 0 + ")");


    function timeToX(time){
        return xScale(time);
    }
    function XToTime(x){
        return xScale.invert(x);
    }
    function valToY(val){
        return yScale(val);
    }
    function YToVal(y) {
        return yScale.invert(y);
    }

    function getY(){
        return maxValue;
    }
    function getX(){
        return startTime;
    }


    var p = d3.select(div_name).append("p");
    p.text("X is");
    var placeholder = p.append("b");
    var placeholder_latex = p.append("div");

    var startTime = (xRange[0] + xRange[1]) / 2;
    var maxValue = (yRange[0] + yRange[1]) / 2;
    var endTime;

    var newg = svg.append("g");

    var dragrect = newg.append("rect")
        .attr("id", "active")
        .attr("x", function (d) {
            return timeToX(startTime);
        })
        .attr("y", function (d) {
            return valToY(maxValue);
        })
        .attr("height", height)
        .attr("width", width)
        .attr("fill", "lightgreen")
        .attr("fill-opacity", .25)
        .attr("cursor", "move")
        .call(drag);

    var dragbarleft = newg.append("circle")
        .attr("cx", function (d) {
            return timeToX(startTime);
        })
        .attr("cy", function (d) {
            return valToY(maxValue) + (height / 2);
        })
        .attr("id", "dragleft")
        .attr("r", dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ew-resize")
        .call(dragleft)
        .on('contextmenu', d3.contextMenu([{
            title: function(){
                return left_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_left
        }]));

    var dragbarright = newg.append("circle")
        .attr("cx", function (d) {
            return timeToX(startTime) + width;
        })
        .attr("cy", function (d) {
            return valToY(maxValue) + height / 2;
        })
        .attr("id", "dragright")
        .attr("r", dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ew-resize")
        .call(dragright)
        .on('contextmenu', d3.contextMenu([{
            title: function(){
                return right_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_right
        }]));
    endTime = XToTime(dragbarright.attr("cx"));


    var dragbartop = newg.append("circle")
        .attr("cx", function (d) {
            return timeToX(startTime) + width / 2;
        })
        .attr("cy", function (d) {
            return valToY(maxValue);
        })
        .attr("r", dragbarw / 2)
        .attr("id", "dragleft")
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ns-resize")
        .call(dragtop)
        .on('contextmenu', d3.contextMenu([{
            title: function(){
                return top_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_top
        }]));


    var dragbarbottom = newg.append("circle")
        .attr("cx", function (d) {
            return timeToX(startTime) + (width / 2);
        })
        .attr("cy", function (d) {
            return valToY(maxValue) + height;
        })
        .attr("id", "dragright")
        .attr("r", dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ns-resize")
        .call(dragbottom)
        .on('contextmenu', d3.contextMenu([{
            title: function(){
                return bottom_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_bottom
        }]));


    var menu = [
        {
            title: 'Constraint starts at fixed time',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                    timing_parent_bar = false;
                }
            },
            disabled: false // optional, defaults to false
        },
        {
            title: 'Constraint applies at <i>some</i> time in range',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'some');
            }
        },
        {
            title: 'Constraint applies at <i>all</i> times in range',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'all');
            }
        }
    ];


    var startline = newg.append("line")
        .attr("x1", timeToX(getX()))
        .attr("x2", timeToX(getX()))
        .attr("y1", valToY(getY()))
        .attr("y2", h - track_padding)
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2");

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("cx", timeToX(getX()))
        .attr("cy", h - track_padding)
        .attr("r", 5)
        .attr("fill", "rgb(255,0,0)")
        .attr("fill-opacity", .5)
        .attr("id", "track_circle")
        .on('contextmenu', d3.contextMenu(menu));

    function move_startline(){
        startline.attr("x1", timeToX(getX()))
            .attr("x2", timeToX(getX()))
            .attr("y1", valToY(getY()))
            .attr("y2", h - track_padding);

        track_circle.attr("cx", timeToX(getX()));
    }


    function drag_fixed() {
        // resize so edges remain on axes if necessary
        if (!left_fixed) {
            drag_resize_left_inner(timeToX(getX()), 0);
        }
        if (!right_fixed) {
            drag_resize_right_inner(timeToX(getX()), w);
        }
        if (!top_fixed) {
            drag_resize_top_inner(valToY(getY()), 0);
        }
        if (!bottom_fixed) {
            drag_resize_bottom_inner(valToY(getY()), h);
        }

    }

// Handle right-clicks on control points
    function rclick_left() {
        left_fixed = !left_fixed;

        if (!left_fixed) {
            drag_resize_left_inner(timeToX(getX()), 0);
        }

        set_edges();
        return false;
    }

    function rclick_right() {
        right_fixed = !right_fixed;
        if (!right_fixed) {
            drag_resize_right_inner(timeToX(getX()), w);
        }
        set_edges();
    }

    function rclick_top() {
        top_fixed = !top_fixed;
        if (!top_fixed) {
            drag_resize_top_inner(valToY(getY()), 0);
        }
        set_edges();
    }

    function rclick_bottom() {
        bottom_fixed = !bottom_fixed;
        if (!bottom_fixed) {
            drag_resize_bottom_inner(valToY(getY()), h);
        }
        set_edges();
    }


// Handle dragging and resizing
    function dragmove(d) {
        dragrect
            .attr("x", function (d){
                var rect_center = d3.mouse(svg.node())[0] - width/2;
                var x = imposeLimits(0, w - width, rect_center);

                if (timing_parent_bar) {
                    x = imposeLimits(timing_parent_bar.get_start_time(), timing_parent_bar.get_end_time(), x);
                }

                startTime = XToTime(x);
                endTime = XToTime(dragbarright.attr("cx"));
                return x;
            });
        dragbarleft
            .attr("cx", function (d) {
                return timeToX(startTime);
            });
        dragbarright
            .attr("cx", function (d) {
                return timeToX(startTime) + width;
            });
        dragbartop
            .attr("cx", function (d) {
                return timeToX(startTime) + (width / 2);
            });
        dragbarbottom
            .attr("cx", function (d) {
                return timeToX(startTime) + (width / 2);
            });

        dragrect
            .attr("y", function (d) {
                var rect_center = d3.mouse(svg.node())[1] - height/2;

                var y = imposeLimits(0, h-height, rect_center);
                maxValue = YToVal(y);
                return y;
            });
        dragbarleft
            .attr("cy", function (d) {
                return valToY(maxValue) + (height / 2);
            });
        dragbarright
            .attr("cy", function (d) {
                return valToY(maxValue) + (height / 2);
            });
        dragbartop
            .attr("cy", function (d) {
                return valToY(maxValue);
            });
        dragbarbottom
            .attr("cy", function (d) {
                return valToY(maxValue) + height;
            });

        drag_fixed();
        update_text();
        move_startline();
    }

    function drag_resize_left(d) {
        if (!left_fixed) {
            return;
        }

        var oldx = timeToX(startTime);
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_x = d3.mouse(svg.node())[0];
        var newx = imposeLimits(0, timeToX(startTime) + width - (dragbarw / 2), cursor_x);

        drag_resize_left_inner(oldx, newx);
    }

    function drag_resize_left_inner(oldx, newx) {

        startTime = XToTime(newx);

        width = width + (oldx - newx);

        dragbarleft
            .attr("cx", newx);

        dragrect
            .attr("x", newx)
            .attr("width", width);

        dragbartop
            .attr("cx", newx + (width / 2))
            .attr("width", width - dragbarw);

        dragbarbottom
            .attr("cx", newx + (width / 2))
            .attr("width", width - dragbarw);

        set_edges();
        update_text();
        move_startline();
    }


    function drag_resize_right(d) {
        if (!right_fixed) {
            return;
        }

        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)
        var dragx = imposeLimits(timeToX(startTime) + (dragbarw / 2), w, timeToX(startTime) + width + d3.event.dx);
        drag_resize_right_inner(timeToX(startTime), dragx);
    }

    function drag_resize_right_inner(oldx_left, newx_right) {

        width = newx_right - oldx_left;

        dragbarright
            .attr("cx", newx_right);

        dragrect
            .attr("width", width);

        dragbartop
            .attr("cx", oldx_left + (width / 2))
            .attr("width", width - dragbarw);

        dragbarbottom
            .attr("cx", oldx_left + (width / 2))
            .attr("width", width - dragbarw);

        endTime = XToTime(dragbarright.attr("cx"));

        set_edges();
        update_text();
        move_startline();
    }


    function drag_resize_top(d) {
        if (!top_fixed) {
            return;
        }

        var oldy = valToY(maxValue);
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_y = d3.mouse(svg.node())[1];
        var newy = imposeLimits(0, Math.min(valToY(maxValue) + height - (dragbarw / 2), cursor_y));
        drag_resize_top_inner(oldy, newy);
    }

    function drag_resize_top_inner(oldy, newy) {

        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        maxValue = YToVal(newy);

        height = height + (oldy - newy);

        dragbartop
            .attr("cy", newy);

        dragrect
            .attr("y", newy)
            .attr("height", height);

        dragbarleft
            .attr("cy", newy + (height / 2))
            .attr("height", height - dragbarw);
        dragbarright
            .attr("cy", newy + (height / 2))
            .attr("height", height - dragbarw);

        set_edges();
        update_text();
        move_startline();
    }


    function drag_resize_bottom(d) {
        if (!bottom_fixed) {
            return;
        }

        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)
        var dragy = imposeLimits(valToY(maxValue) + (dragbarw / 2), h, valToY(maxValue) + height + d3.event.dy);
        drag_resize_bottom_inner(valToY(maxValue), dragy);
    }

    function drag_resize_bottom_inner(oldy, newy) {
        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)

        //recalculate width
        height = newy - oldy;

        //move the right drag handle
        dragbarbottom
            .attr("cy", newy);

        //resize the drag rectangle
        //as we are only resizing from the right, the x coordinate does not need to change
        dragrect
            .attr("height", height);

        dragbarleft
            .attr("cy", oldy + (height / 2))
            .attr("height", height - dragbarw);
        dragbarright
            .attr("cy", oldy + (height / 2))
            .attr("height", height - dragbarw);

        set_edges();
        update_text();
        move_startline();
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
            dragrect.style("stroke-dasharray", [width, height, width + height].join(','));
        } else if (top_fixed && left_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [width + height, width, height].join(','));
        } else if (bottom_fixed && left_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [0, (width), height + width + height].join(','));
        }

        // 2 edges
        else if (top_fixed && bottom_fixed) {
            dragrect.style("stroke-dasharray", [width, height, width, height].join(','));
        } else if (top_fixed && left_fixed) {
            dragrect.style("stroke-dasharray", [width, height + width, height].join(','));
        } else if (top_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [width + height, width + height].join(','));
        } else if (bottom_fixed && left_fixed) {
            dragrect.style("stroke-dasharray", [0, width + height, width + height].join(','));
        } else if (bottom_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [0, width, height + width, height].join(','));
        } else if (left_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [0, width, height, width, height].join(','));
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
        else if (right_fixed) {
            dragrect.style("stroke-dasharray", [0, (width + height + width), height].join(','));
        }

        // 0 edges
        else {
            dragrect.style("stroke-dasharray", [0, width + height + width + height].join(','));
        }

        update_text();
        move_startline();
    }


// Describing selected region
    function get_time_option_box(choice) {

        if (choice == "between times") {
            return '<select id="time_option""><option>between times</option><option>after</option><option>before</option><option>always</option></select>';
        } else if (choice == "after") {
            return '<select id="time_option"><option>between times</option><option selected="true">after</option><option>before</option><option>always</option></select>';
        } else if (choice == "before") {
            return '<select id="time_option"><option>between times</option><option>after</option><option selected="true">before</option><option>always</option></select>';
        } else if (choice == "always") {
            return '<select id="time_option"><option>between times</option><option>after</option><option>before</option><option selected="true">always</option></select>';
        }

    }

    function get_y_option_box(choice) {

        if (choice == "between") {
            return '<select id="value_option"><option selected="true">between</option><option>below</option><option>above</option><option>unconstrained</option></select>';
        } else if (choice == "below") {
            return '<select id="value_option"><option>between</option><option selected="true">below</option><option>above</option><option>unconstrained</option></select>';
        } else if (choice == "above") {
            return '<select id="value_option"><option>between</option><option>below</option><option selected="true">above</option><option>unconstrained</option></select>';
        } else if (choice == "unconstrained") {
            return '<select id="value_option"><option>between</option><option>below</option><option>above</option><option selected=true">unconstrained</option></select>';
        }
    }


    function describe_y() {
        //var y_upper = parseInt(dragrect.attr("y"));
        // var y_upper = dragrect.data("y");

        var y_upper = getY();
        var y_lower = YToVal( valToY(y_upper) + parseInt(dragrect.attr("height")) );

        var html_sting, latex_string,  y_callbacks;

        // 2 bounds
        if (top_fixed && bottom_fixed) {
            y_callbacks = [change_value_lower, change_value_upper];
            latex_string = "(" + y_lower + "< x_" + index + "<" + y_upper + ")";
            html_sting = get_y_option_box("between") + "<input id='y_1' value='" + y_lower + "' />" + " and " + "<input id='y_2' value='" + y_upper + "'/>";
        }

        // 1 bound
        else if (top_fixed) {
            y_callbacks = [change_value_upper];
            latex_string = "(x_" + index + "<" + y_upper + ")";
            html_sting = get_y_option_box("below") + "<input id='y_1' value='" + y_upper + "'/>";
        }
        else if (bottom_fixed) {
            y_callbacks = [change_value_lower];
            latex_string = "(" + y_lower + "< x_" + index + ")";
            html_sting = get_y_option_box("above") + "<input id='y_1' value='" + y_lower + "' />";
        }

        // 0 bounds
        else {
            // Don't convert, but keep as an easily checkable sentinel value
            latex_string = "";
            y_callbacks = [];
            html_sting = "unconstrained";
        }

        return [html_sting, latex_string, y_callbacks];
    }

    function describe_constraint() {
        var y_constraint, y_callbacks, y_latex_string;
        [y_constraint, y_latex_string, y_callbacks] = describe_y();

        var html_string;
        var latex_string;
        var x_callbacks;

        if (y_constraint == "unconstrained") {

            html_string = get_y_option_box("unconstrained");
            x_callbacks = [];
            latex_string = "\\;"; // Insert latex symbol for space to avoid empty forumla appearing as '$$'
            return [html_string, x_callbacks, y_callbacks, latex_string];

        }

        var x_lower = getX();
        var x_upper = XToTime( timeToX(x_lower) + parseInt(dragrect.attr("width")) );


        // 2 bounds
        if (left_fixed && right_fixed) {
            html_string = y_constraint + ", " + get_time_option_box("between times") + "<input id='time_1' value='" + x_lower + "' />" + " and " + "<input id='time_2' value='" + x_upper + "' />";
            latex_string = "\\square_{[" + x_lower + "," + x_upper + "]}" + y_latex_string;
            x_callbacks = [change_time_value_lower, change_time_value_upper];
        }

        // 1 bound
        else if (left_fixed) {
            html_string = y_constraint + get_time_option_box("after") + "<input id='time_1' value='" + x_lower + "' />";
            latex_string = "\\square_{[" + x_lower + ", \\infty]}" + y_latex_string;
            x_callbacks = [change_time_value_lower];
        }
        else if (right_fixed) {
            html_string = y_constraint + get_time_option_box("before") + "<input id='time_1' value='" + x_upper + "' />";
            x_callbacks = [change_time_value_upper];
            latex_string = "\\square_{[0," + x_upper + "]}" + y_latex_string;
        }

        // 0 bounds
        else {
            html_string = y_constraint + get_time_option_box("always");
            x_callbacks = [];
            latex_string = "\\square_{[0, \\infty]}" + y_latex_string;
        }

        return [html_string, x_callbacks, y_callbacks, latex_string];
    }

    function update_text() {

        var html_string, x_callbacks, y_callbacks, latex_string;
        [html_string, x_callbacks, y_callbacks, latex_string] = describe_constraint();

        placeholder.html(html_string);

        if (x_callbacks.length == 2) {
            d3.select(div_name).select("#time_1").on('change', x_callbacks[0]);
            d3.select(div_name).select("#time_2").on('change', x_callbacks[1]);
        } else if (x_callbacks.length == 1){
            d3.select(div_name).select("#time_1").on('change', x_callbacks[0]);
        }

        if (y_callbacks.length == 2) {
            d3.select(div_name).select("#y_1").on('change', y_callbacks[0]);
            d3.select(div_name).select("#y_2").on('change', y_callbacks[1]);
        } else if (y_callbacks.length == 1){
            d3.select(div_name).select("#y_1").on('change', y_callbacks[0]);
        }

        d3.select(div_name).select("#time_option").on('change', change_time_interval_type);
        d3.select(div_name).select("#value_option").on('change', change_value_constraint_type);

        // Update LaTeX formula
        placeholder_latex.html("$" + latex_string + "$");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

        // Make green again if necessary
        if (document.getElementById("value_option").value == "unconstrained") {
            dragrect.attr("fill-opacity", 0)
        } else {
            dragrect.attr("fill-opacity", .25)
        }

    }

    function change_time_interval_type() {
        var new_interval_type = document.getElementById("time_option").value;

        if (new_interval_type == "between times") {
            left_fixed = true;
            right_fixed = true;

        }
        else if (new_interval_type == "after") {
            left_fixed = true;
            right_fixed = false;
        }
        else if (new_interval_type == "before") {
            left_fixed = false;
            right_fixed = true;
        }
        else if (new_interval_type == "always") {
            left_fixed = false;
            right_fixed = false;
        }

        drag_fixed();
        update_text();
        move_startline();
    }


    function change_value_constraint_type() {
        var new_interval_type = document.getElementById("value_option").value;

        if (new_interval_type == "between") {
            top_fixed = true;
            bottom_fixed = true;
        }
        else if (new_interval_type == "below") {
            top_fixed = true;
            bottom_fixed = false;
        }
        else if (new_interval_type == "above") {
            top_fixed = false;
            bottom_fixed = true;
        }
        else if (new_interval_type == "unconstrained"){
            top_fixed = false;
            bottom_fixed = false;
        }

        drag_fixed();
        update_text();
        move_startline();
    }


    function change_value_upper() {
        drag_resize_top_inner(parseFloat(dragbartop.attr('cy')), valToY(parseFloat(this.value)));
    }

    function change_value_lower() {
        drag_resize_bottom_inner(valToY(getY()), valToY(parseFloat(this.value)));
    }

    function change_time_value_lower() {
        drag_resize_left_inner(parseFloat(dragbarleft.attr('cx')), timeToX(parseFloat(this.value)));
    }

    function change_time_value_upper() {
        drag_resize_right_inner(timeToX(getX()), timeToX(parseFloat(this.value)));
    }

    set_edges();
    describe_constraint();


    function create_bar(level, kind){
        // increase SVG height
        svg.attr("height", parseInt(svg.attr("height")) + track_padding);

        // draw bar
        var left_pos = horizontal_padding + 20;
        var right_pos = w - horizontal_padding - 20;
        var base_y = h + (level-2) * track_padding ;

        var drag_track = d3.behavior.drag()
            .origin(Object)
            .on("drag", function(){

                var track_length = track.attr("x2") - track.attr("x1");
                var mouse_pos = d3.mouse(svg.node())[0];

                var x1 = imposeLimits(0, w - horizontal_padding, mouse_pos - track_length/2);
                var x2 = imposeLimits(0, w - horizontal_padding, mouse_pos + track_length/2);

                if (x1 >= timeToX(startTime)){
                    x1 = timeToX(startTime);
                    x2 = track.attr("x2");
                } else if (x2 <= timeToX(startTime)){
                    x1 = track.attr("x1");
                    x2 = timeToX(startTime);
                }

                track
                .attr("x1", x1)
                .attr("x2", x2);

                left_tick.attr("x1", x1)
                    .attr("x2", x1);

                right_tick.attr("x1", x2)
                    .attr("x2", x2);

            });

        var track = newg.append("line")
            .attr("x1", left_pos)
            .attr("x2", right_pos)
            .attr("y1", base_y)
            .attr("y2", base_y)
            .style("stroke", "rgb(128,128,128)")
            .style("stroke-width", "2")
            .style("stroke-dasharray", function (){
                if (kind == "some"){
                    return "5,5";
                } else {
                    return "5,0";
                }
            })
            .call(drag_track);

        var drag_left_tick = d3.behavior.drag()
            .origin(Object)
            .on("drag", function(){
                var x_pos = imposeLimits(0, timeToX(startTime), d3.mouse(svg.node())[0]);

                track.attr("x1", x_pos);
                left_tick.attr("x1", x_pos);
                left_tick.attr("x2", x_pos);
            });

        var left_tick = newg.append("line")
            .attr("x1", left_pos)
            .attr("x2", left_pos)
            .attr("y1", base_y - track_padding/2)
            .attr("y2", base_y + track_padding/2)
            .style("stroke", "rgb(128,128,128)")
            .style("stroke-width", "2")
            .call(drag_left_tick);

        var drag_right_tick = d3.behavior.drag()
            .origin(Object)
            .on("drag", function(){
                var x_pos = imposeLimits(timeToX(startTime), w, d3.mouse(svg.node())[0]);

                track.attr("x2", x_pos);
                right_tick.attr("x1", x_pos);
                right_tick.attr("x2", x_pos);
            });

        var right_tick = newg.append("line")
            .attr("x1", right_pos)
            .attr("x2", right_pos)
            .attr("y1", base_y - track_padding/2)
            .attr("y2", base_y + track_padding/2)
            .style("stroke", "rgb(128,128,128)")
            .style("stroke-width", "2")
            .call(drag_right_tick);


        function delete_bar(){
            // should also delete children

            track.remove();
            left_tick.remove();
            right_tick.remove();
            svg.attr("height", parseInt(svg.attr("height")) - track_padding);
        }

        function get_start_time(){
            return track.attr("x1");
        }

        function get_end_time(){
            return track.attr("x2");
        }

        return {"track": track, "kind": kind, "delete": delete_bar, "level": level, "get_start_time": get_start_time,
            "get_end_time": get_end_time};
    }

}
