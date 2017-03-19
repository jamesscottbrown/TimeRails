from vse.specification.models import Specification
from vse.specification.forms import SpecificationForm

from vse.project.models import Project


from vse.utils import flash_errors

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import login_required, current_user

blueprint = Blueprint('specification', __name__, url_prefix='/specifications', static_folder='../static')

# TODO: validate ownership!
# TODO: view for a spec

@blueprint.route('/add', methods=['GET', 'POST'])
@login_required
def new_project():
    """Add new specification to project."""

    form = SpecificationForm(request.form)
    if form.validate_on_submit():

        project_id = form.project_id.data

        project = Project.query.filter_by(id=project_id).first()
        if not project:
            flash('No such project!', 'danger')
            return redirect('.')

        if project.user != current_user:
            flash('Not your project!', 'danger')
            return redirect('.')

        Specification.create(name=form.name.data, description=form.description.data, specification=form.specification.data,
                             project_id=project_id)
        flash('New specification created.', 'success')
        return redirect('/projects/' + project_id)
    else:
        flash_errors(form)

    return render_template('specifications/new_specification.html', form=form, project_id=request.args.get('project'))



@blueprint.route('/<int:specification_id>/delete', methods=['GET', 'POST'])
@login_required
def delete_specification(specification_id):
    """Delete a specification."""

    current_spec = Specification.query.filter_by(id=specification_id).first()
    if not current_spec:
        flash('No such specification!', 'danger')
        return redirect('.')

    if current_spec.project.user != current_user:
        flash('Not your project!', 'danger')
        return redirect('.')

    project_id = current_spec.project_id

    if request.method == "POST":
        current_spec.delete()
        return redirect('projects/' + str(project_id))

    return render_template('specifications/delete_spec.html', current_spec=current_spec)



@blueprint.route('/<int:specification_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_specification(specification_id):
    """Edit details of a specification."""

    current_spec = Specification.query.filter_by(id=specification_id).first()
    if not current_spec:
        flash('No such specification!', 'danger')
        return redirect('.')

    if current_spec.project.user != current_user:
        flash('Not your project!', 'danger')
        return redirect('.')

    project_id = current_spec.project_id

    form = SpecificationForm(request.form)
    if form.validate_on_submit():
        form.populate_obj(current_spec)
        current_spec.project_id = project_id # ensure project_id is unchanged
        current_spec.save()
        flash('Project updated.', 'success')
        return redirect('projects/' + str(project_id))
    else:
        flash_errors(form)
    return render_template('specifications/edit_spec.html', form=form, current_spec=current_spec)


@blueprint.route('/<int:specification_id>')
@login_required
def view_project(specification_id):
    """View a specification."""

    current_spec = Specification.query.filter_by(id=specification_id).first()
    if not current_spec:
        flash('No such specification!', 'danger')
        return redirect('.')

    print current_spec, current_spec.project_id
    print current_spec.project

    if current_spec.project.user != current_user:
        flash('Not your project!', 'danger')
        return redirect('.')

    return render_template('specifications/view_spec.html', current_spec=current_spec)
