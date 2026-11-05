"""Two-language (EN / UA) support, resolved at build time.

How the site is bilingual
-------------------------
* Long-form pages exist twice: ``some/page.md`` (English) and
  ``some/uk/page.md`` (Ukrainian). The two files are paired automatically by
  that path rule — nothing else needs to be registered anywhere.
* Short interface strings inside templates are written side by side as
  ``data-en="…" data-ua="…"`` attributes. For Ukrainian pages this hook
  replaces the element's content with the ``data-ua`` text while building, so
  every language version is complete, static HTML (indexable, no JS needed).
* On Ukrainian pages every link to an English page that has a Ukrainian twin
  is rewritten to that twin, so templates can simply link to English URLs.
  (``data-href-en`` / ``data-href-ua`` still work for special cases.)
* A page whose ``uk/`` twin does not exist simply has no Ukrainian version;
  the language switcher then points to the Ukrainian section page instead.

Pages that keep both languages inside one file (news posts) still use
``data-en``/``data-ua``; they are rendered in English and switched in the
browser (see ``i18n-inline`` in main.html).
"""

from __future__ import annotations

import posixpath
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

# Labels of top-level tabs / nav sections, English -> Ukrainian.
NAV_UA = {
    "Home": "Головна",
    "News": "Новини",
    "About": "Про мене",
    "PhD": "Дисертація",
    "Authors": "Автори",
    "Articles": "Статті",
    "Books": "Книги",
}

_pairs: dict[str, str] = {}      # src_uri -> counterpart src_uri
_url_of: dict[str, str] = {}     # src_uri -> page url
_lang_of_url: dict[str, str] = {}
_alt_url: dict[str, str] = {}    # url -> counterpart url
_in_nav: set[str] = set()        # urls present in the navigation


def _norm(url: str) -> str:
    url = "/" + url.lstrip("/")
    return "/" if url in ("/.", "/./") else url


def lang_of(src_or_url: str) -> str:
    return "uk" if "/uk/" in "/" + src_or_url.lstrip("/") else "en"


def _twin(src: str) -> str:
    head, name = posixpath.split(src)
    if lang_of(src) == "uk":
        parent, uk = posixpath.split(head)
        return posixpath.join(parent, name) if uk == "uk" else ""
    return posixpath.join(head, "uk", name)


def on_files(files, config):
    _pairs.clear(); _url_of.clear(); _alt_url.clear(); _lang_of_url.clear()
    docs = {f.src_uri: f for f in files.documentation_pages()}
    for src, f in docs.items():
        _url_of[src] = _norm(f.url)
        twin = _twin(src)
        if twin in docs:
            _pairs[src] = twin
    for src, twin in _pairs.items():
        _alt_url[_url_of[src]] = _norm(docs[twin].url)
    for src, url in _url_of.items():
        _lang_of_url[url] = lang_of(src)
    return files


def on_nav(nav, config, files):
    _in_nav.clear()
    for page in nav.pages:
        _in_nav.add(_norm(page.url))
    return nav


def _section_fallback(url: str) -> str:
    """Nearest Ukrainian page up the tree, e.g. /authors/x/ -> /authors/uk/."""
    parts = [p for p in url.strip("/").split("/") if p]
    while parts:
        parts.pop()
        cand = "/" + "/".join(parts + ["uk"]) + "/"
        if cand in _lang_of_url:
            return cand
    return "/uk/"


def on_page_context(context, page, config, nav):
    url = _norm(page.url)
    lang = lang_of(page.file.src_uri)
    alt = _alt_url.get(url)
    inline = bool(page.meta.get("inline_bilingual")) or url.startswith("/news/")
    page.meta["i18n"] = {
        "lang": lang,
        "html_lang": "uk" if lang == "uk" else "en",
        "url": url,
        "alt_url": alt,
        "en_url": url if lang == "en" else alt,
        "uk_url": url if lang == "uk" else alt,
        # where the switcher's other-language button goes
        "switch_url": alt or (None if inline else (_section_fallback(url) if lang == "en" else None)),
        "inline": inline and not alt,
    }
    return context


def _localise(soup: BeautifulSoup, lang: str, base: str):
    key = "data-ua" if lang == "uk" else "data-en"
    for el in soup.select("[data-en]"):
        val = el.get(key)
        if val is None:
            continue
        el.clear()
        el.append(BeautifulSoup(val, "html.parser"))
    hkey = "data-href-ua" if lang == "uk" else "data-href-en"
    for el in soup.select("[data-href-en]"):
        el["href"] = el.get(hkey) or el.get("data-href-en")


def _abs(href: str, base: str) -> str:
    return urlparse(urljoin("http://x" + base, href)).path


def _nav_for_lang(soup: BeautifulSoup, lang: str, base: str):
    # Tabs + sidebar navigation
    for a in soup.select(".md-tabs__link, .md-nav__link[href]"):
        href = a.get("href")
        if not href or href.startswith(("http", "#")):
            continue
        target = _abs(href, base)
        tlang = _lang_of_url.get(target, "en")
        li = a.find_parent("li")
        if li is not None and "mobile-sections" in (li.get("class") or []):
            continue  # fixed main-section links; rewritten to UA twins below
        is_tab = "md-tabs__link" in (a.get("class") or [])
        if lang == "en":
            if tlang == "uk" and li is not None and not is_tab:
                li.decompose()
            continue
        # Ukrainian page
        if tlang == "en" and target in _alt_url:
            twin = _alt_url[target]
            if twin in _in_nav and not is_tab and li is not None \
                    and "md-nav__item--section" not in (li.get("class") or []) \
                    and not li.select_one(".md-nav__container"):
                li.decompose()
                continue
            a["href"] = twin
    if lang == "uk":
        for el in soup.select(".md-tabs__link, .md-nav__link, label.md-nav__title, .md-nav__item--section > label"):
            txt = el.get_text(strip=True)
            if txt in NAV_UA:
                for s in el.find_all(string=True):
                    if s.strip() == txt:
                        s.replace_with(s.replace(txt, NAV_UA[txt]))


def on_post_page(output, page, config):
    i18n = page.meta.get("i18n") or {}
    lang = i18n.get("lang", "en")
    base = i18n.get("url", "/")
    soup = BeautifulSoup(output, "html.parser")
    html = soup.find("html")
    if html is not None:
        html["lang"] = i18n.get("html_lang", "en")
    _localise(soup, lang, base)
    _nav_for_lang(soup, lang, base)
    if lang == "uk":
        # Any remaining link to an English page that has a Ukrainian twin
        # points to the twin instead.
        for a in soup.select("a[href]"):
            href = a["href"]
            if href.startswith(("http:", "https:", "mailto:", "#")) or a.find_parent(class_="lang-switch"):
                continue
            path, _, frag = href.partition("#")
            target = _abs(path or base, base)
            if _lang_of_url.get(target) == "en" and target in _alt_url:
                a["href"] = _alt_url[target] + ("#" + frag if frag else "")
    if not i18n.get("inline"):
        # Strings are final now; drop the duplicates to keep pages light.
        for el in soup.select("[data-en]"):
            del el["data-en"]
            if el.has_attr("data-ua"):
                del el["data-ua"]
    return str(soup)
