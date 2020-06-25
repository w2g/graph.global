#!/usr/bin/env python
# -*-coding: utf-8 -*-

"""
    __init__.py
    ~~~~~~~~~~~

    :copyright: (c) 2015 by Mek Karpeles
    :license: see LICENSE for more details.
"""

import json
import re
import requests

from flask import render_template, Response, jsonify, Markup
from flask.views import MethodView
from werkzeug import wrappers


def get_post(slug):
    url = "https://graph.global/v1/posts?action=search&field=slug&query=%s&exact=true&limit=1&verbose=1"
    posts = requests.get(url % slug).json()
    if posts['posts']:
        return posts['posts'][0]


class Base(MethodView):
    def get(self, uri=""):
        layout = uri.replace(".html", "")
        if not uri or uri[-1] == '/':
            layout = uri + "index"
        try:
            return render_template('base.html', template="partials/%s.html" % layout)
        except:            
            return render_template('base.html', template='%s/index.html' % layout)

class Partial(MethodView):
    def get(self, partial):
        return render_template('partials/%s.html' % partial)


class Edit(MethodView):
    def get(self, slug=''):
        post = slug and get_post(slug)
        if post:
            post['post'] = Markup(post['post'])
        return render_template('base.html', template='edit.html', post=post, slug=slug)


class Posts(MethodView):
    def get(self, slug=None):
        if not slug:
            return jsonify(requests.get('https://graph.global/v1/posts').json())
        url = "https://graph.global/v1/posts?action=search&field=slug&query=%s&exact=true&limit=1&verbose=1"
        results = requests.get(url % slug).json()

        def tagify(text):
            return Markup(
                re.sub('\[{2}([0-9]+)\:([^\]]+)\]{2}',
                       '<cite w2gid="\g<1>">\g<2></cite>', text))

        post = get_post(slug)
        if post:
            title = post.get('title')
            body  = post.get('post')
            tagmap = dict(re.findall('\[\[([0-9]+):([^\]]*)\]', title + body))
            md = ''.join(['<p>%s</p>' % p for p in body.split('<br>') if p])
            tags  = ', '.join(set(re.findall('(\[{2}[^\]]+\]{2})', title + body)))
            related_posts = post.get('related_posts', [])
            for i, rp in enumerate(related_posts):
                related_posts[i]['related_tags'] = {}
                related_posts[i]['tags'] = dict(re.findall(
                        '\[\[([0-9]+):([^\]]*)\]',
                        related_posts[i]['title'] + related_posts[i]['post']))
                for tid, tval in related_posts[i]['tags'].items():
                    if tid in tagmap:
                        related_posts[i]['related_tags'][tid] = tval
                related_posts[i]['title'] = tagify(related_posts[i]['title'])

            return render_template('base.html', template='partials/post.html', post=post,
                                   tags=tagify(tags), title=tagify(title), body=tagify(body),
                                   related_posts=related_posts)


def rest_api(f):
    """Decorator to allow routes to return json"""
    def inner(*args, **kwargs):
        try:
            try:
                res = f(*args, **kwargs)
                if isinstance(res, wrappers.Response):
                    return res
                response = Response(json.dumps(res))
            except Exception as e:
                response = Response(json.dumps(e.__dict__))

            response.headers.add('Content-Type', 'application/json')
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
        finally:
            #DB Rollbacks to protect against inconsistent states
            pass
    return inner
