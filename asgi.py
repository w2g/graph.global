#!/usr/bin/env python3
"""FastAPI (py3) port of the graph.global UI (was Flask). Renders base.html + partials;
posts are backed by the API at GRAPH_API (default https://api.graph.global/v1)."""
import os, re, requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from markupsafe import Markup

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, "w2g", "templates")
STATIC = os.path.join(HERE, "w2g", "static")
GRAPH_API = os.environ.get("GRAPH_API", "https://api.graph.global/v1")

app = FastAPI(title="graph.global UI")
templates = Jinja2Templates(directory=TPL)

def render(request, inner, **ctx):
    ctx["request"] = request; ctx["template"] = inner
    return templates.TemplateResponse(request=request, name="base.html", context=ctx)

def tagify(text):
    return Markup(re.sub(r'\[{2}([0-9]+)\:([^\]]+)\]{2}', r'<cite w2gid="\g<1>">\g<2></cite>', text or ""))

def get_post(slug):
    r = requests.get(f"{GRAPH_API}/posts?action=search&field=slug&query={slug}&exact=true&limit=1&verbose=1", timeout=15).json()
    return r["posts"][0] if r.get("posts") else None

@app.get("/partials/{partial:path}")
def partial(request: Request, partial: str):
    name = f"partials/{partial}" if not partial.endswith(".html") else f"partials/{partial}"
    if os.path.isfile(os.path.join(TPL, name)):
        return templates.TemplateResponse(request=request, name=name, context={})
    return RedirectResponse("/")

@app.get("/posts")
def posts_index():
    return JSONResponse(requests.get(f"{GRAPH_API}/posts", timeout=15).json())

@app.get("/posts/{slug:path}")
def posts_show(request: Request, slug: str):
    post = get_post(slug)
    if not post: return RedirectResponse("/")
    title, body = post.get("title") or "", post.get("post") or ""
    tags = ', '.join(set(re.findall(r'(\[{2}[^\]]+\]{2})', title + body)))
    related = post.get("related_posts", []) or []
    for rp in related: rp["title"] = tagify(rp.get("title"))
    return render(request, "partials/post.html", post=post, tags=tagify(tags),
                  title=tagify(title), body=tagify(body), related_posts=related)

@app.get("/edit")
@app.get("/edit/{slug:path}")
def edit(request: Request, slug: str = ""):
    post = get_post(slug) if slug else None
    if post: post["post"] = Markup(post["post"])
    return render(request, "edit.html", post=post, slug=slug)

app.mount("/static", StaticFiles(directory=STATIC), name="static")

@app.get("/")
@app.get("/{uri:path}")
def base(request: Request, uri: str = ""):
    layout = uri.replace(".html", "")
    if not layout or layout.endswith("/"): layout = layout + "index"
    for cand in (f"partials/{layout}.html", f"partials/{layout}/index.html"):
        if os.path.isfile(os.path.join(TPL, cand)):
            return render(request, cand)
    return RedirectResponse("/") if uri else render(request, "partials/index.html")
