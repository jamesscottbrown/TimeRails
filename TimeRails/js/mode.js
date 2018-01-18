
function Mode(common_geom, subplot_geom, options) {
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
        right_fixed: true,

        rect_top_left: 450 * 2/4,
        height_left: 200 * 0.75,
        width_left: 300 * 0.75,

        top_fixed_left: true,
        bottom_fixed_left: true,
        left_fixed_left: true,

        transition_max_pos: 450 / 3,
        transition_min_pos: 450 * 2/3,
        transition_marker_width: 10,

        followRectangle: false,
        rectangleIndex: subplot_geom.rectangles.length,
        start_line_visible: true,

        num_rails_above: 0,
        get_num_rails_above: get_num_rails_above,

        rail_height: 0,

        siblings: [],
        adjust_everything: adjust_everything,
        getYOffset: function(){ return subplot_geom.yOffset; },
        adjustSharedTimeLine: adjustSharedTimeLine
    };

    function get_num_rails_above(){
        rect_geom.num_rails_above = 0;
        for (var i=0; i<rect_geom.rectangleIndex; i++){
            rect_geom.num_rails_above += 1;
            rect_geom.num_rails_above += subplot_geom.rectangles[i].get_num_rails();
        }
        return rect_geom.num_rails_above;
    }

    var timing_parent_bar = false;

    function timeToX(time){
        return common_geom.xScale(time);
    }
    function XToTime(x){
        return common_geom.xScale.invert(x);
    }
    function valToY(val){
        return subplot_geom.yScale(val);
    }
    function YToVal(y) {
        return subplot_geom.yScale.invert(y);
    }

    var helper_funcs = {
        getStartX: function (){ return rect_geom.track_circle_pos; },
        XToTime: XToTime,
        TimeToX: function(time){ return common_geom.xScale(time); },
        update_text: update_text,
        update_formula: update_formula
    };

    if (options){
        if (options.hasOwnProperty('start_time') && options.hasOwnProperty('track_circle_time') && options.hasOwnProperty('end_time')){
            rect_geom.delay_line_length = common_geom.xScale(options.start_time) - common_geom.xScale(options.track_circle_time);
            rect_geom.start_time_pos = common_geom.xScale(options.start_time);
            rect_geom.track_circle_pos = common_geom.xScale(options.track_circle_time);
            rect_geom.width = common_geom.xScale(options.end_time) - common_geom.xScale(options.start_time);
        } else {
            rect_geom.left_fixed = false;
            rect_geom.right_fixed = false;

            rect_geom.delay_line_length = 0;
            rect_geom.start_time_pos = common_geom.xScale(common_geom.xRange[0]);
            rect_geom.track_circle_pos = common_geom.xScale(common_geom.xRange[0]);
            rect_geom.width = common_geom.xScale(common_geom.xRange[1]) - common_geom.xScale(common_geom.xRange[0]);

        }

        if (!options.hasOwnProperty('lt') || !options.lt) {
            rect_geom.top_fixed = false;
            options.lt = subplot_geom.yScale(subplot_geom.yRange[1]);
        }
        rect_geom.rect_top = subplot_geom.yScale(options.lt);

        if (!options.hasOwnProperty('gt') || !options.gt){
            rect_geom.bottom_fixed = false;
            options.lt = subplot_geom.yScale(subplot_geom.yRange[0]);
        }

        rect_geom.height = subplot_geom.yScale(options.gt) - subplot_geom.yScale(options.lt);
    }

    rect_geom.track_circle_pos = rect_geom.start_time_pos - rect_geom.delay_line_length;
    rect_geom.delay_line_height = rect_geom.rect_top + rect_geom.height/2;


    // Function that defines where each element will be positioned
    /************************************************/
    function adjust_everything(update_description){
        // We rely on: rect_geom.width, rect_geom.height, , common_geom.h

        var num_rails_above = get_num_rails_above();
        rect_geom.rail_height = subplot_geom.yScale.range()[1] + (num_rails_above) * common_geom.track_padding;

        if (parseInt(subplot_geom.svg.attr("height")) < rect_geom.rail_height + common_geom.vertical_padding){
            subplot_geom.svg.attr("height", rect_geom.rail_height + common_geom.vertical_padding)
        }

        // convenience quanities (redundant)
        rect_geom.delay_line_length = rect_geom.start_time_pos - rect_geom.track_circle_pos;

        // delay-line is drawn at height of bottom of the lower of the two rectangles to avoid clutter
        rect_geom.delay_line_height = Math.max(rect_geom.rect_top+rect_geom.height, rect_geom.rect_top_left+rect_geom.height_left);

        // move things
        dragbarleft_left.attr("cx", rect_geom.start_time_pos - rect_geom.width_left)
            .attr("cy", rect_geom.rect_top_left + rect_geom.height_left/2);

        dragbarright.attr("cx", rect_geom.start_time_pos + rect_geom.width)
            .attr("cy", rect_geom.rect_top + rect_geom.height/2);

        dragbartop.attr("cx", rect_geom.start_time_pos + (rect_geom.width / 2))
            .attr("cy", rect_geom.rect_top);

        dragbartop_left.attr("cx", rect_geom.start_time_pos - (rect_geom.width_left / 2))
            .attr("cy", rect_geom.rect_top_left);

        dragbarbottom.attr("cx", rect_geom.start_time_pos + (rect_geom.width / 2))
            .attr("cy", rect_geom.rect_top + rect_geom.height);

        dragbarbottom_left.attr("cx", rect_geom.start_time_pos - (rect_geom.width_left / 2))
            .attr("cy", rect_geom.rect_top_left + rect_geom.height_left);

        dragrect
            .attr("x", rect_geom.start_time_pos)
            .attr("y", rect_geom.rect_top)
            .attr("height", rect_geom.height)
            .attr("width", Math.max(rect_geom.width,1));

        dragrect_left
            .attr("x", rect_geom.start_time_pos - rect_geom.width_left)
            .attr("y", rect_geom.rect_top_left)
            .attr("height", rect_geom.height_left)
            .attr("width", Math.max(rect_geom.width_left,1));

        delay_line
            .attr("x1", rect_geom.track_circle_pos)
            .attr("x2", rect_geom.start_time_pos)
            .attr("y1", rect_geom.delay_line_height)
            .attr("y2", rect_geom.delay_line_height);

        startline.attr("x1", rect_geom.track_circle_pos)
            .attr("x2", rect_geom.track_circle_pos)
            .attr("y1", rect_geom.delay_line_height)
            .attr("y2", rect_geom.rail_height);

        track_circle.attr("cx", rect_geom.track_circle_pos)
                .attr("cy", rect_geom.rail_height);

        transition_marker_top
            .attr("cx", rect_geom.start_time_pos)
            .attr("cy", rect_geom.transition_max_pos);

        transition_marker_top_tick
            .attr("x1", rect_geom.start_time_pos - 7/2)
            .attr("x2", rect_geom.start_time_pos + 7/2)
            .attr("y1", rect_geom.transition_max_pos)
            .attr("y2", rect_geom.transition_max_pos);

        transition_marker_bottom
            .attr("cx", rect_geom.start_time_pos)
            .attr("cy", rect_geom.transition_min_pos);

        transition_marker_bottom_tick
            .attr("x1", rect_geom.start_time_pos - 7/2)
            .attr("x2", rect_geom.start_time_pos + 7/2)
            .attr("y1", rect_geom.transition_min_pos)
            .attr("y2", rect_geom.transition_min_pos);

        transition_marker_vertical
            .attr("x1", rect_geom.start_time_pos)
            .attr("x2", rect_geom.start_time_pos)
            .attr("y1", rect_geom.transition_min_pos)
            .attr("y2", rect_geom.transition_max_pos)


        if (timing_parent_bar){
            // may need to shift time bars vertically
            timing_parent_bar.adjust_everything();
        }

        if (update_description){
          update_text();
        }
        set_edges();
    }

    function update_start_time(){
        var min_y = subplot_geom.yOffset + rect_geom.rail_height;
        var max_y = min_y;


        for (var i=0; i<rect_geom.siblings.length; i++){
            var sibling = rect_geom.siblings[i];
            sibling.start_time_pos = rect_geom.start_time_pos;
            sibling.track_circle_pos = rect_geom.track_circle_pos;
            sibling.adjust_everything();

            var y = sibling.getYOffset() + sibling.rail_height;
            min_y = Math.min(min_y, y);
            max_y = Math.max(max_y, y);
        }


        for (var i=0; i<rect_geom.siblings.length; i++){
            rect_geom.siblings[i].adjustSharedTimeLine(min_y, max_y);
        }
        adjustSharedTimeLine(min_y, max_y);

    }

    function adjustSharedTimeLine (min_y, max_y){
        link_shared_times_line
            .attr("x1", rect_geom.track_circle_pos)
            .attr("x2", rect_geom.track_circle_pos)
            .attr("y1", min_y)
            .attr("y2", max_y);
    }

    function adjust_scales(new_xScale, new_yScale){

        function convertX(x){
            return new_xScale(common_geom.xScale.invert(x));
        }

        function convertY(y){
            return new_yScale(subplot_geom.yScale.invert(y));
        }

        // Adjust positions
        var leftPos = convertX(rect_geom.start_time_pos + rect_geom.width_left);
        var rightPos = convertX(rect_geom.start_time_pos + rect_geom.width);

        rect_geom.track_circle_pos = convertX(rect_geom.track_circle_pos);
        rect_geom.width =  rightPos - convertX(rect_geom.start_time_pos);
        rect_geom.start_time_pos = convertX(rect_geom.start_time_pos);

        rect_geom.width_left = leftPos - rect_geom.start_time_pos;
        rect_geom.height_left = convertY(rect_geom.rect_top_left + rect_geom.height_left) - convertY(rect_geom.rect_top_left);
        rect_geom.rect_top_left = convertY(rect_geom.rect_top_left);

        rect_geom.transition_max_pos = convertY(rect_geom.transition_max_pos);
        rect_geom.transition_min_pos = convertY(rect_geom.transition_min_pos);

        rect_geom.delay_line_height = convertY(rect_geom.delay_line_height);
        var bottom_pos =  convertY(rect_geom.height + rect_geom.rect_top);
        rect_geom.height = bottom_pos - convertY(rect_geom.rect_top);
        rect_geom.rect_top = convertY(rect_geom.rect_top);

        d3.select(common_geom.div_name).selectAll('.data-circle')
            .attr("cx", function(d){ return new_xScale(d.time); })
            .attr("cy", function(d){ return new_yScale(d.value); });

        d3.select(common_geom.div_name).selectAll(".example_line")
            .attr("x1", function(d){ return new_xScale(d.t1) })
            .attr("x2", function(d){ return new_xScale(d.t2) })
            .attr("y1", function(d){ return new_yScale(d.y) })
            .attr("y2", function(d){ return new_yScale(d.y) });

        d3.select(common_geom.div_name).selectAll(".example_circle")
            .attr("cx", function (d) {
                return new_xScale(d.t1)
            })
            .attr("cy", function (d) {
                return new_yScale(d.y)
            });

        d3.select(common_geom.div_name).selectAll(".example_box")
            .attr("x", function(d){ return new_xScale(d.t1) })
            .attr("width", function(d){ return new_xScale(d.t2) - new_xScale(d.t1) })
            .attr("y", function(d){ return new_yScale(d.y_max) })
            .attr("height", function(d){ return new_yScale(d.y_min) - new_yScale(d.y_max) });


        if (timing_parent_bar){
            timing_parent_bar.adjust_scales(new_xScale);
        }

        var new_data_line_generator = d3.svg.line()
        .x(function (d) { return new_xScale(d.time); })
        .y(function (d) { return new_yScale(d.value); });


        d3.select(common_geom.div_name).selectAll(".data-path")
            .attr("d", function(d){ return new_data_line_generator(d); });

        // Redraw
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

            var cursor_x = d3.mouse(subplot_geom.svg.node())[0];
            drag_track_circle_inner(cursor_x);
            adjust_everything(false);
        });


    function drag_track_circle_inner(cursor_x){
            var newx = imposeLimits(timeToX(0), common_geom.subplotWidth, cursor_x);

            if (timing_parent_bar) {
                newx = imposeLimits(timing_parent_bar.get_start_time() + rect_geom.delay_line_length,
                                    timing_parent_bar.get_end_time() + rect_geom.delay_line_length, newx);
            }

            var shift = newx - rect_geom.start_time_pos;
            rect_geom.track_circle_pos += shift;
            rect_geom.start_time_pos += shift;

            if (rect_geom.followRectangle){
                for (var i=0; i<subplot_geom.rectangles.length; i++){
                    if (i == subplot_geom.rectangleIndex){ continue; }

                    var other_rect = subplot_geom.rectangles[i].rect_geom;
                    other_rect.track_circle_pos += shift;
                    other_rect.start_time_pos += shift;
                    subplot_geom.rectangles[i].adjust_everything();
                }
            }
            update_start_time();
    }

    function drag_fixed() {
        // resize so edges remain on axes if necessary
        if (!rect_geom.left_fixed) {
            drag_resize_left_inner(rect_geom.start_time_pos, 0);
        }
        if (!rect_geom.right_fixed) {
            drag_resize_right_inner(rect_geom.start_time_pos, common_geom.subplotWidth);
        }
        if (!rect_geom.top_fixed) {
            drag_resize_top_inner(rect_geom.rect_top, 0);
        }
        if (!rect_geom.bottom_fixed) {
            drag_resize_bottom_inner(common_geom.subplotHeight);
        }
    }

    function dragmove(d) {
        if (common_geom.specification_fixed){ return; }

        // horizontal movement
        var rect_center = d3.mouse(subplot_geom.svg.node())[0] - rect_geom.width/2;

        if (rect_center < rect_geom.track_circle_pos){
            drag_track_circle_inner(rect_center);
        } else if (shift_down) {
            var new_start_pos = imposeLimits(rect_geom.track_circle_pos, common_geom.subplotWidth - rect_geom.width, rect_center);
            rect_geom.start_time_pos = new_start_pos;
        } else {

            var new_start_pos = imposeLimits(rect_geom.track_circle_pos, common_geom.subplotWidth - rect_geom.width, rect_center);

            if (timing_parent_bar) {
                new_start_pos = imposeLimits(timing_parent_bar.get_start_time()+rect_geom.delay_line_length, timing_parent_bar.get_end_time()+rect_geom.delay_line_length, new_start_pos);
            }

            rect_geom.track_circle_pos += (new_start_pos - rect_geom.start_time_pos);
            rect_geom.start_time_pos = new_start_pos;
        }
        update_start_time();

        // vertical movement
        var rect_center = d3.mouse(subplot_geom.svg.node())[1] - rect_geom.height/2;
        rect_geom.rect_top = imposeLimits(timeToX(0), common_geom.subplotHeight - rect_geom.height, rect_center);
        adjust_everything(true);
    }

    function dragmove_left(d) {
        if (common_geom.specification_fixed){ return; }

        // horizontal movement
        var oldRectCenter = rect_geom.start_time_pos - rect_geom.width_left/2;
        var rect_center = d3.mouse(subplot_geom.svg.node())[0] - rect_geom.width_left/2;

        var new_start_pos = rect_geom.start_time_pos + (rect_center - oldRectCenter);


        if (new_start_pos < rect_geom.track_circle_pos){
            drag_track_circle_inner(new_start_pos);
        } else if (shift_down) {
            var new_start_pos = imposeLimits(rect_geom.track_circle_pos, common_geom.subplotWidth - rect_geom.width, new_start_pos);
            rect_geom.start_time_pos = new_start_pos;
        } else {

            var new_start_pos = imposeLimits(rect_geom.track_circle_pos, common_geom.subplotWidth - rect_geom.width, new_start_pos);

            if (timing_parent_bar) {
                new_start_pos = imposeLimits(timing_parent_bar.get_start_time()+rect_geom.delay_line_length, timing_parent_bar.get_end_time()+rect_geom.delay_line_length, new_start_pos);
            }

            rect_geom.track_circle_pos += (new_start_pos - rect_geom.start_time_pos);
            rect_geom.start_time_pos = new_start_pos;
        }

        update_start_time();

        // vertical movement
        var rect_center = d3.mouse(subplot_geom.svg.node())[1] - rect_geom.height_left/2;
        rect_geom.rect_top_left = imposeLimits(timeToX(0), common_geom.subplotHeight - rect_geom.height, rect_center);

        adjust_everything(true);
    }

    function drag_resize_left_left(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.left_fixed) {
            return;
        }

        var oldx = rect_geom.start_time_pos - rect_geom.width_left;
        //Max x on the right is x + width - dragbarw
        //Max x on the left is 0 - (dragbarw/2)

        var cursor_x = d3.mouse(subplot_geom.svg.node())[0];
        var newx = imposeLimits(timeToX(0), rect_geom.start_time_pos, cursor_x);
        drag_resize_left_inner_left(oldx, newx);
    }

    function drag_resize_left_inner_left(oldx, newx) {
        rect_geom.width_left = rect_geom.width_left + (oldx - newx);

        adjust_everything(true);
    }


    function drag_resize_right(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.right_fixed) {
            return;
        }

        //Max x on the left is x - width
        //Max x on the right is width of screen + (dragbarw/2)
        var cursor_x = d3.mouse(subplot_geom.svg.node())[0];
        var dragx = imposeLimits(rect_geom.start_time_pos, common_geom.subplotWidth, cursor_x);
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
        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        var newy = imposeLimits(timeToX(0), rect_geom.rect_top + rect_geom.height - (rect_geom.dragbarw / 2), cursor_y);
        drag_resize_top_inner(oldy, newy);
    }

    function drag_resize_top_inner(oldy, newy) {
        rect_geom.rect_top = newy;
        rect_geom.height = rect_geom.height + (oldy - newy);
        adjust_everything(true);
    }

    function drag_resize_top_left(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.top_fixed_left) {
            return;
        }

        var oldy = rect_geom.rect_top_left;
        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        var newy = imposeLimits(timeToX(0), rect_geom.rect_top_left + rect_geom.height_left - (rect_geom.dragbarw / 2), cursor_y);
        drag_resize_top_inner_left(oldy, newy);
    }

    function drag_resize_top_inner_left(oldy, newy) {
        rect_geom.rect_top_left = newy;
        rect_geom.height_left = rect_geom.height_left + (oldy - newy);
        adjust_everything(true);
    }



    function drag_resize_bottom(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.bottom_fixed) {
            return;
        }

        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        var newy = imposeLimits(rect_geom.rect_top + (rect_geom.dragbarw / 2), common_geom.subplotHeight, cursor_y);

        drag_resize_bottom_inner(newy);
    }

    function drag_resize_bottom_inner(newy) {
        //recalculate width
        rect_geom.height = newy - rect_geom.rect_top;
        adjust_everything(true);
    }

    function drag_resize_bottom_left(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.bottom_fixed_left) {
            return;
        }

        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        var newy = imposeLimits(rect_geom.rect_top_left + (rect_geom.dragbarw / 2), common_geom.subplotHeight, cursor_y);

        drag_resize_bottom_inner_left(newy);
    }

    function drag_resize_bottom_inner_left(newy) {
        //recalculate width
        rect_geom.height_left = newy - rect_geom.rect_top_left;
        adjust_everything(true);
    }



    function drag_transition_marker_top() {
        if (common_geom.specification_fixed){ return; }

        // shift y
        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        rect_geom.transition_max_pos = imposeLimits(timeToX(0), rect_geom.transition_min_pos, cursor_y);

        // shift x
        var oldx = rect_geom.start_time_pos;
        var cursor_x = d3.mouse(subplot_geom.svg.node())[0];
        var newx = imposeLimits(rect_geom.track_circle_pos, rect_geom.start_time_pos + rect_geom.width, cursor_x);
        newx = imposeLimits(common_geom.xScale.range()[0], common_geom.xScale.range()[1], newx);

        if (timing_parent_bar) {
            newx = imposeLimits(timing_parent_bar.get_start_time()+rect_geom.delay_line_length, timing_parent_bar.get_end_time()+rect_geom.delay_line_length, newx);
        }

        if (!shift_down){
            rect_geom.track_circle_pos += (newx - rect_geom.start_time_pos);
        }

        rect_geom.width_left = Math.min(rect_geom.width_left, rect_geom.start_time_pos - timeToX(0));
        rect_geom.width = Math.min(rect_geom.width, common_geom.xScale.range()[1] - rect_geom.start_time_pos);

        drag_resize_left_inner(oldx, newx);
        update_start_time();
    }

    function drag_transition_marker_bottom() {
        if (common_geom.specification_fixed){ return; }

        // shift y
        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        rect_geom.transition_min_pos = imposeLimits(rect_geom.transition_max_pos, common_geom.subplotHeight, cursor_y);


        // shift x
        var oldx = rect_geom.start_time_pos;
        var cursor_x = d3.mouse(subplot_geom.svg.node())[0];
        var newx = imposeLimits(rect_geom.track_circle_pos, rect_geom.start_time_pos + rect_geom.width, cursor_x);
        newx = imposeLimits(common_geom.xScale.range()[0], common_geom.xScale.range()[1], newx);

        if (timing_parent_bar) {
            newx = imposeLimits(timing_parent_bar.get_start_time()+rect_geom.delay_line_length, timing_parent_bar.get_end_time()+rect_geom.delay_line_length, newx);
        }

        if (!shift_down){
            rect_geom.track_circle_pos += (newx - rect_geom.start_time_pos);
        }

        rect_geom.width_left = Math.min(rect_geom.width_left, rect_geom.start_time_pos - timeToX(0));
        rect_geom.width = Math.min(rect_geom.width, common_geom.xScale.range()[1] - rect_geom.start_time_pos);

        drag_resize_left_inner(oldx, newx);
        update_start_time();
    }

    function drag_resize_left_inner(oldx, newx) {
        rect_geom.start_time_pos = newx;

        adjust_everything(true);
    }






    // Context menus and associated functions
    /************************************************/
    var menu = function() {

        var menuOptions = [
            {
                title: 'Constraint starts at fixed time',
                action: function (elm, d, i) {
                    if (timing_parent_bar) {
                        timing_parent_bar.delete();
                        timing_parent_bar = false;
                        common_geom.adjustAllRectangles();
                        update_text();
                    }
                },
                disabled: false // optional, defaults to false
            },
            {
                title: 'Constraint applies at <i>some</i> time in range',
                action: function (elm, d, i) {
                    if (timing_parent_bar) {
                        timing_parent_bar.delete();
                    }
                    timing_parent_bar = create_bar(1, 'some', common_geom, subplot_geom, rect_geom, placeholder_form, newg, helper_funcs);
                    update_text();
                },
                disabled: (common_geom.max_depth <= 1)
            },
            {
                title: 'Constraint applies at <i>all</i> times in range',
                action: function (elm, d, i) {
                    if (timing_parent_bar) {
                        timing_parent_bar.delete();
                    }
                    timing_parent_bar = create_bar(1, 'all', common_geom, subplot_geom, rect_geom, placeholder_form, newg, helper_funcs);
                    update_text();
                },
                disabled: (common_geom.max_depth <= 1)
            },

            {
                divider: true
            },
            {
                title: 'Eventually-Always',
                action: function (elm, d, i) {
                    if (timing_parent_bar) {
                        timing_parent_bar.delete();
                    }
                    timing_parent_bar = create_bar(1, 'all', common_geom, subplot_geom, rect_geom, placeholder_form, newg, helper_funcs);
                    timing_parent_bar.set_parent_bar('some')();
                    update_text();
                }
            },
            {
                title: 'Always-Eventually',
                action: function (elm, d, i) {
                    if (timing_parent_bar) {
                        timing_parent_bar.delete();
                    }
                    timing_parent_bar = create_bar(1, 'some', common_geom, subplot_geom, rect_geom, placeholder_form, newg, helper_funcs);
                    timing_parent_bar.set_parent_bar('all')();
                    update_text();
                }
            }];

        if (common_geom.allow_shared_times) {
            menuOptions.push({
                divider: true
            });

            menuOptions.push({
                title: 'Link start times',
                action: function (elm, d, i) {
                    if (timing_parent_bar) {
                        timing_parent_bar.delete();
                    }

                    common_geom.selected_rail = rect_geom;
                },
                disabled: rect_geom.siblings.length > 0
            });
            menuOptions.push({
                title: 'Make start time independent',
                action: function (elm, d, i) {

                    // remove this rectangle from sibling list of other rectangles
                    for (var i = 0; i < rect_geom.siblings.length; i++) {
                        var index = rect_geom.siblings[i].siblings.indexOf(rect_geom);
                        rect_geom.siblings[i].siblings.splice(index, 1);
                    }

                    // remove from self
                    rect_geom.siblings = [];
                },
                disabled: rect_geom.siblings.length === 0
            });

        }
        return menuOptions;
    };

    function rclick_left() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.left_fixed = !rect_geom.left_fixed;

        if (!rect_geom.left_fixed) {
            drag_resize_left_inner(rect_geom.start_time_pos, 0);
        }

        set_edges();
        return false;
    }

    function rclick_left_left() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.left_fixed_left = !rect_geom.left_fixed_left;

        if (!rect_geom.left_fixed_left) {
            drag_resize_left_inner(rect_geom.start_time_pos_left, 0);
        }

        set_edges();
        return false;
    }

    function rclick_right() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.right_fixed = !rect_geom.right_fixed;
        if (!rect_geom.right_fixed) {
            drag_resize_right_inner(rect_geom.start_time_pos, common_geom.subplotWidth);
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

  function rclick_top_left() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.top_fixed_left = !rect_geom.top_fixed_left;
        if (!rect_geom.top_fixed_left) {
            drag_resize_top_inner_left(rect_geom.rect_top_left, 0);
        }
        set_edges();
    }

    function rclick_bottom() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.bottom_fixed = !rect_geom.bottom_fixed;
        if (!rect_geom.bottom_fixed) {
            drag_resize_bottom_inner(common_geom.subplotHeight);
        }
        set_edges();
    }

    function rclick_bottom_left () {
        if (common_geom.specification_fixed){ return; }

        rect_geom.bottom_fixed_left  = !rect_geom.bottom_fixed_left ;
        if (!rect_geom.bottom_fixed_left ) {
            drag_resize_bottom_inner_left (common_geom.subplotHeight);
        }
        set_edges();
    }

    // Actually create visual elements
    /************************************************/
    d3.select(common_geom.div_name).select(".space-div").style("width", common_geom.subplotWidth + "px");

    var placeholder_form = d3.select(common_geom.div_name).select(".placeholder-form")
                            .append('div')
                            .classed(".rect-" + rect_geom.rectangleIndex, true)
        .classed("single-rect-spec", true);
    var placeholder_latex = d3.select(common_geom.div_name).select(".placeholder-latex");
    var placeholder_latex_formula = placeholder_latex.append("div");

    var options_form = d3.select(common_geom.div_name).append("div").classed("space-div", true).append("form");

    var newg = subplot_geom.svg.append("g");

    // we draw these lines before the dragrect to improve carity when rectangle is very thin
    var delay_line = newg.append("line").classed("red-line", true);

    var startline = newg.append("line").classed("red-line", true);

    // This line spans subplots, so can't be added to the group holding this subplot
    var link_shared_times_line = common_geom.diagram_svg.select("#linking-line-div")
        .append("line")
        .style("opacity", "0.1")
        .classed("red-line", true)
        .call(drag_track_circle);


    var dragrect_left = newg.append("rect")
        .attr("id", "active")
        .attr("fill", "lightgreen")
        .attr("fill-opacity", .25)
        .attr("cursor", "move")
        .call(d3.behavior.drag()
            .origin(Object)
            .on("drag", dragmove_left))
        .on('mousedown', function(d) {
          shift_down = d3.event.shiftKey;
        })
        .on('mouseup', function(d) {
            shift_down = false;
        });


    var rectMenu =
        function () {
            return [{
                title: function () {
                    return 'Adjust values';
                },
                action: adjust_rect_values,
                disabled: common_geom.specification_fixed
            },{
                title: function () {
                    return rect_geom.start_line_visible ? "Hide start line" : "Show start line"
                },
                action: toggle_start_line_visibility
            },{
                title: function () {
                    return rect_geom.followRectangle ? 'Stop other rectangles following' : 'Make other rectangles follow';
                },
                action: function () {
                    rect_geom.followRectangle = !rect_geom.followRectangle;
                }
            },{
                title: function () {
                    return 'Delete mode';
                },
                action: deleteRectangle,
                disabled: common_geom.specification_fixed
            }];
        };


    var shift_down = false;
    var dragrect = newg.append("rect")
        .attr("id", "active")
        .attr("fill", "lightgreen")
        .attr("fill-opacity", .25)
        .attr("cursor", "move")
        .call(d3.behavior.drag()
            .origin(Object)
            .on("drag", dragmove))
        .on('mousedown', function(d) {
          shift_down = d3.event.shiftKey;
        })
        .on('mouseup', function(d) {
            shift_down = false;
        });


    dragrect.on('contextmenu', d3.contextMenu(rectMenu));
    dragrect_left.on('contextmenu', d3.contextMenu(rectMenu));

    var dragbarleft_left = newg.append("circle")
        .attr("id", "dragleftleft")
        .attr("r", rect_geom.dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ew-resize")
        .call(
            d3.behavior.drag()
            .origin(Object)
            .on("drag", drag_resize_left_left)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return rect_geom.left_fixed_left ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_left_left
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

    var dragbartop_left = newg.append("circle")
        .attr("r", rect_geom.dragbarw / 2)
        .attr("id", "dragtopleft")
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ns-resize")
        .call(
            d3.behavior.drag()
            .origin(Object)
            .on("drag", drag_resize_top_left)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return rect_geom.top_fixed_left ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_top_left
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

    var dragbarbottom_left = newg.append("circle")
        .attr("id", "dragbottomleft")
        .attr("r", rect_geom.dragbarw / 2)
        .attr("fill", "lightgray")
        .attr("fill-opacity", .5)
        .attr("cursor", "ns-resize")
        .call( d3.behavior.drag()
        .origin(Object)
        .on("drag", drag_resize_bottom_left)
        ).on('contextmenu', d3.contextMenu([{
            title: function(){
                return rect_geom.bottom_fixed_left ? 'Remove limit' : 'Apply limit';
            },
            action: rclick_bottom_left
        }]));

    var transition_marker_top = newg.append("circle")
        .attr("fill", "lightgray")
        .classed("transition_marker", true)
        .attr("r", 7)
        .attr("cursor", "move")
        .call(
            d3.behavior.drag()
                .origin(Object)
                .on("drag", drag_transition_marker_top)
        )
        .on('mousedown', function(d) {
          shift_down = d3.event.shiftKey;
        })
        .on('mouseup', function(d) {
            shift_down = false;
        });
;

    var transition_marker_top_tick = newg.append("line").style("stroke", "black");

    var transition_marker_bottom = newg.append("circle")
        .attr("fill", "lightgray")
        .classed("transition_marker", true)
        .attr("r", 7)
        .attr("cursor", "move")
        .call(
            d3.behavior.drag()
                .origin(Object)
                .on("drag", drag_transition_marker_bottom)
        )
        .on('mousedown', function(d) {
          shift_down = d3.event.shiftKey;
        })
        .on('mouseup', function(d) {
            shift_down = false;
        });
    var transition_marker_bottom_tick = newg.append("line").style("stroke", "black");
    var transition_marker_vertical = newg.append("line").style("stroke", "black");

    var track_circle = newg
        .append("g")
        .append("circle")
        .attr("r", 7)
        .style("cursor", "move")
        .classed("track_circle", true)
        .on('contextmenu', d3.contextMenu(menu))
        .on("click", link_rail_times)
        .call(drag_track_circle);

    function link_rail_times(){
        // the menu ensures that common_geom.selected_rail has no siblings, but this rectangle might already

        if (!common_geom.selected_rail){ return; }
        if (common_geom.selected_rail == rect_geom){ common_geom.selected_rail = false; return; }

        // add new mode to the sibling list of all of this mode's siblings
        for (var i=0; i<rect_geom.siblings.length; i++){
            rect_geom.siblings[i].siblings.push(common_geom.selected_rail);
        }

        // copy this mode's siblings to new mode's sibling list
        for (var i=0; i<rect_geom.siblings.length; i++){
            common_geom.selected_rail.siblings.push(rect_geom.siblings[i]);
        }

        // add new mode to the sibling list of this mode
        rect_geom.siblings.push(common_geom.selected_rail);

        // add this mode to sibling list of new node
        common_geom.selected_rail.siblings.push(rect_geom);

        update_start_time();

        common_geom.selected_rail = false;
    }

    function toggle_start_line_visibility(){

        if (timing_parent_bar){ return; }

        rect_geom.start_line_visible = !rect_geom.start_line_visible;

        var visibility_string = rect_geom.start_line_visible ? "visible" : "hidden";
        track_circle.style("visibility", visibility_string);
        startline.style("visibility", visibility_string);
        delay_line.style("visibility", visibility_string);
    }

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

        // now do the same thing for rect-left (for which the right side is always fixed)
        dragrect_left.style("stroke", "black");

        // 4 edges:
        if (rect_geom.top_fixed_left && rect_geom.bottom_fixed_left && rect_geom.left_fixed_left) {
            dragrect_left.style("stroke-dasharray", [rect_geom.width_left + rect_geom.height_left + rect_geom.width_left + rect_geom.height_left].join(','));
        }

        // 3 edges
        else if (rect_geom.top_fixed_left && rect_geom.bottom_fixed_left ) {
            dragrect_left.style("stroke-dasharray", [rect_geom.width_left + rect_geom.height_left + rect_geom.width_left, rect_geom.height_left].join(','));
        } else if (rect_geom.top_fixed_left && rect_geom.left_fixed_left) {
            dragrect_left.style("stroke-dasharray", [rect_geom.width_left + rect_geom.height_left, rect_geom.width_left, rect_geom.height_left].join(','));
        } else if (rect_geom.bottom_fixed_left && rect_geom.left_fixed_left) {
            dragrect_left.style("stroke-dasharray", [0, (rect_geom.width_left), rect_geom.height_left + rect_geom.width_left + rect_geom.height_left].join(','));
        }

        // 2 edges
        else if (rect_geom.top_fixed_left) {
            dragrect_left.style("stroke-dasharray", [rect_geom.width_left + rect_geom.height_left, rect_geom.width_left + rect_geom.height_left].join(','));
        } else if (rect_geom.bottom_fixed_left) {
            dragrect_left.style("stroke-dasharray", [0, rect_geom.width_left, rect_geom.height_left + rect_geom.width_left, rect_geom.height_left].join(','));
        } else if (rect_geom.left_fixed_left) {
            dragrect_left.style("stroke-dasharray", [0, rect_geom.width_left, rect_geom.height_left, rect_geom.width_left, rect_geom.height_left].join(','));
        }

        // 1 edges
        else {
            dragrect.style("stroke-dasharray", [0, (rect_geom.width_left + rect_geom.height_left + rect_geom.width_left), rect_geom.height_left].join(','));
        }

        update_text();
    }


    // Describing selected region
    /************************************************/

    function update_formula(){
        var latex_string =  get_latex_string();
        placeholder_latex_formula.html("$" + latex_string + "$");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    }

    function get_latex_string(){

        var latex_string = "";
        var start_time = XToTime(rect_geom.start_time_pos - rect_geom.width_left);
        var mid_time = XToTime(rect_geom.start_time_pos);
        var end_time = XToTime(rect_geom.start_time_pos + rect_geom.width);

        if (timing_parent_bar) {
            latex_string = timing_parent_bar.getLatex();

            start_time -= XToTime(rect_geom.track_circle_pos);
            mid_time -= XToTime(rect_geom.track_circle_pos);
            end_time -= XToTime(rect_geom.track_circle_pos);
        }

        start_time = start_time.toFixed(2);
        mid_time = mid_time.toFixed(2);
        end_time = end_time.toFixed(2);

        var y1 = "(" + YToVal(rect_geom.rect_top_left + rect_geom.height_left).toFixed(2) + "< x_" + common_geom.index + "<" + YToVal(rect_geom.rect_top_left).toFixed(2) + ")";
        var y2 = "(" + YToVal(rect_geom.transition_min_pos).toFixed(2) + "< x_" + common_geom.index + "<" + YToVal(rect_geom.transition_max_pos).toFixed(2) + ")";
        var y3 = "(" + YToVal(rect_geom.rect_top + rect_geom.height).toFixed(2) + "< x_" + common_geom.index + "<" + YToVal(rect_geom.rect_top).toFixed(2) + ")";

        var symbol = common_geom.use_letters ? ' G' : ' \\square';

        return latex_string + symbol + "_{[" + start_time + "," + mid_time + "]}" + y1
            + "\\wedge " + symbol + "_{[" + mid_time + "," + mid_time + "]}" + y2
            + "\\wedge " + symbol + "_{[" + mid_time + "," + end_time+ "]}" + y3
            + "";
    }

    function update_text() {

        function create_initial_bar (kind){
            timing_parent_bar = create_bar(1, kind, common_geom, subplot_geom, rect_geom, placeholder_form, newg, helper_funcs);
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
        describe_constraint(timing_parent_bar, subplot_geom.variable_name, placeholder_form, rect_geom, update_functions);

        update_formula();
    }


    // functions for generating specification to save

    function getSpecString(){
        var spec_string = "";
        var shift = 0;

        if (timing_parent_bar){
            spec_string = timing_parent_bar.getSpecString();
            var shift = XToTime(rect_geom.start_time_pos) - XToTime(rect_geom.track_circle_pos);
        }

        var startTime = XToTime(rect_geom.start_time_pos - rect_geom.width_left) - shift;
        var midTime = XToTime(rect_geom.start_time_pos) - shift;
        var endTime = common_geom.right_fixed ? (rect_geom.start_time_pos + rect_geom.width) - shift : Infinity;

        var startMin = common_geom.top_fixed_left ? (rect_geom.rect_top_left + rect_geom.height_left) : Infinity;
        var startMax = common_geom.bottom_fixed_left ? (rect_geom.rect_top_left) : -Infinity;
        var midMin = YToVal(rect_geom.transition_max_pos);
        var midMax = YToVal(rect_geom.transition_min_pos);
        var endMin = common_geom.top_fixed ? YToVal(rect_geom.rect_top + rect_geom.height) : Infinity;
        var endMax = common_geom.bottom_fixed ? (rect_geom.rect_top) : -Infinity;

        var values = [startTime, midTime, endTime, startMin, startMax, midMin, midMax, endMin, endMax];
        var modeString = "Mode(" + values.join(",") + ")";

        return spec_string + modeString;
    }

    function add_timing_bar(kind, options){
        // create timing-bar, and set it as immediate parent of rectangle
        // kind is 'some' or 'all'

        if (timing_parent_bar){
            timing_parent_bar.set_parent_bar(kind, options)();
        } else {
            timing_parent_bar = create_bar(1, kind, common_geom, subplot_geom, rect_geom, placeholder_form, newg, helper_funcs, options);
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


    function deleteRectangle(){

         if (timing_parent_bar) {
             timing_parent_bar.delete();
         }

        dragbarleft_left.remove();
        dragbarright.remove();
        dragbartop.remove();
        dragbartop_left.remove();
        dragbarbottom.remove();
        dragbarbottom_left.remove();
        dragrect.remove();
        dragrect_left.remove();
        delay_line.remove();
        startline.remove();
        track_circle.remove();
        transition_marker_bottom.remove();
        transition_marker_bottom_tick.remove();
        transition_marker_top.remove();
        transition_marker_top_tick.remove();
        transition_marker_vertical.remove();

        subplot_geom.rectangles.splice(rect_geom.rectangleIndex, 1);
        for (var i=0; i<subplot_geom.rectangles; i++){
            subplot_geom.rectangles[i].saveRectangleIndex(i);
        }

        // loop through sibling rectangles, removing their reference to this rectangle
        for (var i=0; i<rect_geom.siblings.length; i++){
            var sibling = rect_geom.siblings[i];

            var index = sibling.siblings.indexOf(rect_geom);
            sibling.siblings.splice(index, 1);

            sibling.update_start_time();
        }

        // remove this rectangle's shared time line
        link_shared_times_line.remove();

        // delete description
        placeholder_latex_formula.remove();
        placeholder_form.remove();
        common_geom.adjustAllRectangles();
    }

    function adjust_rect_values(){
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

        var shift = 0;
        if (timing_parent_bar) {
            shift = XToTime(rect_geom.start_time_pos) - XToTime(rect_geom.track_circle_pos);
        }

        var startTime = XToTime(rect_geom.start_time_pos - rect_geom.width_left) - shift;
        var midTime = XToTime(rect_geom.start_time_pos) - shift;
        var endTime = XToTime(rect_geom.start_time_pos + rect_geom.width) - shift;

        var startDiv = modalBody.append("div");
        startDiv.append("text").text("From ");
        var startTimeBox = startDiv.append("input").attr("value", startTime.toFixed(2)).node();
        startDiv.append("text").text(" to ");
        var midTimeBox = startDiv.append("input").attr("value", midTime.toFixed(2)).node();
        startDiv.append("text").text(", value is between");
        var minValBox_left = startDiv.append("input").attr("value", YToVal(rect_geom.rect_top_left + rect_geom.height_left).toFixed(2)).node();
        startDiv.append("text").text(" and ");
        var maxValBox_left = startDiv.append("input").attr("value", YToVal(rect_geom.rect_top_left).toFixed(2)).node();
        startDiv.append("text").text(".");

        var midDiv = modalBody.append("div");
        midDiv.append("text").text("Then value is momentarily between ");
        var minValBox_mid = midDiv.append("input").attr("value", YToVal(rect_geom.transition_max_pos).toFixed(2)).node();
        midDiv.append("text").text(" and ");
        var maxValBox_mid = midDiv.append("input").attr("value", YToVal(rect_geom.transition_min_pos).toFixed(2)).node();
        midDiv.append("text").text(".");

        var endDiv = modalBody.append("div");
        endDiv.append("text").text("Then value is between ");
        var minValBox_right = endDiv.append("input").attr("value", YToVal(rect_geom.rect_top + rect_geom.height).toFixed(2)).node();
        endDiv.append("text").text(" and ");
        var maxValBox_right = endDiv.append("input").attr("value", YToVal(rect_geom.rect_top).toFixed(2)).node();
        endDiv.append("text").text(" until ");
        var endTimeBox = endDiv.append("input").attr("value", endTime.toFixed(2)).node();
        endDiv.append("text").text(".");


        modalFooter.append("button").text("Save").on("click", function () {

            rect_geom.width_left = timeToX(parseFloat(midTimeBox.value)) - timeToX(parseFloat(startTimeBox.value));
            rect_geom.height_left = valToY(parseFloat(minValBox_left.value)) - valToY(parseFloat(maxValBox_left.value));
            rect_geom.rect_top_left = valToY(parseFloat(maxValBox_left.value));

            rect_geom.start_time_pos = timeToX(parseFloat(midTimeBox.value) + shift);
            rect_geom.transition_max_pos = valToY(parseFloat(maxValBox_mid.value));
            rect_geom.transition_min_pos = valToY(parseFloat(minValBox_mid.value));

            rect_geom.width = timeToX(parseFloat(endTimeBox.value)) - timeToX(parseFloat(midTimeBox.value));
            rect_geom.height = valToY(parseFloat(minValBox_right.value)) - valToY(parseFloat(maxValBox_right.value));
            rect_geom.rect_top = valToY(parseFloat(maxValBox_right.value));

            adjust_everything(true);
            update_start_time();
        })

            .attr("data-dismiss", "modal");
        modalFooter.append("button").text("Close").attr("data-dismiss", "modal");

        $('#paramModal').modal('toggle');
    }


    adjust_everything(true);
    return {add_bar: append_timing_bar, getSpecString: getSpecString, adjust_scales: adjust_scales,
            adjust_everything: adjust_everything, rect_geom: rect_geom,
            saveRectangleIndex: function(index){rect_geom.rectangleIndex = index;},
            update_formula: update_formula,
            get_num_rails: function (){ return timing_parent_bar ? (1 + timing_parent_bar.get_num_rails()) : 0; },
            get_num_rails_above: get_num_rails_above,
            deleteRectangle: deleteRectangle,
            update_start_time: update_start_time
            }
}