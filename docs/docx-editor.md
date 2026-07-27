---
description: A very simple, browser-based viewer and editor for .docx (Word) files — open, edit, and download without uploading anything to a server.
---

# DOCx Editor

A lightweight tool for opening a `.docx` file, editing its text right in the page, and downloading the result — all in your browser. Nothing is uploaded anywhere.

<div class="docx-editor">
  <div class="docx-editor__toolbars">
    <div class="docx-editor__toolbar">
      <input type="file" id="docx-file-input" accept=".docx">
      <button type="button" id="docx-download-btn" disabled>Save as .docx</button>
    </div>
    <div id="docx-format-toolbar" class="docx-editor__format-toolbar">
      <button type="button" class="docx-fmt-btn" data-cmd="bold" title="Bold" disabled><strong>B</strong></button>
      <button type="button" class="docx-fmt-btn" data-cmd="italic" title="Italic" disabled><em>I</em></button>
      <button type="button" class="docx-fmt-btn" data-cmd="underline" title="Underline" disabled><span class="docx-fmt-underline">U</span></button>
      <span class="docx-editor__sep"></span>
      <select id="docx-font-name" title="Font" disabled>
        <option value="Arial">Arial</option>
        <option value="Calibri">Calibri</option>
        <option value="Cambria">Cambria</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
      </select>
      <input type="number" id="docx-font-size" title="Font size (pt)" min="6" max="96" step="1" value="12" disabled>
      <span class="docx-editor__sep"></span>
      <button type="button" class="docx-fmt-btn" data-cmd="justifyLeft" title="Align left" disabled>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="3" y="4" width="18" height="2"/><rect x="3" y="9" width="12" height="2"/><rect x="3" y="14" width="18" height="2"/><rect x="3" y="19" width="12" height="2"/></svg>
      </button>
      <button type="button" class="docx-fmt-btn" data-cmd="justifyCenter" title="Align center" disabled>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="3" y="4" width="18" height="2"/><rect x="6" y="9" width="12" height="2"/><rect x="3" y="14" width="18" height="2"/><rect x="6" y="19" width="12" height="2"/></svg>
      </button>
      <button type="button" class="docx-fmt-btn" data-cmd="justifyRight" title="Align right" disabled>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="3" y="4" width="18" height="2"/><rect x="9" y="9" width="12" height="2"/><rect x="3" y="14" width="18" height="2"/><rect x="9" y="19" width="12" height="2"/></svg>
      </button>
      <button type="button" class="docx-fmt-btn" data-cmd="justifyFull" title="Justify" disabled>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="3" y="4" width="18" height="2"/><rect x="3" y="9" width="18" height="2"/><rect x="3" y="14" width="18" height="2"/><rect x="3" y="19" width="18" height="2"/></svg>
      </button>
      <span class="docx-editor__sep"></span>
      <button type="button" id="docx-footnote-btn" class="docx-fmt-btn" title="Insert footnote" disabled>AB<sup>1</sup></button>
    </div>
    <div id="docx-status" class="docx-editor__status">Choose a .docx file to begin.</div>
  </div>
  <div id="docx-content" class="docx-editor__content"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/mammoth@1.7.2/mammoth.browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/docx@8.0.0/build/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
<script src="../assets/javascripts/docx-editor.js"></script>
