from flask_wtf import Form
from wtforms import StringField, HiddenField
from wtforms.validators import DataRequired, EqualTo, Length

from .models import Specification


class SpecificationForm(Form):
    """Form to create new specification."""

    name = StringField('Name', validators=[DataRequired(), Length(min=3, max=25)])
    description = StringField('Description', validators=[DataRequired(), Length(min=6, max=40)])
    specification = StringField('Specification', validators=[])
    project_id = HiddenField()

    def __init__(self, *args, **kwargs):
        """Create instance."""
        super(SpecificationForm, self).__init__(*args, **kwargs)

    def validate(self):
        """Validate the form."""
        initial_validation = super(SpecificationForm, self).validate()
        if not initial_validation:
            return False

        #project = Project.query.filter_by(name=self.name.data).first()
        #if project:
        #    self.name.errors.append('You already have a project with that name')
        #    return False

        return True
