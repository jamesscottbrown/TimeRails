
function add_subplot(div_name, spec_id){
    d3.select("#diagrams").append('div').attr("id", div_name);
    setup("#" + div_name, spec_id, 1);
}

function add_subplot_from_specification(specification_string, div_name, spec_id){
    d3.select("#diagrams").append('div').attr("id", div_name);
    setup_from_specification_string("#" + div_name, spec_id, 1, specification_string);
}


function remove_subplot(div_name){
    d3.select("#" + div_name).remove();
}
