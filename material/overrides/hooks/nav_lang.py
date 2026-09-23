"""Keep the footer's Previous/Next links inside a single language.

MkDocs derives prev/next from one flat, nav-ordered page list, so the last
English page of a section links forward into the Ukrainian pages that follow
it in the nav (and the last Ukrainian page links on into English ones). The
EN|UA switcher in main.html only hides nav items with CSS, which never touches
the footer. This hook rebuilds the prev/next chain once per language, so the
footer links stay in the language of the page the reader is on.
"""


def _lang(page):
    return "uk" if "/uk/" in "/" + page.url else "en"


def on_nav(nav, config, files):
    for lang in ("en", "uk"):
        chain = [page for page in nav.pages if _lang(page) == lang]
        for i, page in enumerate(chain):
            page.previous_page = chain[i - 1] if i else None
            page.next_page = chain[i + 1] if i + 1 < len(chain) else None
    return nav
