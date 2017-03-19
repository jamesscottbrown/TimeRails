from vse.project.models import Project
from vse.project.forms import ProjectForm

from vse.utils import flash_errors

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import login_required, current_user

blueprint = Blueprint('project', __name__, url_prefix='/projects', static_folder='../static')


@blueprint.route('/')
@login_required
def list_projects():
    """List all user's projects."""
    return render_template('projects/list_projects.html')


@blueprint.route('/<int:project_id>')
@login_required
def project(project_id):
    """List details of a project."""
    current_project = Project.query.filter_by(id=project_id).first()

    if current_project.user != current_user:
        flash('Not your project!', 'danger')
        return redirect('.')

    return render_template('projects/project.html', project=current_project)


@blueprint.route('/<int:project_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_project(project_id):
    """Edit details of a project."""
    current_project = Project.query.filter_by(id=project_id).first()

    if current_project.user != current_user:
        flash('Not your project!', 'danger')
        return redirect('.')

    form = ProjectForm(request.form)
    if form.validate_on_submit():
        form.populate_obj(current_project)
        current_project.save()
        flash('Project updated.', 'success')
        return redirect('projects/' + str(project_id))
    else:
        flash_errors(form)
    return render_template('projects/edit_project.html', form=form, current_project=current_project)


@blueprint.route('/<int:project_id>/delete', methods=['GET', 'POST'])
@login_required
def delete_project(project_id):
    """Delete a project."""
    current_project = Project.query.filter_by(id=project_id).first()

    if current_project.user != current_user:
        flash('Not your project!', 'danger')
        return redirect('.')

    if request.method == "POST":
        current_project.delete()
        return redirect(url_for('project.list_projects'))

    return render_template('projects/delete_project.html', current_project=current_project)


@blueprint.route('/add', methods=['GET', 'POST'])
@login_required
def new_project():
    """Add new project."""
    form = ProjectForm(request.form)
    if form.validate_on_submit():
        Project.create(name=form.name.data, description=form.description.data, dimensionality=form.dimensionality.data, user_id=current_user.id)
        flash('New project created.', 'success')
        return redirect(url_for('project.list_projects'))
    else:
        flash_errors(form)
    return render_template('projects/new_project.html', form=form)