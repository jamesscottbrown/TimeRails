num_vars = 1;

function add_subplot(){
    num_vars++;
    var div_name = 'constraint_diagram_' + num_vars;

    d3.select("#diagrams").append('div').attr("id", div_name);
    setup("#" + div_name, num_vars);

    d3.select('#num_vars_placeholder').html(num_vars);
}

function add_subplot_from_specification(specification_string){
    num_vars++;
    var div_name = 'constraint_diagram_' + num_vars;

    d3.select("#diagrams").append('div').attr("id", div_name);
    setup_from_specification_string("#" + div_name, num_vars, specification_string);

    d3.select('#num_vars_placeholder').html(num_vars);
}


function remove_subplot(){
    var div_name = 'constraint_diagram_' + num_vars;

    d3.select("#" + div_name).remove();

    num_vars--;
    d3.select('#num_vars_placeholder').html(num_vars);
}
