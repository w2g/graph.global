#!/usr/bin/env python
# -*-coding: utf-8 -*-

"""
    __init__.py
    ~~~~~~~~~~~
    views

    :copyright: (c) 2015 by Mek Karpeles
    :license: see LICENSE for more details.
"""


from flask.views import MethodView, request
from views import rest_api

class Nodes(MethodView):

    @rest_api
    def get(self, uri=None):
        return []

    @rest_api
    def post(self):
        i = request.args()
        return i

urls = (    
    '/', Nodes
)
