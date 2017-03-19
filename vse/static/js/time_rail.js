function create_bar(level, kind, geom, svg, newg, helper_funcs){
    // increase SVG height
    svg.attr("height", parseInt(svg.attr("height")) + geom.track_padding);

    var timing_parent_bar = false;

    // draw bar
    var start_time_pos = geom.horizontal_padding;
    var left_tick_pos = geom.horizontal_padding + 20;
    var right_tick_pos = geom.w - geom.horizontal_padding - 20;
    var base_y = geom.h + (level-2) * geom.track_padding ;

    var drag_track = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){

            if (geom.specification_fixed){ return; }

            var track_length = right_tick_pos - left_tick_pos;
            var mouse_pos = d3.mouse(svg.node())[0];

            var x1 = imposeLimits(0, geom.w - geom.horizontal_padding, mouse_pos - track_length/2);
            var x2 = imposeLimits(0, geom.w - geom.horizontal_padding, mouse_pos + track_length/2);

            if (x1 >= helper_funcs.getStartX()){
                x1 = helper_funcs.getStartX();
                x2 = right_tick_pos;
            } else if (x2 <= helper_funcs.getStartX()){
                x1 = left_tick_pos;
                x2 = helper_funcs.getStartX();
            }

            start_time_pos = start_time_pos + (x1 - left_tick_pos);
            left_tick_pos = x1;
            right_tick_pos = x2;

            track
                .attr("x1", left_tick_pos)
                .attr("x2", right_tick_pos);

            left_tick.attr("x1", left_tick_pos)
                .attr("x2", left_tick_pos);

            right_tick.attr("x1", right_tick_pos)
                .attr("x2", right_tick_pos);

            delay_line.attr("x2", left_tick_pos);

            helper_funcs.update_text();
        });

    var track = newg.append("line")
        .attr("x1", left_tick_pos)
        .attr("x2", right_tick_pos)
        .attr("y1", base_y)
        .attr("y2", base_y)
        .style("stroke", "rgb(128,128,128)")
        .style("stroke-width", "2")
        .style("stroke-dasharray", kind == "some" ? "5,5" : "5,0")
        .call(drag_track);

    var drag_left_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (geom.specification_fixed){ return; }

            left_tick_pos = imposeLimits(0, helper_funcs.getStartX(), d3.mouse(svg.node())[0]);

            track.attr("x1", left_tick_pos);
            left_tick.attr("x1", left_tick_pos)
                     .attr("x2", left_tick_pos);

            delay_line.attr("x2", left_tick_pos);

            helper_funcs.update_text();
        });

    var left_tick = newg.append("line")
        .attr("x1", left_tick_pos)
        .attr("x2", left_tick_pos)
        .attr("y1", base_y - geom.track_padding/2)
        .attr("y2", base_y + geom.track_padding/2)
        .style("stroke", "rgb(128,128,128)")
        .style("stroke-width", "2")
        .call(drag_left_tick);

    var drag_right_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (geom.specification_fixed){ return; }

            right_tick_pos = imposeLimits(helper_funcs.getStartX(), geom.w, d3.mouse(svg.node())[0]);

            track.attr("x2", right_tick_pos);
            right_tick.attr("x1", right_tick_pos)
                      .attr("x2", right_tick_pos);

            helper_funcs.update_text();
        });

    var right_tick = newg.append("line")
        .attr("x1", right_tick_pos)
        .attr("x2", right_tick_pos)
        .attr("y1", base_y - geom.track_padding/2)
        .attr("y2", base_y + geom.track_padding/2)
        .style("stroke", "rgb(128,128,128)")
        .style("stroke-width", "2")
        .call(drag_right_tick);

    var startline = newg.append("line")
        .attr("x1", start_time_pos)
        .attr("x2", start_time_pos)
        .attr("y1", base_y)
        .attr("y2", base_y + geom.track_padding)
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2");

    var helper_funcs_new = {
        getStartX: function () {
            return start_time_pos;
        },
        XToTime: helper_funcs.XToTime,
        update_text: helper_funcs.update_text
    };

    var append_bar = function(bar_kind){
        return function() {
            if (timing_parent_bar){
                timing_parent_bar.delete();
            }
            timing_parent_bar = create_bar(level + 1, bar_kind, geom, svg, newg, helper_funcs_new);
            helper_funcs.update_text();
        }
    };

    var remove_parent_bar = function() {
            if (timing_parent_bar){
                timing_parent_bar.delete();
                timing_parent_bar = false;
            }
        helper_funcs.update_text();
    };

    var menu = [
        {
            title: 'Constraint starts at fixed time',
            action: remove_parent_bar,
            disabled: false // optional, defaults to false
        },
        {
            title: 'Constraint applies at <i>some</i> time in range',
            action: append_bar('some')
        },
        {
            title: 'Constraint applies at <i>all</i> times in range',
            action: append_bar('all')
        }
    ];

    var drag_track_circle = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (geom.specification_fixed && !timing_parent_bar){
                return;
            }

            var start_line_length = left_tick_pos - start_time_pos;
            var track_length = right_tick_pos - left_tick_pos;

            var x_left = imposeLimits(helper_funcs.getStartX() - start_line_length - track_length, helper_funcs.getStartX() - start_line_length, d3.mouse(svg.node())[0]);
            if (timing_parent_bar) {
                x_left = imposeLimits(timing_parent_bar.get_start_time(), timing_parent_bar.get_end_time(), x_left);
            }

            left_tick_pos = left_tick_pos + (x_left - start_time_pos);
            right_tick_pos = right_tick_pos + (x_left - start_time_pos);
            start_time_pos = x_left;

            track.attr("x1", left_tick_pos)
                 .attr("x2", right_tick_pos);

            left_tick.attr("x1", left_tick_pos)
                .attr("x2", left_tick_pos);

            right_tick.attr("x1", right_tick_pos)
                .attr("x2", right_tick_pos);

            startline.attr("x1", start_time_pos)
                .attr("x2", start_time_pos);

            track_circle.attr("cx", start_time_pos);

            delay_line.attr("x1", start_time_pos)
                .attr("x2", left_tick_pos);

            helper_funcs.update_text();
        });

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("cx", start_time_pos)
        .attr("cy", base_y + geom.track_padding)
        .attr("r", 5)
        .attr("fill", "rgb(255,0,0)")
        .attr("fill-opacity", .5)
        .attr("id", "track_circle")
        .on('contextmenu', d3.contextMenu(menu))
        .call(drag_track_circle);


    var delay_line = newg.append("line")
        .attr("x1", start_time_pos)
        .attr("x2", left_tick_pos)
        .attr("y1", base_y)
        .attr("y2", base_y)
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2")
        .call(drag_track_circle);


    function delete_bar(){
        track.remove();
        left_tick.remove();
        right_tick.remove();
        startline.remove();
        track_circle.remove();
        delay_line.remove();
        svg.attr("height", parseInt(svg.attr("height")) - geom.track_padding);
        
        if (timing_parent_bar){
            timing_parent_bar.delete();
            timing_parent_bar = false;
        }
    }

    function get_start_time(){
        return left_tick_pos;
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
            t_lower = helper_funcs.XToTime(left_tick_pos) - helper_funcs.XToTime(start_time_pos);
            t_upper =  helper_funcs.XToTime(right_tick_pos) - helper_funcs.XToTime(start_time_pos);
        } else {
            // start and end times are absolute
            t_lower = helper_funcs.XToTime(left_tick_pos);
            t_upper = helper_funcs.XToTime(right_tick_pos);
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


    return {"track": track, "kind": kind, "delete": delete_bar, "level": level, "get_start_time": get_start_time,
        "get_end_time": get_end_time, append_bar: append_bar, getLatex: getLatex};
}