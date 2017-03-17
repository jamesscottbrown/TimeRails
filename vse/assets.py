# -*- coding: utf-8 -*-
"""Application assets."""
from flask_assets import Bundle, Environment

css = Bundle(
    'libs/bootstrap/dist/css/bootstrap.css',
    'css/style.css',
    filters='cssmin',
    output='public/css/common.css'
)

css_spec = Bundle(
    'css/spec.css',
    filters='cssmin',
    output='public/css/common.css'
)

js = Bundle(
    'libs/jQuery/dist/jquery.js',
    'libs/bootstrap/dist/js/bootstrap.js',
    'js/plugins.js',
    filters='jsmin',
    output='public/js/common.js'
)

js_spec = Bundle(
	'libs/d3.v3.4.11.js',
	'libs/d3-context-menu.js',
	'libs/https_cdn.mathjax.org_mathjax_latest_MathJax.js\?config\=TeX-AMS-MML_HTMLorMML.js',
	'js/dragrect.js',
	'js/subplots.js',
	'js/time_rail.js',
    filters='jsmin',
    output='public/js/common.js'
)

assets = Environment()

assets.register('js_all', js)
assets.register('js_spec', js_spec)

assets.register('css_all', css)
assets.register('css_spec', css_spec)
