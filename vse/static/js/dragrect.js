function imposeLimits(lower, upper, val){
    return Math.max(lower, Math.min(upper, val));
}

function setup(svg, div_name, spec_id, index, options) {
    // Setting up scales and initial default positions
    /************************************************/
    var geom = {
        w: parseInt(svg.attr("width")),
        h: parseInt(svg.attr("height")),

        width: 300 * 0.75,
        height: 200 * 0.75,
        dragbarw: 20,

        vertical_padding: 30,
        horizontal_padding: 30,
        track_padding: 20,

        delay_line_length: 30,

        rect_top: 450 / 2,
        start_time_pos: 750 / 2,

        specification_fixed: false,
        use_letters: false
    };

    var top_fixed = true;
    var bottom_fixed = true;
    var left_fixed = true;
    var right_fixed = true;

    var timing_parent_bar = false;

    var xRange = [0, 100];
    var xScale = d3.scale.linear()
        .domain(xRange)
        .range([geom.vertical_padding, geom.w - geom.horizontal_padding]);

    var yRange = [100, 0];
    var yScale = d3.scale.linear()
        .domain(yRange)
        .range([geom.vertical_padding, geom.h - geom.vertical_padding]);

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
        getStartX: function (){ return geom.track_circle_pos; },
        XToTime: XToTime,
        TimeToX: function(time){ return xScale(time); },
        update_text: update_text
    };

    if (options){
        if (options.hasOwnProperty('start_time') && options.hasOwnProperty('track_circle_time') && options.hasOwnProperty('end_time')){
            geom.delay_line_length = xScale(options.start_time) - xScale(options.track_circle_time);
            geom.start_time_pos = xScale(options.start_time);
            geom.track_circle_pos = xScale(options.track_circle_time);
            geom.width = xScale(options.end_time) - xScale(options.start_time);
        } else {
            left_fixed = false;
            right_fixed = false;

            geom.delay_line_length = 0;
            geom.start_time_pos = xScale(xRange[0]);
            geom.track_circle_pos = xScale(xRange[0]);
            geom.width = xScale(xRange[1]) - xScale(xRange[0]);

        }

        if (options.hasOwnProperty('lt')) {
            geom.rect_top = yScale(options.lt);
        } else {
            top_fixed = false;
        }

        if (!options.hasOwnProperty('gt')){
            bottom_fixed = false;
        }

        if (options.hasOwnProperty('lt') && options.hasOwnProperty('gt')) {
            geom.height = yScale(options.gt) - yScale(options.lt);
        }
    }

    geom.track_circle_pos = geom.start_time_pos - geom.delay_line_length;
    geom.delay_line_height = geom.rect_top + geom.height/2;


    // Function that defines where each element will be positioned
    /************************************************/
    function adjust_everything(update_description){
        // We rely on: geom.width, geom.height, , geom.h

        // convenience quanities (redundant)
        geom.delay_line_length = geom.start_time_pos - geom.track_circle_pos;
        geom.delay_line_height = geom.rect_top + (geom.height/2);

        // move things
        dragbarleft.attr("cx", geom.start_time_pos)
            .attr("cy", geom.delay_line_height);

        dragbarright.attr("cx", geom.start_time_pos + geom.width)
            .attr("cy", geom.delay_line_height);

        dragbartop.attr("cx", geom.start_time_pos + (geom.width / 2))
            .attr("cy", geom.rect_top);

        dragbarbottom.attr("cx", geom.start_time_pos + (geom.width / 2))
            .attr("cy", geom.rect_top + geom.height);

        dragrect
            .attr("x", geom.start_time_pos)
            .attr("y", geom.rect_top)
            .attr("height", geom.height)
            .attr("width", Math.max(geom.width,1));

        delay_line
            .attr("x1", geom.track_circle_pos)
            .attr("x2", geom.start_time_pos)
            .attr("y1", geom.delay_line_height)
            .attr("y2", geom.delay_line_height);

        startline.attr("x1", geom.track_circle_pos)
            .attr("x2", geom.track_circle_pos)
            .attr("y1", geom.delay_line_height)
            .attr("y2", geom.h - geom.track_padding);

        track_circle.attr("cx", geom.track_circle_pos)
                .attr("cy", geom.h - geom.track_padding);

        if (update_description){
          update_text();
        }

    }


    // Callback functions for interactions
    /************************************************/
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

            var shift = newx - geom.start_time_pos;
            geom.track_circle_pos += shift;
            geom.start_time_pos += shift;

            adjust_everything(false);
        });

    function drag_fixed() {
        // resize so edges remain on axes if necessary
        if (!left_fixed) {
            drag_resize_left_inner(geom.start_time_pos, 0);
        }
        if (!right_fixed) {
            drag_resize_right_inner(geom.start_time_pos, geom.w);
        }
        if (!top_fixed) {
            drag_resize_top_inner(geom.rect_top, 0);
        }
        if (!bottom_fixed) {
            drag_resize_bottom_inner(geom.rect_top, geom.h);
        }
    }

    function dragmove(d) {
        if (geom.specification_fixed){ return; }

        // horizontal movement
        var rect_center = d3.mouse(svg.node())[0] - geom.width/2;
        var new_start_pos = imposeLimits(geom.track_circle_pos, geom.w - geom.width, rect_center);

        geom.start_time_pos = new_start_pos;

        // vertical movement
        var rect_center = d3.mouse(svg.node())[1] - geom.height/2;
        geom.rect_top = imposeLimits(0, geom.h - geom.height, rect_center);
        adjust_everything(true);
    }

    function drag_resize_left(d) {
        if (geom.specification_fixed){ return; }

        if (!left_fixed) {
            return;
        }

        var oldx = geom.start_time_pos;
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_x = d3.mouse(svg.node())[0];
        var newx = imposeLimits(geom.track_circle_pos, geom.start_time_pos + geom.width, cursor_x);
        drag_resize_left_inner(oldx, newx);
    }

    function drag_resize_left_inner(oldx, newx) {
        geom.start_time_pos = newx;
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
        var dragx = imposeLimits(geom.start_time_pos, geom.w, geom.start_time_pos + geom.width + d3.event.dx);
        drag_resize_right_inner(geom.start_time_pos, dragx);
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

        var oldy = geom.rect_top;
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_y = d3.mouse(svg.node())[1];
        var newy = imposeLimits(0, geom.rect_top + geom.height - (geom.dragbarw / 2), cursor_y);
        drag_resize_top_inner(oldy, newy);
    }

    function drag_resize_top_inner(oldy, newy) {
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        geom.rect_top = newy;
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
        var dragy = imposeLimits(geom.rect_top + (geom.dragbarw / 2), geom.h, geom.rect_top + geom.height + d3.event.dy);
        drag_resize_bottom_inner(geom.rect_top, dragy);
    }

    function drag_resize_bottom_inner(oldy, newy) {
        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)

        //recalculate width
        geom.height = newy - oldy;
        adjust_everything(true);
        set_edges();
    }


    // Context menus and associated functions
    /************************************************/
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

    function rclick_left() {
        if (geom.specification_fixed){ return; }

        left_fixed = !left_fixed;

        if (!left_fixed) {
            drag_resize_left_inner(geom.start_time_pos, 0);
        }

        set_edges();
        return false;
    }

    function rclick_right() {
        if (geom.specification_fixed){ return; }

        right_fixed = !right_fixed;
        if (!right_fixed) {
            drag_resize_right_inner(geom.start_time_pos, geom.w);
        }
        set_edges();
    }

    function rclick_top() {
        if (geom.specification_fixed){ return; }

        top_fixed = !top_fixed;
        if (!top_fixed) {
            drag_resize_top_inner(geom.rect_top, 0);
        }
        set_edges();
    }

    function rclick_bottom() {
        if (geom.specification_fixed){ return; }

        bottom_fixed = !bottom_fixed;
        if (!bottom_fixed) {
            drag_resize_bottom_inner(geom.rect_top, geom.h);
        }
        set_edges();
    }


    // Actually create visual elements
    /************************************************/

    var xAxis =  d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    svg.append("g")
        .call(xAxis)
        .attr("class", "axis")
        .attr("transform", "translate(0," + (geom.h - geom.vertical_padding) + ")");

    var yAxis =  d3.svg.axis()
        .scale(yScale)
        .orient("left");

    svg.append("g")
        .call(yAxis)
        .attr("class", "axis")
        .attr("transform", "translate(" + (geom.horizontal_padding) + ", " + 0 + ")");

    var example_trajctory_g = svg.append("g")
        .attr("id", "example_trajectory");

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
            var new_spec_string = getSpecString();
            $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: "http://" + window.location.host + "/specifications/" + spec_id + "/save",
            dataType: 'html',
            async: true,
            data: new_spec_string,

             beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", csrf_token);
             },

            success: function (data) {
                d3.select("#spec_string_" + spec_id).text(new_spec_string)
            },
            error: function (result, textStatus) { }
            })
        });

    d3.select(div_name).append('button')
        .text("Plot example trajectory")
        .on("click", function(){
            var new_spec_string = getSpecString();
            $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            url: "http://" + window.location.host + "/specifications/example",
            dataType: 'html',
            async: true,
            data: {"specification_string": new_spec_string, "t_max": xRange[1]},

             beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", csrf_token);
             },

            success: function (data) {
                example_trajctory_g
                    .append("g")
                    .selectAll(".dot")
                    .data(JSON.parse(data))
                    .enter()
                    .append("circle")
                    .attr("class", "dot")
                    .attr("r", 3.5)
                    .attr("cx", function (d){return xScale(d.x)})
                    .attr("cy", function (d){return yScale(d.y)});
            },
            error: function (result, textStatus) { }
            })
        });

    d3.select(div_name).append('button')
        .text("Delete example trajectory")
        .on("click", function(){
            example_trajctory_g.selectAll(".dot").remove();
        });



    var newg = svg.append("g");

    // we draw these lines before the dragrect to improve carity when rectangle is very thin
    var delay_line = newg.append("line")
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2");

    var startline = newg.append("line")
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2");

    var dragrect = newg.append("rect")
        .attr("id", "active")
        .attr("fill", "lightgreen")
        .attr("fill-opacity", .25)
        .attr("cursor", "move")
        .call(d3.behavior.drag()
            .origin(Object)
            .on("drag", dragmove));

    var dragbarleft = newg.append("circle")
        .attr("id", "dragleft")
        .attr("r", geom.dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ew-resize")
        .call(
            d3.behavior.drag()
            .origin(Object)
            .on("drag", drag_resize_left)
        ).on('contextmenu', d3.contextMenu([{
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
        .call(
            d3.behavior.drag()
            .origin(Object)
            .on("drag", drag_resize_right)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return right_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_right
        }]));


    var dragbartop = newg.append("circle")
        .attr("r", geom.dragbarw / 2)
        .attr("id", "dragtop")
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ns-resize")
        .call(
            d3.behavior.drag()
            .origin(Object)
            .on("drag", drag_resize_top)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return top_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_top
        }]));


    var dragbarbottom = newg.append("circle")
        .attr("id", "dragbottom")
        .attr("r", geom.dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ns-resize")
        .call( d3.behavior.drag()
        .origin(Object)
        .on("drag", drag_resize_bottom)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return bottom_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_bottom
        }]));

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("r", 5)
        .attr("fill", "rgb(255,0,0)")
        .attr("fill-opacity", .5)
        .attr("id", "track_circle")
        .on('contextmenu', d3.contextMenu(menu))
        .call(drag_track_circle);




    // Shading edges of rectangle
    /************************************************/

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
    /************************************************/

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

        var y_upper = YToVal(geom.rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + geom.height ).toFixed(2);

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

            var delay_time = XToTime(geom.start_time_pos) - XToTime(geom.track_circle_pos);
            delay_time = delay_time.toFixed(2);

            var length =   XToTime(geom.start_time_pos + geom.width) - XToTime(geom.track_circle_pos);
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

        var x_lower = XToTime(geom.start_time_pos).toFixed(2);
        var x_upper = XToTime(geom.start_time_pos + geom.width ).toFixed(2);

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
        var y_upper = YToVal(geom.rect_top).toFixed(2);
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

        var x_lower = XToTime(geom.start_time_pos).toFixed(2);
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

        var y_upper = YToVal(geom.rect_top).toFixed(2);
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

            var delay_time = XToTime(geom.start_time_pos) - XToTime(geom.track_circle_pos);
            delay_time = delay_time.toFixed(2);

            var length =   XToTime(geom.start_time_pos + geom.width) - XToTime(geom.track_circle_pos);
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

        var x_lower = XToTime(geom.start_time_pos).toFixed(2);
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
        drag_resize_top_inner(geom.rect_top, valToY(parseFloat(this.value)));
    }

    function change_value_lower() {
        drag_resize_bottom_inner(geom.rect_top, valToY(parseFloat(this.value)));
    }

    function change_time_value_lower() {
        drag_resize_left_inner(geom.start_time_pos, timeToX(parseFloat(this.value)));
    }

    function change_time_value_upper() {
        drag_resize_right_inner(geom.start_time_pos, timeToX(parseFloat(this.value)));
    }

    function add_timing_bar(kind, options){
        // kind is 'some' or 'all'

        if (timing_parent_bar){
            timing_parent_bar.append_bar('kind', options)();
        } else {
            timing_parent_bar = create_bar(1, kind, geom, svg, newg, helper_funcs, options);
        }
        update_text();
    }

    adjust_everything(true);
    set_edges();

    return {add_bar: add_timing_bar}
}

function setup_from_specification_string(svg, div_name, spec_id, index, string){
    string = string.toLowerCase().trim().replace(/ /g, '');

    if (!string){ return setup(svg, div_name, spec_id, index); }

    var queue = [];
    var  args, parts, start, end;
    var totalOffset = 0;

    while (string) {
        if (string.startsWith("globally")) {

            args = string.slice(9, -1);
            parts = args.split(',');

            start = parseFloat(parts[0]);
            end = parseFloat(parts[1]);
            string = parts.slice(2).join(',');

            totalOffset += start;
            queue.push({type: "globally", start: start, end: end});

        } else if (string.startsWith("finally")) {
            args = string.slice(8, -1);
            parts = args.split(',');

            start = parseFloat(parts[0]);
            end = parseFloat(parts[1]);
            string = parts.slice(2).join(',');

            totalOffset += start;
            queue.push({type: "finally", start: start, end: end});

        } else if (string.startsWith("inequality")) {
            args = string.slice(11, -1);
            parts = args.split(',');

            var lt, gt, part, terms, name, val;

            for (var i = 0; i < parts.length; i++) {
                part = parts[i].trim();
                terms = part.split('=');

                if (terms[0] == 'lt') {
                    lt = terms[1];
                } else if (terms[0] == 'gt') {
                    gt = terms[1];
                }
            }

            break;
        }
    }


    var rectangle_opts = [];
    rectangle_opts.lt = lt;
    rectangle_opts.gt = gt;

    // handle case where constraint is an inequality alone
    if (queue.length == 0){
        return setup(svg, div_name, spec_id, index, rectangle_opts);
    }

    // We need to distinguish between the cases where the innermost term is Finally or Globally
    // As 'globally' sets the rectangle width, and is not drawn as a bar
    // handle case where innermost (non-inequality) term is 'globally'
    var term = queue.pop();

    if (term.type == "globally"){
        rectangle_opts.lt = lt;
        rectangle_opts.gt = gt;

        if (queue.length == 0){
            // if whole expression is simply G(., ., Inequality(.)), then
            // shift bar, so track circle is in line with start of rectangle
            rectangle_opts.track_circle_time = term.start;
            rectangle_opts.start_time = rectangle_opts.track_circle_time;
            rectangle_opts.end_time = term.end;
        } else {
            // unshifted
            totalOffset -= term.start;

            rectangle_opts.track_circle_time = totalOffset;
            rectangle_opts.start_time = totalOffset + term.start;
            rectangle_opts.end_time = totalOffset + term.end;
        }

    } else {
        // a 'Finally(.,., Inequality(.,.)', so drawn as a zero width-rectangle
        // totalOffset -= term.start; // ???
        rectangle_opts.track_circle_time = totalOffset;
        rectangle_opts.start_time = totalOffset;
        rectangle_opts.end_time = totalOffset;

        // push the finally term back onto queue, so that it is still drawn
        queue.push(term);
    }

    var diagram = setup(svg, div_name, spec_id, index, rectangle_opts);

    while (queue.length > 0){
        term = queue.pop();
        totalOffset -= term.start;

        var timing_bar_options = [];
        timing_bar_options.start_time = totalOffset;
        timing_bar_options.left_tick_time = term.start + totalOffset;
        timing_bar_options.right_tick_time = term.end + totalOffset;

        var kind = (term.type == "finally") ? 'some' : 'all';
        diagram.add_bar(kind, timing_bar_options);

    }
}


function add_subplot_from_specification(specification_string, div_name, spec_id){
    d3.select("#diagrams").append('div').attr("id", div_name);
    var svg = d3.select('#' + div_name).append("svg")
        .attr("width", 750)
        .attr("height", 450);

    setup_from_specification_string(svg, "#" + div_name, spec_id, 1, specification_string);
}

