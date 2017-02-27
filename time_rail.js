function create_bar(level, kind, geom, svg, newg, helper_funcs){
    // increase SVG height
    svg.attr("height", parseInt(svg.attr("height")) + geom.track_padding);

    var timing_parent_bar = false;

    // draw bar
    var left_pos = geom.horizontal_padding + 20;
    var right_pos = geom.w - geom.horizontal_padding - 20;
    var base_y = geom.h + (level-2) * geom.track_padding ;

    var drag_track = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){

            var track_length = track.attr("x2") - track.attr("x1");
            var mouse_pos = d3.mouse(svg.node())[0];

            var x1 = imposeLimits(0, geom.w - geom.horizontal_padding, mouse_pos - track_length/2);
            var x2 = imposeLimits(0, geom.w - geom.horizontal_padding, mouse_pos + track_length/2);

            if (x1 >= helper_funcs.getStartX()){
                x1 = helper_funcs.getStartX();
                x2 = track.attr("x2");
            } else if (x2 <= helper_funcs.getStartX()){
                x1 = track.attr("x1");
                x2 = helper_funcs.getStartX();
            }

            track
                .attr("x1", x1)
                .attr("x2", x2);

            left_tick.attr("x1", x1)
                .attr("x2", x1);

            right_tick.attr("x1", x2)
                .attr("x2", x2);

            startline.attr("x1", x1)
                .attr("x2", x1);

            track_circle.attr("cx", x1);
        });

    var track = newg.append("line")
        .attr("x1", left_pos)
        .attr("x2", right_pos)
        .attr("y1", base_y)
        .attr("y2", base_y)
        .style("stroke", "rgb(128,128,128)")
        .style("stroke-width", "2")
        .style("stroke-dasharray", kind == "some" ? "5,5" : "5,0")
        .call(drag_track);

    var drag_left_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            var x_pos = imposeLimits(0, helper_funcs.getStartX(), d3.mouse(svg.node())[0]);

            track.attr("x1", x_pos);
            left_tick.attr("x1", x_pos);
            left_tick.attr("x2", x_pos);
            startline.attr("x1", x_pos)
                .attr("x2", x_pos);
            track_circle.attr("cx", x_pos);
        });

    var left_tick = newg.append("line")
        .attr("x1", left_pos)
        .attr("x2", left_pos)
        .attr("y1", base_y - geom.track_padding/2)
        .attr("y2", base_y + geom.track_padding/2)
        .style("stroke", "rgb(128,128,128)")
        .style("stroke-width", "2")
        .call(drag_left_tick);

    var drag_right_tick = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            var x_pos = imposeLimits(helper_funcs.getStartX(), geom.w, d3.mouse(svg.node())[0]);

            track.attr("x2", x_pos);
            right_tick.attr("x1", x_pos);
            right_tick.attr("x2", x_pos);
        });

    var right_tick = newg.append("line")
        .attr("x1", right_pos)
        .attr("x2", right_pos)
        .attr("y1", base_y - geom.track_padding/2)
        .attr("y2", base_y + geom.track_padding/2)
        .style("stroke", "rgb(128,128,128)")
        .style("stroke-width", "2")
        .call(drag_right_tick);

    var startline = newg.append("line")
        .attr("x1", left_pos)
        .attr("x2", left_pos)
        .attr("y1", base_y)
        .attr("y2", base_y + geom.track_padding)
        .style("stroke", "rgb(255,0,0)")
        .style("stroke-width", "2");


    // TODO: reduce duplication of menus ?

    var helper_funcs_new = {
        getStartX: function () {
            return track.attr("x1");
        }
    };

    var append_bar = function(bar_kind){
        return function() {
            if (timing_parent_bar){
                timing_parent_bar.delete();
            }
            timing_parent_bar = create_bar(level + 1, bar_kind, geom, svg, newg, helper_funcs_new);
        }
    };

    var remove_parent_bar = function() {
            if (timing_parent_bar){
                timing_parent_bar.delete();
                timing_parent_bar = false;
            }
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
            var x_left = imposeLimits(0, helper_funcs.getStartX(), d3.mouse(svg.node())[0]);
            var x_right = x_left + (track.attr("x2") - track.attr("x1"));

            track.attr("x1", x_left)
                 .attr("x2", x_right);

            left_tick.attr("x1", x_left)
                .attr("x2", x_left);

            right_tick.attr("x1", x_right)
                .attr("x2", x_right);

            startline.attr("x1", x_left)
                .attr("x2", x_left);

            track_circle.attr("cx", x_left);
        });

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("cx", left_pos)
        .attr("cy", base_y + geom.track_padding)
        .attr("r", 5)
        .attr("fill", "rgb(255,0,0)")
        .attr("fill-opacity", .5)
        .attr("id", "track_circle")
        .on('contextmenu', d3.contextMenu(menu))
        .call(drag_track_circle);



    function delete_bar(){
        track.remove();
        left_tick.remove();
        right_tick.remove();
        startline.remove();
        track_circle.remove();
        svg.attr("height", parseInt(svg.attr("height")) - geom.track_padding);
        
        if (timing_parent_bar){
            timing_parent_bar.delete();
            timing_parent_bar = false;
        }
    }

    function get_start_time(){
        return track.attr("x1");
    }

    function get_end_time(){
        return track.attr("x2");
    }

    
    return {"track": track, "kind": kind, "delete": delete_bar, "level": level, "get_start_time": get_start_time,
        "get_end_time": get_end_time, append_bar: append_bar};
}
