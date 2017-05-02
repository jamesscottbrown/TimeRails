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

function drawAxes(svg, common_geom, xScale, yScale, variable_name){
    var xAxis =  d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    svg.selectAll('.axis').remove();
    svg.selectAll('.axis-label').remove();

    svg.append("g")
        .call(xAxis)
        .attr("class", "axis")
        .attr("transform", "translate(0," + (common_geom.h - common_geom.vertical_padding) + ")");

    svg
        .append("text")
        .classed("axis-label", true)
        .attr('x', -common_geom.h/2)
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
        .attr("transform", "translate(" + (common_geom.horizontal_padding) + ", " + 0 + ")");
}


function setup(svg, common_geom, div_name, spec_id, index, variable_name, options) {
    // Setting up scales and initial default positions
    /************************************************/
    var rect_geom = {
        width: 300 * 0.75,
        height: 200 * 0.75,
        dragbarw: 20,

        delay_line_length: 30,

        rect_top: 450 / 2,
        start_time_pos: 750 / 2,

        top_fixed: true,
        bottom_fixed: true,
        left_fixed: true,
        right_fixed: true
    };


    var timing_parent_bar = false;

    var xRange = [0, 100];
    var xScale = d3.scale.linear()
        .domain(xRange)
        .range([common_geom.horizontal_padding, common_geom.w - common_geom.horizontal_padding]);

    var yRange = [100, 0];
    var yScale = d3.scale.linear()
        .domain(yRange)
        .range([common_geom.vertical_padding, common_geom.h - common_geom.vertical_padding]);

    var colorScale = d3.scale.category10();

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

    var data_line_generator = d3.svg.line()
        .x(function (d) { return timeToX(d.time); })
        .y(function (d) { return valToY(d.value); });

    var helper_funcs = {
        getStartX: function (){ return rect_geom.track_circle_pos; },
        XToTime: XToTime,
        TimeToX: function(time){ return xScale(time); },
        update_text: update_text,
        update_formula: update_formula
    };

    if (options){
        if (options.hasOwnProperty('start_time') && options.hasOwnProperty('track_circle_time') && options.hasOwnProperty('end_time')){
            rect_geom.delay_line_length = xScale(options.start_time) - xScale(options.track_circle_time);
            rect_geom.start_time_pos = xScale(options.start_time);
            rect_geom.track_circle_pos = xScale(options.track_circle_time);
            rect_geom.width = xScale(options.end_time) - xScale(options.start_time);
        } else {
            rect_geom.left_fixed = false;
            rect_geom.right_fixed = false;

            rect_geom.delay_line_length = 0;
            rect_geom.start_time_pos = xScale(xRange[0]);
            rect_geom.track_circle_pos = xScale(xRange[0]);
            rect_geom.width = xScale(xRange[1]) - xScale(xRange[0]);

        }

        if (!options.hasOwnProperty('lt') || !options.lt) {
            rect_geom.top_fixed = false;
            options.lt = yScale(yRange[1]);
        }
        rect_geom.rect_top = yScale(options.lt);

        if (!options.hasOwnProperty('gt') || !options.gt){
            rect_geom.bottom_fixed = false;
            options.lt = yScale(yRange[0]);
        }

        rect_geom.height = yScale(options.gt) - yScale(options.lt);
    }

    rect_geom.track_circle_pos = rect_geom.start_time_pos - rect_geom.delay_line_length;
    rect_geom.delay_line_height = rect_geom.rect_top + rect_geom.height/2;


    // Function that defines where each element will be positioned
    /************************************************/
    function adjust_everything(update_description){
        // We rely on: rect_geom.width, rect_geom.height, , common_geom.h

        // convenience quanities (redundant)
        rect_geom.delay_line_length = rect_geom.start_time_pos - rect_geom.track_circle_pos;
        rect_geom.delay_line_height = rect_geom.rect_top + (rect_geom.height/2);

        // move things
        dragbarleft.attr("cx", rect_geom.start_time_pos)
            .attr("cy", rect_geom.delay_line_height);

        dragbarright.attr("cx", rect_geom.start_time_pos + rect_geom.width)
            .attr("cy", rect_geom.delay_line_height);

        dragbartop.attr("cx", rect_geom.start_time_pos + (rect_geom.width / 2))
            .attr("cy", rect_geom.rect_top);

        dragbarbottom.attr("cx", rect_geom.start_time_pos + (rect_geom.width / 2))
            .attr("cy", rect_geom.rect_top + rect_geom.height);

        dragrect
            .attr("x", rect_geom.start_time_pos)
            .attr("y", rect_geom.rect_top)
            .attr("height", rect_geom.height)
            .attr("width", Math.max(rect_geom.width,1));

        delay_line
            .attr("x1", rect_geom.track_circle_pos)
            .attr("x2", rect_geom.start_time_pos)
            .attr("y1", rect_geom.delay_line_height)
            .attr("y2", rect_geom.delay_line_height);

        startline.attr("x1", rect_geom.track_circle_pos)
            .attr("x2", rect_geom.track_circle_pos)
            .attr("y1", rect_geom.delay_line_height)
            .attr("y2", common_geom.h - common_geom.track_padding);

        track_circle.attr("cx", rect_geom.track_circle_pos)
                .attr("cy", common_geom.h - common_geom.track_padding);

        if (update_description){
          update_text();
        }
        set_edges();
    }

    function adjust_scales(){

        // Create new scales
        var new_xScale = d3.scale.linear()
            .domain(xRange)
            .range([common_geom.horizontal_padding, common_geom.w - common_geom.horizontal_padding]);

        var new_yScale = d3.scale.linear()
        .domain(yRange)
        .range([common_geom.vertical_padding, common_geom.h - common_geom.vertical_padding]);


        function convertX(x){
            return new_xScale(xScale.invert(x));
        }

        function convertY(y){
            return new_yScale(yScale.invert(y));
        }

        // Adjust positions
        rect_geom.track_circle_pos = convertX(rect_geom.track_circle_pos);

        var rightPos = convertX(rect_geom.start_time_pos + rect_geom.width);
        rect_geom.width =  rightPos - convertX(rect_geom.start_time_pos);
        rect_geom.start_time_pos = convertX(rect_geom.start_time_pos);


        rect_geom.delay_line_height = convertY(rect_geom.delay_line_height);
        var bottom_pos =  convertY(rect_geom.height + rect_geom.rect_top);
        rect_geom.height = bottom_pos - convertY(rect_geom.rect_top);
        rect_geom.rect_top = convertY(rect_geom.rect_top);

        d3.select(div_name).selectAll('.data-circle')
            .attr("cx", function(d){ return new_xScale(d.time); })
            .attr("cy", function(d){ return new_yScale(d.value); });

        d3.select(div_name).selectAll(".example_line")
            .attr("x1", function(d){ return new_xScale(d.t1) })
            .attr("x2", function(d){ return new_xScale(d.t2) })
            .attr("y1", function(d){ return new_yScale(d.y) })
            .attr("y2", function(d){ return new_yScale(d.y) });

        d3.select(div_name).selectAll(".example_circle")
            .attr("cx", function (d) {
                return new_xScale(d.t1)
            })
            .attr("cy", function (d) {
                return new_yScale(d.y)
            });

        if (timing_parent_bar){
            timing_parent_bar.adjust_scales(new_xScale);
        }

        // switch scales
        xScale = new_xScale;
        yScale = new_yScale;

        d3.select(div_name).selectAll(".data-path")
            .attr("d", function(d){ return data_line_generator(d); });

        // Redraw
        drawAxes(svg, common_geom, xScale, yScale, variable_name);
        adjust_everything();
    }


    // Callback functions for interactions
    /************************************************/
    var drag_track_circle = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){

            if (common_geom.specification_fixed && !timing_parent_bar){
                return;
            }

            var cursor_x = d3.mouse(svg.node())[0];
            var newx = imposeLimits(0, common_geom.w, cursor_x);

            if (timing_parent_bar) {
                newx = imposeLimits(timing_parent_bar.get_start_time() + rect_geom.delay_line_length,
                                    timing_parent_bar.get_end_time() + rect_geom.delay_line_length, newx);
            }

            var shift = newx - rect_geom.start_time_pos;
            rect_geom.track_circle_pos += shift;
            rect_geom.start_time_pos += shift;

            adjust_everything(false);
        });

    function drag_fixed() {
        // resize so edges remain on axes if necessary
        if (!rect_geom.left_fixed) {
            drag_resize_left_inner(rect_geom.start_time_pos, 0);
        }
        if (!rect_geom.right_fixed) {
            drag_resize_right_inner(rect_geom.start_time_pos, common_geom.w);
        }
        if (!rect_geom.top_fixed) {
            drag_resize_top_inner(rect_geom.rect_top, 0);
        }
        if (!rect_geom.bottom_fixed) {
            drag_resize_bottom_inner(rect_geom.rect_top, common_geom.h);
        }
    }

    function dragmove(d) {
        if (common_geom.specification_fixed){ return; }

        // horizontal movement
        var rect_center = d3.mouse(svg.node())[0] - rect_geom.width/2;
        var new_start_pos = imposeLimits(rect_geom.track_circle_pos, common_geom.w - rect_geom.width, rect_center);

        rect_geom.start_time_pos = new_start_pos;

        // vertical movement
        var rect_center = d3.mouse(svg.node())[1] - rect_geom.height/2;
        rect_geom.rect_top = imposeLimits(0, common_geom.h - rect_geom.height, rect_center);
        adjust_everything(true);
    }

    function drag_resize_left(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.left_fixed) {
            return;
        }

        var oldx = rect_geom.start_time_pos;
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_x = d3.mouse(svg.node())[0];
        var newx = imposeLimits(rect_geom.track_circle_pos, rect_geom.start_time_pos + rect_geom.width, cursor_x);
        drag_resize_left_inner(oldx, newx);
    }

    function drag_resize_left_inner(oldx, newx) {
        rect_geom.start_time_pos = newx;
        rect_geom.width = rect_geom.width + (oldx - newx);

        adjust_everything(true);
    }


    function drag_resize_right(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.right_fixed) {
            return;
        }

        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)
        var dragx = imposeLimits(rect_geom.start_time_pos, common_geom.w, rect_geom.start_time_pos + rect_geom.width + d3.event.dx);
        drag_resize_right_inner(rect_geom.start_time_pos, dragx);
    }

    function drag_resize_right_inner(oldx_left, newx_right) {
        rect_geom.width = newx_right - oldx_left;
        adjust_everything(true);
    }


    function drag_resize_top(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.top_fixed) {
            return;
        }

        var oldy = rect_geom.rect_top;
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_y = d3.mouse(svg.node())[1];
        var newy = imposeLimits(0, rect_geom.rect_top + rect_geom.height - (rect_geom.dragbarw / 2), cursor_y);
        drag_resize_top_inner(oldy, newy);
    }

    function drag_resize_top_inner(oldy, newy) {
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        rect_geom.rect_top = newy;
        rect_geom.height = rect_geom.height + (oldy - newy);
        adjust_everything(true);
    }


    function drag_resize_bottom(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.bottom_fixed) {
            return;
        }

        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)
        var dragy = imposeLimits(rect_geom.rect_top + (rect_geom.dragbarw / 2), common_geom.h, rect_geom.rect_top + rect_geom.height + d3.event.dy);
        drag_resize_bottom_inner(rect_geom.rect_top, dragy);
    }

    function drag_resize_bottom_inner(oldy, newy) {
        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)

        //recalculate width
        rect_geom.height = newy - oldy;
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
                timing_parent_bar = create_bar(1, 'some', common_geom, svg, placeholder_form, newg, helper_funcs);
                update_text();
            }
        },
        {
            title: 'Constraint applies at <i>all</i> times in range',
            action: function(elm, d, i) {
                if (timing_parent_bar){
                    timing_parent_bar.delete();
                }
                timing_parent_bar = create_bar(1, 'all', common_geom, svg, placeholder_form, newg, helper_funcs);
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
                timing_parent_bar = create_bar(1, 'all', common_geom, svg, placeholder_form, newg, helper_funcs);
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
                timing_parent_bar = create_bar(1, 'some', common_geom, svg, placeholder_form, newg, helper_funcs);
                timing_parent_bar.set_parent_bar('all')();
                update_text();
            }
        }

    ];

    function rclick_left() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.left_fixed = !rect_geom.left_fixed;

        if (!rect_geom.left_fixed) {
            drag_resize_left_inner(rect_geom.start_time_pos, 0);
        }

        set_edges();
        return false;
    }

    function rclick_right() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.right_fixed = !rect_geom.right_fixed;
        if (!rect_geom.right_fixed) {
            drag_resize_right_inner(rect_geom.start_time_pos, common_geom.w);
        }
        set_edges();
    }

    function rclick_top() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.top_fixed = !rect_geom.top_fixed;
        if (!rect_geom.top_fixed) {
            drag_resize_top_inner(rect_geom.rect_top, 0);
        }
        set_edges();
    }

    function rclick_bottom() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.bottom_fixed = !rect_geom.bottom_fixed;
        if (!rect_geom.bottom_fixed) {
            drag_resize_bottom_inner(rect_geom.rect_top, common_geom.h);
        }
        set_edges();
    }


    // Actually create visual elements
    /************************************************/
    drawAxes(svg, common_geom, xScale, yScale, variable_name);

    var example_trajctory_g = svg.append("g")
        .attr("id", "example_trajectory");

    d3.select(div_name).select(".space-div").style("width", common_geom.w + "px");

    var placeholder_form = d3.select(div_name).select(".placeholder-form");
    var placeholder_latex = d3.select(div_name).select(".placeholder-latex");
    var placeholder_latex_formula = placeholder_latex.append("div");

    var options_form = d3.select(div_name).append("div").classed("space-div", true).append("form");
    var use_letters = placeholder_latex.append("input")
        .attr("type", "checkbox")
        .attr("id", "use_letters_checkbox")
        .attr("value", "false")
        .on("change", function(){
            common_geom.use_letters = !common_geom.use_letters;
            update_text();
        });
    var use_letters_label = placeholder_latex.append("label").attr("for", "use_letters_checkbox").text("Use letters");

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

    function plotExampleTrajectory(applyAllConstraints){

        return function() {
            var spec_strings = [];

            if (applyAllConstraints) {
                for (var i = 0; i < diagrams.length; i++) {
                    spec_strings.push(diagrams[i].getSpecString());
                }
            } else {
                spec_strings.push(getSpecString());
            }

            $.ajax({
                type: "GET",
                contentType: "application/json; charset=utf-8",
                url: "http://" + window.location.host + "/specifications/example",
                dataType: 'html',
                async: true,
                data: {"specification_string": spec_strings, "t_max": xRange[1]},

                beforeSend: function (xhr, settings) {
                    xhr.setRequestHeader("X-CSRFToken", csrf_token);
                },

                success: function (data) {
                    data = JSON.parse(data);
                    var line_data = data.filter(function (d){ return d.t2 > d.t1; });
                    var circle_data = data.filter(function (d){ return d.t2 == d.t1; });

                    example_trajctory_g
                        .append("g")
                        .selectAll(".example_line")
                        .data(data)
                        .enter()
                        .append("line")
                        .attr("x1", function(d){ return timeToX(d.t1) })
                        .attr("x2", function(d){ return timeToX(d.t2) })
                        .attr("y1", function(d){ return valToY(d.y) })
                        .attr("y2", function(d){ return valToY(d.y) })
                        .attr("stroke-width", "2")
                        .attr("stroke", "rgb(0,0,0)")
                        .attr("class", "example_line");


                    example_trajctory_g
                        .append("g")
                        .selectAll(".example_circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("class", "example_circle")
                        .attr("r", 3.5)
                        .attr("cx", function (d) {
                            return timeToX(d.t1)
                        })
                        .attr("cy", function (d) {
                            return valToY(d.y)
                        });


                    d3.select(div_name)
                        .select("#delete_trajectory_button")
                        .style("visibility", "visible");

                },
                error: function (result, textStatus) {
                }
            })
        }
    }


    var diagram_option = d3.select(div_name)
                            .select(".diagram-div")
                            .append("div");

    var constant = diagram_option.append("input")
        .attr("type", "checkbox")
        .attr("id", "constant_checkbox")
        .attr("value", "false")
        .on("change", function(){ common_geom.specification_fixed = !common_geom.specification_fixed;});
    var constant_label = diagram_option.append("label").attr("for", "constant_checkbox").text("Fix specification");


    var experimental_data_div = diagram_option.append("div");


    function hide_data(dataset_name){
        return function (){
            svg.selectAll(".data-circle")
                .filter(function(d){ return d.dataset == dataset_name })
                .style("visibility",  this.checked ? 'visible' : 'hidden');

            svg.selectAll(".data-path")
                .filter(function(d){ return d[0].dataset == dataset_name })
                .style("visibility",  this.checked ? 'visible' : 'hidden');

        }
    }

    for (var i=0; i <  dataset_names.length; i++){
        experimental_data_div.append("label")
            .attr("for", "dataset_" + [i] + "_input").text(dataset_names[i])
            .style("color", colorScale(i));

        experimental_data_div.append("input")
            .attr("id", "dataset_" + [i] + "_input")
            .attr("type", "checkbox")
            .attr("checked", "true")
            .on("change", hide_data(dataset_names[i]) );
    }

    var axis_range_div = diagram_option.append("div");
    var time_max_label = axis_range_div.append("label").attr("for", "time_max_input").text(" Max time ");
    var time_max_input = axis_range_div.append("input")
        .attr("id", "time_max")
        .attr("value", xRange[1])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                xRange[1] = parseFloat(this.value);
                adjust_scales();
            }
        });

    var y_min_label = axis_range_div.append("label").attr("for", "y_min_input").text(" Min " + variable_name);
    var y_min_input = axis_range_div.append("input")
        .attr("id", "y_max")
        .attr("value", yRange[1])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                yRange[1] = parseFloat(this.value);
                adjust_scales();
            }
        });

    var y_max_label = axis_range_div.append("label").attr("for", "y_max_input").text(" Max " + variable_name);
    var y_max_input = axis_range_div.append("input")
        .attr("id", "y_min")
        .attr("value", yRange[0])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                yRange[0] = parseFloat(this.value);
                adjust_scales();
            }
        });

    var example_plot_buttons_div = diagram_option.append("div");
    example_plot_buttons_div.append('button')
        .classed("btn", true).classed("btn-default", true).attr("type", "button")
        .text("Plot trajectory satisfying this constraint")
        .on("click", plotExampleTrajectory(false));

    example_plot_buttons_div.append('button')
        .classed("btn", true).classed("btn-default", true)
        .text("Plot trajectory satisfying all constraints")
        .on("click", plotExampleTrajectory(true));

    example_plot_buttons_div.append('button')
        .text("Delete example trajectory")
        .on("click", function(){
            example_trajctory_g.selectAll(".example_line").remove();
            example_trajctory_g.selectAll(".example_circle").remove();
            d3.select(this).style("visibility", "hidden");
        })
        .attr("id", "delete_trajectory_button")
        .classed("btn", true).classed("btn-danger", true)
        .style("visibility", "hidden");



    var newg = svg.append("g");

    // we draw these lines before the dragrect to improve carity when rectangle is very thin
    var delay_line = newg.append("line").classed("red-line", true);

    var startline = newg.append("line").classed("red-line", true);

    var dragrect = newg.append("rect")
        .attr("id", "active")
        .attr("fill", "lightgreen")
        .attr("fill-opacity", .25)
        .attr("cursor", "move")
        .call(d3.behavior.drag()
            .origin(Object)
            .on("drag", dragmove));

    dragrect.on('contextmenu', d3.contextMenu([{
            title: 'Adjust values',
            action: adjust_rect_values
        }]));

    var dragbarleft = newg.append("circle")
        .attr("id", "dragleft")
        .attr("r", rect_geom.dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ew-resize")
        .call(
            d3.behavior.drag()
            .origin(Object)
            .on("drag", drag_resize_left)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return rect_geom.left_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_left
        }]));

    var dragbarright = newg.append("circle")
        .attr("id", "dragright")
        .attr("r", rect_geom.dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ew-resize")
        .call(
            d3.behavior.drag()
            .origin(Object)
            .on("drag", drag_resize_right)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return rect_geom.right_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_right
        }]));


    var dragbartop = newg.append("circle")
        .attr("r", rect_geom.dragbarw / 2)
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
                return rect_geom.top_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_top
        }]));


    var dragbarbottom = newg.append("circle")
        .attr("id", "dragbottom")
        .attr("r", rect_geom.dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ns-resize")
        .call( d3.behavior.drag()
        .origin(Object)
        .on("drag", drag_resize_bottom)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return rect_geom.bottom_fixed ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_bottom
        }]));

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("r", 7)
        .classed("track_circle", true)
        .on('contextmenu', d3.contextMenu(menu))
        .call(drag_track_circle);

    // Plotting saved datasets
    d3.json(window.location + "/data", function(error, all_data){

            for (var i=0; i<all_data.length; i++) {

                var data = all_data[i].value;

                var circles = svg.append('g')
                    .selectAll('circle')
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return timeToX(d.time)
                    })
                    .attr("cy", function (d) {
                        return valToY(d.value)
                    })
                    .attr("r", 2)
                    .classed("data-circle", true);

                svg
                    .append("path")
                    .classed("data-path", true)
                    .datum(data.filter(function (d) { return d.variable == variable_name; }))
                    .attr("fill", "none")
                    .attr("stroke", colorScale(i))
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", 1.5)
                    .attr("d", data_line_generator);

                circles.filter(function (d) {
                    return d.variable != variable_name
                })
                    .remove();

            }
    });



    // Shading edges of rectangle
    /************************************************/

    function set_edges() {

        dragrect.style("stroke", "black");

        // Edging goes top, right, bottom, left
        // As a rectangle has 4 sides, there are 2^4 = 16 cases to handle.

        // 4 edges:
        if (rect_geom.top_fixed && rect_geom.bottom_fixed && rect_geom.left_fixed && rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width + rect_geom.height + rect_geom.width + rect_geom.height].join(','));
        }

        // 3 edges
        else if (rect_geom.top_fixed && rect_geom.bottom_fixed && rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width + rect_geom.height + rect_geom.width, rect_geom.height].join(','));
        } else if (rect_geom.top_fixed && rect_geom.bottom_fixed && rect_geom.left_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width, rect_geom.height, rect_geom.width + rect_geom.height].join(','));
        } else if (rect_geom.top_fixed && rect_geom.left_fixed && rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width + rect_geom.height, rect_geom.width, rect_geom.height].join(','));
        } else if (rect_geom.bottom_fixed && rect_geom.left_fixed && rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [0, (rect_geom.width), rect_geom.height + rect_geom.width + rect_geom.height].join(','));
        }

        // 2 edges
        else if (rect_geom.top_fixed && rect_geom.bottom_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width, rect_geom.height, rect_geom.width, rect_geom.height].join(','));
        } else if (rect_geom.top_fixed && rect_geom.left_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width, rect_geom.height + rect_geom.width, rect_geom.height].join(','));
        } else if (rect_geom.top_fixed && rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width + rect_geom.height, rect_geom.width + rect_geom.height].join(','));
        } else if (rect_geom.bottom_fixed && rect_geom.left_fixed) {
            dragrect.style("stroke-dasharray", [0, rect_geom.width + rect_geom.height, rect_geom.width + rect_geom.height].join(','));
        } else if (rect_geom.bottom_fixed && rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [0, rect_geom.width, rect_geom.height + rect_geom.width, rect_geom.height].join(','));
        } else if (rect_geom.left_fixed && rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [0, rect_geom.width, rect_geom.height, rect_geom.width, rect_geom.height].join(','));
        }

        // 1 edges
        else if (rect_geom.top_fixed) {
            dragrect.style("stroke-dasharray", [rect_geom.width, (rect_geom.height + rect_geom.width + rect_geom.height)].join(','));
        }
        else if (rect_geom.bottom_fixed) {
            dragrect.style("stroke-dasharray", [0, (rect_geom.width + rect_geom.height), rect_geom.width, rect_geom.height].join(','));
        }
        else if (rect_geom.left_fixed) {
            dragrect.style("stroke-dasharray", [0, (rect_geom.width + rect_geom.height + rect_geom.width), rect_geom.height].join(','));
        }
        else if (rect_geom.right_fixed) {
            dragrect.style("stroke-dasharray", [0, (rect_geom.width + rect_geom.height + rect_geom.width), rect_geom.height].join(','));
        }

        // 0 edges
        else {
            dragrect.style("stroke-dasharray", [0, rect_geom.width + rect_geom.height + rect_geom.width + rect_geom.height].join(','));
        }

        update_text();
    }


    // Describing selected region
    /************************************************/

    function getYLatexString(){

        var y_upper = YToVal(rect_geom.rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + rect_geom.height ).toFixed(2);

        var latex_string;

        // 2 bounds
        if (rect_geom.top_fixed && rect_geom.bottom_fixed) {
            latex_string = "(" + y_lower + "< x_" + index + "<" + y_upper + ")";
        }

        // 1 bound
        else if (rect_geom.top_fixed) {
            latex_string = "(x_" + index + "<" + y_upper + ")";
        }
        else if (rect_geom.bottom_fixed) {
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
        placeholder_latex_formula.html("$" + latex_string + "$");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    }

    function get_latex_string(){
        var y_latex_string = getYLatexString();
        var latex_string = "";

        // If rectangle has a parent bar, rectangle is represented by a Global term with start/end times measured from start_line
        if (timing_parent_bar){
            latex_string = timing_parent_bar.getLatex();
            var delay_time = XToTime(rect_geom.start_time_pos) - XToTime(rect_geom.track_circle_pos);
            delay_time = delay_time.toFixed(2);

            var length =   XToTime(rect_geom.start_time_pos + rect_geom.width) - XToTime(rect_geom.track_circle_pos);
            length = length.toFixed(2);

            if (delay_time == 0 && length == 0){
                return latex_string + y_latex_string;
            } else {
                var symbol = common_geom.use_letters ? ' G' : ' \\square';
                return latex_string + symbol + "_{[" + delay_time + "," + length + "]}" + y_latex_string;
            }
        }

        // Otherwise, rectangle is represented by a Global term with a start and end time
        if (!rect_geom.top_fixed && !rect_geom.bottom_fixed) {
            return latex_string + "\\;"; // Insert latex symbol for space to avoid empty forumla appearing as '$$'
        }

        var x_lower = XToTime(rect_geom.start_time_pos).toFixed(2);
        var x_upper = XToTime(rect_geom.start_time_pos + rect_geom.width ).toFixed(2);

        if (!rect_geom.right_fixed){
            x_upper = "\\infty";
        }

        if (!rect_geom.left_fixed){
            x_lower = "0";
        }

        var symbol = common_geom.use_letters ? ' G' : ' \\square';
        return latex_string + symbol + "_{[" + x_lower + "," + x_upper + "]}" + y_latex_string;
    }

    function update_text() {

        function create_initial_bar (kind){
            timing_parent_bar = create_bar(1, kind, common_geom, svg, placeholder_form, newg, helper_funcs);
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
        describe_constraint(timing_parent_bar, variable_name, placeholder_form, rect_geom, update_functions);

        update_formula();
    }


    // functions for generating specification to save

    function getYSpecString(){

        var y_upper = YToVal(rect_geom.rect_top).toFixed(2);
        var y_lower = YToVal( valToY(y_upper) + rect_geom.height ).toFixed(2);

        var spec_string;

        // 2 bounds
        if (rect_geom.top_fixed && rect_geom.bottom_fixed) {
            spec_string = "Inequality(gt=" + y_lower + ", lt=" + y_upper;
        }

        // 1 bound
        else if (rect_geom.top_fixed) {
            spec_string = "Inequality(lt=" + y_upper;
        }
        else if (rect_geom.bottom_fixed) {
            spec_string = "Inequality(gt=" + y_lower;
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

            var delay_time = XToTime(rect_geom.start_time_pos) - XToTime(rect_geom.track_circle_pos);
            delay_time = delay_time.toFixed(2);

            var length =   XToTime(rect_geom.start_time_pos + rect_geom.width) - XToTime(rect_geom.track_circle_pos);
            length = length.toFixed(2);

            if (delay_time == 0 && length == 0){
                spec_string += y_spec_string;
            } else {
                spec_string += "Globally(" + delay_time + "," + length + "," + y_spec_string;
            }

            var numLeftParens = 0;
            for (var i=0; i<spec_string.length; i++){
                if (spec_string[i] == "("){ numLeftParens++; }
            }

            return spec_string + ")".repeat(numLeftParens);
        }

        // Otherwise, rectangle is represented by a Global term with a start and end time
        if (!rect_geom.top_fixed && !rect_geom.bottom_fixed) {
            return spec_string;
        }

        var x_lower = XToTime(rect_geom.start_time_pos).toFixed(2);
        var x_upper = XToTime( timeToX(x_lower) + rect_geom.width ).toFixed(2);

        if (!rect_geom.right_fixed){
            x_upper = "Inf";
        }

        if (!rect_geom.left_fixed){
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
            timing_parent_bar = create_bar(1, kind, common_geom, svg, placeholder_form, newg, helper_funcs, options);
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



    function adjust_rect_values(){
        d3.select("#paramModal").remove();
        var modal_contents = d3.select(div_name).append("div")
            .attr("id", "paramModal")
            .classed("modal", true)
            .classed("fade", true)

            .append("div")
            .classed("modal-dialog", true)

            .append("div")
            .classed("modal-content", true);

        var modalHeader = modal_contents.append("div").classed("modal-header", true);
        var modalBody = modal_contents.append("div").classed("modal-body", true);
        var modalFooter = modal_contents.append("div").classed("modal-footer", true);

        modalHeader.append("button")
            .classed("close", true)
            .attr("data-dismiss", "modal") // ???
            .attr("type", "button")
            .attr("aria-hidden", true)
            .text('×');


        modalHeader.append("h4").text("Adjust values").classed("modal-title", true);

        var start, end;
        if (timing_parent_bar){
            start = XToTime(rect_geom.start_time_pos) - XToTime(rect_geom.track_circle_pos);
            end = XToTime(rect_geom.start_time_pos + rect_geom.width) - XToTime(rect_geom.track_circle_pos);
        } else {
            start = XToTime(rect_geom.start_time_pos);
            end = XToTime(rect_geom.start_time_pos + rect_geom.width);
        }


        var timeDiv = modalBody.append("div");
        timeDiv.append("text").text("From ");
        var startTimeBox = timeDiv.append("input").attr("value",  start.toFixed(2)).node();
        timeDiv.append("text").text(" to ");
        var endTimeBox = timeDiv.append("input").attr("value",  end.toFixed(2)).node();

        var valDiv = modalBody.append("div");
        valDiv.append("text").text("Value is between");
        var minValBox = valDiv.append("input").attr("value", YToVal(rect_geom.rect_top + rect_geom.height).toFixed(2)).node();
        valDiv.append("text").text(" and ");
        var maxValBox = valDiv.append("input").attr("value", YToVal(rect_geom.rect_top).toFixed(2)).node();


        modalFooter.append("button").text("Save").on("click", function(){

            if (timing_parent_bar){
                rect_geom.width = timeToX(parseFloat(endTimeBox.value)) - timeToX(parseFloat(startTimeBox.value));
                rect_geom.start_time_pos =  timeToX(parseFloat(startTimeBox.value) + XToTime(rect_geom.track_circle_pos));
            } else {
                rect_geom.width = timeToX(parseFloat(endTimeBox.value)) - timeToX(parseFloat(startTimeBox.value));
                rect_geom.start_time_pos =  timeToX(parseFloat(startTimeBox.value));

                rect_geom.track_circle_pos = rect_geom.start_time_pos;
            }

            rect_geom.height = valToY(parseFloat(minValBox.value)) - valToY(parseFloat(maxValBox.value));
            rect_geom.rect_top = valToY(parseFloat(maxValBox.value));

            adjust_everything(true);
        })

        .attr("data-dismiss", "modal");
        modalFooter.append("button").text("Close").attr("data-dismiss", "modal");

        $('#paramModal').modal('toggle');
    }


    adjust_everything(true);
    return {add_bar: append_timing_bar, getSpecString: getSpecString}
}

function add_subplot_from_specification(specification_string, div_name, spec_id, variable_name){
   // d3.select("#diagrams").append('div').attr("id", div_name);

    var diagram_div = d3.select('#' + div_name).select(".svg-container").append('div').classed("diagram-div", true);

    var svg = diagram_div.append("svg")
        .attr("width", 750)
        .attr("height", 450);

    var common_geom = {
        w: parseInt(svg.attr("width")),
        h: parseInt(svg.attr("height")),
        vertical_padding: 30,
        horizontal_padding: 60,
        track_padding: 20,
        specification_fixed: false,
        use_letters: false
    };


    var index = 1;
    div_name = "#" + div_name;

    var string = specification_string.toLowerCase().trim().replace(/ /g, '');

    if (!string){ return setup(svg, common_geom, div_name, spec_id, index, variable_name); }

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
            string = string.replace(/\)/g, ''); // remove all closing parens
            args = string.slice(11);
            
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
        return setup(svg, common_geom, div_name, spec_id, index, variable_name, rectangle_opts);
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

    var diagram = setup(svg, common_geom, div_name, spec_id, index, variable_name, rectangle_opts);

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
    return diagram;
}
