const books = [];
const RENDER_EVENT = 'render-book';
const SAVED_EVENT = 'saved-book';
const STORAGE_KEY = 'BOOKSHELFY';

// Utility Functions

function generateId() {
    return +new Date();
}

function createBook(id, title, author, year, isComplete) {
    return {
        id,
        title,
        author,
        year,
        isComplete
    }
}

function findBookById(bookId) {
    for (const book of books) {
        if (book.id === bookId) {
            return book;
        }
    }
    return null;
}

function findBookIndexById(bookId) {
    for (const index in books) {
        if (books[index].id === bookId) {
            return index;
        }
    }
    return -1;
}

function filterBooksByQuery(query) {
    return books.filter(function (book) {
        return book.title.toLowerCase().includes(query.toLowerCase());
    });
}

function isLocalStorageAvailable() {
    if (typeof (Storage) === undefined) {
        alert('Your browser doesn\'t support local storage!');
        return false;
    }
    return true;
}

function saveBooksToLocalStorage() {
    if (isLocalStorageAvailable()) {
        const parsed = JSON.stringify(books);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

function loadBooksFromLocalStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        for (const book of data) {
            books.push(book);
        }
    }

    document.dispatchEvent(new Event(RENDER_EVENT));
}

// DOM Manipulation Handler

function createBookCard(bookObject) {
    const { id, title, author, year, isComplete } = bookObject;

    const textTitle = document.createElement('h2');
    textTitle.innerHTML = title;

    const textAuthor = document.createElement('p');
    textAuthor.innerHTML = "<strong>Author:</strong> " + author;

    const textYear = document.createElement('p');
    textYear.innerHTML = "<strong>Year:</strong> " + year;

    const cardContent = document.createElement('div');
    cardContent.classList.add('card-content');
    cardContent.append(textTitle, textAuthor, textYear);

    const container = document.createElement('div');
    container.classList.add('card');
    container.append(cardContent);
    container.setAttribute('id', `book-${id}`);

    const createButton = (text, colorClass, clickHandler) => {
        const button = document.createElement('button');
        button.classList.add('button', colorClass);
        button.innerText = text;
        if (text == "Delete") {
            button.classList.add('js-modal-trigger');
            button.setAttribute('data-target', 'delete-modal');
        }
        button.addEventListener('click', clickHandler);
        return button;
    };

    const deleteButton = createButton("Delete", 'is-danger', () => showRemoveModalDialog(id));

    if (isComplete) {
        const undoButton = createButton("Mark As Unread", 'is-link', () => undoMarkBookDone(id));
        cardContent.append(createGroupedButtonField([undoButton, deleteButton]));
    } else {
        const markDoneButton = createButton("Mark As Read", 'is-link', () => markBookAsDone(id));
        cardContent.append(createGroupedButtonField([markDoneButton, deleteButton]));
    }

    return container;
}

function createGroupedButtonField(buttons) {
    const buttonControls = buttons.map(button => {
        const buttonControl = document.createElement('div');
        buttonControl.classList.add('control');
        buttonControl.append(button);
        return buttonControl;
    });

    const groupedField = document.createElement('div');
    groupedField.classList.add('field', 'is-grouped');
    groupedField.append(...buttonControls);

    return groupedField;
}

function showRemoveModalDialog(bookId) {
    const bookTarget = findBookById(bookId);

    if (!bookTarget) return;

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = '';

    const createParagraph = (label, value) => {
        const paragraph = document.createElement('p');
        paragraph.innerHTML = `<strong>${label}:</strong> ${value}`;
        return paragraph;
    };

    const textTitle = createParagraph('Title', bookTarget.title);
    const textAuthor = createParagraph('Author', bookTarget.author);
    const textYear = createParagraph('Year', bookTarget.year);

    modalContent.append(textTitle, textAuthor, textYear);

    const deleteButton = document.getElementById('delete-book');
    deleteButton.onclick = () => removeBookFromList(bookId);

    openModal(document.getElementById('delete-modal'));
}

// Book Management Functions

function addNewBook() {
    const bookTitle = document.getElementById('book-title').value;
    const bookAuthor = document.getElementById('book-author').value;
    const bookYear = document.getElementById('book-year').value;
    const bookisComplete = document.getElementById('book-is-completed').value == "yes" ? true : false;

    if (bookTitle == "" || bookAuthor == "" || bookYear == "") { return }

    const generatedID = generateId();
    const bookObject = createBook(generatedID, bookTitle, bookAuthor, parseInt(bookYear), bookisComplete);
    books.push(bookObject);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBooksToLocalStorage();
}

function searchBook() {
    const searchQuery = document.getElementById('book-title-search').value;

    if (searchQuery != "") {
        const bookToBeReadList = document.getElementById('to-be-read-books');
        const bookDoneList = document.getElementById('done-reading-books');

        bookToBeReadList.innerHTML = '';
        bookDoneList.innerHTML = '';

        console.log(filterBooksByQuery(searchQuery));

        for (const book of filterBooksByQuery(searchQuery)) {
            const bookElement = createBookCard(book);
            if (book.isComplete) {
                bookDoneList.append(bookElement);
            } else {
                bookToBeReadList.append(bookElement);
            }
        }
    } else {
        document.dispatchEvent(new Event(RENDER_EVENT));
    }
}

function markBookAsDone(bookId) {
    const bookTarget = findBookById(bookId);

    if (bookTarget == null) return;

    bookTarget.isComplete = true;
    saveBooksToLocalStorage();
    document.dispatchEvent(new Event(RENDER_EVENT));
}

function removeBookFromList(bookId) {
    const bookTarget = findBookIndexById(bookId);

    if (bookTarget === -1) return;

    books.splice(bookTarget, 1);
    saveBooksToLocalStorage();
    document.dispatchEvent(new Event(RENDER_EVENT));
}

function undoMarkBookDone(bookId) {
    const bookTarget = findBookById(bookId);
    if (bookTarget == null) return;

    bookTarget.isComplete = false;
    saveBooksToLocalStorage();
    document.dispatchEvent(new Event(RENDER_EVENT));
}

// Modal

function openModal($element) {
    $element.classList.add('is-active');
}

function closeModal($element) {
    $element.classList.remove('is-active');
}

// Event Listeners

document.addEventListener('DOMContentLoaded', function () {
    const addBookForm = document.getElementById('add-book-form');
    const searchBookForm = document.getElementById('search-book-form');

    addBookForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addNewBook();
    });

    searchBookForm.addEventListener('submit', function (event) {
        event.preventDefault();
        searchBook();
    });

    if (isLocalStorageAvailable()) {
        loadBooksFromLocalStorage();
    }

    (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
        const $target = $close.closest('.modal');

        $close.addEventListener('click', () => {
            closeModal($target);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape") {
            closeModal(document.getElementById('delete-modal'));
        }
    });
});

document.addEventListener(SAVED_EVENT, () => {
    console.log('Data successfully saved.');
});

document.addEventListener(RENDER_EVENT, function () {
    const bookToBeReadList = document.getElementById('to-be-read-books');
    const bookDoneList = document.getElementById('done-reading-books');

    bookToBeReadList.innerHTML = '';
    bookDoneList.innerHTML = '';

    for (const book of books) {
        const bookElement = createBookCard(book);
        if (book.isComplete) {
            bookDoneList.append(bookElement);
        } else {
            bookToBeReadList.append(bookElement);
        }
    }
})