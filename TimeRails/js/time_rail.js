function create_bar(level, kind, geom, subplot_geom, rectGeom, placeholder_form, newg, helper_funcs, options){

    var subplot_svg = subplot_geom.svg;
    var diagram_svg = geom.diagram_svg;

    var timing_parent_bar = false;

    
    var rail = {"track": track, "kind": kind, "delete": delete_bar, "level": level, "get_start_time": get_start_time,
        "get_end_time": get_end_time, set_parent_bar: set_parent_bar, getLatex: getLatex,
        describe_constraint: describe_constraint,
        getTimingParentBar: function(){return timing_parent_bar;}, adjust_scales: adjust_scales,
        adjust_everything: adjust_everything,
        get_num_rails: function(){ return timing_parent_bar ? (1 + timing_parent_bar.get_num_rails()) : 0;},
        get_rail_height_absolute: function(){ return subplot_geom.yOffset + base_y; },
        children: [],
        track_circle_pos: geom.horizontal_padding,
        subplot: subplot_geom,

        toJSON: function () {
            // modify copy of this object that will be serialised to eliminate cyclic references
            var clone = Object.assign({}, rail);

            // N.B. .children stores only rectangles/modes (not other rails)
            clone.children = clone.children.map(function (n) {
                var subplot_index = geom.subplot_geoms.indexOf(n.subplot);
                var rectIndex = n.subplot.rectangles.indexOf(n);
                return {subplot_index: subplot_index, rect_index: rectIndex, kind: n.kind};
            });

            clone.timing_parent_bar = false;
            if (timing_parent_bar){
                var subplot_index = geom.subplot_geoms.indexOf(timing_parent_bar.subplot);
                var railIndex = timing_parent_bar.subplot.rails.indexOf(timing_parent_bar);
                clone.timing_parent_bar = {subplot_index: subplot_index, railIndex: railIndex, kind: timing_parent_bar.kind};
            }

            delete clone.subplot;
            return clone;
        }
    };

        
    var left_tick_pos = geom.horizontal_padding + 20;
    var right_tick_pos = geom.w - geom.horizontal_padding - 20;
    var base_y;

    function TimeToX(time){
        return geom.xScale(time);
    }
    
    function XToTime(x){
        return geom.xScale.invert(x);
    }

    
    if (options){
        if (options.hasOwnProperty('start_time')) { rail.track_circle_pos = TimeToX(options.start_time); }
        if (options.hasOwnProperty('left_tick_time')) { left_tick_pos = TimeToX(options.left_tick_time); }
        if (options.hasOwnProperty('right_tick_time')) { right_tick_pos = TimeToX(options.right_tick_time); }
    }

    // increase SVG height
    diagram_svg.attr("height", parseInt(diagram_svg.attr("height")) + 2*geom.track_padding);

       // shift later (lower) subplots downwards
    for (var i=subplot_geom.subplot_index+1; i<geom.subplot_geoms.length; i++){
        var g = geom.subplot_geoms[i].svg;

        var transform = g.attr("transform");
        var p=transform.split(", ");

        var newTranslation =  parseInt(p[1].substring(0, p[1].length-1)) + 2*geom.track_padding;
        g.attr("transform", "translate(0, " + newTranslation + ")");
    }

    function getStartX(){
        var minStartX = +Infinity;
        var maxStartX = -Infinity;

        for (var i=0; i<rail.children.length; i++){
            minStartX = Math.min(minStartX, rail.children[i].track_circle_pos);
            maxStartX = Math.max(maxStartX, rail.children[i].track_circle_pos);
        }

        // TODO: other bars need to be stored as children, not just rect/mode
        // TODO: we need to expose rail.track_circle_pos from bar

        return [minStartX, maxStartX];
    }
    var minStartX, maxStartX;

    function adjust_everything(update_description){

        base_y = rectGeom.rail_height + (level - 1) * geom.track_padding;

        track
            .attr("x1", left_tick_pos)
            .attr("x2", right_tick_pos)
            .attr("y1", base_y)
            .attr("y2", base_y)
            .style("stroke-dasharray", kind == "some" ? "5,5" : "5,0");
        
        left_tick
            .attr("x1", left_tick_pos)
            .attr("x2", left_tick_pos)
            .attr("y1", base_y - geom.track_padding/2)
            .attr("y2", base_y + geom.track_padding/2);

        right_tick
            .attr("x1", right_tick_pos)
            .attr("x2", right_tick_pos)
            .attr("y1", base_y - geom.track_padding/2)
            .attr("y2", base_y + geom.track_padding/2);
            
        startline    
            .attr("x1", rail.track_circle_pos)
            .attr("x2", rail.track_circle_pos)
            .attr("y1", base_y)
            .attr("y2", base_y + geom.track_padding);
        
        delay_line
            .attr("x1", rail.track_circle_pos)
            .attr("x2", left_tick_pos)
            .attr("y1", base_y)
            .attr("y2", base_y);
        
        track_circle
            .attr("cx", rail.track_circle_pos)
            .attr("cy", base_y + geom.track_padding);

        if (timing_parent_bar){
            timing_parent_bar.adjust_everything();
        }

        if (update_description){
            helper_funcs.update_text();
        }
    }

    function adjust_scales(new_xScale){

        function convertX(x){
            return new_xScale(XToTime(x));
        }

        rail.track_circle_pos = convertX(rail.track_circle_pos);
        left_tick_pos = convertX(left_tick_pos);
        right_tick_pos = convertX(right_tick_pos);

        adjust_everything();

        if (timing_parent_bar) {
            timing_parent_bar.adjust_scales(new_xScale);
        }
    }

    // Callback functions for interactions
    var drag_track = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){

            if (geom.specification_fixed){ return; }

            var track_length = right_tick_pos - left_tick_pos;
            var mouse_pos = d3.mouse(subplot_svg.node())[0];

            var new_left_end = imposeLimits(rail.track_circle_pos, geom.w - geom.horizontal_padding, mouse_pos - track_length/2);
            var new_right_end = new_left_end + track_length;

            [minStartX, maxStartX] = getStartX();
            if (new_left_end >= minStartX){
                new_left_end = minStartX;
                new_right_end = right_tick_pos;
            } else if (new_right_end <= maxStartX){
                new_left_end = left_tick_pos;
                new_right_end = maxStartX;
            }

            left_tick_pos = new_left_end;
            right_tick_pos = new_right_end;
            adjust_everything(true);
        });

    var drag_left_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (geom.specification_fixed){ return; }

            [minStartX, maxStartX] = getStartX();
            left_tick_pos = imposeLimits(rail.track_circle_pos, minStartX, d3.mouse(subplot_svg.node())[0]);
            adjust_everything(true);
        });


    var drag_right_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (geom.specification_fixed){ return; }

            [minStartX, maxStartX] = getStartX();
            right_tick_pos = imposeLimits(maxStartX, geom.w, d3.mouse(subplot_svg.node())[0]);
            adjust_everything(true);
        });

    var drag_track_circle = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (geom.specification_fixed && !timing_parent_bar){
                return;
            }

            var start_line_length = left_tick_pos - rail.track_circle_pos;
            var track_length = right_tick_pos - left_tick_pos;

            [minStartX, maxStartX] = getStartX();
            var x_left = imposeLimits(maxStartX - start_line_length - track_length, minStartX - start_line_length, d3.mouse(subplot_svg.node())[0]);
            if (timing_parent_bar) {
                x_left = imposeLimits(timing_parent_bar.get_start_time(), timing_parent_bar.get_end_time(), x_left);
            }

            left_tick_pos = left_tick_pos + (x_left - rail.track_circle_pos);
            right_tick_pos = right_tick_pos + (x_left - rail.track_circle_pos);
            rail.track_circle_pos = x_left;
            adjust_everything(true);
        });


    // Context menus and associated functions
    var helper_funcs_new = {
        update_text: helper_funcs.update_text,
        update_formula: helper_funcs.update_formula
    };

    var set_parent_bar = function(bar_kind, options){
        // set the immediate parent of this bar

        return function() {
            if (timing_parent_bar){
                timing_parent_bar.delete();
            }
            timing_parent_bar = create_bar(level + 1, bar_kind, geom, subplot_geom, rectGeom, placeholder_form, newg, helper_funcs_new, options);
            geom.adjustAllRectangles(true);
            helper_funcs.update_text();
        }
    };

    var remove_parent_bar = function() {
        if (timing_parent_bar){
            timing_parent_bar.delete();
            timing_parent_bar = false;
        }
        geom.adjustAllRectangles(true);
        helper_funcs.update_text();
    };

    var menu = [
        {
            title: 'Starts at fixed time',
            action: remove_parent_bar,
            disabled: false // optional, defaults to false
        },
        {
            title: 'Applies at <i>some</i> time in range',
            action: set_parent_bar('some'),
            disabled: (level >= geom.max_depth)
        }];
    
        if (geom.allow_globally) {

            menu.push({
                title: 'Applies at <i>all</i> times in range',
                action: set_parent_bar('all'),
                disabled: (level >= geom.max_depth)
            });
        }
                
        menu.push({
				divider: true
        });

        menu.push({
            title: 'Adjust values',
            action: adjust_rail_values
        });



    // Actual visual elements
    var track = newg.append("line").classed("grey-line", true)
        .call(drag_track);

    var left_tick = newg.append("line").classed("grey-line", true)
        .style("cursor", "ew-resize")
        .call(drag_left_tick);

    var right_tick = newg.append("line").classed("grey-line", true)
        .style("cursor", "ew-resize")
        .call(drag_right_tick);

    var startline = newg.append("line").classed("red-line", true);

    var delay_line = newg.append("line").classed("red-line", true)
        .call(drag_track_circle);

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("r", 7)
        .style("cursor", "move")
        .classed("track_circle", true)
        .on('contextmenu', d3.contextMenu(menu))
        .call(drag_track_circle)
        .on("click", function(){
            if (!geom.selected_rail_to_add_to_rail){ return; }
            geom.selected_rail_to_add_to_rail.assign_parent_bar(rail);
            geom.selected_rail_to_add_to_rail.update_start_time();
        });

    // Externally exposed functions
    function delete_bar(){
        track.remove();
        left_tick.remove();
        right_tick.remove();
        startline.remove();
        track_circle.remove();
        delay_line.remove();

        diagram_svg.attr("height", parseInt(diagram_svg.attr("height")) - 2*geom.track_padding);

       // shift later (lower) subplots upwards
        for (var i=subplot_geom.subplot_index+1; i<geom.subplot_geoms.length; i++){
            var g = geom.subplot_geoms[i].svg;

            var transform = g.attr("transform");
            var p=transform.split(", ");

            var newTranslation =  parseInt(p[1].substring(0, p[1].length-1)) - 2*geom.track_padding;
            g.attr("transform", "translate(0, " + newTranslation + ")");
        }


        if (timing_parent_bar){
            timing_parent_bar.delete();
            timing_parent_bar = false;
        }
    }

    function get_start_time(){
        return left_tick_pos; // TODO: fix confusing naming here
    }

    function get_end_time(){
        return right_tick_pos;
    }

    function getLatex(){
        var latex_string = "";
        var t_lower, t_upper;

        if (timing_parent_bar){
            latex_string += timing_parent_bar.getLatex();

            // start and end times are relative to te track_circle
            t_lower = XToTime(left_tick_pos) - XToTime(rail.track_circle_pos);
            t_upper =  XToTime(right_tick_pos) - XToTime(rail.track_circle_pos);
        } else {
            // start and end times are absolute
            t_lower = XToTime(left_tick_pos);
            t_upper = XToTime(right_tick_pos);
        }

        t_lower = t_lower.toFixed(2);
        t_upper = t_upper.toFixed(2);

        var symbol;
        if (kind == "some"){
            symbol = geom.use_letters ? ' F' : ' \\diamond';
        } else {
            symbol = geom.use_letters ? ' G' : ' \\square';
        }

        //         var symbol = use_letters ? ' G' : ' \\square';

        
        latex_string += symbol + "_{[" + t_lower + "," + t_upper + "]}";
        return latex_string;
    }
    
    function describe_constraint (){

        var time_number;
        if (timing_parent_bar) {
            time_number = timing_parent_bar.describe_constraint();
        } else {
            time_number = 0;
        }

        var newDiv = placeholder_form.append("div").classed("spec-row", true);

        newDiv.append("text").text("For ");

        getSomeAllSelect(newDiv);

        var s1 = " t_ " + (time_number + 1) + " between ";
        var s2 = (time_number > 0) ? "t_" + time_number + "+" : "";

        newDiv.append("text").text(s1 + s2);

        var start_time = XToTime(left_tick_pos) - XToTime(rail.track_circle_pos);

        newDiv.append("input")
            .classed("spec_menu", true)
            .attr("value", start_time.toFixed(2))
            .attr("size", "6")
            .on("change", function (){
                left_tick_pos = TimeToX(parseFloat(this.value) + XToTime(rail.track_circle_pos));
                adjust_everything();
            });

        newDiv.append("text").text(" and " + s2);

        var end_time = XToTime(right_tick_pos) - XToTime(rail.track_circle_pos);
        newDiv.append("input")
            .classed("spec_menu", true)
            .attr("value", end_time.toFixed(2))
            .attr("size", "6")
            .on("change", function (){
                right_tick_pos = TimeToX(parseFloat(this.value) + XToTime(rail.track_circle_pos));
                adjust_everything();
            });

        return time_number + 1;
    }

    function getSomeAllSelect (newDiv){
        var select = newDiv.append("select").classed("spec_menu", true);

        var some_time = select.append("option").text("some time");
        var all_time = select.append("option").text("all times");

        if (kind == "some"){
            some_time.attr("selected", "selected");
        } else {
            all_time.attr("selected", "selected");
        }

        select.on("change", function(){
            kind = this.value.startsWith("all") ? "all" : "some";
            adjust_everything();
            helper_funcs.update_formula();
        });
    }

    function adjust_rail_values(){
        d3.select("#paramModal").remove();

        var modal_contents = d3.select(placeholder_form.node().parentNode.parentNode).append("div")
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

        var start_time = XToTime(left_tick_pos) - XToTime(rail.track_circle_pos);
        var end_time = XToTime(right_tick_pos) - XToTime(rail.track_circle_pos);

        var timeDiv = modalBody.append("div");
        timeDiv.append("text").text("From ");
        var startTimeBox = timeDiv.append("input").attr("value",  start_time.toFixed(2)).node();
        timeDiv.append("text").text(" to ");
        var endTimeBox = timeDiv.append("input").attr("value",  end_time.toFixed(2)).node();


        modalFooter.append("button").text("Save").on("click", function(){
            left_tick_pos = TimeToX(parseFloat(startTimeBox.value) + XToTime(rail.track_circle_pos));
            right_tick_pos = TimeToX(parseFloat(endTimeBox.value) + XToTime(rail.track_circle_pos));
            adjust_everything();
        })

        .attr("data-dismiss", "modal");
        modalFooter.append("button").text("Close").attr("data-dismiss", "modal");

        $('#paramModal').modal('toggle');
    }

    
    adjust_everything(true);
    geom.adjustAllRectangles();
    
    subplot_geom.rails.push(rail);
    return rail;
}
