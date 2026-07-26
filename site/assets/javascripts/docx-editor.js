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
      document.execCommand(btn.getAttribute("data-cmd"), false, null);
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

  downloadBtn.addEventListener("click", function () {
    var doc = new docx.Document({
      sections: [{ children: buildParagraphs(contentEl) }],
    });
    docx.Packer.toBlob(doc).then(function (blob) {
      var name = currentName.replace(/\.docx$/i, "") + "-edited.docx";
      saveAs(blob, name);
    });
  });
})();
