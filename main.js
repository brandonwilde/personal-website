import { BookshelfScene } from './assets/js/scene/BookshelfScene.js';
import { bookConfigs, shelfConfigs } from './assets/js/config/contentConfig.js';
import { initDebugPanel } from './assets/js/ui/debugPanel.js';
import { initNavHints } from './assets/js/ui/navHints.js';

window.onload = () => {
    const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    if (isLocal) initDebugPanel();

    initNavHints();

    const bookshelfScene = new BookshelfScene();
    bookshelfScene.addBooksFromConfig(bookConfigs, shelfConfigs);
    bookshelfScene.addBookReviews(bookConfigs.other.goodreads);
    bookshelfScene.addContactCard(bookConfigs.other.contact);
    bookshelfScene.addBlogNotebook(bookConfigs.other.blog);
    bookshelfScene.animate();
};
