/*
 * Very simple in-browser .docx viewer/editor.
 * Open  -> mammoth.js converts the .docx to HTML for viewing/editing.
 * Save  -> html-docx-js repackages the edited HTML back into a .docx file.
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

  if (fontNameSelect) {
    fontNameSelect.addEventListener("mousedown", function () {
      contentEl.focus();
    });
    fontNameSelect.addEventListener("change", function () {
      document.execCommand("fontName", false, fontNameSelect.value);
      contentEl.focus();
    });
  }

  if (fontSizeInput) {
    fontSizeInput.addEventListener("mousedown", function () {
      contentEl.focus();
    });
    fontSizeInput.addEventListener("change", function () {
      var pt = parseInt(fontSizeInput.value, 10);
      if (!pt) {
        return;
      }
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

  downloadBtn.addEventListener("click", function () {
    var html =
      "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>" +
      contentEl.innerHTML +
      "</body></html>";

    var blob = htmlDocx.asBlob(html);
    var name = currentName.replace(/\.docx$/i, "") + "-edited.docx";
    saveAs(blob, name);
  });
})();
