const glossaryLinksContainer = document.querySelector(".text-rich-text");
const glossaryModal = document.querySelector(".glossary-modal_component");
const glossaryModalContent = document.querySelector(
  ".glossary-modal_content-wrapper"
);
const glossaryModalParent = glossaryModal?.parentElement;

const glossaryModalClose = glossaryModal?.querySelectorAll(
  ".glossary-modal_close-button"
);
const glossaryAlphabetLinks = glossaryModal?.querySelectorAll(
  ".glossary-modal_alphabet-wrapper a"
);
const glosaryModalSimilarLetter = glossaryModal?.querySelector(
  ".glossary-modal_similar-letter-wrapper"
);
const glossaryModalTitle = glossaryModal?.querySelector("h3");
const glossaryModalDescription = glossaryModal?.querySelector("p");

// Data storage on page
let glossaryData;

let lastFocusedElement;

let clickEventListener; // Declare a variable to store the click event listener

function closeModalOnClick(e, triggerElement) {
  if (!glossaryModal.contains(e.target) && e.target !== triggerElement) {
    console.log("event");
    closeModal();
  }
}

function openModal(triggerElement) {
  lastFocusedElement = triggerElement;
  glossaryModalParent.classList.add("is-active");
  glossaryModal.classList.add("is-active");

  // Add tabindex attribute to the modal title to make it focusable
  glossaryModalContent.setAttribute("tabindex", "-1");

  // Set focus on the modal title
  glossaryModalContent.focus();

  // Add keydown listener for Escape key when modal is open
  document.addEventListener("keydown", handleModalKeydown);

  // Close outside modal
  clickEventListener = (e) => closeModalOnClick(e, triggerElement); // Store the reference
  document
    .querySelector(".page-wrapper")
    .addEventListener("click", clickEventListener);
}

function closeModal() {
  glossaryModalParent.classList.remove("is-active");
  glossaryModal.classList.remove("is-active");

  if (lastFocusedElement) {
    lastFocusedElement.focus(); // Set focus back to the element that opened the modal
  }

  // Remove keydown listener when modal is closed
  document.removeEventListener("keydown", handleModalKeydown);

  // Remove the click event listener using the stored reference
  if (clickEventListener) {
    document
      .querySelector(".page-wrapper")
      .removeEventListener("click", clickEventListener);
  }
}

function createTermLinks(terms) {
  return terms.map((t) => {
    const termLink = document.createElement("a");
    termLink.href = "#";
    termLink.textContent = t;
    termLink.setAttribute("aria-label", `${t} glossary term`);

    // Add keydown event listener for Enter key
    termLink.addEventListener("keydown", handleGlossaryLinkKeydown);
    return termLink;
  });
}

// Accessibility
// Function to handle keydown on glossary links
function handleGlossaryLinkKeydown(e) {
  if (e.key === "Enter") {
    // Simulate a click event
    this.click();
  }
}

// Function to handle keydown for closing modal
function handleModalKeydown(e) {
  if (e.key === "Escape") {
    closeModal();
  }
}

function attachLinkEventListeners(links) {
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const term = link.textContent.trim().toLowerCase();
      const matchingItem = glossaryData.find(
        (entry) => Object.keys(entry)[0].toLowerCase() === term
      );
      glossaryModalTitle.textContent = term;
      glossaryModalDescription.textContent =
        matchingItem[Object.keys(matchingItem)[0]];
    });
  });
}

// Check if database contains certain letter and delete letter if not
function removeUnusedAlphabetLinks() {
  glossaryAlphabetLinks.forEach((link) => {
    const letter = link.textContent.trim();
    const wordsStartingWithLetter = glossaryData.some(
      (entry) => Object.keys(entry)[0].charAt(0).toUpperCase() === letter
    );

    if (!wordsStartingWithLetter) {
      link.parentElement.remove(); // Remove the alphabet link if no words start with this letter
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  if (glossaryModal) {
    // Fetch the glossary data
    fetch(
      "https://cdn.jsdelivr.net/gh/MaxChechel/EPYC---glossary/glossary-base.json"
    )
      .then((response) => response.json())
      .then((data) => {
        // Sort the glossary data alphabetically
        glossaryData = data.sort((a, b) =>
          Object.keys(a)[0].localeCompare(Object.keys(b)[0])
        );
        removeUnusedAlphabetLinks();
        // Attach event listeners to alphabetical links
        glossaryAlphabetLinks.forEach((alphaLink) => {
          alphaLink.addEventListener("click", (e) => {
            e.preventDefault();
            const letter = alphaLink.textContent.trim();

            // Filter glossary data for terms starting with the clicked letter
            const termsStartingWithLetter = glossaryData
              .filter(
                (entry) =>
                  Object.keys(entry)[0].charAt(0).toUpperCase() === letter
              )
              .map((entry) => Object.keys(entry)[0]);

            // Create links for terms starting with the clicked letter
            const links = createTermLinks(termsStartingWithLetter);

            // Clear and insert the links into the wrapper
            glosaryModalSimilarLetter.innerHTML = "";
            attachLinkEventListeners(links);
            glosaryModalSimilarLetter.append(...links);
          });
        });
      });

    // Event listener for both text links and same-letter links
    glossaryLinksContainer.addEventListener("click", (e) => {
      const link = e.target.closest("a:not([data-audio])");
      if (!link) return; // If the click did not occur on a link element

      e.preventDefault();
      const term = link.textContent.trim().toLowerCase(); // Convert term to lowercase
      const matchingItems = glossaryData.filter((entry) =>
        Object.keys(entry)[0].toLowerCase().startsWith(term)
      );

      if (matchingItems.length > 0) {
        // Find the matching item with the longest prefix
        const matchingItem = matchingItems.reduce((prev, current) => {
          const prevTerm = Object.keys(prev)[0].toLowerCase();
          const currentTerm = Object.keys(current)[0].toLowerCase();
          return prevTerm.length > currentTerm.length ? prev : current;
        });

        const originalTerm = Object.keys(matchingItem)[0]; // Store the original term
        const matchingDescription = matchingItem[originalTerm]; // Use the original term to retrieve description
        glossaryModalTitle.textContent = originalTerm;
        glossaryModalDescription.textContent = matchingDescription;

        // Filter terms with the same starting letter and exclude the current term
        const firstLetter = term.charAt(0).toUpperCase();
        const newTermsWithSameLetter = glossaryData
          .filter(
            (entry) =>
              Object.keys(entry)[0].charAt(0).toUpperCase() === firstLetter &&
              Object.keys(entry)[0].toLowerCase() !== originalTerm.toLowerCase()
          )
          .map((entry) => {
            const key = Object.keys(entry)[0];
            return {
              term: key.toLowerCase(), // Convert the key to lowercase
              description: entry[key], // Use the original case description
            };
          });

        // Create links for terms with the same starting letter
        const links = createTermLinks(
          newTermsWithSameLetter.map((entry) => entry.term)
        );

        // Clear and insert the links into the wrapper
        glosaryModalSimilarLetter.innerHTML = "";
        attachLinkEventListeners(links);
        glosaryModalSimilarLetter.append(...links);

        // Open modal
        openModal(link);
      }
    });

    // Attach click event listener to the outer wrapper of the modal
    glossaryModalClose.forEach((item) => {
      item.addEventListener("click", (e) => {
        closeModal();
      });
    });
  }
});
