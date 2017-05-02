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

function addCommonElements(common_geom, rect){

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
                data: {"specification_string": spec_strings, "t_max": common_geom.xRange[1]},

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


                    d3.select(common_geom.div_name)
                        .select("#delete_trajectory_button")
                        .style("visibility", "visible");

                },
                error: function (result, textStatus) {
                }
            })
        }
    }

    var diagram_option = d3.select(common_geom.div_name)
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
            common_geom.svg.selectAll(".data-circle")
                .filter(function(d){ return d.dataset == dataset_name })
                .style("visibility",  this.checked ? 'visible' : 'hidden');

            common_geom.svg.selectAll(".data-path")
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

    var axis_range_div = diagram_option.append("div");
    var time_max_label = axis_range_div.append("label").attr("for", "time_max_input").text(" Max time ");
    var time_max_input = axis_range_div.append("input")
        .attr("id", "time_max")
        .attr("value", common_geom.xRange[1])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                common_geom.xRange[1] = parseFloat(this.value);
                rect.adjust_scales();
            }
        });

    var y_min_label = axis_range_div.append("label").attr("for", "y_min_input").text(" Min " + common_geom.variable_name);
    var y_min_input = axis_range_div.append("input")
        .attr("id", "y_max")
        .attr("value", common_geom.yRange[1])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                common_geom.yRange[1] = parseFloat(this.value);
                rect.adjust_scales();
            }
        });

    var y_max_label = axis_range_div.append("label").attr("for", "y_max_input").text(" Max " + common_geom.variable_name);
    var y_max_input = axis_range_div.append("input")
        .attr("id", "y_min")
        .attr("value", common_geom.yRange[0])
        .attr("length", "6")
        .on("change", function(){
            var val = parseFloat(this.value);
            if (!isNaN(val)){
                common_geom.yRange[0] = parseFloat(this.value);
                rect.adjust_scales();
            }
        });

    var example_plot_buttons_div = diagram_option.append("div");
    example_plot_buttons_div.append('button')
        .classed("btn", true).classed("btn-default", true).attr("type", "button")
        .text("Plot trajectory satisfying this constraint")
        .on("click", plotExampleTrajectory(false));  // TODO: fix

    example_plot_buttons_div.append('button')
        .classed("btn", true).classed("btn-default", true)
        .text("Plot trajectory satisfying all constraints")
        .on("click", plotExampleTrajectory(true));  // TODO: fix

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

}


function drawAxes(common_geom){
    var xAxis =  d3.svg.axis()
        .scale(common_geom.xScale)
        .orient("bottom");

    common_geom.svg.selectAll('.axis').remove();
    common_geom.svg.selectAll('.axis-label').remove();

    common_geom.svg.append("g")
        .call(xAxis)
        .attr("class", "axis")
        .attr("transform", "translate(0," + (common_geom.h - common_geom.vertical_padding) + ")");

    common_geom.svg
        .append("text")
        .classed("axis-label", true)
        .attr('x', -common_geom.h/2)
        .attr("y", 6)

        .attr("transform", "rotate(-90)")
        .attr("dy", ".75em")
        .text(common_geom.variable_name);

    var yAxis =  d3.svg.axis()
        .scale(common_geom.yScale)
        .orient("left");

    common_geom.svg.append("g")
        .call(yAxis)
        .attr("class", "axis")
        .attr("transform", "translate(" + (common_geom.horizontal_padding) + ", " + 0 + ")");
}

function add_subplot_from_specification(specification_string, div_name, spec_id, variable_name){
   // d3.select("#diagrams").append('div').attr("id", div_name);

    var diagram_div = d3.select('#' + div_name).select(".svg-container").append('div').classed("diagram-div", true);

    var svg = diagram_div.append("svg")
        .attr("width", 750)
        .attr("height", 450);

    var index = 1;
    div_name = "#" + div_name;

    var common_geom = {
        w: parseInt(svg.attr("width")),
        h: parseInt(svg.attr("height")),
        vertical_padding: 30,
        horizontal_padding: 60,
        track_padding: 20,
        specification_fixed: false,
        use_letters: false,

        colorScale: d3.scale.category10(),
        xRange: [0, 100],
        yRange: [100, 0],
        svg: svg,
        div_name: div_name,
        spec_id: spec_id,
        index: index,
        variable_name: variable_name,

        drawAxes: drawAxes
    };

    common_geom.xScale = d3.scale.linear()
        .domain(common_geom.xRange)
        .range([common_geom.horizontal_padding, common_geom.w - common_geom.horizontal_padding]);

    common_geom.yScale = d3.scale.linear()
        .domain(common_geom.yRange)
        .range([common_geom.vertical_padding, common_geom.h - common_geom.vertical_padding]);


    var string = specification_string.toLowerCase().trim().replace(/ /g, '');

    if (!string){ return Rectangle(common_geom); }

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
        return Rectangle(common_geom, rectangle_opts);
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

    var diagram = Rectangle(common_geom, rectangle_opts);

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

    drawAxes(common_geom);
    addCommonElements(common_geom, diagram);
    return diagram;
}
