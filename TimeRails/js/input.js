    function drawInput(common_geom, subplot_geom, opts, state) {

        if (!opts){ opts = []; }
        var maxTime = opts.maxTime ? opts.maxTime : 100;
        var maxY = subplot_geom.yScale.domain()[0];
        var num_points = opts.num_points ? opts.num_points : 100;

        var g = subplot_geom.svg;

        var color = d3.scale.category10();

        // context menu to add terms
        var getMenu = function(){
            return [{
                    title: 'Add linear term',
                    action: function(){  addLinearTerm(); }, // wrap in new function to swallow unwanted arguments
                    disabled: common_geom.specification_fixed
                }, {
                    title: 'Add sigmoidal term',
                    action: function(){ addSigmoidalTerm(); },
                    disabled: common_geom.specification_fixed
                },{
                    title: 'Add bell-shaped term',
                    action: function(){ addBellTerm(); },
                    disabled: common_geom.specification_fixed
                }];
            };

        g.append("rect")
            .attr("x", common_geom.horizontal_padding)
            .attr("width", common_geom.subplotWidth - 2*common_geom.horizontal_padding)
            .attr("y", common_geom.vertical_padding)
            .attr("height", common_geom.subplotHeight - 2*common_geom.vertical_padding)
            .style("opacity", 0)
            .attr("class", "clickable-background")
            .on('contextmenu', d3.contextMenu(getMenu));

        var terms = [];
        if (state && state.length > 0){
            for (var i =0; i<state.length; i++){
                var term = state[i];
                if (term.type == "linear"){
                    addLinearTerm(term);
                } else if (term.type == "sigmoidal"){
                    addSigmoidalTerm(term);
                } else if (term.type == "bell") {
                    addBellTerm(term);
                }
            }
        }


        function addLinearTerm(s){
            if (!s){ s = {type: "linear", positions: [{x: 0, y: 0}, {x: maxTime, y: maxY} ]}; }
            terms.push(LinearTerm(terms.length, s));
            terms[terms.length-1].updateLine();
        }
        function addSigmoidalTerm(s){
            if (!s){ s = {type: "sigmoidal", positions: [{x: 0, y: 0}, {x: maxTime/2, y: maxY/2}, {x: maxTime, y: maxY} ], hillCoefficient: 10}; }
            terms.push(SigmoidalTerm(terms.length, s))
            terms[terms.length-1].updateLine();
        }
        function addBellTerm(s){
            if (!s){ s = {type: "bell", positions: [{x: 0, y: 0}, {x: maxTime/4, y: maxY/2}, {x: maxTime/2, y: maxY}, {x: maxTime * 3/4, y: maxY} ]};}
            terms.push(BellTerm(terms.length, s));
            terms[terms.length-1].updateLine();
        }


        function adjust_scales(new_xScale, new_yScale){

            function convertX(x){
                return new_xScale(common_geom.xScale.invert(x));
            }

            function convertY(y){
                return new_yScale(subplot_geom.yScale.invert(y));
            }

            for (var i=0; i<terms.length; i++){
                terms[i].updateScale(convertX, convertY);
            }

            common_geom.xScale = new_xScale;
            subplot_geom.yScale = new_yScale;

            maxY = new_yScale.domain()[0];
        }

        function shift_circle(circle, convertX, convertY){
            circle.attr("cx", convertX(parseFloat(circle.attr("cx"))))
                  .attr("cy", convertY(parseFloat(circle.attr("cy"))));
        }

        function updateSumPoints(){

                if (terms.length == 0){ return; }

                var total = [];

                for (var i=0; i<terms.length; i++){

                    if (terms[i].isDeleted()){ continue; }

                    var points = terms[i].getPoints();

                    for (var j=0; j<points.length; j++){
                        if (j < total.length){
                            total[j] = {x: points[j].x,  y: points[j].y + total[j].y}
                        }  else {
                            total[j] = {x: points[j].x,  y: points[j].y};
                        }
                    }
                }

               var data_circles = g.selectAll(".data-points")
                   .data(total)
                   .enter()
                   .append("circle")
                   .attr("class", "data-points");

                g.selectAll(".data-points")
                    .data(total)
                    .exit()
                    .remove();

               g.selectAll(".data-points")
                   .attr("cx", function (d) {
                       return common_geom.xScale(d.x)
                   })
                   .attr("cy", function (d) {
                       return subplot_geom.yScale(d.y)
                   })
                   .attr("r", 1)
                   .classed("data-points", true);

        }

        function getExpression(){
                if (terms.length == 0){ return; }
                var expression = [];

                for (var i=0; i<terms.length; i++){
                    if (terms[i].isDeleted()){ continue; }
                    expression.push(terms[i].getExpression());
                }
                return expression;
        }

        function getState(){
                if (terms.length == 0){ return; }
                var expression = [];

                for (var i=0; i<terms.length; i++){
                    if (terms[i].isDeleted()){ continue; }
                    expression.push(terms[i].getState());
                }
                return expression;
        }




        function LinearTerm(i, state) {
            var line = g.append("line")
                .classed("line", true)
                .attr("draggable", false);

            var point1 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[0].x))
                .attr("cy", subplot_geom.yScale(state.positions[0].y))
                .attr("r", 5)
                .style("cursor", "ns-resize")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                var cursor_y = d3.mouse(g.node())[1];
                                var newy = imposeLimits(0, common_geom.subplotHeight, cursor_y);
                                point1.attr("cy", newy);
                                updateLine();
                            })
                );


            var point2 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[1].x))
                .attr("cy", subplot_geom.yScale(state.positions[1].y))
                .attr("r", 5)
                .style("cursor", "move")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                // move, but keep to the right of point 1
                                var cursor_x = d3.mouse(g.node())[0];
                                var newx = imposeLimits(point1.attr("cx"), common_geom.subplotWidth, cursor_x);
                                point2.attr("cx", newx);


                                var cursor_y = d3.mouse(g.node())[1];
                                var newy = imposeLimits(0, common_geom.subplotHeight, cursor_y);
                                point2.attr("cy", newy);

                                updateLine();
                            })
                );


            var menu = function () {
                return [{
                    title: 'Delete term',
                    action: deleteLine,
                    disabled: common_geom.specification_fixed
                },{
                    title: 'Adjust values',
                    action: adjustValues,
                    disabled: common_geom.specification_fixed
                }];
            };

            point1.on('contextmenu', d3.contextMenu(menu));
            point2.on('contextmenu', d3.contextMenu(menu));

            updateLine();

            var points = [];
            function updateLine() {

                var intercept = subplot_geom.yScale.invert(point1.attr("cy"));
                var gradient = (subplot_geom.yScale.invert(point2.attr("cy")) - subplot_geom.yScale.invert(point1.attr("cy"))) / (common_geom.xScale.invert(point2.attr("cx")) - common_geom.xScale.invert(point1.attr("cx")));

                var t2 = common_geom.xScale.invert(point2.attr("cx"));

                line
                    .attr("x1", common_geom.xScale(0))
                    .attr("y1", point1.attr("cy"))
                    .attr("x2", common_geom.xScale(maxTime))
                    .attr("y2", subplot_geom.yScale(intercept + gradient * maxTime))
                    .style("stroke", color(i));

                points = [];
                for (var t = 0; t < maxTime; t = t + (maxTime / num_points)) {
                    var y_val = intercept + gradient * t;
                    points.push({x: t, y: y_val});
                }

                updateSumPoints();
            }

            function updateScale(convertX, convertY){
                shift_circle(point1, convertX, convertY);
                shift_circle(point2, convertX, convertY);
                updateLine();
            }

            var isDeleted = false;
            function deleteLine() {
                point1.remove();
                point2.remove();
                line.remove();

                isDeleted = true;
                updateSumPoints();
            }

            function adjustValues(){
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

                var startDiv = modalBody.append("div");

                state = getState();

                startDiv.append("text").text(" Increase from ");
                var minVal = startDiv.append("input").attr("value", state.parameters.intercept).node();
                startDiv.append("text").text(" and pass through  ");
                var maxVal = startDiv.append("input").attr("value", subplot_geom.yScale.invert(point2.attr("cy")) ).node();
                startDiv.append("text").text(" at time ");
                var endTime = startDiv.append("input").attr("value", common_geom.xScale.invert(point2.attr("cx"))).node();

                startDiv.append("text").text(".");

                modalFooter.append("button").text("Save").on("click", function () {

                    point1.attr("cy", subplot_geom.yScale(+minVal.value));

                    point2.attr("cy", subplot_geom.yScale(+maxVal.value))
                        .attr("cx", common_geom.xScale(+endTime.value));

                    updateLine();
                })

                    .attr("data-dismiss", "modal");
                modalFooter.append("button").text("Close").attr("data-dismiss", "modal");

                $('#paramModal').modal('toggle');
            }



            function getPoints(){
                return points;
            }
            function getExpression() {

            }
            function getState(){
                var intercept = subplot_geom.yScale.invert(point1.attr("cy"));
                var gradient = (subplot_geom.yScale.invert(point2.attr("cy")) - subplot_geom.yScale.invert(point1.attr("cy"))) / (common_geom.xScale.invert(point2.attr("cx")) - common_geom.xScale.invert(point1.attr("cx")));

                return {type: "linear", positions: [getCircleVal(point1), getCircleVal(point2)], parameters: {"intercept": intercept, "gradient": gradient}}
            }

            return {updateScale: updateScale, updateLine: updateLine, deleteLine: deleteLine, getExpression: getExpression, getPoints: getPoints, isDeleted: function(){ return isDeleted; }, getState: getState }
        }


        function SigmoidalTerm(i, state) {
            var point1 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[0].x))
                .attr("cy", subplot_geom.yScale(state.positions[0].y))
                .attr("r", 5)
                .style("cursor", "ns-resize")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                var cursor_y = d3.mouse(g.node())[1];
                                var newy = imposeLimits(0, common_geom.subplotHeight, cursor_y);
                                point1.attr("cy", newy);
                                updateLine();
                            })
                );


            var point2 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[1].x))
                .attr("cy", subplot_geom.yScale(state.positions[1].y))
                .attr("r", 5)
                .style("cursor", "ew-resize")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                // move, but keep to the right of point 1
                                var cursor_x = d3.mouse(g.node())[0];
                                var newx = imposeLimits(point1.attr("cx"), point3.attr("cx"), cursor_x);
                                point2.attr("cx", newx);

                                updateLine();
                            })
                );


            var point3 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[2].x))
                .attr("cy", subplot_geom.yScale(state.positions[2].y))
                .attr("r", 5)
                .style("cursor", "ns-resize")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                var cursor_y = d3.mouse(g.node())[1];
                                var newy = imposeLimits(0, common_geom.subplotHeight, cursor_y);
                                point3.attr("cy", newy);

                                updateLine();
                            })
                );


            var hillCoefficient = state.hillCoefficient;
            var menu = function () {
                return [{
                    title: 'Delete term',
                    action: deleteLine,
                    disabled: common_geom.specification_fixed
                }, {
                    title: 'Adjust values',
                    action: adjustValues,
                    disabled: common_geom.specification_fixed
                }];
            };

            point1.on('contextmenu', d3.contextMenu(menu));
            point2.on('contextmenu', d3.contextMenu(menu));
            point3.on('contextmenu', d3.contextMenu(menu));


            var line = d3.svg.line()
                .interpolate("linear")
                .x(function (d) {
                    return common_geom.xScale(d.x);
                })
                .y(function (d) {
                    return subplot_geom.yScale(d.y);
                });

            var line_path = g.append("path")
                .attr("class", "line")
                .attr("draggable", false)
                .style("stroke", "red")
                .style("stroke", color(i));

            updateLine();

            var points = [];
            function updateLine() {

                point2.attr("cy", ( parseFloat(point1.attr("cy")) + parseFloat(point3.attr("cy"))) / 2);

                var initial_value = parseFloat(subplot_geom.yScale.invert(point1.attr("cy")));
                var midpoint_time = parseFloat(common_geom.xScale.invert(point2.attr("cx")));
                var final_value = parseFloat(subplot_geom.yScale.invert(point3.attr("cy")));

                points = [];
                for (var t = 0; t < maxTime; t = t + (maxTime / num_points)) {
                    var y_val = initial_value + (final_value - initial_value) / ( Math.pow((midpoint_time / t), hillCoefficient) + 1 );
                    points.push({x: t, y: y_val});
                }

                line_path.attr("d", line(points));
                updateSumPoints();
            }

            var isDeleted = false;
            function deleteLine() {
                point1.remove();
                point2.remove();
                point3.remove();
                line_path.remove();

                isDeleted = true;
                updateSumPoints();
            }


        function adjustValues(){
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

            var startDiv = modalBody.append("div");

            state = getState();

            startDiv.append("text").text(" Increase from ");
            var minVal = startDiv.append("input").attr("value", state.parameters.initial_value).node();
            startDiv.append("text").text(" to  ");
            var maxVal = startDiv.append("input").attr("value", state.parameters.final_value).node();
            startDiv.append("text").text(" , with midpoint at ");
            var midpointTime = startDiv.append("input").attr("value", state.parameters.midpoint_time).node();
            startDiv.append("text").text(" , and steepness ");
            var hillVal = startDiv.append("input").attr("value", hillCoefficient).node();

            startDiv.append("text").text(".");

            modalFooter.append("button").text("Save").on("click", function () {

                point1.attr("cy", subplot_geom.yScale(minVal.value));

                point3.attr("cy", subplot_geom.yScale(maxVal.value));

                point2.attr("cx", common_geom.xScale(midpointTime.value))
                    .attr("cy", subplot_geom.yScale( (+minVal.value + maxVal.value)/2 ) );

                hillCoefficient = hillVal.value;

                updateLine();
            })

                .attr("data-dismiss", "modal");
            modalFooter.append("button").text("Close").attr("data-dismiss", "modal");

            $('#paramModal').modal('toggle');
        }



            function getPoints(){
                return points;
            }
            function getExpression(){}

            function updateScale(convertX, convertY){
                shift_circle(point1, convertX, convertY);
                shift_circle(point2, convertX, convertY);
                shift_circle(point3, convertX, convertY);

                updateLine();
            }

            function getState(){
                var initial_value = parseFloat(subplot_geom.yScale.invert(point1.attr("cy")));
                var midpoint_time = parseFloat(common_geom.xScale.invert(point2.attr("cx")));
                var final_value = parseFloat(subplot_geom.yScale.invert(point3.attr("cy")));

                return {type: "sigmoidal",
                        positions: [getCircleVal(point1), getCircleVal(point2), getCircleVal(point3)],
                        hillCoefficient: hillCoefficient,
                        parameters: {initial_value: initial_value, midpoint_time: midpoint_time, final_value: final_value, hillCoefficient: hillCoefficient}
                        }
            }


            return {updateScale: updateScale, updateLine: updateLine, deleteLine: deleteLine, getExpression: getExpression, getPoints: getPoints, isDeleted: function(){ return isDeleted; }, getState: getState}

        }

        function BellTerm(i, state) {
            var point1 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[0].x))
                .attr("cy", subplot_geom.yScale(state.positions[0].y))
                .attr("r", 5)
                .style("cursor", "ns-resize")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                var cursor_y = d3.mouse(g.node())[1];
                                var newy = imposeLimits(0, common_geom.subplotHeight, cursor_y);
                                point1.attr("cy", newy);
                                shiftHeight();

                                updateLine();
                            })
                );


            var point2 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[1].x))
                .attr("cy", subplot_geom.yScale(state.positions[1].y))
                .attr("r", 5)
                .style("cursor", "ew-resize")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                // move, but keep to the left of point 3
                                var cursor_x = d3.mouse(g.node())[0];
                                var newx = imposeLimits(0, point3.attr("cx"), cursor_x);
                                point2.attr("cx", newx);

                                // update point 4 to maintain symmetry
                                shiftPoint4();

                                updateLine();
                            })
                );


            var point3 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[2].x))
                .attr("cy", subplot_geom.yScale(state.positions[2].y))
                .style("cursor", "move")
                .attr("r", 5)
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                // move, but keep to the right of point 2
                                var oldx = parseFloat(point3.attr("cx"));
                                var cursor_x = d3.mouse(g.node())[0];
                                var newx = imposeLimits(point2.attr("cx"), common_geom.subplotWidth, cursor_x);
                                point3.attr("cx", newx);

                                point4.attr("cx", (newx - oldx) + parseFloat(point4.attr("cx")));
                                point2.attr("cx", (newx - oldx) + parseFloat(point2.attr("cx")));

                                var cursor_y = d3.mouse(g.node())[1];
                                var newy = imposeLimits(0, common_geom.subplotHeight, cursor_y);
                                point3.attr("cy", newy);
                                shiftHeight();

                                updateLine();
                            })
                );


            var point4 = g.append("circle")
                .attr("cx", common_geom.xScale(state.positions[3].x))
                .attr("cy", subplot_geom.yScale(state.positions[3].y))
                .attr("r", 5)
                .style("cursor", "ew-resize")
                .style("fill", color(i))
                .call(
                    d3.behavior.drag()
                        .origin(Object)
                        .on("drag",

                            function () {
                                if (common_geom.specification_fixed){ return; }

                                // move, but keep to the right of point 3
                                var cursor_x = d3.mouse(g.node())[0];
                                var newx = imposeLimits(point3.attr("cx"), common_geom.subplotWidth, cursor_x);
                                point4.attr("cx", newx);

                                shiftPoint2();
                                updateLine();
                            })
                );

            var menu = function () {
                return [{
                    title: 'Delete term',
                    action: deleteLine,
                    disabled: common_geom.specification_fixed
                },{
                    title: 'Adjust values',
                    action: adjustValues,
                    disabled: common_geom.specification_fixed
                }];
            };

            point1.on('contextmenu', d3.contextMenu(menu));
            point2.on('contextmenu', d3.contextMenu(menu));
            point3.on('contextmenu', d3.contextMenu(menu));
            point4.on('contextmenu', d3.contextMenu(menu));


            var line = d3.svg.line()
                .interpolate("linear")
                .x(function (d) {
                    return common_geom.xScale(d.x);
                })
                .y(function (d) {
                    return subplot_geom.yScale(d.y);
                });

            var line_path = g.append("path")
                .attr("class", "line")
                .attr("draggable", false)
                .style("stroke", "red")
                .style("stroke", color(i));


            function shiftPoint4() {
                var reflected = 2 * parseFloat(point3.attr("cx")) - parseFloat(point2.attr("cx"));
                point4.attr("cx", reflected);
            }

            function shiftPoint2() {
                var reflected = 2 * parseFloat(point3.attr("cx")) - parseFloat(point4.attr("cx"));
                point2.attr("cx", reflected);

            }

            function shiftHeight() {


                var initial_value = parseFloat(subplot_geom.yScale.invert(point1.attr("cy")));
                var peak_value = parseFloat(subplot_geom.yScale.invert(point3.attr("cy")));
                var sigma = (parseFloat(common_geom.xScale.invert(point3.attr("cx"))) - parseFloat(common_geom.xScale.invert(point2.attr("cx"))));

                var y_val = subplot_geom.yScale(initial_value + (peak_value - initial_value) * Math.exp(-1));

                point2.attr("cy", y_val);
                point4.attr("cy", y_val);
            }


            updateLine();
            shiftHeight();

            var points = [];
            function updateLine() {

                var initial_value = parseFloat(subplot_geom.yScale.invert(point1.attr("cy")));
                var peak_value = parseFloat(subplot_geom.yScale.invert(point3.attr("cy")));
                var peak_time = parseFloat(common_geom.xScale.invert(point3.attr("cx")));
                var sigma = (parseFloat(common_geom.xScale.invert(point3.attr("cx"))) - parseFloat(common_geom.xScale.invert(point2.attr("cx"))));

                points = [];
                for (var t = 0; t < maxTime; t = t + (maxTime / num_points)) {
                    var y_val = initial_value + (peak_value - initial_value) * Math.exp(-Math.pow(((t - peak_time) / sigma), 2));
                    points.push({x: t, y: y_val});
                }

                line_path.attr("d", line(points));
                updateSumPoints();

            }

            var isDeleted = false;
            function deleteLine() {
                point1.remove();
                point2.remove();
                point3.remove();
                point4.remove();

                line_path.remove();

                isDeleted = true;
                updateSumPoints();
            }


            function adjustValues(){
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

                var startDiv = modalBody.append("div");

                state = getState();

                startDiv.append("text").text(" Increase from ");
                var minVal = startDiv.append("input").attr("value", state.parameters.initial_value).node();
                startDiv.append("text").text(" to  ");
                var maxVal = startDiv.append("input").attr("value", state.parameters.peak_value).node();
                startDiv.append("text").text(" at time  ");
                var peakTime = startDiv.append("input").attr("value", state.parameters.peak_time).node();

                startDiv.append("text").text(" , with width of ");
                var width = startDiv.append("input").attr("value", state.parameters.sigma).node();

                startDiv.append("text").text(".");

                modalFooter.append("button").text("Save").on("click", function () {

                    point1.attr("cy", subplot_geom.yScale(+minVal.value));
                    point3.attr("cy", subplot_geom.yScale(+maxVal.value));

                    shiftHeight(); // sets height of points 2 and 4

                    point2.attr("cx", common_geom.xScale(+peakTime.value - width.value));
                    point3.attr("cx", common_geom.xScale(+peakTime.value));
                    point4.attr("cx", common_geom.xScale(+peakTime.value + width.value));

                    updateLine();
                })

                    .attr("data-dismiss", "modal");
                modalFooter.append("button").text("Close").attr("data-dismiss", "modal");

                $('#paramModal').modal('toggle');
            }


            function getPoints(){
                return points;
            }
            function getExpression(){}

            function updateScale(convertX, convertY){
                shift_circle(point1, convertX, convertY);
                shift_circle(point2, convertX, convertY);
                shift_circle(point3, convertX, convertY);
                shift_circle(point4, convertX, convertY);

                updateLine();
            }

            function getState(){
                var initial_value = parseFloat(subplot_geom.yScale.invert(point1.attr("cy")));
                var peak_value = parseFloat(subplot_geom.yScale.invert(point3.attr("cy")));
                var peak_time = parseFloat(common_geom.xScale.invert(point3.attr("cx")));
                var sigma = (parseFloat(common_geom.xScale.invert(point3.attr("cx"))) - parseFloat(common_geom.xScale.invert(point2.attr("cx"))));

                return {type: "bell",
                    positions: [getCircleVal(point1), getCircleVal(point2), getCircleVal(point3), getCircleVal(point4)],
                    parameters: {initial_value: initial_value, peak_value: peak_value, peak_time: peak_time, sigma: sigma}
                }
            }

            return {updateScale: updateScale, updateLine: updateLine, deleteLine: deleteLine, getExpression: getExpression, getPoints: getPoints, isDeleted: function(){ return isDeleted; }, getState: getState}

        }

        function imposeLimits(lower, upper, val) {
            return Math.max(lower, Math.min(upper, val));
        }

        function getCircleVal(circle){
            return {x: common_geom.xScale.invert(parseFloat(circle.attr("cx"))),
                    y: subplot_geom.yScale.invert(parseFloat(circle.attr("cy")))};
        }

        function getTerms(){
            return terms.filter(function (d) {
                return !d.isDeleted();
            });
        }

        function toJSON(){
            return terms.filter(function (d) {
                return !d.isDeleted();
            })
                .map(function(term){ return term.getState(); })
        }

        return {adjust_scales: adjust_scales, addLinearTerm: addLinearTerm, addSigmoidalTerm: addSigmoidalTerm,  addBellTerm: addBellTerm, getExpression: getExpression, getState: getState, getTerms: getTerms, toJSON: toJSON };
    }

