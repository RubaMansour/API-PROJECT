// Create the header 
const header = document.createElement('header');

// Logo Section
const logoDiv = document.createElement('div');
logoDiv.classList.add('logo');
const logoImg = document.createElement('img');
logoImg.src = 'logo2.png';
logoImg.alt = 'Logo';
logoImg.classList.add('logo-image');
logoDiv.appendChild(logoImg);

// Search Section
const searchContainer = document.createElement('div');
searchContainer.classList.add('search-container');
const searchBox = document.createElement('div');
searchBox.classList.add('search-box');

const categorySelect = document.createElement('select');
categorySelect.id = 'category-select';
categorySelect.innerHTML = `
  <option value="">All Categories</option>
  <option value="fiction">Fiction</option>
  <option value="science">Science</option>
  <option value="history">History</option>
  <option value="children">Children</option>
  <option value="fantasy">Fantasy</option>
`;


const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.id = 'search-input';
searchInput.placeholder = 'Search for books...';
searchInput.autocomplete = 'off';

const searchButton = document.createElement('button');
searchButton.id = 'search-button';
const searchIcon = document.createElement('i');
searchIcon.classList.add('fas', 'fa-search');
searchButton.appendChild(searchIcon);

const suggestionsList = document.createElement('div');
suggestionsList.id = 'suggestions-list';
suggestionsList.classList.add('suggestions-list');

searchBox.appendChild(categorySelect);
searchBox.appendChild(searchInput);
searchBox.appendChild(searchButton);
searchBox.appendChild(suggestionsList);

searchContainer.appendChild(searchBox);

// Header Icons Section
const headerIcons = document.createElement('div');
headerIcons.classList.add('header-icons');
const bookmarkIcon = document.createElement('i');
bookmarkIcon.classList.add('fas', 'fa-bookmark');
const userIcon = document.createElement('i');
userIcon.classList.add('fas', 'fa-user');
const cartIcon = document.createElement('i');
cartIcon.classList.add('fas', 'fa-shopping-cart');

headerIcons.appendChild(bookmarkIcon);
headerIcons.appendChild(userIcon);
headerIcons.appendChild(cartIcon);

// Append sections to header
header.appendChild(logoDiv);
header.appendChild(searchContainer);
header.appendChild(headerIcons);
document.body.appendChild(header);

// Create the container for books and navigation
const container = document.createElement('div');
container.classList.add('container');
const booksContainer = document.createElement('div');
booksContainer.id = 'books-container';
container.appendChild(booksContainer);

// Navigation buttons and loading spinner
const navigationButtons = document.createElement('div');
navigationButtons.classList.add('navigation-buttons');

const scrollLeftButton = document.createElement('span');
scrollLeftButton.id = 'scroll-left';
scrollLeftButton.classList.add('nav-button', 'disabled');
scrollLeftButton.textContent = '<';

const scrollRightButton = document.createElement('span');
scrollRightButton.id = 'scroll-right';
scrollRightButton.classList.add('nav-button');
scrollRightButton.textContent = '>';

const loadingSpinner = document.createElement('div');

loadingSpinner.id = 'loading-spinner';
const spinnerIcon = document.createElement('i');
spinnerIcon.classList.add('fas', 'fa-spinner', 'fa-spin');

loadingSpinner.appendChild(spinnerIcon);

navigationButtons.appendChild(scrollLeftButton);
navigationButtons.appendChild(scrollRightButton);
navigationButtons.appendChild(loadingSpinner);

container.appendChild(navigationButtons);
document.body.appendChild(container);


let delayTimeout;
let errorPage, offlinePage;
searchButton.addEventListener('click', () => {
    searchBooks(searchInput.value, categorySelect.value);
});

searchInput.addEventListener('input', () => {
    clearTimeout(delayTimeout);
    delayTimeout = setTimeout(() => {
        fetchSuggestions(searchInput.value);
    }, 500);
});

async function fetchSuggestions(query) {
    if (query.trim() === "") {
        suggestionsList.style.display = "none";
        return;
    }

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=50&fields=title,author_name,cover_i`);
        const data = await response.json();
        const filteredSuggestions = data.docs.filter((book) =>
            book.title.toLowerCase().includes(query.toLowerCase())
        );
        displaySuggestions(filteredSuggestions);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        suggestionsList.style.display = "none";
    }
}

function displaySuggestions(suggestions) {
    suggestionsList.innerHTML = '';

    if (suggestions.length === 0) {
        suggestionsList.style.display = "none";
        return;
    }

    suggestions.forEach((suggestion) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');

        const coverId = suggestion.cover_i ? suggestion.cover_i : null;
        const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-S.jpg`
            : 'https://media.istockphoto.com/id/1055079680/vector/black-linear-photo-camera-like-no-image-available.jpg?s=612x612&w=0&k=20&c=P1DebpeMIAtXj_ZbVsKVvg-duuL0v9DlrOZUvPG6UJk=';

        const coverImg = document.createElement('img');
        coverImg.src = coverUrl;
        coverImg.alt = suggestion.title;

        const titleDiv = document.createElement('div');
        const titleText = document.createElement('div');
        titleText.className = 'suggestion-title';
        titleText.innerText = suggestion.title;

        const authorText = document.createElement('div');
        authorText.className = 'suggestion-author';
        authorText.innerText = suggestion.author_name ? `by ${suggestion.author_name.join(", ")}` : "";

        titleDiv.appendChild(titleText);
        titleDiv.appendChild(authorText);
        item.appendChild(coverImg);
        item.appendChild(titleDiv);

        item.addEventListener('click', () => {
            searchInput.value = suggestion.title;
            suggestionsList.style.display = "none";
            searchBooks(suggestion.title, categorySelect.value);
        });

        suggestionsList.appendChild(item);
    });

    suggestionsList.style.display = "block";
}

async function searchBooks(query, category) {
    if (!query.trim() && category === "") {
        query = "book"; 
    }

   
    if (errorPage) {
        errorPage.style.display = 'none';
    }
    if (offlinePage) {
        offlinePage.style.display = 'none';
    }

   
    scrollLeftButton.style.display = 'none';
    scrollRightButton.style.display = 'none';
    booksContainer.innerHTML = '';
    loadingSpinner.style.display = "block";

    if (!navigator.onLine) {
        showOfflinePage();
        return;
    }

    let searchQuery = query.trim();
    let apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=10`;

    if (category && category !== "") {
        apiUrl += `&subject=${encodeURIComponent(category)}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.docs && data.docs.length > 0) {
            displayBooks(data.docs);
        } else {
            displayBooks([]);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        displayBooks([]); 
    }
}

function showOfflinePage() {
    if (!offlinePage) {
        offlinePage = document.createElement('div');
        offlinePage.style.textAlign = 'center';
        offlinePage.style.padding = '100px 20px';
        offlinePage.innerHTML = `
            <h1 style="color: #333; font-size: 2.5em;">No Internet Connection</h1>
            <p style="color: #555; font-size: 1.2em;">Please check your internet connection and try again.</p>
            <button onclick="location.reload()" 
                style="padding: 10px 20px; background-color: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; margin-top: 20px;">
                Retry
            </button>
        `;
        document.body.appendChild(offlinePage);
    }
   
    offlinePage.style.display = 'block';
}

function hideOfflinePage() {
    if (offlinePage) {
        offlinePage.style.display = 'none';
    }
}
async function displayBooks(books) {
    booksContainer.innerHTML = '';
    loadingSpinner.style.display = "none"; 
    if (!books || books.length === 0) {
       
        if (!errorPage) {
            errorPage = document.createElement('div');
            errorPage.style.textAlign = 'center';
            errorPage.style.padding = '100px 20px';
            errorPage.innerHTML = `
                <h1 style="color: #333; font-size: 2.5em;">No results found</h1>
                <p style="color: #555; font-size: 1.2em;">Unfortunately, we couldn't find any books matching your search.</p>
                <button onclick="location.reload()" 
                    style="padding: 10px 20px; background-color: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; margin-top: 20px;">
                    Try Again
                </button>
            `;
            document.body.appendChild(errorPage);
        }
      
        errorPage.style.display = 'block';
        return;
    }

    books.forEach((book) => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';
        const coverId = book.cover_i ? book.cover_i : null;
        const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
            : 'https://media.istockphoto.com/id/1055079680/vector/black-linear-photo-camera-like-no-image-available.jpg?s=612x612&w=0&k=20&c=P1DebpeMIAtXj_ZbVsKVvg-duuL0v9DlrOZUvPG6UJk='; 
        const OLID = book.key.split('/').pop();

        bookElement.innerHTML = `
            <img src="${coverUrl}" alt="${book.title}" loading="lazy">
            <h3>${book.title}</h3>
            <span>${book.author_name ? book.author_name[0] : 'Unknown Author'}</span>
        `;

        bookElement.addEventListener('click', async () => {
            const response = await fetch(`https://openlibrary.org/works/${OLID}.json`);
            const bookDetails = await response.json();
            const popupWindow = document.createElement('div');
            popupWindow.className = 'popupWindow';
            popupWindow.innerHTML = `
                <img src="${coverUrl}" alt="${bookDetails.title}">
                <div class="popupWindow-content">
                    <span class="close-button">&times;</span>
                    <h2>${bookDetails.title}</h2>
                    <p><strong>Author Name:</strong>${book.author_name ? book.author_name[0] : 'Unknown Author'}</p>
                    <p><strong>Publish Date:</strong>${book.first_publish_year ? book.first_publish_year : 'Unknown'}</p>
                    <p><strong>Edition count:</strong>${book.edition_count ? book.edition_count : 'Unknown'}</p>
                    <p><strong>Description:</strong> ${bookDetails.description ? (typeof bookDetails.description === 'string' ? bookDetails.description : bookDetails.description.value) : 'No description available.'}</p>
                </div>
            `;
            popupWindow.querySelector('.close-button').addEventListener('click', () => {
                popupWindow.remove();
            });
            document.body.appendChild(popupWindow);
        });

        booksContainer.appendChild(bookElement);
    });

  
    loadingSpinner.style.display = "none";
    updateNavigationButtons();
    if (books.length > 1) {
        scrollLeftButton.style.display = 'inline';
        scrollRightButton.style.display = 'inline';
    }
}

function updateNavigationButtons() {
    const isAtStart = booksContainer.scrollLeft === 0;
    const isAtEnd = booksContainer.scrollLeft + booksContainer.offsetWidth >= booksContainer.scrollWidth;

    if (isAtStart) {
        scrollLeftButton.classList.add('disabled');
    } else {
        scrollLeftButton.classList.remove('disabled');
    }

    if (isAtEnd) {
        scrollRightButton.classList.add('disabled');
    } else {
        scrollRightButton.classList.remove('disabled');
    }
}
scrollLeftButton.addEventListener('click', () => {
    booksContainer.scrollBy({ left: -300, behavior: 'smooth' });
    updateNavigationButtons();
});

scrollRightButton.addEventListener('click', () => {
    booksContainer.scrollBy({ left: 300, behavior: 'smooth' });
    updateNavigationButtons();
});

booksContainer.addEventListener('scroll', updateNavigationButtons);
window.addEventListener('online', hideOfflinePage);
window.addEventListener('offline', showOfflinePage);

if (!navigator.onLine) {
    showOfflinePage();
}

window.onload = function () {
    searchBooks('book', '');
};
