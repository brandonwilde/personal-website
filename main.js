import { BookshelfScene } from './assets/js/BookshelfScene.js';
import { bookConfigs, shelfConfigs } from './assets/js/config/contentConfig.js';
import { initDebugPanel } from './assets/js/ui/debugPanel.js';

window.onload = () => {
    initDebugPanel();

    const bookshelfScene = new BookshelfScene();
    bookshelfScene.addBooksFromConfig(bookConfigs, shelfConfigs);
    bookshelfScene.addContactCard(bookConfigs.other.contact);
    bookshelfScene.addBlogNotebook(bookConfigs.other.blog);
    bookshelfScene.animate();
};
