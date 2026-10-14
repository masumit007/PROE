
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("submitPaperForm");
  const titleInput = document.getElementById("paperTitle");
  const topicInput = document.getElementById("paperTopic");
  const keywordsInput = document.getElementById("paperKeywords");
  const abstractInput = document.getElementById("paperAbstract");
  const fileInput = document.getElementById("paperFile");

  const titleCount = document.getElementById("titleCount");
  const abstractCount = document.getElementById("abstractCount");

  const dropzone = document.getElementById("uploadDropzone");
  const uploadContent = document.getElementById("uploadContent");
  const selectedFile = document.getElementById("selectedFile");
  const fileName = document.getElementById("fileName");
  const fileSize = document.getElementById("fileSize");
  const removeFileButton = document.getElementById("removeFile");
  const uploadError = document.getElementById("uploadError");

  const message = document.getElementById("submissionMessage");
  const submitButton = document.getElementById("submitPaperButton");
  const submissionYear = document.getElementById("submissionYear");

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  let selectedPdf = null;

  if (submissionYear) {
    submissionYear.textContent = new Date().getFullYear();
  }

  if (!form || !titleInput || !topicInput || !abstractInput || !fileInput) {
    console.error("PROE submission form: a required form element is missing.");
    return;
  }

  /* Character counters */

  function updateCounter(input, output, maximum) {
    if (!input || !output) return;

    output.textContent = `${input.value.length} / ${maximum}`;
  }

  titleInput.addEventListener("input", () => {
    updateCounter(titleInput, titleCount, 200);
    clearFeedback();
  });

  abstractInput.addEventListener("input", () => {
    updateCounter(abstractInput, abstractCount, 10000);
    clearFeedback();
  });

  updateCounter(titleInput, titleCount, 200);
  updateCounter(abstractInput, abstractCount, 10000);

  /* Feedback helpers */

  function showMessage(text, type = "success") {
    if (!message) return;

    message.hidden = false;
    message.textContent = text;
    message.classList.toggle("error", type === "error");
  }

  function clearFeedback() {
    if (message) {
      message.hidden = true;
      message.textContent = "";
      message.classList.remove("error");
    }

    if (uploadError) {
      uploadError.hidden = true;
      uploadError.textContent = "";
    }
  }

  function showUploadError(text) {
    if (!uploadError) return;

    uploadError.hidden = false;
    uploadError.textContent = text;
  }

  /* File formatting */

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function isPdf(file) {
    const hasPdfExtension = /\.pdf$/i.test(file.name);
    const validMimeType =
      file.type === "application/pdf" || file.type === "";

    return hasPdfExtension && validMimeType;
  }

  /* Upload zone */

  function renderSelectedFile(file) {
    if (uploadContent) uploadContent.hidden = Boolean(file);
    if (selectedFile) selectedFile.hidden = !file;

    if (!file) {
      if (fileName) fileName.textContent = "";
      if (fileSize) fileSize.textContent = "";
      return;
    }

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
  }

  function setFile(file) {
    clearFeedback();

    if (!file) return;

    if (!isPdf(file)) {
      showUploadError("Please select a PDF file with a .pdf extension.");
      return;
    }

    if (file.size === 0) {
      showUploadError("The selected PDF is empty. Please choose another file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showUploadError("The PDF exceeds the 10 MB limit. Please select a smaller file.");
      return;
    }

    selectedPdf = file;
    renderSelectedFile(file);

    // Keep the native file input synchronized for normal file-picker use.
    // For drag-and-drop, FormData can use selectedPdf separately.
    showMessage("PDF selected successfully. Your file is ready for validation.");
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];

    if (file) {
      setFile(file);
    } else {
      selectedPdf = null;
      renderSelectedFile(null);
    }
  });

  removeFileButton?.addEventListener("click", () => {
    selectedPdf = null;
    fileInput.value = "";
    renderSelectedFile(null);
    clearFeedback();
  });

  /* Drag and drop */

  if (dropzone) {
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "dragend", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];

      if (file) {
        setFile(file);
      }
    });
  }

  /* Form validation */

  function validateForm() {
    clearFeedback();

    const title = titleInput.value.trim();
    const topic = topicInput.value.trim();
    const abstractText = abstractInput.value.trim();

    if (!title) {
      showMessage("Please enter your research paper title.", "error");
      titleInput.focus();
      return false;
    }

    if (title.length < 5) {
      showMessage("Please enter a more descriptive title of at least 5 characters.", "error");
      titleInput.focus();
      return false;
    }

    if (title.length > 200) {
      showMessage("The title must be 200 characters or fewer.", "error");
      titleInput.focus();
      return false;
    }

    if (!topic) {
      showMessage("Please select a research topic.", "error");
      topicInput.focus();
      return false;
    }

    if (!abstractText) {
      showMessage("Please provide an abstract for your research.", "error");
      abstractInput.focus();
      return false;
    }

    if (abstractText.length < 30) {
      showMessage("Please expand your abstract to at least 30 characters.", "error");
      abstractInput.focus();
      return false;
    }

    if (abstractText.length > 10000) {
      showMessage("The abstract must be 10,000 characters or fewer.", "error");
      abstractInput.focus();
      return false;
    }

    if (!selectedPdf) {
      showMessage("Please choose your research paper PDF.", "error");
      fileInput.focus();
      return false;
    }

    if (!isPdf(selectedPdf)) {
      showMessage("Please choose a valid PDF file.", "error");
      return false;
    }

    if (selectedPdf.size === 0 || selectedPdf.size > MAX_FILE_SIZE) {
      showMessage("The PDF must be larger than 0 bytes and no larger than 10 MB.", "error");
      return false;
    }

    return true;
  }

  /* Submission readiness */

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    /*
      Backend integration intentionally remains separate.

      When your teammate provides the real upload endpoint,
      send these values using FormData and fetch():

      - title
      - topic
      - keywords
      - abstract
      - file

      Do not claim a server upload succeeded until the API
      actually returns a successful response.
    */

    const submissionData = {
      title: titleInput.value.trim(),
      topic: topicInput.value.trim(),
      keywords: keywordsInput?.value.trim() || "",
      abstract: abstractInput.value.trim(),
      fileName: selectedPdf.name,
      fileSize: selectedPdf.size
    };

    console.info("PROE submission passed local validation.", submissionData);

    showMessage(
      "Validation complete! Your paper details and PDF are ready. The paper has not been uploaded to the server yet; backend API integration is required.",
      "success"
    );
  });
});
