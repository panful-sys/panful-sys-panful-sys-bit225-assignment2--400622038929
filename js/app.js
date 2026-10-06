// BlueLib Catalogue - vanilla JavaScript
// Note: Drafted with help from an AI assistant (Claude); reviewed and understood by me.
// Book cover images are loaded from Open Library (https://openlibrary.org) using ISBNs.

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

// Colours used for the auto-generated fallback covers
const coverColours = {
  IT: "#1e3a8a",
  Business: "#065f46",
  Science: "#6d28d9",
  Arts: "#b45309"
};

// Real books. The ISBN is used to load the cover from Open Library.
// (Will be replaced by the BlueLib API later)
const books = [
  { id: 1, title: "Clean Code", author: "Robert C. Martin", category: "IT", copies: 5, isbn: "9780132350884" },
  { id: 2, title: "Eloquent JavaScript", author: "Marijn Haverbeke", category: "IT", copies: 4, isbn: "9781593279509" },
  { id: 3, title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "IT", copies: 3, isbn: "9780262033848" },
  { id: 4, title: "Good to Great", author: "Jim Collins", category: "Business", copies: 4, isbn: "9780066620992" },
  { id: 5, title: "The Lean Startup", author: "Eric Ries", category: "Business", copies: 2, isbn: "9780307887894" },
  { id: 6, title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", copies: 3, isbn: "9780553380163" },
  { id: 7, title: "Cosmos", author: "Carl Sagan", category: "Science", copies: 1, isbn: "9780345539434" },
  { id: 8, title: "Things Fall Apart", author: "Chinua Achebe", category: "Arts", copies: 6, isbn: "9780385474542" }
];
let nextId = books.length + 1;

// Page elements
const bookList = document.getElementById("bookList");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const form = document.getElementById("bookForm");
const coverInput = document.getElementById("cover");
const preview = document.getElementById("preview");
const errorBox = document.getElementById("error");
const successBox = document.getElementById("success");
const bookCount = document.getElementById("bookCount");
const showingLabel = document.getElementById("showingLabel");
const titleCount = document.getElementById("titleCount");

// Make a book cover image (SVG data URL) used when no real cover is available
function makeCover(title, category) {
  const colour = coverColours[category] || "#334155";
  const safe = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Split the title into short lines so it fits on the cover
  const words = safe.split(" ");
  const lines = [];
  let line = "";
  words.forEach(word => {
    if ((line + " " + word).trim().length > 14) {
      lines.push(line.trim());
      line = word;
    } else {
      line += " " + word;
    }
  });
  lines.push(line.trim());

  const text = lines.slice(0, 4).map((l, i) =>
    '<text x="150" y="' + (150 + i * 30) + '" text-anchor="middle" fill="#fff" ' +
    'font-family="Georgia, serif" font-size="22" font-weight="bold">' + l + "</text>"
  ).join("");

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">' +
    '<rect width="300" height="400" fill="' + colour + '"/>' +
    '<rect x="0" y="0" width="22" height="400" fill="rgba(0,0,0,0.25)"/>' +
    '<rect x="45" y="40" width="210" height="4" fill="#fff" opacity="0.7"/>' +
    text +
    '<rect x="45" y="340" width="210" height="4" fill="#fff" opacity="0.7"/>' +
    '<text x="150" y="372" text-anchor="middle" fill="#fff" opacity="0.8" ' +
    'font-family="Arial" font-size="14">' + category.toUpperCase() + "</text></svg>";

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Build one card element for a book
function createCard(book) {
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  img.alt = "Cover of " + book.title;

  if (book.cover) {
    // Image uploaded by the user
    img.src = book.cover;
  } else if (book.isbn) {
    // Real cover from Open Library; default=false makes a missing cover fail
    img.src = "https://covers.openlibrary.org/b/isbn/" + book.isbn + "-L.jpg?default=false";
    // If the cover can't load (offline or not found), use the generated cover
    img.addEventListener("error", () => {
      img.src = makeCover(book.title, book.category);
    }, { once: true });
  } else {
    img.src = makeCover(book.title, book.category);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = book.category;

  const title = document.createElement("h3");
  title.textContent = book.title;

  const author = document.createElement("p");
  author.textContent = "Author: " + book.author;

  const copies = document.createElement("p");
  if (book.copies === 0) {
    copies.textContent = "Out of stock";
    copies.className = "out";
  } else {
    copies.textContent = "Copies available: " + book.copies;
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary";
  btn.textContent = book.copies === 0 ? "Out of stock" : "Borrow";
  btn.disabled = book.copies === 0;
  btn.addEventListener("click", () => borrowBook(book.id));

  body.append(badge, title, author, copies, btn);
  card.append(img, body);
  return card;
}

// Show the books that match the search text and selected category
function renderBooks() {
  const term = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  const filtered = books.filter(b =>
    (b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term)) &&
    (cat === "All" || b.category === cat)
  );

  bookList.innerHTML = "";
  if (filtered.length === 0) {
    const msg = document.createElement("p");
    msg.className = "empty-message";
    msg.textContent = "No books found.";
    bookList.appendChild(msg);
  } else {
    filtered.forEach(b => bookList.appendChild(createCard(b)));
  }

  bookCount.textContent = filtered.length + (filtered.length === 1 ? " book" : " books");
  showingLabel.textContent = cat === "All" ? "Showing All" : "Showing " + cat;
  titleCount.textContent = books.length + " Titles Available";
}

// Borrow: reduce copies by 1 (button is disabled at 0)
function borrowBook(id) {
  const book = books.find(b => b.id === id);
  if (book && book.copies > 0) {
    book.copies--;
    renderBooks();
  }
}

// Check the chosen image: must be an image and 20MB or smaller
function handleImageChange() {
  preview.innerHTML = "";
  errorBox.textContent = "";
  const file = coverInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    errorBox.textContent = "Please choose an image file (JPG, PNG, etc.).";
    coverInput.value = "";
    return;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    errorBox.textContent = "Image is too large. Maximum size is 20MB.";
    coverInput.value = "";
    return;
  }

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.alt = "Selected cover preview";
  preview.appendChild(img);
}

// Validate the form and add the new book
function handleAddBook(event) {
  event.preventDefault();
  successBox.textContent = "";

  const title = form.title.value.trim();
  const author = form.author.value.trim();
  const category = form.category.value;
  const copiesText = form.copies.value.trim();
  const file = coverInput.files[0];

  if (!title || !author || !category || copiesText === "") {
    errorBox.textContent = "Please fill in all required fields.";
    return;
  }
  const copies = Number(copiesText);
  if (!Number.isInteger(copies) || copies < 0) {
    errorBox.textContent = "Copies must be a whole number of 0 or more.";
    return;
  }
  if (file && file.size > MAX_IMAGE_SIZE) {
    errorBox.textContent = "Image is too large. Maximum size is 20MB.";
    return;
  }

  const cover = file ? URL.createObjectURL(file) : null;
  books.push({ id: nextId++, title, author, category, copies, cover });

  errorBox.textContent = "";
  successBox.textContent = '"' + title + '" was added to the catalogue.';
  form.reset();
  preview.innerHTML = "";
  renderBooks();
}

searchInput.addEventListener("input", renderBooks);
categoryFilter.addEventListener("change", renderBooks);
coverInput.addEventListener("change", handleImageChange);
form.addEventListener("submit", handleAddBook);

renderBooks();