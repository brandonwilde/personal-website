function updatePosition(book) {
  const viewportWidth = window.innerWidth;
  const bookRect = book.getBoundingClientRect();
  const bookCenterX = bookRect.left + bookRect.width / 2;
  const distanceFromCenter = bookCenterX - viewportWidth / 2;
  const rotationValue = (distanceFromCenter / viewportWidth) * 7;

  // Cache the perspective calculation
  const perspective = book.perspective || setSpinePerspective(book);
  book.perspective = perspective;

  if (book.classList.contains("hovered")) {
    book.style.transform = `${perspective.transform} translateZ(100px)`;
  } else {
    book.style.transform = perspective.transform;
    book.style.zIndex = perspective.zIndex;
  }
}

// Function to calculate the 3D transformation for a book based on its position
function setSpinePerspective(book) {
  const bookRect = book.getBoundingClientRect();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // book center position relative to the viewport center
  const deltaX = bookRect.left + bookRect.width / 2 - centerX;
  const deltaY = bookRect.top + bookRect.height / 2 - centerY;
  const distFromCenter = Math.sqrt(deltaX ** 2 + deltaY ** 2);

  // perspective factor (related to viewing distance)
  const factor = 0.02;
  const rotateY = deltaX * factor;
  const rotateX = -deltaY * factor;

  // Pre-compute the transform string
  return {
    transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
    zIndex: Math.round(1000 - distFromCenter),
  };
}

function setFaceDimensions(book, depth) {
  // Cache DOM queries
  if (!book.faces) {
    book.faces = {
      right: book.querySelector(".book-right-face"),
      left: book.querySelector(".book-left-face"),
      top: book.querySelector(".book-top-face"),
      bottom: book.querySelector(".book-bottom-face")
    };
  }

  const bookHeight = book.offsetHeight;
  const bookWidth = book.offsetWidth;

  const { right, left, top, bottom } = book.faces;

  // Set dimensions and transforms for all faces
  [right, left].forEach(face => {
    face.style.height = `${bookHeight}px`;
    face.style.width = `${depth}px`;
  });

  right.style.transform = `rotateY(90deg) translateZ(${bookWidth + depth}px)`;
  left.style.transform = `rotateY(90deg) translateZ(-${bookWidth + depth}px) translateX(${depth}px)`;

  [top, bottom].forEach(face => {
    face.style.width = `${bookWidth}px`;
    face.style.height = `${depth}px`;
  });

  top.style.transform = `rotateX(90deg)`;
  bottom.style.transform = `rotateX(90deg) translateY(-${depth}px)`;
}

function toggleBookFaces(book, centerX, centerY) {
  const bookRect = book.getBoundingClientRect();
  const bookCenterX = bookRect.left + bookRect.width / 2;
  const bookCenterY = bookRect.top + bookRect.height / 2;

  const { right, left, top, bottom } = book.faces;

  // Use CSS display property for face visibility
  right.style.display = bookCenterX < centerX ? "block" : "none";
  left.style.display = bookCenterX >= centerX ? "block" : "none";
  bottom.style.display = bookCenterY < centerY ? "block" : "none";
  top.style.display = bookCenterY >= centerY ? "block" : "none";
}

function setPerspective() {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  document.querySelectorAll(".book").forEach((book) => {
    book.perspective = setSpinePerspective(book);
    book.style.transform = book.perspective.transform;
    book.style.zIndex = book.perspective.zIndex;
    setFaceDimensions(book, 200); // Give the book a depth of 200px
    toggleBookFaces(book, centerX, centerY);
  });
}

// Apply transforms on page load and window resize
window.addEventListener("DOMContentLoaded", setPerspective);
window.addEventListener("resize", setPerspective);
