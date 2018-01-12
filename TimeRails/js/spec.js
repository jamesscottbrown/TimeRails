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

function addCommonElements(common_geom, subplot_geom){

    function plotExampleTrajectory(applyAllConstraints){

        return function() {
            var spec_strings = [];

            if (applyAllConstraints) {
                for (var i = 0; i < diagrams.length; i++) {
                    spec_strings.push(diagrams[i].getSpecString(common_geom));
                }
            } else {
                spec_strings.push(getSpecString(common_geom));
            }

            $.ajax({
                type: "GET",
                contentType: "application/json; charset=utf-8",
                url: "http://" + window.location.host + "/specifications/example",
                dataType: 'html',
                async: true,
                data: {"specification_string": spec_strings, "t_max": common_geom.xRange[1], "yRange": subplot_geom.yRange},

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
                        .attr("x1", function(d){ return common_geom.xScale(d.t1) })
                        .attr("x2", function(d){ return common_geom.xScale(d.t2) })
                        .attr("y1", function(d){ return subplot_geom.yScale(d.y) })
                        .attr("y2", function(d){ return subplot_geom.yScale(d.y) })
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
                            return common_geom.xScale(d.t1)
                        })
                        .attr("cy", function (d) {
                            return subplot_geom.yScale(d.y)
                        });

                    example_trajctory_g
                        .append("g")
                        .selectAll(".example_box")
                        .data(data)
                        .enter()
                        .append("rect")
                        .attr("class", "example_box")
                        .attr("y", function (d) {
                            return subplot_geom.yScale(d.y_max)
                        })
                        .attr("height", function (d) {
                            return subplot_geom.yScale(d.y_min) - subplot_geom.yScale(d.y_max)
                        })
                        .attr("x", function (d) {
                            return common_geom.xScale(d.t1)
                        })
                        .attr("width", function (d) {
                            return common_geom.xScale(d.t2) - common_geom.xScale(d.t1)
                        })
                        .attr("fill-opacity", 0.2)
                        .style("isolation-mode", "isolate");




                    d3.select(common_geom.div_name)
                        .select("#delete_trajectory_button")
                        .style("visibility", "visible");

                },
                error: function (result, textStatus) {
                }
            })
        }
    }

    var example_trajctory_g = subplot_geom.svg.append("g")
        .attr("id", "example_trajectory");

    var diagram_option = d3.select(common_geom.div_name)
                            .select(".diagram-div")
                            .append("div");

    if (common_geom.subplot_geoms.length < 1) {
        var constant = diagram_option.append("input")
            .attr("type", "checkbox")
            .attr("id", "constant_checkbox")
            .attr("value", "false")
            .on("change", function () {
                common_geom.specification_fixed = !common_geom.specification_fixed;
            });
        var constant_label = diagram_option.append("label").attr("for", "constant_checkbox").text("Fix specification");


        var time_axis_range_div = diagram_option.append("div");
        var time_max_label = time_axis_range_div.append("label").attr("for", "time_max_input").text(" Max time ");
        var time_max_input = time_axis_range_div.append("input")
            .attr("id", "time_max")
            .attr("value", common_geom.xRange[1])
            .attr("length", "6")
            .on("change", function(){
                var val = parseFloat(this.value);
                if (!isNaN(val)){
                    common_geom.xRange[1] = parseFloat(this.value);
                    adjustAllXScales(common_geom, subplot_geom);
                }
            });

    }

    var experimental_data_div = diagram_option.append("div");


    function hide_data(dataset_name){
        return function (){
            subplot_geom.svg.selectAll(".data-circle")
                .filter(function(d){ return d.dataset == dataset_name })
                .style("visibility",  this.checked ? 'visible' : 'hidden');

            subplot_geom.svg.selectAll(".data-path")
                .filter(function(d){ return d[0].dataset == dataset_name })
                .style("visibility",  this.checked ? 'visible' : 'hidden');

        }
    }

    for (var i=0; i <  dataset_names.length; i++){
        experimental_data_div.append("label")
            .attr("for", "dataset_" + [i] + "_input").text(dataset_names[i])
            .style("color", common_geom.colorScale(i));

        experimental_data_div.append("input")
            .attr("id", "dataset_" + [i] + "_input")
            .attr("type", "checkbox")
            .attr("checked", "true")
            .on("change", hide_data(dataset_names[i]) );
    }

        // Plotting saved datasets
    d3.json(window.location + "/data", function(error, all_data){

            for (var i=0; i<all_data.length; i++) {

                var data = all_data[i].value;

                var circles = subplot_geom.svg.append('g')
                    .selectAll('circle')
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return common_geom.xScale(d.time)
                    })
                    .attr("cy", function (d) {
                        return subplot_geom.yScale(d.value)
                    })
                    .attr("r", 2)
                    .classed("data-circle", true);

                    var data_line_generator = d3.svg.line()
                        .x(function (d) { return common_geom.xScale(d.time); })
                        .y(function (d) { return subplot_geom.yScale(d.value); });

                subplot_geom.svg
                    .append("path")
                    .classed("data-path", true)
                    .datum(data.filter(function (d) { return d.variable == subplot_geom.variable_name; }))
                    .attr("fill", "none")
                    .attr("stroke", common_geom.colorScale(i))
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", 1.5)
                    .attr("d", data_line_generator);

                circles.filter(function (d) {
                    return d.variable != subplot_geom.variable_name
                })
                    .remove();

            }
    });


    var axis_range_div = diagram_option.append("div");

    var y_min_label = axis_range_div.append("label").attr("for", "y_min_input").text(" Min " + subplot_geom.variable_name);
    var y_min_input = axis_range_div.append("input")
        .attr("id", "y_max")
        .attr("value", subplot_geom.yRange[1])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                subplot_geom.yRange[1] = parseFloat(this.value);
                adjustAllYScales(common_geom, subplot_geom);
            }
        });

    var y_max_label = axis_range_div.append("label").attr("for", "y_max_input").text(" Max " + subplot_geom.variable_name);
    var y_max_input = axis_range_div.append("input")
        .attr("id", "y_min")
        .attr("value", subplot_geom.yRange[0])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                subplot_geom.yRange[0] = parseFloat(this.value);
                adjustAllYScales(common_geom, subplot_geom);
            }
        });

    if (common_geom.generateExampleTrajectories){
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
                example_trajctory_g.selectAll(".example_box").remove();
                d3.select(this).style("visibility", "hidden");
            })
            .attr("id", "delete_trajectory_button")
            .classed("btn", true).classed("btn-danger", true)
            .style("visibility", "hidden");
    }

    d3.select(common_geom.div_name).append('button')
        .text("Save")
        .on("click", function(){
            var new_spec_string = getSpecString(common_geom);
            $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: "http://" + window.location.host + "/specifications/" + common_geom.spec_id + "/save",
            dataType: 'html',
            async: true,
            data: new_spec_string,

             beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", csrf_token);
             },

            success: function (data) {
                d3.select("#spec_string_" + common_geom.spec_id).text(new_spec_string)
            },
            error: function (result, textStatus) { }
            })
        });

    d3.select(common_geom.div_name).select("#use_letters_checkbox").on("change", function(){
        common_geom.use_letters = !common_geom.use_letters;

        for (var j=0; j<common_geom.subplot_geoms.length; j++){
           for (var i=0; i<common_geom.subplot_geoms[j].rectangles.length; i++){
            common_geom.subplot_geoms[j].rectangles[i].update_formula();
            }
        }


    });

    d3.select("#export_button")
        .on("click", function(){

            var operator = d3.select("#operator").node().value;
            var symbol = (operator == "and") ? " && " : " || ";

            var spec_strings = [];
            for (var i=0; i < diagrams.length; i++){
                spec_strings.push("(" + diagrams[i].getSpecString(common_geom) + ")"); // TODO: get right common_geoms
            }

            alert(spec_strings.join(symbol));
            //return true;
        })

}

function getSpecString(common_geom){
    var spec_strings = [];

    for (var j=0; j<common_geom.subplot_geoms.length; j++) {

        for (var i = 0; i < common_geom.subplot_geoms[j].rectangles.length; i++) {
            spec_strings.push(common_geom.subplot_geoms[j].rectangles[i].getSpecString(common_geom));
        }
    }
    return spec_strings.join(' && ');
}

function adjustAllYScales(common_geom, subplot_geom) {
        // Create new scales
        var new_yScale = d3.scale.linear()
        .domain(subplot_geom.yRange)
        .range([common_geom.vertical_padding, common_geom.subplotHeight - common_geom.vertical_padding]);

        for (var i=0; i < subplot_geom.rectangles.length; i++){
            subplot_geom.rectangles[i].adjust_scales(common_geom.xScale, new_yScale);
        }

        // switch scales
        subplot_geom.yScale = new_yScale;

        // Redraw axes
        common_geom.drawAxes(common_geom, subplot_geom);
}

function adjustAllXScales(common_geom, subplot_geom) {
    // TODO: if x-scale was changed, we should update all subplots
        // Create new scales
        var new_xScale = d3.scale.linear()
            .domain(common_geom.xRange)
            .range([common_geom.horizontal_padding, common_geom.subplotWidth - common_geom.horizontal_padding]);

        for (var j=0; j<common_geom.subplot_geoms.length; j++) {
            for (var i = 0; i < common_geom.subplot_geoms[j].rectangles.length; i++) {
                var this_subplot = common_geom.subplot_geoms[j];
                this_subplot.rectangles[i].adjust_scales(new_xScale, this_subplot.yScale);
                drawAxes(common_geom, this_subplot, new_xScale);
            }
        }
        // switch scales
        common_geom.xScale = new_xScale;
}



function drawAxes(common_geom, subplot_geom, new_xScale){

    var xScale = new_xScale ? new_xScale : common_geom.xScale;

    var xAxis =  d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    subplot_geom.svg.selectAll('.axis').remove();
    subplot_geom.svg.selectAll('.axis-label').remove();

    subplot_geom.svg.append("g")
        .call(xAxis)
        .attr("class", "axis")
        .attr("transform", "translate(0," + subplot_geom.yScale.range()[1] + ")");

    subplot_geom.svg
        .append("text")
        .classed("axis-label", true)
        .attr('x', -common_geom.subplotHeight/2)
        .attr("y", 6)

        .attr("transform", "rotate(-90)")
        .attr("dy", ".75em")
        .text(subplot_geom.variable_name);

    var yAxis =  d3.svg.axis()
        .scale(subplot_geom.yScale)
        .orient("left");

    subplot_geom.svg.append("g")
        .call(yAxis)
        .attr("class", "axis")
        .attr("transform", "translate(" + (common_geom.horizontal_padding) + ", " + 0 + ")");

}

function Diagram(div_name, spec_id, spec_options) {

    var subplotWidth = 750,
        subplotHeight = 450;

    var diagram_div = d3.select('#' + div_name).select(".svg-container").append('div').classed("diagram-div", true);

    var svg = diagram_div.append("svg")
        .attr("width", subplotWidth)
        .attr("height", 0)
        .on('contextmenu', d3.contextMenu([]));


    var index = 1;
    var subplotIndex = 0;
    div_name = "#" + div_name;

    // Group together data that is shared between all rectangles in a specification,
    // and methods that act on the whole specification
    var common_geom = {
        w: parseInt(svg.attr("width")),
        h: parseInt(svg.attr("height")),
        vertical_padding: 30,
        horizontal_padding: 60,
        track_padding: 20,

        subplotWidth: subplotWidth,
        subplotHeight: subplotHeight,

        specification_fixed: false,
        use_letters: false,
        generateExampleTrajectories: spec_options.hasOwnProperty("generateExampleTrajectories") ? spec_options.generateExampleTrajectories : true,

        colorScale: d3.scale.category10(),

        xRange: [0, 100],

        div_name: div_name,
        spec_id: spec_id,
        index: index,

        drawAxes: drawAxes,
        adjustAllRectangles: function (update_description) {
            for (var j=0; j<common_geom.subplot_geoms.length; j++){
                for (var i = 0; i < common_geom.subplot_geoms[j].rectangles.length; i++) {
                    common_geom.subplot_geoms[j].rectangles[i].adjust_everything(update_description);
                }
            }
        },

        rectangles: [],
        variable_names: [],

        subplot_geoms: []
    };

    if (!spec_options){ spec_options = {}; }
    common_geom.max_depth = spec_options.max_depth ? spec_options.max_depth : 5;
    common_geom.allow_rectangles = spec_options.hasOwnProperty("allow_rectangles") ? spec_options.allow_rectangles : true;
    common_geom.allow_modes = spec_options.hasOwnProperty("allow_modes") ? spec_options.allow_modes : false;

    common_geom.xScale = d3.scale.linear()
        .domain(common_geom.xRange)
        .range([common_geom.horizontal_padding, common_geom.subplotWidth - common_geom.horizontal_padding]);



    function addConstraintSubplot(specification_string, variable_name) {

        // Group together data that is shared between all rectangles in a sub-plot
        var subplot_geom = {
            yRange: [100, 0],
            variable_name: variable_name,
            svg: svg.append("g").attr("transform", "translate(0, " + (subplotIndex * subplotHeight) + ")"), // TODO: rename this
            rectangles: []
        };

        subplot_geom.yScale = d3.scale.linear()
            .domain(subplot_geom.yRange)
            .range([common_geom.vertical_padding, common_geom.subplotHeight-common_geom.vertical_padding]);

        function menuOptions(){
            var menu_options = [];
            if (common_geom.allow_rectangles) {
                menu_options.push({
                    title: 'Add rectangle',
                    action: function () {
                        subplot_geom.rectangles.push(Rectangle(common_geom, subplot_geom))
                    },
                    disabled: common_geom.specification_fixed
                });
            }
            if (common_geom.allow_modes) {
                menu_options.push({
                    title: 'Add Mode',
                    action: function () {
                        subplot_geom.rectangles.push(Mode(common_geom, subplot_geom))
                    },
                    disabled: common_geom.specification_fixed
                })
            }
            return menu_options;
        }

        subplot_geom.svg
            .append("rect")
            .attr("x", common_geom.horizontal_padding)
            .attr("width", common_geom.subplotWidth - 2*common_geom.horizontal_padding)
            .attr("y", common_geom.vertical_padding)
            .attr("height", common_geom.subplotHeight - 2*common_geom.vertical_padding)
            .style("opacity", 0)
            .attr("class", "clickable-background")
            .on('contextmenu', d3.contextMenu(menuOptions));

        svg.attr("height", parseFloat(svg.attr("height")) + subplotHeight);


        var string = specification_string.toLowerCase().trim().replace(/ /g, '');

        drawAxes(common_geom, subplot_geom);
        addCommonElements(common_geom, subplot_geom);

        if (string){
            var rectangle_strings = string.split("&amp;&amp;");
            var diagram;
            for (var i = 0; i < rectangle_strings.length; i++) {
                diagram = addRectangleToSubplot(rectangle_strings[i], common_geom, subplot_geom);
                subplot_geom.rectangles.push(diagram);
            }
        }

        subplotIndex += 1;
        common_geom.variable_names.push(variable_name);
        common_geom.subplot_geoms.push(subplot_geom);
    }


    function addInputSubplot(specification_string, variable_name) {

        // Group together data that is shared between all rectangles in a sub-plot
        var subplot_geom = {
            yRange: [100, 0],
            variable_name: variable_name,
            svg: svg.append("g").attr("transform", "translate(0, " + (subplotIndex * subplotHeight) + ")"), // TODO: rename this
            rectangles: []
        };

        subplot_geom.yScale = d3.scale.linear()
            .domain(subplot_geom.yRange)
            .range([common_geom.vertical_padding, common_geom.subplotHeight-common_geom.vertical_padding]);


        // TODO: actually initialise populate from specification_string (and save?)

        svg.attr("height", parseFloat(svg.attr("height")) + subplotHeight);

        var string = specification_string.toLowerCase().trim().replace(/ /g, '');

        drawAxes(common_geom, subplot_geom);
        addCommonElements(common_geom, subplot_geom);

        drawInput(common_geom, subplot_geom);

        subplotIndex += 1;
        common_geom.variable_names.push(variable_name);
        common_geom.subplot_geoms.push(subplot_geom);
    }


    // TODO: getSpecString needs to handle all subplots
    return {getSpecString: getSpecString,
        addConstraintSubplot: addConstraintSubplot,
        addInputSubplot:addInputSubplot,
        getVariableNames: function(){ return common_geom.variable_names}};
}


function addRectangleToSubplot(string, common_geom, subplot_geom){
    if (!string){ return Rectangle(common_geom, subplot_geom); }

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
        return Rectangle(common_geom, subplot_geom, rectangle_opts);
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

    var diagram = Rectangle(common_geom, subplot_geom, rectangle_opts);

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