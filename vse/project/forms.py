from flask_wtf import Form
from wtforms import StringField, IntegerField
from wtforms.validators import DataRequired, EqualTo, Length

from .models import Project


class ProjectForm(Form):
    """Form to create new project."""

    name = StringField('Name', validators=[DataRequired(), Length(min=3, max=25)])
    description = StringField('Description', validators=[DataRequired(), Length(min=6, max=40)])
    dimensionality = IntegerField('Dimensionality', validators=[DataRequired(message='required and must be an integer')])

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(ProjectForm, self).__init__(*args, **kwargs)
        # self.user = None

    def validate(self):
        """Validate the form."""
        initial_validation = super(ProjectForm, self).validate()
        if not initial_validation:
            return False

        return True
