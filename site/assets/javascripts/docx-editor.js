/*
 * Very simple in-browser .docx viewer/editor.
 * Open  -> mammoth.js converts the .docx to HTML for viewing/editing.
 * Save  -> the edited HTML is walked into real docx.js paragraphs/runs, so the
 *          result is a genuine OOXML file that both Word and this same page's
 *          mammoth-based viewer can read back correctly.
 * Everything runs client-side; no file ever leaves the browser.
 */
(function () {
  "use strict";

  var fileInput = document.getElementById("docx-file-input");
  var downloadBtn = document.getElementById("docx-download-btn");
  var statusEl = document.getElementById("docx-status");
  var contentEl = document.getElementById("docx-content");
  var fontNameSelect = document.getElementById("docx-font-name");
  var fontSizeInput = document.getElementById("docx-font-size");
  var fmtButtons = document.querySelectorAll(".docx-fmt-btn");

  if (!fileInput || !downloadBtn || !statusEl || !contentEl) {
    return;
  }

  function setFormattingEnabled(enabled) {
    fmtButtons.forEach(function (btn) {
      btn.disabled = !enabled;
    });
    if (fontNameSelect) fontNameSelect.disabled = !enabled;
    if (fontSizeInput) fontSizeInput.disabled = !enabled;
  }

  fmtButtons.forEach(function (btn) {
    // preventDefault on mousedown so the selection inside contentEl survives the click
    btn.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    btn.addEventListener("click", function () {
      var cmd = btn.getAttribute("data-cmd");
      if (!cmd) {
        // Buttons like the footnote inserter have their own click handler.
        return;
      }
      document.execCommand(cmd, false, null);
      contentEl.focus();
    });
  });

  // Clicking into the font-name select or the font-size number input moves
  // focus away from contentEl, which collapses/clears the text selection the
  // user just made. Unlike the B/I/U buttons, these controls can't block that
  // with preventDefault (the user needs to actually type/pick a value), so we
  // save the last selection made inside contentEl and restore it right before
  // running the format command.
  var savedRange = null;

  function restoreSelection() {
    if (!savedRange) {
      return;
    }
    var selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  if (fontNameSelect) {
    fontNameSelect.addEventListener("change", function () {
      contentEl.focus();
      restoreSelection();
      document.execCommand("fontName", false, fontNameSelect.value);
      contentEl.focus();
    });
  }

  if (fontSizeInput) {
    fontSizeInput.addEventListener("change", function () {
      var pt = parseInt(fontSizeInput.value, 10);
      if (!pt) {
        return;
      }
      contentEl.focus();
      restoreSelection();
      // execCommand only understands the legacy 1-7 scale, so apply size 7
      // then rewrite the <font size="7"> it produces into a real pt value.
      document.execCommand("fontSize", false, "7");
      contentEl.querySelectorAll('font[size="7"]').forEach(function (el) {
        el.removeAttribute("size");
        el.style.fontSize = pt + "pt";
      });
      contentEl.focus();
    });
  }

  function pxToPt(px) {
    return Math.round((parseFloat(px) || 0) * 72 / 96);
  }

  document.addEventListener("selectionchange", function () {
    if (contentEl.getAttribute("contenteditable") !== "true") {
      return;
    }
    var selection = document.getSelection();
    if (
      !selection.anchorNode ||
      !contentEl.contains(selection.anchorNode)
    ) {
      return;
    }

    if (selection.rangeCount) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }

    fmtButtons.forEach(function (btn) {
      var cmd = btn.getAttribute("data-cmd");
      if (!cmd) {
        return;
      }
      btn.classList.toggle("docx-fmt-btn--active", document.queryCommandState(cmd));
    });

    var node = selection.anchorNode;
    var el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el) {
      return;
    }
    var computed = window.getComputedStyle(el);

    if (fontSizeInput && document.activeElement !== fontSizeInput) {
      fontSizeInput.value = pxToPt(computed.fontSize);
    }

    if (fontNameSelect && document.activeElement !== fontNameSelect) {
      var family = computed.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      var hasMatch = Array.prototype.some.call(fontNameSelect.options, function (opt) {
        return opt.value === family;
      });
      fontNameSelect.value = hasMatch ? family : "";
    }
  });

  // ---------------------------------------------------------------------
  // Footnotes
  //
  // A footnote is two linked pieces kept in sync by a shared, never-reused
  // "uid": a <sup> reference mark inline in the text, and an entry in a
  // footnotes block appended at the end of the document (mirroring how
  // Word shows footnote text at the bottom of the page). Both the mark and
  // the delete button are contenteditable="false" (atomic, like Word
  // treats them); only the footnote's own text is editable. Numbers are
  // never stored — they're recomputed from document order every time a
  // footnote is added, deleted, or its reference is moved/removed, so
  // renumbering is always automatic, like Word.
  // ---------------------------------------------------------------------

  var footnoteBtn = document.getElementById("docx-footnote-btn");
  var footnoteUidCounter = 1;

  function getFootnotesContainer() {
    return document.getElementById("docx-footnotes");
  }

  function createFootnotesContainer() {
    var existing = getFootnotesContainer();
    if (existing) {
      return existing;
    }
    var container = document.createElement("div");
    container.id = "docx-footnotes";
    container.className = "docx-footnotes";
    container.setAttribute("contenteditable", "false");

    var rule = document.createElement("hr");
    rule.className = "docx-footnotes__rule";

    var list = document.createElement("div");
    list.className = "docx-footnotes__list";

    container.appendChild(rule);
    container.appendChild(list);
    contentEl.appendChild(container);
    return container;
  }

  function createFootnoteRefElement(uid) {
    var sup = document.createElement("sup");
    sup.className = "docx-footnote-ref";
    sup.setAttribute("contenteditable", "false");
    sup.dataset.footnoteUid = uid;
    return sup;
  }

  function createFootnoteEntryElement(uid) {
    var entry = document.createElement("div");
    entry.className = "docx-footnote";
    entry.dataset.footnoteUid = uid;
    entry.setAttribute("contenteditable", "false");

    var num = document.createElement("span");
    num.className = "docx-footnote__num";

    var text = document.createElement("span");
    text.className = "docx-footnote__text";
    text.setAttribute("contenteditable", "true");

    var del = document.createElement("button");
    del.type = "button";
    del.className = "docx-footnote__delete";
    del.title = "Delete footnote";
    del.setAttribute("contenteditable", "false");
    del.textContent = "×";

    entry.appendChild(num);
    entry.appendChild(text);
    entry.appendChild(del);
    return entry;
  }

  // Recomputes footnote numbers from the reference marks' document order,
  // and reorders the footnote entries to match — exactly what Word does
  // whenever a footnote is added, deleted, or moved.
  function renumberFootnotes() {
    var refs = Array.prototype.slice.call(contentEl.querySelectorAll("sup.docx-footnote-ref"));
    var container = getFootnotesContainer();
    if (refs.length === 0) {
      if (container) {
        container.remove();
      }
      return;
    }
    var list = container.querySelector(".docx-footnotes__list");
    refs.forEach(function (ref, index) {
      var n = index + 1;
      ref.textContent = String(n);
      var entry = list.querySelector('.docx-footnote[data-footnote-uid="' + ref.dataset.footnoteUid + '"]');
      if (entry) {
        entry.querySelector(".docx-footnote__num").textContent = n + ".";
        list.appendChild(entry); // re-append in ref order to sort the list
      }
    });
  }

  // If the user deletes a reference mark directly from the text (backspace,
  // cutting a paragraph, undo, ...) the matching footnote entry is now
  // orphaned; drop it and renumber, same as Word does.
  function pruneOrphanFootnotes() {
    var container = getFootnotesContainer();
    if (!container) {
      return;
    }
    var liveUids = {};
    Array.prototype.forEach.call(contentEl.querySelectorAll("sup.docx-footnote-ref"), function (ref) {
      liveUids[ref.dataset.footnoteUid] = true;
    });
    var changed = false;
    Array.prototype.forEach.call(container.querySelectorAll(".docx-footnote"), function (entry) {
      if (!liveUids[entry.dataset.footnoteUid]) {
        entry.remove();
        changed = true;
      }
    });
    if (changed) {
      renumberFootnotes();
    }
  }

  function deleteFootnote(uid) {
    var ref = contentEl.querySelector('sup.docx-footnote-ref[data-footnote-uid="' + uid + '"]');
    if (ref) {
      ref.remove();
    }
    var container = getFootnotesContainer();
    var entry = container && container.querySelector('.docx-footnote[data-footnote-uid="' + uid + '"]');
    if (entry) {
      entry.remove();
    }
    renumberFootnotes();
  }

  if (footnoteBtn) {
    footnoteBtn.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    footnoteBtn.addEventListener("click", function () {
      // Unlike the font-size/font-name controls, this button's mousedown
      // handler already prevents focus from ever leaving contentEl, so the
      // live selection is still whatever the user last set — no need (and
      // it would be wrong) to restore the separately-cached savedRange.
      var selection = document.getSelection();
      var insertRange;
      var startNode = selection.rangeCount > 0 ? selection.getRangeAt(0).startContainer : null;
      var startEl = startNode && (startNode.nodeType === Node.ELEMENT_NODE ? startNode : startNode.parentElement);
      var insertingInsideFootnotes = !!(startEl && startEl.closest && startEl.closest(".docx-footnotes"));

      if (selection.rangeCount > 0 && contentEl.contains(startNode) && !insertingInsideFootnotes) {
        insertRange = selection.getRangeAt(0);
      } else {
        // No usable selection in the main text (or the caret was inside
        // another footnote, which Word doesn't allow) — insert at the end.
        insertRange = document.createRange();
        insertRange.selectNodeContents(contentEl);
        insertRange.collapse(false);
      }

      var container = createFootnotesContainer();
      var uid = "fn-" + footnoteUidCounter++;
      var refEl = createFootnoteRefElement(uid);
      insertRange.deleteContents();
      insertRange.insertNode(refEl);
      insertRange.setStartAfter(refEl);
      insertRange.setEndAfter(refEl);
      selection.removeAllRanges();
      selection.addRange(insertRange);

      var entry = createFootnoteEntryElement(uid);
      container.querySelector(".docx-footnotes__list").appendChild(entry);
      renumberFootnotes();

      // Jump the caret into the new footnote's text, like Word does.
      var textEl = entry.querySelector(".docx-footnote__text");
      var textRange = document.createRange();
      textRange.selectNodeContents(textEl);
      textRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(textRange);
      textEl.focus();
    });
  }

  contentEl.addEventListener("click", function (event) {
    var delBtn = event.target.closest && event.target.closest(".docx-footnote__delete");
    if (!delBtn) {
      return;
    }
    event.preventDefault();
    var entry = delBtn.closest(".docx-footnote");
    if (entry) {
      deleteFootnote(entry.dataset.footnoteUid);
    }
  });

  new MutationObserver(function () {
    pruneOrphanFootnotes();
  }).observe(contentEl, { childList: true, subtree: true });

  // mammoth renders existing footnotes as a plain <ol> of <li id="footnote-N">
  // appended after the document, with in-text <sup><a href="#footnote-N">
  // markers. Convert that into our editable footnote UI so footnotes already
  // in an opened file work the same as ones inserted here.
  function importFootnotesFromMammoth() {
    var noteList = null;
    Array.prototype.forEach.call(contentEl.querySelectorAll(":scope > ol"), function (ol) {
      if (ol.querySelector('li[id^="footnote-"], li[id^="endnote-"]')) {
        noteList = ol;
      }
    });
    if (!noteList) {
      return;
    }

    var container = createFootnotesContainer();
    var list = container.querySelector(".docx-footnotes__list");
    var uidByNoteId = {};

    Array.prototype.forEach.call(noteList.querySelectorAll(":scope > li[id]"), function (li) {
      if (!/^(?:footnote|endnote)-/.test(li.id)) {
        return;
      }
      var uid = "fn-" + footnoteUidCounter++;
      uidByNoteId[li.id] = uid;

      // Drop mammoth's "↑ back to text" link. It's usually merged into the
      // same trailing <p> as the footnote's own text (not a separate
      // paragraph), so target the link itself rather than assuming a
      // whole last-child paragraph to remove.
      var backLink = li.querySelector('a[href^="#footnote-ref-"], a[href^="#endnote-ref-"]');
      if (backLink) {
        var backLinkParent = backLink.parentElement;
        var beforeBackLink = backLink.previousSibling;
        if (beforeBackLink && beforeBackLink.nodeType === Node.TEXT_NODE && /^\s+$/.test(beforeBackLink.textContent)) {
          beforeBackLink.remove();
        }
        backLink.remove();
        if (backLinkParent && backLinkParent.tagName === "P" && !backLinkParent.textContent.trim() && !backLinkParent.querySelector("*")) {
          backLinkParent.remove();
        }
      }

      var entry = createFootnoteEntryElement(uid);
      entry.querySelector(".docx-footnote__text").innerHTML = li.innerHTML || "";
      list.appendChild(entry);
    });
    noteList.remove();

    Array.prototype.forEach.call(
      contentEl.querySelectorAll('sup > a[id^="footnote-ref-"], sup > a[id^="endnote-ref-"]'),
      function (anchor) {
        var uid = uidByNoteId[anchor.getAttribute("href").replace(/^#/, "")];
        if (!uid) {
          return;
        }
        anchor.parentElement.replaceWith(createFootnoteRefElement(uid));
      }
    );

    renumberFootnotes();
  }

  var currentName = "document.docx";

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle("docx-editor__status--error", !!isError);
  }

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) {
      return;
    }

    currentName = file.name;
    setStatus("Loading " + file.name + " …");
    contentEl.setAttribute("contenteditable", "false");
    downloadBtn.disabled = true;
    setFormattingEnabled(false);

    var reader = new FileReader();
    reader.onerror = function () {
      setStatus("Could not read the file.", true);
    };
    reader.onload = function (event) {
      mammoth
        .convertToHtml({ arrayBuffer: event.target.result })
        .then(function (result) {
          contentEl.innerHTML = result.value || "<p><em>(empty document)</em></p>";
          importFootnotesFromMammoth();
          contentEl.setAttribute("contenteditable", "true");
          downloadBtn.disabled = false;
          setFormattingEnabled(true);
          setStatus(
            "Opened " + file.name + " — click the text below to edit it."
          );
        })
        .catch(function (error) {
          setStatus("Could not open this file: " + error.message, true);
        });
    };
    reader.readAsArrayBuffer(file);
  });

  var HEADING_TAGS = {
    h1: docx.HeadingLevel.HEADING_1,
    h2: docx.HeadingLevel.HEADING_2,
    h3: docx.HeadingLevel.HEADING_3,
    h4: docx.HeadingLevel.HEADING_4,
    h5: docx.HeadingLevel.HEADING_5,
    h6: docx.HeadingLevel.HEADING_6,
  };

  // Populated right before export (see collectFootnotes) so buildRuns can
  // turn each <sup class="docx-footnote-ref"> into a real docx footnote
  // reference instead of literal "1" text.
  var footnoteExportIdByUid = {};

  // Walks the edited HTML into a flat list of docx.TextRun, carrying bold/
  // italic/underline/font/size down through nested <b>/<i>/<u>/<span> tags.
  function buildRuns(node, props) {
    var runs = [];
    node.childNodes.forEach(function (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent) {
          runs.push(new docx.TextRun(Object.assign({ text: child.textContent }, props)));
        }
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      if (child.tagName === "BR") {
        runs.push(new docx.TextRun({ text: "", break: 1 }));
        return;
      }
      if (child.classList.contains("docx-footnote-ref")) {
        var exportId = footnoteExportIdByUid[child.dataset.footnoteUid];
        if (exportId) {
          runs.push(new docx.FootnoteReferenceRun(exportId));
        }
        return;
      }

      var childProps = Object.assign({}, props);
      var tag = child.tagName.toLowerCase();
      if (tag === "b" || tag === "strong") childProps.bold = true;
      if (tag === "i" || tag === "em") childProps.italics = true;
      if (tag === "u") childProps.underline = {};

      var style = child.getAttribute("style") || "";
      var sizeMatch = /font-size:\s*([\d.]+)pt/i.exec(style);
      if (sizeMatch) childProps.size = Math.round(parseFloat(sizeMatch[1]) * 2);
      var fontMatch = /font-family:\s*([^;]+)/i.exec(style);
      if (fontMatch) childProps.font = fontMatch[1].replace(/["']/g, "").trim();
      if (tag === "font" && child.hasAttribute("face")) {
        childProps.font = child.getAttribute("face");
      }

      runs = runs.concat(buildRuns(child, childProps));
    });
    return runs;
  }

  var ALIGNMENT_MAP = {
    left: docx.AlignmentType.LEFT,
    center: docx.AlignmentType.CENTER,
    right: docx.AlignmentType.RIGHT,
    justify: docx.AlignmentType.JUSTIFIED,
  };

  // execCommand's justify* commands set text-align on the block-level element
  // they're applied to, so that's where we read it back from on export.
  function getAlignment(el) {
    return ALIGNMENT_MAP[el.style.textAlign] || undefined;
  }

  // Walks the top-level block elements (headings, paragraphs, lists) into
  // docx.Paragraph objects, one per visual line/list item.
  function buildParagraphs(container) {
    var paragraphs = [];
    Array.prototype.forEach.call(container.children, function (el) {
      if (el.id === "docx-footnotes") {
        return;
      }
      var tag = el.tagName.toLowerCase();
      if (HEADING_TAGS[tag]) {
        paragraphs.push(new docx.Paragraph({ heading: HEADING_TAGS[tag], alignment: getAlignment(el), children: buildRuns(el, {}) }));
      } else if (tag === "ul" || tag === "ol") {
        Array.prototype.forEach.call(el.querySelectorAll(":scope > li"), function (li, index) {
          var prefix = tag === "ul" ? "• " : index + 1 + ". ";
          var runs = buildRuns(li, {});
          runs.unshift(new docx.TextRun({ text: prefix }));
          paragraphs.push(new docx.Paragraph({ alignment: getAlignment(li), children: runs }));
        });
      } else {
        paragraphs.push(new docx.Paragraph({ alignment: getAlignment(el), children: buildRuns(el, {}) }));
      }
    });
    if (paragraphs.length === 0) {
      paragraphs.push(new docx.Paragraph({ text: "" }));
    }
    return paragraphs;
  }

  // Assigns each footnote reference a docx-style numeric id (matching its
  // current on-screen number) and builds the docx.Document "footnotes" map
  // from each entry's editable text. Must run before buildParagraphs, which
  // relies on footnoteExportIdByUid to turn refs into real footnote runs.
  function collectFootnotes() {
    var refs = Array.prototype.slice.call(contentEl.querySelectorAll("sup.docx-footnote-ref"));
    var container = getFootnotesContainer();
    footnoteExportIdByUid = {};
    var footnotes = {};
    refs.forEach(function (ref, index) {
      var exportId = index + 1;
      footnoteExportIdByUid[ref.dataset.footnoteUid] = exportId;
      var entry = container
        ? container.querySelector('.docx-footnote[data-footnote-uid="' + ref.dataset.footnoteUid + '"]')
        : null;
      var textEl = entry ? entry.querySelector(".docx-footnote__text") : null;
      var runs = textEl ? buildRuns(textEl, {}) : [];
      if (runs.length === 0) {
        runs.push(new docx.TextRun({ text: "" }));
      }
      footnotes[exportId] = { children: [new docx.Paragraph({ children: runs })] };
    });
    return footnotes;
  }

  downloadBtn.addEventListener("click", function () {
    var footnotes = collectFootnotes();
    var doc = new docx.Document({
      sections: [{ children: buildParagraphs(contentEl) }],
      footnotes: footnotes,
    });
    docx.Packer.toBlob(doc).then(function (blob) {
      var name = currentName.replace(/\.docx$/i, "") + "-edited.docx";
      saveAs(blob, name);
    });
  });
})();
