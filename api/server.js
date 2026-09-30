const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

app.get('/api/manga/one-piece', async (req, res) => {
    const url = 'https://komiku.org/manga/komik-one-piece-indo/';

    try {
        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);

        const judul = $('h1').text().trim();
        const chapters = [];

        $('#Daftar_Chapter tr, .judul-chapter').each((index, element) => {
            const linkElement = $(element).find('a');
            const chapterTitle = linkElement.text().trim();
            const chapterUrl = linkElement.attr('href');

            if (chapterTitle && chapterUrl) {
                const fullUrl = chapterUrl.startsWith('http') ? chapterUrl : `https://komiku.org${chapterUrl}`;

                chapters.push({
                    title: chapterTitle,
                    url: fullUrl
                });
            }
        });

        res.json({
            status: 'success',
            data: { judul, total_chapter: chapters.length, chapters }
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/manga/chapter-images', async (req, res) => {
    const chapterUrl = req.query.url;

    if (!chapterUrl) {
        return res.status(400).json({
            status: 'error',
            message: 'Parameter "url" chapter diperlukan!'
        });
    }

    try {
        console.log(`Mengambil gambar dari: ${chapterUrl}`);
        const response = await axios.get(chapterUrl, { headers });
        const $ = cheerio.load(response.data);

        const rawImageLinks = [];

        $('#Baca_Komik img, .nx img, img').each((index, element) => {
            const imgSrc = $(element).attr('src') || $(element).attr('data-src');

            if (imgSrc && !imgSrc.includes('logo') && !imgSrc.includes('icon') && !imgSrc.includes('avatar')) {
                const fullImgUrl = imgSrc.startsWith('http') ? imgSrc : `https://komiku.org${imgSrc}`;
                rawImageLinks.push(fullImgUrl);
            }
        });
        //image filter
        const filteredImages = rawImageLinks.slice(7, -3);

        res.json({
            status: 'success',
            chapter_url: chapterUrl,
            total_images: filteredImages.length,
            images: filteredImages
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});
// module.exports = app;
app.listen(PORT, () => {
    // console.log(`Server API berjalan di: http://localhost:${PORT}`);
    // console.log(`1. Cek Chapter: http://localhost:${PORT}/api/manga/one-piece`);
    // console.log(`2. Cek Gambar : http://localhost:${PORT}/api/manga/chapter-images?url=URL_CHAPTER`);
    console.log(`Chapters: http://localhost:${PORT}/api/manga/one-piece`);
    console.log(`Images : http://localhost:${PORT}/api/manga/chapter-images?url=URL_CHAPTER`);
});