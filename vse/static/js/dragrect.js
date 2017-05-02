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

    if (!string){ return Rectangle(svg, common_geom, div_name, spec_id, index, variable_name); }

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
        return Rectangle(svg, common_geom, div_name, spec_id, index, variable_name, rectangle_opts);
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

    var diagram = Rectangle(svg, common_geom, div_name, spec_id, index, variable_name, rectangle_opts);

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
