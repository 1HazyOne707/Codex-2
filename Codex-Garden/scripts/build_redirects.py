import os, yaml, pathlib, html

SRC = "offers/offers.yaml"
OUT = pathlib.Path("site/go")
REDIRECTS = []

tpl = """<!doctype html><html lang="en"><meta charset="utf-8">
<title>Redirecting…</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={url}">
<script>window.location.replace("{url}");</script>
<body>
  <p>Redirecting to <a href="{url}">{name}</a>…</p>
</body></html>
"""

with open(SRC, "r") as f:
    offers = yaml.safe_load(f)

for o in offers:
    slug = o["slug"].strip()
    name = o.get("name", slug)
    url  = o["url"].strip()
    # write /site/go/<slug>/index.html
    d = OUT / slug
    d.mkdir(parents=True, exist_ok=True)
    with open(d / "index.html", "w") as h:
        h.write(tpl.format(url=html.escape(url, quote=True), name=html.escape(name)))
    # add a 301 rule for Netlify/Cloudflare Pages style deployments
    REDIRECTS.append(f"/go/{slug}  {url}  301!")

# write _redirects file (optional, harmless on GH Pages)
with open("site/_redirects", "w") as r:
    r.write("\n".join(REDIRECTS) + "\n")

print(f"Built {len(offers)} redirects into site/go/")
