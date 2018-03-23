
function Mode(common_geom, subplot_geom, options) {
    // Setting up scales and initial default positions
    /************************************************/
    var rect_geom = {
        kind: "mode",

        width: 300 * 0.75,
        height: 200 * 0.75,
        dragbarw: 20,

        delay_line_length: 0,

        rect_top: 450 / 2,
        start_time_pos: 750 / 2,

        top_fixed: true,
        bottom_fixed: true,
        left_fixed: true,
        right_fixed: true,

        followRectangle: (options && options.hasOwnProperty("followRectangle")) ? options.followRectangle : false,
        rectangleIndex: subplot_geom.rectangles.length,
        start_line_visible: (options && options.hasOwnProperty("start_line_visible")) ? options.followRectangle : true,

        num_rails_above: 0,
        get_num_rails_above: get_num_rails_above,

        rail_height: 0,

        siblings: [],
        followers: [],
        sharedEndTimes: [],
        following: (options && options.hasOwnProperty("following")) ? options.following : false,
        startTimeIsBound: (options && options.hasOwnProperty("startTimeIsBound")) ? options.startTimeIsBound : true,
        endTimeIsBound: (options && options.hasOwnProperty("endTimeIsBound")) ? options.endTimeIsBound : false,

        update_text: update_text,
        update_formula: update_formula,

        adjust_everything: adjust_everything,
        getYOffset: function(){ return subplot_geom.yOffset; },
        adjustSharedTimeLine: adjustSharedTimeLine,
        update_start_time: update_start_time,

        setTimingBar: function(newBar){

            // remove self from timing_parent_bar's list of children
            if (timing_parent_bar){
                var index = timing_parent_bar.children.indexOf(rect_geom);
                timing_parent_bar.children.splice(index, 1);
            }

             if (timing_parent_bar && timing_parent_bar.children.length === 0) {
                 timing_parent_bar.delete();
             }

            timing_parent_bar = newBar;
            update_text();

            if (newBar){
                // newBar may be false (rather than a bar)
                newBar.children.push(rect_geom);
            }
        },

        subplot: subplot_geom,
        assign_parent_bar: assign_parent_bar
    };

    subplot_geom.shift_down();

    function assign_parent_bar(bar){
        for (var i=0; i < rect_geom.siblings.length; i++){
            rect_geom.siblings[i].setTimingBar(bar);
        }

        rect_geom.setTimingBar(bar);
    }

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
    

    if (options){
        if (options.hasOwnProperty('start_time_pos') && options.hasOwnProperty('track_circle_pos')){
            rect_geom.delay_line_length = options.delay_line_length;
            rect_geom.start_time_pos = options.start_time_pos;
            rect_geom.track_circle_pos = options.track_circle_pos;
            rect_geom.width = options.width;
            rect_geom.height = options.height;
            rect_geom.rect_top = options.rect_top;
        }

        rect_geom.height = options.height;
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

        rect_geom.delay_line_height = rect_geom.rect_top+rect_geom.height;

        // move things
        dragbarright.attr("cx", rect_geom.start_time_pos + rect_geom.width)
            .attr("cy", rect_geom.rect_top + rect_geom.height/2);

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
            .attr("y2", rect_geom.rail_height)
            .style("visibility", (rect_geom.startTimeIsBound && !rect_geom.following) ? 'visible' : 'hidden');

        endline.attr("x1", rect_geom.track_circle_pos + rect_geom.width)
            .attr("x2", rect_geom.track_circle_pos + rect_geom.width)
            .attr("y1", rect_geom.delay_line_height)
            .attr("y2", rect_geom.rail_height)
            .style("visibility", rect_geom.endTimeIsBound ? 'visible' : 'hidden');

        track_circle.attr("cx", rect_geom.track_circle_pos)
            .attr("cy", rect_geom.rail_height)
            .style("visibility", (rect_geom.startTimeIsBound && !rect_geom.following) ? 'visible' : 'hidden');

        end_circle.attr("cx", rect_geom.track_circle_pos + rect_geom.width)
                .attr("cy", rect_geom.rail_height)
                .style("visibility", rect_geom.endTimeIsBound ? 'visible' : 'hidden')
                .style("visibility", rect_geom.endTimeIsBound ? 'visible' : 'hidden');

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


        if (rect_geom.siblings.length === 0 && !rect_geom.following){
            adjustSharedTimeLine(0, 0); // hide line as a point
            return;
        } else if (rect_geom.following){
            return; // line is adjusted by update_end_time
        }

        for (var i=0; i<rect_geom.siblings.length; i++){
            var sibling = rect_geom.siblings[i];
            sibling.track_circle_pos = rect_geom.track_circle_pos; // bring track_circles into line
            sibling.start_time_pos = sibling.track_circle_pos + sibling.delay_line_length; // preserve delay line length

            sibling.adjust_everything();

            var y = sibling.getYOffset() + sibling.rail_height;
            min_y = Math.min(min_y, y);
            max_y = Math.max(max_y, y);
        }

        if (timing_parent_bar){
            min_y = Math.min(min_y, timing_parent_bar.get_rail_height_absolute());
            max_y = Math.max(max_y, timing_parent_bar.get_rail_height_absolute());
        }

        for (var i=0; i<rect_geom.siblings.length; i++){
            rect_geom.siblings[i].adjustSharedTimeLine(min_y, max_y);
        }

        adjustSharedTimeLine(min_y, max_y);
    }

    function update_end_time(){
        updateFollowers(rect_geom);

        // adjust shared end time
        var min_y = subplot_geom.yOffset + rect_geom.rail_height;
        var max_y = min_y;

        for (var i=0; i<rect_geom.sharedEndTimes.length; i++){
            var otherMode = rect_geom.sharedEndTimes[i];

            var y = otherMode.getYOffset() + otherMode.rail_height;
            min_y = Math.min(min_y, y);
            max_y = Math.max(max_y, y);
        }

        for (var i=0; i<rect_geom.sharedEndTimes.length; i++){
            var linkedMode = rect_geom.sharedEndTimes[i];
            linkedMode.width = rect_geom.width;
            linkedMode.track_circle_pos = rect_geom.track_circle_pos;
            linkedMode.start_time_pos = rect_geom.start_time_pos;

            linkedMode.adjustSharedEndTimeLine(min_y, max_y);
            linkedMode.adjust_everything();

            updateFollowers(linkedMode);
        }

        adjustSharedEndTimeLine(min_y, max_y);
    }

    function updateFollowers(rectangle){
        for (var i=0; i<rectangle.followers.length; i++){
            var follower = rectangle.followers[i];

            // Shared time-line goes from this mode to what it is following
            follower.track_circle_pos = rectangle.start_time_pos + rectangle.width;
            follower.start_time_pos = rectangle.start_time_pos + rectangle.width;

            var rail_height = subplot_geom.yOffset + rectangle.rect_top + rectangle.height;
            var follower_rail_height = follower.getYOffset() + follower.rail_height;

            follower.update_end_time();
            follower.adjustSharedTimeLine(rail_height, follower_rail_height);
            follower.adjust_everything();
        }

    }

    function adjustSharedTimeLine (min_y, max_y){
        link_shared_times_line
            .attr("x1", rect_geom.track_circle_pos)
            .attr("x2", rect_geom.track_circle_pos)
            .attr("y1", min_y)
            .attr("y2", max_y);
    }

    function adjustSharedEndTimeLine(min_y, max_y){
        shared_end_times_line
            .attr("x1", rect_geom.track_circle_pos + rect_geom.width)
            .attr("x2", rect_geom.track_circle_pos + rect_geom.width)
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
        var rightPos = convertX(rect_geom.start_time_pos + rect_geom.width);

        rect_geom.track_circle_pos = convertX(rect_geom.track_circle_pos);
        rect_geom.width =  rightPos - convertX(rect_geom.start_time_pos);
        rect_geom.start_time_pos = convertX(rect_geom.start_time_pos);

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
            if (rect_geom.following){ return; }

            var cursor_x = d3.mouse(subplot_geom.svg.node())[0];
            drag_track_circle_inner(cursor_x);
            adjust_everything(false);
        });

    function drag_track_circle_inner(cursor_x){
            var newx = imposeLimits(timeToX(0), common_geom.xScale.range()[1], cursor_x);

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
            update_end_time();
    }

    var drag_end_circle = d3.behavior.drag()
        .origin(Object)
        .on("drag", function(){
            if (common_geom.specification_fixed){
                return;
            }

            var cursor_x = d3.mouse(subplot_geom.svg.node())[0];
            drag_end_circle_inner(cursor_x);
            adjust_everything(false);
        });

    function drag_end_circle_inner(cursor_x){
            var newx = imposeLimits(timeToX(0), common_geom.xScale.range()[1], cursor_x);
            rect_geom.width = newx - rect_geom.start_time_pos;
            adjust_everything();
            update_end_time();
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

        if (rect_geom.following){ rect_center =rect_geom.track_circle_pos; }

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
        update_end_time();

        // vertical movement
        var rect_center = d3.mouse(subplot_geom.svg.node())[1] - rect_geom.height/2;
        rect_geom.rect_top = imposeLimits(subplot_geom.yScale.range()[0], subplot_geom.yScale.range()[1] - rect_geom.height, rect_center);
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
        var dragx = imposeLimits(rect_geom.start_time_pos, common_geom.xScale.range()[1], cursor_x);
        drag_resize_right_inner(rect_geom.start_time_pos, dragx);
    }

    function drag_resize_right_inner(oldx_left, newx_right) {
        rect_geom.width = newx_right - oldx_left;
        adjust_everything(true);
        update_end_time();
    }


    function drag_resize_top(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.top_fixed) {
            return;
        }

        var oldy = rect_geom.rect_top;
        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        var newy = imposeLimits(subplot_geom.yScale.range()[0], rect_geom.rect_top + rect_geom.height - (rect_geom.dragbarw / 2), cursor_y);
        drag_resize_top_inner(oldy, newy);
    }

    function drag_resize_top_inner(oldy, newy) {
        rect_geom.rect_top = newy;
        rect_geom.height = rect_geom.height + (oldy - newy);
        adjust_everything(true);
    }


    function drag_resize_bottom(d) {
        if (common_geom.specification_fixed){ return; }

        if (!rect_geom.bottom_fixed) {
            return;
        }

        var cursor_y = d3.mouse(subplot_geom.svg.node())[1];
        var newy = imposeLimits(rect_geom.rect_top + (rect_geom.dragbarw / 2), subplot_geom.yScale.range()[1], cursor_y);

        drag_resize_bottom_inner(newy);
    }

    function drag_resize_bottom_inner(newy) {
        //recalculate width
        rect_geom.height = newy - rect_geom.rect_top;
        adjust_everything(true);
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
                title: 'Starts at fixed time',
                action: function (elm, d, i) {
                    if (timing_parent_bar) {
                        assign_parent_bar(false);
                        common_geom.adjustAllRectangles();
                    }
                },
                disabled: false // optional, defaults to false
            }];

            if (common_geom.max_depth > 0) {
                menuOptions.push({
                    title: 'Applies at <i>some</i> time in range',
                    action: function (elm, d, i) {
                        var bar = create_bar(1, 'some', common_geom, subplot_geom, rect_geom, placeholder_form, newg);
                        assign_parent_bar(bar);
                    }
                });

                if (common_geom.allow_globally) {
                    menuOptions.push({
                            title: 'Applies at <i>all</i> times in range',
                            action: function (elm, d, i) {
                                var bar = create_bar(1, 'all', common_geom, subplot_geom, rect_geom, placeholder_form, newg);
                                assign_parent_bar(bar);
                            },
                            disabled: (common_geom.max_depth <= 1)
                        },
                        {
                            divider: true
                        });
                }
            }

            if (common_geom.max_depth >= 2){
                menuOptions.push({
                    title: 'Eventually-Always',
                    action: function(elm, d, i) {
                        var bar = create_bar(1, 'all', common_geom, subplot_geom, rect_geom, placeholder_form, newg);
                        assign_parent_bar(bar);
                        timing_parent_bar.set_parent_bar('some')();
                        update_text();
                    }
                 });
                menuOptions.push({
                    title: 'Always-Eventually',
                    action: function(elm, d, i) {
                        var bar = create_bar(1, 'some', common_geom, subplot_geom, rect_geom, placeholder_form, newg);
                        assign_parent_bar(bar);
                        timing_parent_bar.set_parent_bar('all')();
                        update_text();
                    }
                });
            }

        if (common_geom.allow_shared_times) {
            menuOptions.push({
                divider: true
            });

            menuOptions.push({
                title: 'Link start times',
                action: function (elm, d, i) {
                    common_geom.selected_rail = rect_geom;
                },
                disabled: rect_geom.siblings.length > 0
            });
            menuOptions.push({
                title: 'Make start time independent',
                action: makeStartTimeIndependent,
                disabled: (rect_geom.siblings.length === 0 && !rect_geom.following)
            });
            
            menuOptions.push({
                title: 'Attach to rail',
                action: function (elm, d, i) {

                    common_geom.selected_rail_to_add_to_rail = rect_geom;
                },
                disabled: false
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

    function rclick_bottom() {
        if (common_geom.specification_fixed){ return; }

        rect_geom.bottom_fixed = !rect_geom.bottom_fixed;
        if (!rect_geom.bottom_fixed) {
            drag_resize_bottom_inner(common_geom.subplotHeight);
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

    var endline = newg.append("line").classed("red-line", true)
                        .style("visibility", "hidden");

    // This line spans subplots, so can't be added to the group holding this subplot
    var link_shared_times_line = common_geom.diagram_svg.select("#linking-line-div")
        .append("line")
        .style("opacity", "0.1")
        .classed("red-line", true)
        .call(drag_track_circle);

    var shared_end_times_line = common_geom.diagram_svg.select("#linking-line-div")
        .append("line")
        .style("opacity", "0.1")
        .classed("red-line", true);


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
            },{
                title: 'Make start time independent',
                action: makeStartTimeIndependent,
                disabled: (rect_geom.siblings.length === 0 && !rect_geom.following)
            },{
                divider: true
            },{
                title: 'Bind start time',
                action: function(){ 
                    rect_geom.startTimeIsBound = true;
                    adjust_everything();
                },
                disabled: rect_geom.startTimeIsBound
            },{
                title: 'Un-bind start time',
                action: function (){
                    rect_geom.startTimeIsBound = false;
                    adjust_everything();
                },
                disabled: (!rect_geom.startTimeIsBound || rect_geom.following || timing_parent_bar)
            },{
                title: 'Bind end time',
                action: function(){ 
                    rect_geom.endTimeIsBound = true;
                    adjust_everything();
                },
                disabled: rect_geom.endTimeIsBound
            },{
                title: 'Un-bind end time',
                action: function (){
                    rect_geom.endTimeIsBound = false;
                    adjust_everything();
                },
                disabled: !rect_geom.endTimeIsBound
            },{
                title: 'Share times with another mode',
                action: function(){ common_geom.selected_mode_to_link = rect_geom; },
                disabled: rect_geom.sharedEndTimes.length > 0 //(rect_geom.siblings.length === 0 && !rect_geom.following)
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
        })
        .on("click", link_to_end_time);


    dragrect.on('contextmenu', d3.contextMenu(rectMenu));
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
        .style("cursor", "move")
        .classed("track_circle", true)
        .on('contextmenu', d3.contextMenu(menu))
        .on("click", link_to_start_time)
        .call(drag_track_circle);

    var end_circle = newg
        .append("g")
        .append("circle")
        .attr("r", 7)
        .style("cursor", "move")
        .style("visibility", "hidden")
        .classed("track_circle", true)
        .on('contextmenu', d3.contextMenu(menu))
        .on("click", link_to_start_time)
        .call(drag_end_circle);


    function link_to_start_time(){
        // the menu ensures that common_geom.selected_rail has no siblings, but this rectangle might already

        if (!common_geom.selected_rail || !common_geom.selected_rail.hasOwnProperty('siblings')){ return; }
        if (common_geom.selected_rail == rect_geom){ common_geom.selected_rail = false; return; }

        addAsSibling(common_geom.selected_rail);
        common_geom.selected_rail = false;
    }


    function addAsSibling(selected_rail){
        if (rect_geom.following){ return; } // Also clear selection?
        // add new mode to the sibling list of all of this mode's siblings
        for (var i=0; i<rect_geom.siblings.length; i++){
            rect_geom.siblings[i].siblings.push(selected_rail);
        }

        // copy this mode's siblings to new mode's sibling list
        for (var i=0; i<rect_geom.siblings.length; i++){
            selected_rail.siblings.push(rect_geom.siblings[i]);
        }

        // add new mode to the sibling list of this mode
        rect_geom.siblings.push(selected_rail);

        // add this mode to sibling list of new node
        selected_rail.siblings.push(rect_geom);

        selected_rail.setTimingBar(timing_parent_bar);

        update_start_time();
    }

    function addAsLinkedEnding(selected_mode){
        // add new mode to the sharedEndTimes list of all of this mode's sharedEndTimes
        for (var i=0; i<rect_geom.sharedEndTimes.length; i++){
            rect_geom.sharedEndTimes[i].sharedEndTimes.push(selected_mode);
        }

        // copy this mode's sharedEndTimes to new mode's sharedEndTimes list
        for (var i=0; i<rect_geom.sharedEndTimes.length; i++){
            selected_mode.sharedEndTimes.push(rect_geom.sharedEndTimes[i]);
        }

        // add new mode to the sharedEndTimes list of this mode
        rect_geom.sharedEndTimes.push(selected_mode);

        // add this mode to sharedEndTimes list of new node
        selected_mode.sharedEndTimes.push(rect_geom);

        update_end_time();
    }

     function link_to_end_time(){
        // the menu ensures that common_geom.selected_rail has no siblings, but this rectangle might already

        if (common_geom.selected_rail && common_geom.selected_rail.hasOwnProperty('siblings')) {
            if (common_geom.selected_rail == rect_geom) {
                common_geom.selected_rail = false;
                return;
            }

            rect_geom.followers.push(common_geom.selected_rail);
            common_geom.selected_rail.following = rect_geom;

            update_end_time();

            common_geom.selected_rail = false;
        }

         // the menu ensures that common_geom.selected_mode_to_link doesn't add have a linked end time yet, but this rectangle might already
        if (common_geom.selected_mode_to_link){
            // call linkedStartTime???

            // record linked-ness
            addAsLinkedEnding(common_geom.selected_mode_to_link);
            addAsSibling(common_geom.selected_mode_to_link);

            common_geom.selected_mode_to_link = false;
        }

    }

    function makeStartTimeIndependent() {

        // remove this rectangle from sibling list of other rectangles
        for (var i = 0; i < rect_geom.siblings.length; i++) {
            var index = rect_geom.siblings[i].siblings.indexOf(rect_geom);
            rect_geom.siblings[i].siblings.splice(index, 1);
        }

        // clear up if following a rectangle
        if (rect_geom.following){
            var index = rect_geom.following.followers.indexOf(rect_geom);
            rect_geom.following.followers.splice(index, 1);

            rect_geom.following = false;
        }

        // adjust start line for former sibling
        if (rect_geom.siblings.length > 0){
            rect_geom.siblings[0].update_start_time();

            // remove from self
            rect_geom.siblings = [];
        }

        // adjust start line for self
        rect_geom.update_start_time();

        rect_geom.adjust_everything(); // to toggle visibility of track_circle



        // remove from sharedEndTimes of other modes
        for (var i = 0; i < rect_geom.sharedEndTimes.length; i++) {
            var index = rect_geom.sharedEndTimes[i].sharedEndTimes.indexOf(rect_geom);
            rect_geom.sharedEndTimes[i].sharedEndTimes.splice(index, 1);
        }

        // adjust end line for modes formerly ending at same time
        if (rect_geom.sharedEndTimes.length > 0){
            rect_geom.sharedEndTimes[0].update_end_time();

            // remove from self
            rect_geom.sharedEndTimes = [];
        }
        rect_geom.update_end_time();



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


        var numRepeats = Math.floor(rect_geom.width / 4);
        var gap = rect_geom.width - 4 * numRepeats;
        var edge = "2,2,".repeat(numRepeats) + gap + ",0";

        var dashArray = "";

        if (rect_geom.top_fixed){
            dashArray += edge;
        } else {
            dashArray += "0," + rect_geom.width;
        }

        if (rect_geom.right_fixed){
            dashArray += "," + rect_geom.height + ",0";
        } else {
           dashArray += "," +  "0," + rect_geom.height;
        }

        if (rect_geom.bottom_fixed){
            dashArray += "," + edge;
        } else {
           dashArray += "," +  "0," + rect_geom.width;
        }

        if (rect_geom.left_fixed){
            dashArray += "," + rect_geom.height + ",0";
        } else {
           dashArray += "," +  "0," + rect_geom.height;
        }

        dragrect.style("stroke-dasharray", dashArray);
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

        // TODO: FIXME

    }

    function update_text() {

        function create_initial_bar (kind){
            var bar = create_bar(1, kind, common_geom, subplot_geom, rect_geom, placeholder_form, newg);
            assign_parent_bar(bar);
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

    
    function add_timing_bar(kind, options){
        // create timing-bar, and set it as immediate parent of rectangle
        // kind is 'some' or 'all'

        if (timing_parent_bar){
            timing_parent_bar.set_parent_bar(kind, options)();
            update_text();
        } else {
            var bar = create_bar(1, kind, common_geom, subplot_geom, rect_geom, placeholder_form, newg, options);
            assign_parent_bar(bar);
        }
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

        dragbarright.remove();
        dragbartop.remove();
        dragbarbottom.remove();
        dragrect.remove();
        delay_line.remove();
        startline.remove();
        track_circle.remove();

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

        // TODO: followers and sharedEndTimes

        // remove this rectangle's shared time line
        link_shared_times_line.remove();
        shared_end_times_line.remove();

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

    rect_geom.add_bar = append_timing_bar;
    rect_geom.adjust_scales = adjust_scales;
    rect_geom.adjust_everything = adjust_everything;
    rect_geom.saveRectangleIndex = function (index) {
        rect_geom.rectangleIndex = index;
    };
    rect_geom.update_formula = update_formula;
    rect_geom.get_num_rails = function () {
        return timing_parent_bar ? (1 + timing_parent_bar.get_num_rails()) : 0;
    };
    rect_geom.get_num_rails_above = get_num_rails_above;
    rect_geom.deleteRectangle = deleteRectangle;
    rect_geom.update_start_time = update_start_time;
    rect_geom.toJSON = function () {
        // modify copy of this object that will be serialised to eliminate cyclic references
        var clone = Object.assign({}, rect_geom);

        clone.siblings = clone.siblings.map(function (n) { return getRectangleIndex(n); });
        clone.followers = clone.followers.map(function (n) { return getRectangleIndex(n); });
        clone.sharedEndTimes = clone.sharedEndTimes.map(function (n) { return getRectangleIndex(n); });

        if (clone.following){
            clone.following = getRectangleIndex(clone.following);
        }
        delete clone.subplot;

        clone.max_val = subplot_geom.yScale.invert(clone.rect_top);
        clone.min_val = subplot_geom.yScale.invert(clone.rect_top + clone.height);
        clone.max_time = common_geom.xScale.invert(clone.start_time_pos + clone.width);
        clone.min_time = common_geom.xScale.invert(clone.start_time_pos);

        return clone;
    };

    function getRectangleIndex(n) {
        var subplot_index = common_geom.subplot_geoms.indexOf(n.subplot);
        var rectIndex = n.subplot.rectangles.indexOf(n);
        return {subplot_index: subplot_index, rect_index: rectIndex};
    }

    rect_geom.update_end_time = update_end_time;
    rect_geom.adjustSharedEndTimeLine = adjustSharedEndTimeLine;

    return rect_geom;
}