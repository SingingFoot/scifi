# Language switcher — global EN|UA toggle is handled in main.html via JS/CSS.
# This hook is intentionally a no-op; the file is kept so the hooks config entry
# in mkdocs.yml does not cause a build error.


def on_page_content(html, *, page, config, files):
    return html
