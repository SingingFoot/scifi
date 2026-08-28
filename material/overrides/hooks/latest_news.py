"""Expose the most recent blog posts to templates for the home-page widget.

The home page shows a fixed number of the latest news items; older posts drop
out of the widget but remain available on the News page.
"""

import re

# Number of items the home-page news widget holds.
MAX_ITEMS = 8

# The Ukrainian headline lives in the data-ua attribute of the post's H1 span.
TITLE_UA = re.compile(r'<span[^>]*\bdata-ua="([^"]*)"', re.IGNORECASE)


def _created(post):
    date = getattr(post.config, "date", None) or {}
    return date.get("created")


def on_env(env, config, files, **kwargs):
    plugin = config.plugins.get("material/blog")
    posts = list(getattr(getattr(plugin, "blog", None), "posts", None) or [])
    posts.sort(key=_created, reverse=True)

    latest = []
    for post in posts[:MAX_ITEMS]:
        match = TITLE_UA.search(post.markdown or "")
        latest.append({
            "url": post.url,
            "title": post.title,
            "title_ua": match.group(1) if match else post.title,
        })

    env.globals["latest_news"] = latest
    return env
