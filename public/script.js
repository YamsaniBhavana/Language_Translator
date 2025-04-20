// Existing selectors
const dropdowns = document.querySelectorAll(".dropdown-container"),
  inputLanguageDropdown = document.querySelector("#input-language"),
  outputLanguageDropdown = document.querySelector("#output-language"),
  inputTextElem = document.querySelector("#input-text"),
  outputTextElem = document.querySelector("#output-text"),
  swapBtn = document.querySelector(".swap-position"),
  uploadDocument = document.querySelector("#upload-document"),
  uploadTitle = document.querySelector("#upload-title"),
  downloadBtn = document.querySelector("#download-btn"),
  darkModeCheckbox = document.getElementById("dark-mode-btn"),
  inputChars = document.querySelector("#input-chars"),
  speakBtn = document.querySelector("#speak-btn");

function populateDropdown(dropdown, options) {
  dropdown.querySelector("ul").innerHTML = "";
  options.forEach((option) => {
    const li = document.createElement("li");
    const title = option.name + " (" + option.native + ")";
    li.innerHTML = title;
    li.dataset.value = option.code;
    li.classList.add("option");
    dropdown.querySelector("ul").appendChild(li);
  });
}

populateDropdown(inputLanguageDropdown, languages);
populateDropdown(outputLanguageDropdown, languages);

dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", (e) => {
    dropdown.classList.toggle("active");
  });

  dropdown.querySelectorAll(".option").forEach((item) => {
    item.addEventListener("click", (e) => {
      dropdown.querySelectorAll(".option").forEach((item) => {
        item.classList.remove("active");
      });
      item.classList.add("active");
      const selected = dropdown.querySelector(".selected");
      selected.innerHTML = item.innerHTML;
      selected.dataset.value = item.dataset.value;
      translate();
    });
  });
});

document.addEventListener("click", (e) => {
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
});

swapBtn.addEventListener("click", (e) => {
  const temp = inputLanguage.innerHTML;
  inputLanguage.innerHTML = outputLanguage.innerHTML;
  outputLanguage.innerHTML = temp;

  const tempValue = inputLanguage.dataset.value;
  inputLanguage.dataset.value = outputLanguage.dataset.value;
  outputLanguage.dataset.value = tempValue;

  const tempInputText = inputTextElem.value;
  inputTextElem.value = outputTextElem.value;
  outputTextElem.value = tempInputText;

  translate();
});

// Translate function with speech output trigger
function translate() {
  const inputText = inputTextElem.value;
  const inputLanguage =
    inputLanguageDropdown.querySelector(".selected").dataset.value;
  const outputLanguage =
    outputLanguageDropdown.querySelector(".selected").dataset.value;

  if (!inputText.trim()) return;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLanguage}&tl=${outputLanguage}&dt=t&q=${encodeURI(
    inputText,
  )}`;

  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      const translated = json[0].map((item) => item[0]).join("");
      outputTextElem.value = translated;
    })
    .catch((error) => {
      console.log(error);
    });
}

inputTextElem.addEventListener("input", () => {
  if (inputTextElem.value.length > 5000) {
    inputTextElem.value = inputTextElem.value.slice(0, 5000);
  }
  inputChars.innerHTML = inputTextElem.value.length;
  translate();
});

uploadDocument.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  uploadTitle.innerHTML = file.name;

  if (file.type === "text/plain") {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      inputTextElem.value = e.target.result;
      translate();
    };
  } else if (file.type === "application/pdf") {
    const reader = new FileReader();
    reader.onload = async function () {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str).join(" ");
        text += strings + "\n";
      }
      inputTextElem.value = text;
      translate();
    };
    reader.readAsArrayBuffer(file);
  } else if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;
      mammoth
        .extractRawText({ arrayBuffer: arrayBuffer })
        .then(function (resultObject) {
          inputTextElem.value = resultObject.value;
          translate();
        })
        .catch(function (err) {
          console.log("DOCX parsing error: ", err);
        });
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Unsupported file type. Please upload a TXT, PDF, or DOCX file.");
  }
});

downloadBtn.addEventListener("click", (e) => {
  const outputText = outputTextElem.value;
  const outputLanguage =
    outputLanguageDropdown.querySelector(".selected").dataset.value;
  if (outputText) {
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `translated-to-${outputLanguage}.txt`;
    a.href = url;
    a.click();
  }
});

darkModeCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});

// 🌟 Text-to-Speech
function speakText(text, langCode) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

speakBtn.addEventListener("click", () => {
  const text = outputTextElem.value;
  const langCode =
    outputLanguageDropdown.querySelector(".selected").dataset.value;
  if (text.trim()) {
    speakText(text, langCode);
  }
});
