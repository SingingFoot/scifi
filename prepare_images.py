#!/usr/bin/env python3
"""
prepare_images.py
=================
Run this after you've saved the three photos below into docs/assets/images/.

Required files you need to save manually:
  docs/assets/images/books-combined.jpg  — your photo of both books side by side
                                           (Temponavty on LEFT, Sonyachny Viter on RIGHT)
  docs/assets/images/berezhnyi.jpg       — the b&w portrait of Vasyl Berezhnyi
  docs/assets/images/logo-pub.png        — the publisher's square logo

Run with:
    python3 prepare_images.py
"""

from PIL import Image
import os, sys

BASE = os.path.join(os.path.dirname(__file__), "docs", "assets", "images")

def check(path, label):
    if not os.path.exists(path):
        print(f"  ✗  MISSING: {path}  ← save your {label} here")
        return False
    print(f"  ✓  Found: {path}")
    return True

# ── 1. Split the combined book photo ──────────────────────────────────────────
combined = os.path.join(BASE, "books-combined.jpg")
zayets_book = os.path.join(BASE, "zayets-book.jpg")
polozhiy_book = os.path.join(BASE, "polozhiy-book.jpg")

print("\n[1] Splitting combined book photo →")
if check(combined, "photo of both books"):
    img = Image.open(combined)
    w, h = img.size
    mid = w // 2

    left  = img.crop((0,    0, mid, h))
    right = img.crop((mid,  0, w,   h))

    # Scale to a consistent height (900px) for book covers
    def resize_cover(im, target_h=900):
        ratio = target_h / im.height
        return im.resize((int(im.width * ratio), target_h), Image.LANCZOS)

    left  = resize_cover(left)
    right = resize_cover(right)

    left.convert("RGB").save(zayets_book,   "JPEG", quality=88)
    right.convert("RGB").save(polozhiy_book, "JPEG", quality=88)
    print(f"     → zayets-book.jpg   ({left.width}×{left.height})")
    print(f"     → polozhiy-book.jpg ({right.width}×{right.height})")

# ── 2. Resize Berezhnyi portrait ──────────────────────────────────────────────
berezhnyi_src = os.path.join(BASE, "berezhnyi.jpg")
print("\n[2] Preparing Berezhnyi portrait →")
if check(berezhnyi_src, "Berezhnyi b&w portrait"):
    img = Image.open(berezhnyi_src)
    img.thumbnail((600, 800), Image.LANCZOS)
    img.convert("RGB").save(berezhnyi_src, "JPEG", quality=88)
    print(f"     → berezhnyi.jpg resized to {img.width}×{img.height}")

# ── 3. Check logo ─────────────────────────────────────────────────────────────
logo = os.path.join(BASE, "logo-pub.png")
print("\n[3] Checking publisher logo →")
if check(logo, "publisher logo (square аб symbol)"):
    img = Image.open(logo)
    if img.height > 120:
        img.thumbnail((300, 120), Image.LANCZOS)
        img.save(logo, "PNG", optimize=True)
        print(f"     → logo-pub.png resized to {img.width}×{img.height}")
    else:
        print(f"     → logo-pub.png OK ({img.width}×{img.height})")

# ── Also resize zayets2.jpg if it's huge ─────────────────────────────────────
z2 = os.path.join(BASE, "zayets2.jpg")
if os.path.exists(z2):
    img = Image.open(z2)
    if img.width > 800:
        img.thumbnail((600, 800), Image.LANCZOS)
        img.convert("RGB").save(z2, "JPEG", quality=88)
        print(f"\n[4] zayets2.jpg resized to {img.width}×{img.height}")

print("\nDone! Now run:  mkdocs serve\n")
