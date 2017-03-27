function imposeLimits(lower, upper, val){
    return Math.max(lower, Math.min(upper, val));
}

function sum (x){
    var total = 0;
    for (var i=0; i< x.length; i++){
        total += x[i];
    }
    return total;
}

function setup(svg, div_name, spec_id, index, variable_name, options) {
    // Setting up scales and initial default positions
    /************************************************/
    var geom = {
        w: parseInt(svg.attr("width")),
        h: parseInt(svg.attr("height")),

        width: 300 * 0.75,
        height: 200 * 0.75,
        dragbarw: 20,

        vertical_padding: 30,
        horizontal_padding: 60,
        track_padding: 20,

        delay_line_length: 30,

        rect_top: 450 / 2,
        start_time_pos: 750 / 2,

        specification_fixed: false,
        use_letters: false,
        
        top_fixed: true,
        bottom_fixed: true,
        left_fixed: true,
        right_fixed: true
    };


    var timing_parent_bar = false;

    var xRange = [0, 100];
    var xScale = d3.scale.linear()
        .domain(xRange)
        .range([geom.horizontal_padding, geom.w - geom.horizontal_padding]);

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
        update_text: update_text,
        update_formula: update_formula
    };

    if (options){
        if (options.hasOwnProperty('start_time') && options.hasOwnProperty('track_circle_time') && options.hasOwnProperty('end_time')){
            geom.delay_line_length = xScale(options.start_time) - xScale(options.track_circle_time);
            geom.start_time_pos = xScale(options.start_time);
            geom.track_circle_pos = xScale(options.track_circle_time);
            geom.width = xScale(options.end_time) - xScale(options.start_time);
        } else {
            geom.left_fixed = false;
            geom.right_fixed = false;

            geom.delay_line_length = 0;
            geom.start_time_pos = xScale(xRange[0]);
            geom.track_circle_pos = xScale(xRange[0]);
            geom.width = xScale(xRange[1]) - xScale(xRange[0]);

        }

        if (options.hasOwnProperty('lt')) {
            geom.rect_top = yScale(options.lt);
        } else {
            geom.top_fixed = false;
        }

        if (!options.hasOwnProperty('gt')){
            geom.bottom_fixed = false;
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
        set_edges();
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
        if (!geom.left_fixed) {
            drag_resize_left_inner(geom.start_time_pos, 0);
        }
        if (!geom.right_fixed) {
            drag_resize_right_inner(geom.start_time_pos, geom.w);
        }
        if (!geom.top_fixed) {
            drag_resize_top_inner(geom.rect_top, 0);
        }
        if (!geom.bottom_fixed) {
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

        if (!geom.left_fixed) {
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
    }


    function drag_resize_right(d) {
        if (geom.specification_fixed){ return; }

        if (!geom.right_fixed) {
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
    }


    function drag_resize_top(d) {
        if (geom.specification_fixed){ return; }

        if (!geom.top_fixed) {
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
    }


    function drag_resize_bottom(d) {
        if (geom.specification_fixed){ return; }

        if (!geom.bottom_fixed) {
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
                timing_parent_bar = create_bar(1, 'some', geom, svg, placeholder_form, newg, helper_funcs);
                update_text();
            }
        },
        {
            title: 'Constraint applies at <i>all</i> times in range',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'all', geom, svg, placeholder_form, newg, helper_funcs);
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
                timing_parent_bar = create_bar(1, 'all', geom, svg, placeholder_form, newg, helper_funcs);
                timing_parent_bar.set_parent_bar('some')();
                update_text();
            }
        },
        {
            title: 'Always-Eventually',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'some', geom, svg, placeholder_form, newg, helper_funcs);
                timing_parent_bar.set_parent_bar('all')();
                update_text();
            }
        }

    ];

    function rclick_left() {
        if (geom.specification_fixed){ return; }

        geom.left_fixed = !geom.left_fixed;

        if (!geom.left_fixed) {
            drag_resize_left_inner(geom.start_time_pos, 0);
        }

        set_edges();
        return false;
    }

    function rclick_right() {
        if (geom.specification_fixed){ return; }

        geom.right_fixed = !geom.right_fixed;
        if (!geom.right_fixed) {
            drag_resize_right_inner(geom.start_time_pos, geom.w);
        }
        set_edges();
    }

    function rclick_top() {
        if (geom.specification_fixed){ return; }

        geom.top_fixed = !geom.top_fixed;
        if (!geom.top_fixed) {
            drag_resize_top_inner(geom.rect_top, 0);
        }
        set_edges();
    }

    function rclick_bottom() {
        if (geom.specification_fixed){ return; }

        geom.bottom_fixed = !geom.bottom_fixed;
        if (!geom.bottom_fixed) {
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

    svg
        .append("text")
        .attr('x', -geom.h/2)
        .attr("y", 6)

        .attr("transform", "rotate(-90)")
        .attr("dy", ".75em")
        .text(variable_name);

    var yAxis =  d3.svg.axis()
        .scale(yScale)
        .orient("left");

    svg.append("g")
        .call(yAxis)
        .attr("class", "axis")
        .attr("transform", "translate(" + (geom.horizontal_padding) + ", " + 0 + ")");

    var example_trajctory_g = svg.append("g")
        .attr("id", "example_trajectory");

    var textual_div = d3.select(div_name).classed("space-div", true);
    var placeholder_form = textual_div.append("div").style("width", geom.w + "px").classed("placeholder-form", true);
    var placeholder_latex = textual_div.append("div").classed("space-div", true);

    var options_form = d3.select(div_name).append("div").classed("space-div", true).append("form");
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

                d3.select(div_name)
                    .select("#delete_trajectory_button")
                    .style("visibility", "visible");

            },
            error: function (result, textStatus) { }
            })
        });

    d3.select(div_name).append('button')
        .text("Delete example trajectory")
        .on("click", function(){
            example_trajctory_g.selectAll(".dot").remove();
            d3.select(this).style("visibility", "hidden");
        })
        .attr("id", "delete_trajectory_button")
        .style("visibility", "hidden");



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
                return geom.left_fixed ? 'Remove limit' : 'Apply limit';
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
                return geom.right_fixed ? 'Remove limit' : 'Apply limit';
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
                return geom.top_fixed ? 'Remove limit' : 'Apply limit';
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
                return geom.bottom_fixed ? 'Remove limit' : 'Apply limit';
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
        if (geom.top_fixed && geom.bottom_fixed && geom.left_fixed && geom.right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height + geom.width + geom.height].join(','));
        }

        // 3 edges
        else if (geom.top_fixed && geom.bottom_fixed && geom.right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height + geom.width, geom.height].join(','));
        } else if (geom.top_fixed && geom.bottom_fixed && geom.left_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, geom.height, geom.width + geom.height].join(','));
        } else if (geom.top_fixed && geom.left_fixed && geom.right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height, geom.width, geom.height].join(','));
        } else if (geom.bottom_fixed && geom.left_fixed && geom.right_fixed) {
            dragrect.style("stroke-dasharray", [0, (geom.width), geom.height + geom.width + geom.height].join(','));
        }

        // 2 edges
        else if (geom.top_fixed && geom.bottom_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, geom.height, geom.width, geom.height].join(','));
        } else if (geom.top_fixed && geom.left_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, geom.height + geom.width, geom.height].join(','));
        } else if (geom.top_fixed && geom.right_fixed) {
            dragrect.style("stroke-dasharray", [geom.width + geom.height, geom.width + geom.height].join(','));
        } else if (geom.bottom_fixed && geom.left_fixed) {
            dragrect.style("stroke-dasharray", [0, geom.width + geom.height, geom.width + geom.height].join(','));
        } else if (geom.bottom_fixed && geom.right_fixed) {
            dragrect.style("stroke-dasharray", [0, geom.width, geom.height + geom.width, geom.height].join(','));
        } else if (geom.left_fixed && geom.right_fixed) {
            dragrect.style("stroke-dasharray", [0, geom.width, geom.height, geom.width, geom.height].join(','));
        }

        // 1 edges
        else if (geom.top_fixed) {
            dragrect.style("stroke-dasharray", [geom.width, (geom.height + geom.width + geom.height)].join(','));
        }
        else if (geom.bottom_fixed) {
            dragrect.style("stroke-dasharray", [0, (geom.width + geom.height), geom.width, geom.height].join(','));
        }
        else if (geom.left_fixed) {
            dragrect.style("stroke-dasharray", [0, (geom.width + geom.height + geom.width), geom.height].join(','));
        }
        else if (geom.right_fixed) {
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

    function getYLatexString(){

        var y_upper = YToVal(geom.rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + geom.height ).toFixed(2);

        var latex_string;

        // 2 bounds
        if (geom.top_fixed && geom.bottom_fixed) {
            latex_string = "(" + y_lower + "< x_" + index + "<" + y_upper + ")";
        }

        // 1 bound
        else if (geom.top_fixed) {
            latex_string = "(x_" + index + "<" + y_upper + ")";
        }
        else if (geom.bottom_fixed) {
            latex_string = "(" + y_lower + "< x_" + index + ")";
        }

        // 0 bounds
        else {
            // Don't convert, but keep as an easily checkable sentinel value
            latex_string = "";
        }

        return latex_string;
    }

    function update_formula(){
        var latex_string =  get_latex_string();
        placeholder_latex.html("$" + latex_string + "$");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    }

    function get_latex_string(){
        var y_latex_string = getYLatexString();
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
        if (!geom.top_fixed && !geom.bottom_fixed) {
            return latex_string + "\\;"; // Insert latex symbol for space to avoid empty forumla appearing as '$$'
        }

        var x_lower = XToTime(geom.start_time_pos).toFixed(2);
        var x_upper = XToTime(geom.start_time_pos + geom.width ).toFixed(2);

        if (!geom.right_fixed){
            x_upper = "\\infty";
        }

        if (!geom.left_fixed){
            x_lower = "0";
        }

        var symbol = geom.use_letters ? ' G' : ' \\square';
        return latex_string + symbol + "_{[" + x_lower + "," + x_upper + "]}" + y_latex_string;
    }

    function update_text() {

        function create_initial_bar (kind){
            timing_parent_bar = create_bar(1, kind, geom, svg, placeholder_form, newg, helper_funcs);
            update_text();
        }

        var update_functions = {
            YToVal: YToVal,
            valToY: valToY,
            XToTime: XToTime,
            timeToX: timeToX,
            drag_fixed: drag_fixed,
            update_text: update_text,
            adjust_everything: adjust_everything,
            append_timing_bar: append_timing_bar
        };
        describe_constraint(timing_parent_bar, variable_name, placeholder_form, geom, update_functions);

        update_formula();
    }


    // functions for generating specification to save

    function getYSpecString(){

        var y_upper = YToVal(geom.rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + geom.height ).toFixed(2);

        var spec_string;

        // 2 bounds
        if (geom.top_fixed && geom.bottom_fixed) {
            spec_string = "Inequality(gt=" + y_lower + ", lt=" + y_upper + ")";
        }

        // 1 bound
        else if (geom.top_fixed) {
            spec_string = "Inequality(lt=" + y_upper + ")";
        }
        else if (geom.bottom_fixed) {
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
        if (!geom.top_fixed && !geom.bottom_fixed) {
            return spec_string;
        }

        var x_lower = XToTime(geom.start_time_pos).toFixed(2);
        var x_upper = XToTime( timeToX(x_lower) + geom.width ).toFixed(2);

        if (!geom.right_fixed){
            x_upper = "Inf";
        }

        if (!geom.left_fixed){
            x_lower = "0";
        }

        return spec_string + "Globally(" + x_lower + "," + x_upper + ", " + y_spec_string + ")";
    }

    function add_timing_bar(kind, options){
        // create timing-bar, and set it as immediate parent of rectangle
        // kind is 'some' or 'all'

        if (timing_parent_bar){
            timing_parent_bar.set_parent_bar(kind, options)();
        } else {
            timing_parent_bar = create_bar(1, kind, geom, svg, placeholder_form, newg, helper_funcs, options);
        }
        update_text();
    }

    function append_timing_bar(kind, options){
        // create a new bar as the parent of all parents of rectangle

        if (!timing_parent_bar){
            add_timing_bar(kind, options);
        } else {
            var bar = timing_parent_bar;
            while (bar.getTimingParentBar()) {
                bar = bar.getTimingParentBar();
            }
            bar.set_parent_bar(kind, options)();
        }
    }

    adjust_everything(true);
    return {add_bar: append_timing_bar}
}

function setup_from_specification_string(svg, div_name, spec_id, index, variable_name, string){
    string = string.toLowerCase().trim().replace(/ /g, '');

    if (!string){ return setup(svg, div_name, spec_id, index, variable_name); }

    var queue = [];
    var args, parts, start, end;
    var totalOffset = 0;
    var widths = [0]; // offset for top-level element is 0

    while (string) {
        if (string.startsWith("globally")) {

            args = string.slice(9, -1);
            parts = args.split(',');

            start = parseFloat(parts[0]);
            end = parseFloat(parts[1]);
            string = parts.slice(2).join(',');

            totalOffset += start;
            widths.push(end - start);
            queue.push({type: "globally", start: start, end: end});

        } else if (string.startsWith("finally")) {
            args = string.slice(8, -1);
            parts = args.split(',');

            start = parseFloat(parts[0]);
            end = parseFloat(parts[1]);
            string = parts.slice(2).join(',');

            totalOffset += start;
            widths.push(end - start);
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
    var pos;
    rectangle_opts.lt = lt;
    rectangle_opts.gt = gt;

    // handle case where constraint is an inequality alone
    if (queue.length == 0){
        return setup(svg, div_name, spec_id, index, variable_name, rectangle_opts);
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
            widths.pop(); // discard top element of widths, a Global corresponding to rectangle width

            pos = totalOffset + sum(widths)/2;
            widths.pop();

            rectangle_opts.track_circle_time = pos;
            rectangle_opts.start_time = pos + term.start;
            rectangle_opts.end_time = pos + term.end;
        }

    } else {
        // a 'Finally(.,., Inequality(.,.)', so drawn as a zero width-rectangle
        pos = totalOffset + sum(widths)/2;
        widths.pop();

        rectangle_opts.track_circle_time = pos;
        rectangle_opts.start_time = pos;
        rectangle_opts.end_time = pos;

        // push the finally term back onto queue, so that it is still drawn
        queue.push(term);
    }

    var diagram = setup(svg, div_name, spec_id, index, variable_name, rectangle_opts);

    while (queue.length > 0){
        term = queue.pop();
        totalOffset -= term.start;

        pos = totalOffset + sum(widths)/2;
        widths.pop();

        var timing_bar_options = [];
        timing_bar_options.start_time = pos;
        timing_bar_options.left_tick_time = term.start + pos;
        timing_bar_options.right_tick_time = term.end + pos;

        var kind = (term.type == "finally") ? 'some' : 'all';
        diagram.add_bar(kind, timing_bar_options);

    }
}


function add_subplot_from_specification(specification_string, div_name, spec_id, variable_name){
    d3.select("#diagrams").append('div').attr("id", div_name);
    var svg = d3.select('#' + div_name).append("svg")
        .attr("width", 750)
        .attr("height", 450);

    setup_from_specification_string(svg, "#" + div_name, spec_id, 1, variable_name, specification_string);
}

