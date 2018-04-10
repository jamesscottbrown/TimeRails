function create_bar(level, kind, common_geom, subplot_geom, rect_geom, options){

    var subplot_svg = subplot_geom.svg;
    var diagram_svg = common_geom.diagram_svg;

    var newg = subplot_svg.append("g").attr('class', "rail");
    
    var rail = {"track": track, "kind": kind, "delete": delete_bar, "level": level, "get_start_time": get_start_time,
        "get_end_time": get_end_time, set_parent_bar: set_parent_bar, getLatex: getLatex,
        getTimingParentBar: function(){return rail.timing_parent_bar;}, adjust_scales: adjust_scales,
        adjust_everything: adjust_everything,
        get_num_rails: function(){ return rail.timing_parent_bar ? (1 + rail.timing_parent_bar.get_num_rails()) : 0;},
        get_rail_height_absolute: function(){ return subplot_geom.yOffset + base_y; },
        children: [],
        track_circle_pos: common_geom.horizontal_padding,
        subplot: subplot_geom,

        timing_parent_bar: false,
        
        left_tick_pos: common_geom.horizontal_padding + 20,
        right_tick_pos: common_geom.w - common_geom.horizontal_padding - 20,
        
        toJSON: function () {
            // modify copy of this object that will be serialised to eliminate cyclic references
            var clone = Object.assign({}, rail);

            // N.B. .children stores only rectangles/modes (not other rails)
            clone.children = clone.children.map(function (n) {
                var subplot_index = common_geom.subplot_geoms.indexOf(n.subplot);
                var rectIndex = n.subplot.rectangles.indexOf(n);
                return {subplot_index: subplot_index, rect_index: rectIndex, kind: n.kind};
            });

            clone.timing_parent_bar = false;
            if (rail.timing_parent_bar){
                var subplot_index = common_geom.subplot_geoms.indexOf(rail.timing_parent_bar.subplot);
                var railIndex = rail.timing_parent_bar.subplot.rails.indexOf(rail.timing_parent_bar);
                clone.timing_parent_bar = {subplot_index: subplot_index, railIndex: railIndex, kind: rail.timing_parent_bar.kind};
            }

            clone.start_time = XToTime(rail.track_circle_pos);
            clone.left_tick_time = XToTime(rail.left_tick_pos);
            clone.right_tick_time = XToTime(rail.right_tick_pos);

            delete clone.subplot;
            return clone;
        }
        
    };

    var base_y;

    function TimeToX(time){
        return common_geom.xScale(time);
    }
    
    function XToTime(x){
        return common_geom.xScale.invert(x);
    }

    
    if (options){
        if (options.hasOwnProperty('start_time')) { rail.track_circle_pos = TimeToX(options.start_time); }
        if (options.hasOwnProperty('left_tick_time')) { rail.left_tick_pos = TimeToX(options.left_tick_time); }
        if (options.hasOwnProperty('right_tick_time')) { rail.right_tick_pos = TimeToX(options.right_tick_time); }
    }

    subplot_geom.shift_down();
    
    function getStartX(){
        var minStartX = +Infinity;
        var maxStartX = -Infinity;

        for (var i=0; i<rail.children.length; i++){
            minStartX = Math.min(minStartX, rail.children[i].track_circle_pos);
            maxStartX = Math.max(maxStartX, rail.children[i].track_circle_pos);
        }

        for (var i=0; i<common_geom.subplot_geoms.length; i++){
            var sg = common_geom.subplot_geoms[i];
            for (var j=0; j<sg.rails.length; j++){
                if (sg.rails[j].timing_parent_bar === rail){
                    console.log(i + ", " + j + ": " + sg.rails[j].track_circle_pos);
                    minStartX = Math.min(minStartX, sg.rails[j].track_circle_pos);
                    maxStartX = Math.max(maxStartX, sg.rails[j].track_circle_pos);
                }
            }
        }

        return [minStartX, maxStartX];
    }
    var minStartX, maxStartX;

    function adjust_everything(update_description){

        base_y = rect_geom.rail_height + (level - 1) * common_geom.track_padding;

        track
            .attr("x1", rail.left_tick_pos)
            .attr("x2", rail.right_tick_pos)
            .attr("y1", base_y)
            .attr("y2", base_y)
            .style("stroke-dasharray", kind == "some" ? "5,5" : "5,0");
        
        left_tick
            .attr("x1", rail.left_tick_pos)
            .attr("x2", rail.left_tick_pos)
            .attr("y1", base_y - common_geom.track_padding/2)
            .attr("y2", base_y + common_geom.track_padding/2);

        right_tick
            .attr("x1", rail.right_tick_pos)
            .attr("x2", rail.right_tick_pos)
            .attr("y1", base_y - common_geom.track_padding/2)
            .attr("y2", base_y + common_geom.track_padding/2);
            
        startline    
            .attr("x1", rail.track_circle_pos)
            .attr("x2", rail.track_circle_pos)
            .attr("y1", base_y)
            .attr("y2", base_y + common_geom.track_padding);
        
        delay_line
            .attr("x1", rail.track_circle_pos)
            .attr("x2", rail.left_tick_pos)
            .attr("y1", base_y)
            .attr("y2", base_y);
        
        track_circle
            .attr("cx", rail.track_circle_pos)
            .attr("cy", base_y + common_geom.track_padding);

        if (rail.timing_parent_bar){
            rail.timing_parent_bar.adjust_everything();
        }

        if (update_description){
            rect_geom.update_text();
        }
    }

    function adjust_scales(new_xScale){

        function convertX(x){
            return new_xScale(XToTime(x));
        }

        rail.track_circle_pos = convertX(rail.track_circle_pos);
        rail.left_tick_pos = convertX(rail.left_tick_pos);
        rail.right_tick_pos = convertX(rail.right_tick_pos);

        adjust_everything();

        if (rail.timing_parent_bar) {
            rail.timing_parent_bar.adjust_scales(new_xScale);
        }
    }

    // Callback functions for interactions
    var drag_track = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){

            if (common_geom.specification_fixed){ return; }

            var track_length = rail.right_tick_pos - rail.left_tick_pos;
            var mouse_pos = d3.mouse(subplot_svg.node())[0];

            var new_left_end = imposeLimits(rail.track_circle_pos, common_geom.w - common_geom.horizontal_padding, mouse_pos - track_length/2);
            var new_right_end = new_left_end + track_length;

            [minStartX, maxStartX] = getStartX();
            if (new_left_end >= minStartX){
                new_left_end = minStartX;
                new_right_end = rail.right_tick_pos;
            } else if (new_right_end <= maxStartX){
                new_left_end = rail.left_tick_pos;
                new_right_end = maxStartX;
            }

            rail.left_tick_pos = new_left_end;
            rail.right_tick_pos = new_right_end;
            adjust_everything(true);
        });

    var drag_left_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (common_geom.specification_fixed){ return; }

            [minStartX, maxStartX] = getStartX();
            rail.left_tick_pos = imposeLimits(rail.track_circle_pos, minStartX, d3.mouse(subplot_svg.node())[0]);
            adjust_everything(true);
        });


    var drag_right_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (common_geom.specification_fixed){ return; }

            [minStartX, maxStartX] = getStartX();
            rail.right_tick_pos = imposeLimits(maxStartX, common_geom.w, d3.mouse(subplot_svg.node())[0]);
            adjust_everything(true);
        });

    var drag_track_circle = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (common_geom.specification_fixed && !rail.timing_parent_bar){
                return;
            }

            var start_line_length = rail.left_tick_pos - rail.track_circle_pos;
            var track_length = rail.right_tick_pos - rail.left_tick_pos;

            [minStartX, maxStartX] = getStartX();
            var x_left = imposeLimits(maxStartX - start_line_length - track_length, minStartX - start_line_length, d3.mouse(subplot_svg.node())[0]);
            if (rail.timing_parent_bar) {
                x_left = imposeLimits(rail.timing_parent_bar.get_start_time(), rail.timing_parent_bar.get_end_time(), x_left);
            }

            rail.left_tick_pos = rail.left_tick_pos + (x_left - rail.track_circle_pos);
            rail.right_tick_pos = rail.right_tick_pos + (x_left - rail.track_circle_pos);
            rail.track_circle_pos = x_left;
            adjust_everything(true);
        });

    
    var set_parent_bar = function(bar_kind, options){
        // set the immediate parent of this bar

        return function() {
            if (rail.timing_parent_bar){
                rail.timing_parent_bar.delete();
            }
            rail.timing_parent_bar = create_bar(level + 1, bar_kind, common_geom, subplot_geom, rect_geom, options);
            common_geom.adjustAllRectangles(true);
            rect_geom.update_text();
        }
    };

    var remove_parent_bar = function() {
        if (rail.timing_parent_bar){
            rail.timing_parent_bar.delete();
            rail.timing_parent_bar = false;
        }
        common_geom.adjustAllRectangles(true);
        rect_geom.update_text();
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
            disabled: (level >= common_geom.max_depth)
        }];
    
        if (common_geom.allow_globally) {

            menu.push({
                title: 'Applies at <i>all</i> times in range',
                action: set_parent_bar('all'),
                disabled: (level >= common_geom.max_depth)
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
            if (!common_geom.selected_rail_to_add_to_rail){ return; }
            common_geom.selected_rail_to_add_to_rail.assign_parent_bar(rail);
            common_geom.selected_rail_to_add_to_rail.update_start_time();

            common_geom.selected_rail_to_add_to_rail.rail_height = base_y;
            common_geom.selected_rail_to_add_to_rail.adjust_everything(false);
        });

    // Externally exposed functions
    function delete_bar(){
        track.remove();
        left_tick.remove();
        right_tick.remove();
        startline.remove();
        track_circle.remove();
        delay_line.remove();

        diagram_svg.attr("height", parseInt(diagram_svg.attr("height")) - 2*common_geom.track_padding);

       // shift later (lower) subplots upwards
        for (var i=subplot_geom.subplot_index+1; i<common_geom.subplot_geoms.length; i++){
            var g = common_geom.subplot_geoms[i].svg;

            var transform = g.attr("transform");
            var p=transform.split(", ");

            var newTranslation =  parseInt(p[1].substring(0, p[1].length-1)) - 2*common_geom.track_padding;
            g.attr("transform", "translate(0, " + newTranslation + ")");
        }


        if (rail.timing_parent_bar){
            rail.timing_parent_bar.delete();
            rail.timing_parent_bar = false;
        }
    }

    function get_start_time(){
        return rail.left_tick_pos; // TODO: fix confusing naming here
    }

    function get_end_time(){
        return rail.right_tick_pos;
    }

    function getLatex(){
        var latex_string = "";
        var t_lower, t_upper;

        if (rail.timing_parent_bar){
            latex_string += rail.timing_parent_bar.getLatex();

            // start and end times are relative to te track_circle
            t_lower = XToTime(rail.left_tick_pos) - XToTime(rail.track_circle_pos);
            t_upper =  XToTime(rail.right_tick_pos) - XToTime(rail.track_circle_pos);
        } else {
            // start and end times are absolute
            t_lower = XToTime(rail.left_tick_pos);
            t_upper = XToTime(rail.right_tick_pos);
        }

        t_lower = t_lower.toFixed(2);
        t_upper = t_upper.toFixed(2);

        var symbol;
        if (kind == "some"){
            symbol = common_geom.use_letters ? ' F' : ' \\diamond';
        } else {
            symbol = common_geom.use_letters ? ' G' : ' \\square';
        }

        //         var symbol = use_letters ? ' G' : ' \\square';

        
        latex_string += symbol + "_{[" + t_lower + "," + t_upper + "]}";
        return latex_string;
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
            rect_geom.update_formula();
        });
    }

    function adjust_rail_values(){
        d3.select("#paramModal").remove();

        var modal_contents = d3.select(common_geom.div_name).append("div")
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

        var start_time = XToTime(rail.left_tick_pos) - XToTime(rail.track_circle_pos);
        var end_time = XToTime(rail.right_tick_pos) - XToTime(rail.track_circle_pos);

        var timeDiv = modalBody.append("div");
        timeDiv.append("text").text("From ");
        var startTimeBox = timeDiv.append("input").attr("value",  start_time.toFixed(2)).node();
        timeDiv.append("text").text(" to ");
        var endTimeBox = timeDiv.append("input").attr("value",  end_time.toFixed(2)).node();


        modalFooter.append("button").text("Save").on("click", function(){
            rail.left_tick_pos = TimeToX(parseFloat(startTimeBox.value) + XToTime(rail.track_circle_pos));
            rail.right_tick_pos = TimeToX(parseFloat(endTimeBox.value) + XToTime(rail.track_circle_pos));
            adjust_everything();
        })

        .attr("data-dismiss", "modal");
        modalFooter.append("button").text("Close").attr("data-dismiss", "modal");

        $('#paramModal').modal('toggle');
    }

    
    adjust_everything(true);
    common_geom.adjustAllRectangles();
    
    subplot_geom.rails.push(rail);
    return rail;
}
