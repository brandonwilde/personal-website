// Committed snapshot of recent Goodreads reads, used for an instant first paint
// (zero network at load). The live feed is fetched in the background and silently
// replaces this if it has changed — see data/goodreads.js and BookshelfScene.addBookReviews.
//
// Re-seed periodically by running the parse over the live feed (Goodreads user 7208433,
// https://www.goodreads.com/user/updates_rss/7208433) so first paint stays current.
// Each entry matches the normalized shape produced by parseReviewItem().
//
// coverImgSrcFull strips the size directive (._SY75_ / ._SX50_) from the thumbnail URL to
// load the full-resolution cover; gr-assets serves these with `Access-Control-Allow-Origin: *`
// so they upload to WebGL as textures without tainting.

export const goodreadsSnapshot = [
    {
        id: 'gr385',
        title: 'On Bullshit',
        author: 'Harry G. Frankfurt',
        coverImgSrc:     'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1726601299l/385._SY75_.jpg',
        coverImgSrcFull: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1726601299l/385.jpg',
        rating: 4,
        genres: ['language', 'philosophy'],
        review: '',
    },
    {
        id: 'gr228646231',
        title: 'If Anyone Builds It, Everyone Dies: Why Superhuman AI Would Kill Us All',
        author: 'Eliezer Yudkowsky',
        coverImgSrc:     'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1751650717l/228646231._SY75_.jpg',
        coverImgSrcFull: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1751650717l/228646231.jpg',
        rating: 4,
        genres: ['artificial-intelligence', 'book-club-suited'],
        review: '',
    },
    {
        id: 'gr205409665',
        title: 'Hamas: The Quest for Power',
        author: 'Beverley Milton-Edwards',
        coverImgSrc:     'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1718697429l/205409665._SY75_.jpg',
        coverImgSrcFull: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1718697429l/205409665.jpg',
        rating: 2,
        genres: ['politics', 'religion', 'true-story'],
        review: '',
    },
    {
        id: 'gr334176',
        title: 'The Sparrow',
        author: 'Mary Doria Russell',
        coverImgSrc:     'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1230829367l/334176._SY75_.jpg',
        coverImgSrcFull: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1230829367l/334176.jpg',
        rating: 4,
        genres: ['sci-fi', 'religion', 'language'],
        review: '',
    },
    {
        id: 'gr46199',
        title: 'Letters to a Young Poet',
        author: 'Rainer Maria Rilke',
        coverImgSrc:     'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1321994947l/46199._SY75_.jpg',
        coverImgSrcFull: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1321994947l/46199.jpg',
        rating: 3,
        genres: ['self-improvement', 'book-club-suited', 'inspirational'],
        review: '',
    },
    {
        id: 'gr222531818',
        title: 'What Is Life?: Evolution as Computation',
        author: 'Blaise Aguera y Arcas',
        coverImgSrc:     'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1736390670l/222531818._SX50_.jpg',
        coverImgSrcFull: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1736390670l/222531818.jpg',
        rating: 3,
        genres: ['artificial-intelligence', 'computer-science', 'neuroscience', 'science'],
        review: '',
    },
    {
        id: 'gr21977917',
        title: 'Understanding Beliefs',
        author: 'Nils J. Nilsson',
        coverImgSrc:     'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1400839146l/21977917._SX50_.jpg',
        coverImgSrcFull: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1400839146l/21977917.jpg',
        rating: 2,
        genres: ['philosophy', 'psychology'],
        review: '',
    },
];
