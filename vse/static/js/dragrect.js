function imposeLimits(lower, upper, val){
    return Math.max(lower, Math.min(upper, val));
}

function setup(div_name, index) {

    var geom = {
        w: 750,
        h: 450,
        r: 120,

        width: 300 * 0.75,
        height: 200 * 0.75,
        dragbarw: 20,

        vertical_padding: 30,
        horizontal_padding: 30,
        track_padding: 20,

        delay_line_length: 30,

        specification_fixed: false,
        use_letters: false
    };


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
        .attr("width", geom.w)
        .attr("height", geom.h);

    var xRange = [0, 100];
    var xScale = d3.scale.linear()
        .domain(xRange)
        .range([geom.vertical_padding, geom.w - geom.horizontal_padding]);

    var xAxis =  d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    svg.append("g")
        .call(xAxis)
        .attr("class", "axis")
        .attr("transform", "translate(0," + (geom.h - geom.vertical_padding) + ")");

    var yRange = [100, 0];
    var yScale = d3.scale.linear()
        .domain(yRange)
        .range([geom.vertical_padding, geom.h - geom.vertical_padding]);

    var yAxis =  d3.svg.axis()
        .scale(yScale)
        .orient("left");

    svg.append("g")
        .call(yAxis)
        .attr("class", "axis")
        .attr("transform", "translate(" + (geom.horizontal_padding) + ", " + 0 + ")");


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

    var helper_funcs = {
        getStartX: function (){ return track_circle_pos; },
        XToTime: XToTime,
        update_text: update_text
    };


    var p = d3.select(div_name).append("p");
    p.text("X is");
    var placeholder = p.append("b");
    var placeholder_latex = p.append("div");



    var options_form = d3.select(div_name).append("div").append("form");
    var constant = options_form.append("input")
        .attr("type", "checkbox")
        .attr("id", "constant_checkbox")
        .attr("value", "false")
        .on("change", function(){ geom.specification_fixed = !geom.specification_fixed;});
    var constant_label = options_form.append("label").attr("for", "constant_checkbox").text("Fix specification");

    var use_letters = options_form.append("input")
        .attr("type", "checkbox")
        .attr("id", "use_letters_checkbox")
        .attr("value", "false")
        .on("change", function(){
            geom.use_letters = !geom.use_letters;
            update_text();
        });
    var use_letters_label = options_form.append("label").attr("for", "use_letters_checkbox").text("Use letters");

    d3.select(div_name).append('button')
        .text("Save")
        .on("click", function(){
            console.log(getSpecString());

            $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: window.location.href + "/save",
            dataType: 'json',
            async: true,
            data: getSpecString(),

             beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", csrf_token);
             },

            success: function (data) {
               console.log("Saved");
            },
            error: function (result) {}
            })
        });

    var start_time_pos = timeToX((xRange[0] + xRange[1]) / 2);

    var rect_top = YToVal((yRange[0] + yRange[1]) / 2);

    var newg = svg.append("g");

    var dragrect = newg.append("rect")
        .attr("id", "active")
        .attr("fill", "lightgreen")
        .attr("fill-opacity", .25)
        .attr("cursor", "move")
        .call(drag);

    var dragbarleft = newg.append("circle")
        .attr("id", "dragleft")
        .attr("r", geom.dragbarw / 2)
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
        .attr("id", "dragright")
        .attr("r", geom.dragbarw / 2)
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


    var dragbartop = newg.append("circle")
        .attr("r", geom.dragbarw / 2)
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
        .attr("id", "dragright")
        .attr("r", geom.dragbarw / 2)
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
                    update_text();
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
                timing_parent_bar = create_bar(1, 'some', geom, svg, newg, helper_funcs);
                update_text();
            }
        },
        {
            title: 'Constraint applies at <i>all</i> times in range',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'all', geom, svg, newg, helper_funcs);
                update_text();
            }
        },

        {
            divider: true
        },
        {
            title: 'Eventually-Always',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'all', geom, svg, newg, helper_funcs);
                timing_parent_bar.append_bar('some')();
                update_text();
            }
        },
        {
            title: 'Always-Eventually',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'some', geom, svg, newg, helper_funcs);
                timing_parent_bar.append_bar('all')();
                update_text();
            }
        }

    ];

    var track_circle_pos = start_time_pos - geom.delay_line_length;

    var delay_line_height = rect_top + geom.height/2;
    var delay_line = newg.append("line")
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2");


    var startline = newg.append("line")
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2");

    function adjust_everything(update_description){
        // We rely on: geom.width, geom.height, rect_top, start_time_pos, track_circle_pos, geom.h

        // convenience quanities (redundant)
        geom.delay_line_length = start_time_pos - track_circle_pos;
        delay_line_height = rect_top + (geom.height/2);

        // move things
        dragbarleft.attr("cx", start_time_pos)
            .attr("cy", delay_line_height);

        dragbarright.attr("cx", start_time_pos + geom.width)
            .attr("cy", delay_line_height);

        dragbartop.attr("cx", start_time_pos + (geom.width / 2))
            .attr("cy", rect_top);

        dragbarbottom.attr("cx", start_time_pos + (geom.width / 2))
            .attr("cy", rect_top + geom.height);

        dragrect
            .attr("x", start_time_pos)
            .attr("y", rect_top)
            .attr("height", geom.height)
            .attr("width", geom.width);

        delay_line
            .attr("x1", track_circle_pos)
            .attr("x2", start_time_pos)
            .attr("y1", delay_line_height)
            .attr("y2", delay_line_height);
        
        startline.attr("x1", track_circle_pos)
            .attr("x2", track_circle_pos)
            .attr("y1", delay_line_height)
            .attr("y2", geom.h - geom.track_padding);

        track_circle.attr("cx", track_circle_pos)
                .attr("cy", geom.h - geom.track_padding);

        if (update_description){
          update_text();
        }

    }


    var drag_track_circle = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){

            if (geom.specification_fixed && !timing_parent_bar){
                return;
            }

            var cursor_x = d3.mouse(svg.node())[0];
            var newx = imposeLimits(0, geom.w, cursor_x);

            if (timing_parent_bar) {
                newx = imposeLimits(timing_parent_bar.get_start_time() + geom.delay_line_length,
                                    timing_parent_bar.get_end_time() + geom.delay_line_length, newx);
            }

            var shift = newx - start_time_pos;
            track_circle_pos += shift;
            start_time_pos += shift;

            adjust_everything(false);
        });

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("r", 5)
        .attr("fill", "rgb(255,0,0)")
        .attr("fill-opacity", .5)
        .attr("id", "track_circle")
        .on('contextmenu', d3.contextMenu(menu))
        .call(drag_track_circle);


    function drag_fixed() {
        // resize so edges remain on axes if necessary
        if (!left_fixed) {
            drag_resize_left_inner(start_time_pos, 0);
        }
        if (!right_fixed) {
            drag_resize_right_inner(start_time_pos, geom.w);
        }
        if (!top_fixed) {
            drag_resize_top_inner(rect_top, 0);
        }
        if (!bottom_fixed) {
            drag_resize_bottom_inner(rect_top, geom.h);
        }

    }

// Handle right-clicks on control points
    function rclick_left() {
        if (geom.specification_fixed){ return; }

        left_fixed = !left_fixed;

        if (!left_fixed) {
            drag_resize_left_inner(start_time_pos, 0);
        }

        set_edges();
        return false;
    }

    function rclick_right() {
        if (geom.specification_fixed){ return; }

        right_fixed = !right_fixed;
        if (!right_fixed) {
            drag_resize_right_inner(start_time_pos, geom.w);
        }
        set_edges();
    }

    function rclick_top() {
        if (geom.specification_fixed){ return; }

        top_fixed = !top_fixed;
        if (!top_fixed) {
            drag_resize_top_inner(rect_top, 0);
        }
        set_edges();
    }

    function rclick_bottom() {
        if (geom.specification_fixed){ return; }

        bottom_fixed = !bottom_fixed;
        if (!bottom_fixed) {
            drag_resize_bottom_inner(rect_top, geom.h);
        }
        set_edges();
    }


// Handle dragging and resizing
    function dragmove(d) {
        if (geom.specification_fixed){ return; }

        // horizontal movement
        var rect_center = d3.mouse(svg.node())[0] - geom.width/2;
        var new_start_pos = imposeLimits(track_circle_pos, geom.w - geom.width, rect_center);

        start_time_pos = new_start_pos;

        // vertical movement
        var rect_center = d3.mouse(svg.node())[1] - geom.height/2;
        rect_top = imposeLimits(0, geom.h - geom.height, rect_center);
        adjust_everything(true);
    }

    function drag_resize_left(d) {
        if (geom.specification_fixed){ return; }

        if (!left_fixed) {
            return;
        }

        var oldx = start_time_pos;
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_x = d3.mouse(svg.node())[0];
        var newx = imposeLimits(track_circle_pos, start_time_pos + geom.width, cursor_x);
        drag_resize_left_inner(oldx, newx);
    }

    function drag_resize_left_inner(oldx, newx) {
        start_time_pos = newx;
        geom.width = geom.width + (oldx - newx);

        adjust_everything(true);
        set_edges();
    }


    function drag_resize_right(d) {
        if (geom.specification_fixed){ return; }

        if (!right_fixed) {
            return;
        }

        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)
        var dragx = imposeLimits(start_time_pos, geom.w, start_time_pos + geom.width + d3.event.dx);
        drag_resize_right_inner(start_time_pos, dragx);
    }

    function drag_resize_right_inner(oldx_left, newx_right) {
        geom.width = newx_right - oldx_left;
        adjust_everything(true);
        set_edges();
    }


    function drag_resize_top(d) {
        if (geom.specification_fixed){ return; }

        if (!top_fixed) {
            return;
        }

        var oldy = rect_top;
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_y = d3.mouse(svg.node())[1];
        var newy = imposeLimits(0, rect_top + geom.height - (geom.dragbarw / 2), cursor_y);
        drag_resize_top_inner(oldy, newy);
    }

    function drag_resize_top_inner(oldy, newy) {
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        rect_top = newy;
        geom.height = geom.height + (oldy - newy);
        adjust_everything(true);

        set_edges();
    }


    function drag_resize_bottom(d) {
        if (geom.specification_fixed){ return; }

        if (!bottom_fixed) {
            return;
        }

        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)
        var dragy = imposeLimits(rect_top + (geom.dragbarw / 2), geom.h, rect_top + geom.height + d3.event.dy);
        drag_resize_bottom_inner(rect_top, dragy);
    }

    function drag_resize_bottom_inner(oldy, newy) {
        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)

        //recalculate width
        geom.height = newy - oldy;
        adjust_everything(true);
        set_edges();
    }


// Shading edges

    function set_edges() {

        dragrect.style("stroke", "black");

        // Edging goes top, right, bottom, left
        // As a rectangle has 4 sides, there are 2^4 = 16 cases to handle.

        // 4 edges:
        if (top_fixed && bottom_fixed && left_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height + geom.width + geom.height].join(','));
        }

        // 3 edges
        else if (top_fixed && bottom_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height + geom.width, geom.height].join(','));
        } else if (top_fixed && bottom_fixed && left_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, geom.height, geom.width + geom.height].join(','));
        } else if (top_fixed && left_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height, geom.width, geom.height].join(','));
        } else if (bottom_fixed && left_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [0, (geom.width), geom.height + geom.width + geom.height].join(','));
        }

        // 2 edges
        else if (top_fixed && bottom_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, geom.height, geom.width, geom.height].join(','));
        } else if (top_fixed && left_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, geom.height + geom.width, geom.height].join(','));
        } else if (top_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height, geom.width + geom.height].join(','));
        } else if (bottom_fixed && left_fixed) {
            dragrect.style("stroke-dasharray", [0, geom.width + geom.height, geom.width + geom.height].join(','));
        } else if (bottom_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [0, geom.width, geom.height + geom.width, geom.height].join(','));
        } else if (left_fixed && right_fixed) {
            dragrect.style("stroke-dasharray", [0, geom.width, geom.height, geom.width, geom.height].join(','));
        }

        // 1 edges
        else if (top_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, (geom.height + geom.width + geom.height)].join(','));
        }
        else if (bottom_fixed) {
            dragrect.style("stroke-dasharray", [0, (geom.width + geom.height), geom.width, geom.height].join(','));
        }
        else if (left_fixed) {
            dragrect.style("stroke-dasharray", [0, (geom.width + geom.height + geom.width), geom.height].join(','));
        }
        else if (right_fixed) {
            dragrect.style("stroke-dasharray", [0, (geom.width + geom.height + geom.width), geom.height].join(','));
        }

        // 0 edges
        else {
            dragrect.style("stroke-dasharray", [0, geom.width + geom.height + geom.width + geom.height].join(','));
        }

        update_text();
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

    function getYLatexString(){

        var y_upper = YToVal(rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + geom.width ).toFixed(2);

        var latex_string;
        
        // 2 bounds
        if (top_fixed && bottom_fixed) {
            latex_string = "(" + y_lower + "< x_" + index + "<" + y_upper + ")";
        }

        // 1 bound
        else if (top_fixed) {
            latex_string = "(x_" + index + "<" + y_upper + ")";
        }
        else if (bottom_fixed) {
            latex_string = "(" + y_lower + "< x_" + index + ")";
        }

        // 0 bounds
        else {
            // Don't convert, but keep as an easily checkable sentinel value
            latex_string = "";
        }

        return latex_string;
    }

    function getLatexString(){
        var y_latex_string = getYLatexString();
        [y_constraint, y_callbacks] = describe_y();

        var latex_string = "";

        // If rectangle has a parent bar, rectangle is represented by a Global term with start/end times measured from start_line
        if (timing_parent_bar){
            latex_string = timing_parent_bar.getLatex();

            var delay_time = XToTime(start_time_pos) - XToTime(track_circle_pos);
            delay_time = delay_time.toFixed(2);

            var length =   XToTime(start_time_pos) + geom.width - XToTime(track_circle_pos);
            length = length.toFixed(2);

            if (delay_time == 0 && length == 0){
                return latex_string + y_latex_string;
            } else {
                var symbol = geom.use_letters ? ' G' : ' \\square';
                return latex_string + symbol + "_{[" + delay_time + "," + length + "]}" + y_latex_string;
            }
        }

        // Otherwise, rectangle is represented by a Global term with a start and end time
        if (y_constraint == "unconstrained") {
            return latex_string + "\\;"; // Insert latex symbol for space to avoid empty forumla appearing as '$$'
        }
        
        var x_lower = XToTime(start_time_pos).toFixed(2);
        var x_upper = XToTime( timeToX(x_lower) + geom.width ).toFixed(2);
        
        if (!right_fixed){
            x_upper = "\\infty";
        }
        
        if (!left_fixed){
            x_lower = "0";
        }

        var symbol = geom.use_letters ? ' G' : ' \\square';
        return latex_string + symbol + "_{[" + x_lower + "," + x_upper + "]}" + y_latex_string;
    }

    function describe_y() {
        var y_upper = YToVal(rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + geom.height ).toFixed(2);

        var html_sting,  y_callbacks;

        // 2 bounds
        if (top_fixed && bottom_fixed) {
            y_callbacks = [change_value_lower, change_value_upper];
            html_sting = get_y_option_box("between") + "<input id='y_1' value='" + y_lower + "' />" + " and " + "<input id='y_2' value='" + y_upper + "'/>";
        }

        // 1 bound
        else if (top_fixed) {
            y_callbacks = [change_value_upper];
            html_sting = get_y_option_box("below") + "<input id='y_1' value='" + y_upper + "'/>";
        }
        else if (bottom_fixed) {
            y_callbacks = [change_value_lower];
            html_sting = get_y_option_box("above") + "<input id='y_1' value='" + y_lower + "' />";
        }

        // 0 bounds
        else {
            // Don't convert, but keep as an easily checkable sentinel value
            y_callbacks = [];
            html_sting = "unconstrained";
        }

        return [html_sting, y_callbacks];
    }

    function describe_constraint() {
        var y_constraint, y_callbacks;
        [y_constraint, y_callbacks] = describe_y();

        var html_string;
        var x_callbacks;

        var latex_string = getLatexString();

        if (y_constraint == "unconstrained") {

            html_string = get_y_option_box("unconstrained");
            x_callbacks = [];
            return [html_string, x_callbacks, y_callbacks, latex_string];

        }

        var x_lower = XToTime(start_time_pos).toFixed(2);
        var x_upper = XToTime( timeToX(x_lower) + geom.width ).toFixed(2);


        // 2 bounds
        if (left_fixed && right_fixed) {
            html_string = y_constraint + ", " + get_time_option_box("between times") + "<input id='time_1' value='" + x_lower + "' />" + " and " + "<input id='time_2' value='" + x_upper + "' />";
            x_callbacks = [change_time_value_lower, change_time_value_upper];
        }

        // 1 bound
        else if (left_fixed) {
            html_string = y_constraint + get_time_option_box("after") + "<input id='time_1' value='" + x_lower + "' />";
            x_callbacks = [change_time_value_lower];
        }
        else if (right_fixed) {
            html_string = y_constraint + get_time_option_box("before") + "<input id='time_1' value='" + x_upper + "' />";
            x_callbacks = [change_time_value_upper];
        }

        // 0 bounds
        else {
            html_string = y_constraint + get_time_option_box("always");
            x_callbacks = [];
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


    // functions for generating specification to save

    function getYSpecString(){

        var y_upper = YToVal(rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + geom.height ).toFixed(2);

        var spec_string;

        // 2 bounds
        if (top_fixed && bottom_fixed) {
            spec_string = "Inequality(gt=" + y_lower + ", lt=" + y_upper + ")";
        }

        // 1 bound
        else if (top_fixed) {
            spec_string = "Inequality(lt=" + y_upper + ")";
        }
        else if (bottom_fixed) {
            spec_string = "Inequality(gt=" + y_lower + ")";
        }

        // 0 bounds
        else {
            // Don't convert, but keep as an easily checkable sentinel value
            spec_string = "";
        }

        return spec_string;
    }

    function getSpecString(){
        var y_spec_string = getYSpecString();
        [y_constraint, y_callbacks] = describe_y();

        var spec_string = "";

        // If rectangle has a parent bar, rectangle is represented by a Global term with start/end times measured from start_line
        if (timing_parent_bar){
            spec_string = timing_parent_bar.getSpecString();

            var delay_time = XToTime(start_time_pos) - XToTime(track_circle_pos);
            delay_time = delay_time.toFixed(2);

            var length =   XToTime(start_time_pos + geom.width) - XToTime(track_circle_pos);
            length = length.toFixed(2);

            if (delay_time == 0 && length == 0){
                return spec_string + y_spec_string + ")";
            } else {
                return spec_string + "Globally(" + delay_time + "," + length + "," + y_spec_string + ")";
            }
        }

        // Otherwise, rectangle is represented by a Global term with a start and end time
        if (y_constraint == "unconstrained") {
            return spec_string;
        }

        var x_lower = XToTime(start_time_pos).toFixed(2);
        var x_upper = XToTime( timeToX(x_lower) + geom.width ).toFixed(2);

        if (!right_fixed){
            x_upper = "Inf";
        }

        if (!left_fixed){
            x_lower = "0";
        }

        return spec_string + "Globally(" + x_lower + "," + x_upper + ", " + y_spec_string + ")";
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
    }


    function change_value_upper() {
        drag_resize_top_inner(rect_top, valToY(parseFloat(this.value)));
    }

    function change_value_lower() {
        drag_resize_bottom_inner(rect_top, valToY(parseFloat(this.value)));
    }

    function change_time_value_lower() {
        drag_resize_left_inner(start_time_pos, timeToX(parseFloat(this.value)));
    }

    function change_time_value_upper() {
        drag_resize_right_inner(start_time_pos, timeToX(parseFloat(this.value)));
    }

    adjust_everything(true);
    set_edges();
}
