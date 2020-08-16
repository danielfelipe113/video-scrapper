"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const youtubedl = require('youtube-dl');
const sanitize = require("sanitize-filename");
const puppeteer = require('puppeteer');
const userAgent = require('user-agents');
// Globals
const videProviderBaseUrl = 'https://fast.wistia.net/embed/iframe/';
const basePath = `${__dirname}/videos/`;
const credentials = {
    email: 'danielfelipe113@gmail.com',
    password: 'despertarkaren333'
};
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer.launch({ headless: false });
    const page = yield browser.newPage();
    yield page.setDefaultNavigationTimeout(0);
    yield page.setUserAgent(userAgent.toString());
    // await page.goto('https://sso.teachable.com/secure/210848/users/sign_in', {waitUntil: 'networkidle2'});
    // await page.screenshot({path: 'example.png'});
    // await page.type('#user_email', credentials.email);
    // await page.type('#user_password', credentials.password);
    // await page.keyboard.press('Enter');
    // await page.waitForNavigation();
    // await page.screenshot({path: 'example2.png'});
    // console.log('New Page URL:', page.url());
    // await page.waitForNavigation();
    // await page.screenshot({path: 'example3.png'});
    //In!
    // await page.goto('https://sso.teachable.com/secure/210848/users/sign_in', {waitUntil: 'networkidle2'});
    // 'data-course-url'
    let coursesPages = [];
    yield page.goto('https://pro.academind.com/courses/javascript-algorithms-the-fundamentals/lectures/16817672', { waitUntil: 'networkidle2' });
    getVideoUrls(page);
    // await browser.close();
}))();
// getVideoUrls('https://pro.academind.com', '/courses/javascript-algorithms-the-fundamentals/lectures/16817672');
function getVideoUrls(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Getting sections');
            const data = yield page.evaluate(() => {
                const sections = Array
                    .from(document.querySelectorAll('.course-section'))
                    .map(elem => elem.tagName);
                console.log(sections);
            });
            // $('.course-section')
            //     .map((idx: number, el: Cheerio) => {
            //         el = $(el);
            //         el.each((index: number, eachEl: CheerioElement) => {
            //             const eachElCheer: Cheerio = $(eachEl);
            //             const anchors = eachElCheer.find('a');
            //             console.log('Getting anchors');
            //             anchors.each((idx, anchor) => {
            //                 const anchorElem: Cheerio = $(anchor);
            //                 const anchorSrc = anchorElem.attr("href"); 
            //                 if(!!anchorSrc) {
            //                     getVideo(baseUrl+anchorSrc, idx);
            //                 }
            //             })
            //         });
            //     });
        }
        catch (error) {
            console.log('ERROR - Can\'t get page content', error);
        }
    });
}
function getVideo(url, counter) {
    return __awaiter(this, void 0, void 0, function* () {
        let pageContent;
        try {
            pageContent = yield axios.get(url);
            const $ = cheerio.load(pageContent.data);
            const videoTitle = $("#lecture_heading").text().trim();
            const videoKeys = getVideoKeys($);
            let video;
            let validName;
            videoKeys.forEach(videoKey => {
                validName = getValidName(basePath, counter, videoTitle);
                console.log('Starting video download');
                video = youtubedl(videProviderBaseUrl + videoKey, 
                // Optional arguments passed to youtube-dl.
                [], 
                // Additional options can be given for calling `child_process.execFile()`.
                { cwd: __dirname });
                console.log('Finished video download');
                console.log('Starting video saving');
                video.pipe(fs.createWriteStream(`${basePath}${validName.trim()}.mp4`));
                console.log('Video saved in ' + basePath + ' with name: ' + `${validName.trim()}.mp4`);
            });
        }
        catch (error) {
            console.log('ERROR - Can\'t get page content', error);
        }
    });
}
function getVideoKeys(cheerioInstance) {
    const $ = cheerioInstance;
    let videoKeys = [];
    console.log('Getting video key');
    $(".attachment-wistia-player")
        .map((idx, el) => {
        el = $(el);
        el.each((index, eachEl) => {
            const eachElCheer = $(eachEl);
            const key = eachElCheer.attr("data-wistia-id");
            if (!!key) {
                videoKeys.push(key);
            }
        });
    });
    return videoKeys;
}
function getValidName(path = "", counter, videoTitle = "", modificator) {
    console.log('Getting valid name');
    const fileName = `${!!counter ? counter + '. ' : ''}${videoTitle}${modificator || ""}`;
    if (fs.existsSync(`${basePath}${sanitize(fileName.trim())}.mp4`)) {
        //file exists
        if (modificator !== undefined) {
            modificator++;
        }
        else {
            modificator = 0;
        }
        ;
        return getValidName(path, counter, videoTitle, modificator);
    }
    return sanitize(fileName);
}
//# sourceMappingURL=index.js.map