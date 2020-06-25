#!/usr/bin/env pythonNone
#-*-coding: utf-8 -*-

"""
    app.py
    ~~~~~~
    

    :copyright: (c) 2015 by Mek
    :license: see LICENSE for more details.
"""

from flask import Flask
from flask.ext.routing import router
import views
from views import api
from configs import options

urls = ('/partials/<path:partial>', views.Partial,
        '/api', api,
        '/<path:uri>', views.Base,
        '/edit/<path:slug>', views.Edit,
        '/edit', views.Edit,
        '/posts/<path:slug>', views.Posts,
        '/posts', views.Posts,
        '/', views.Base
        )
app = router(Flask(__name__), urls)

if __name__ == "__main__":
    app.run(**options)

