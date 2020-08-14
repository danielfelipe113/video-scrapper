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
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const youtubedl = require('youtube-dl');
// Globals
const baseUrl = 'https://fast.wistia.net/embed/iframe/';
const basePath = `${__dirname}/videos/`;
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
}
function cheerioExample() {
    return __awaiter(this, void 0, void 0, function* () {
        const pageContent = yield axios.get('https://pro.academind.com/courses/javascript-algorithms-the-fundamentals/lectures/16817672');
        fs.writeFileSync(`${__dirname}/test.txt`, pageContent.data);
        const $ = cheerio.load(pageContent.data);
        let videoKeys = [];
        const videoTitle = $("#lecture_heading").text();
        const presentations = $(".attachment-wistia-player")
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
        let video;
        let validName;
        videoKeys.forEach(videoKey => {
            validName = getValidName(basePath, videoTitle);
            console.log(validName);
            return;
            video = youtubedl(baseUrl + videoKey, 
            // Optional arguments passed to youtube-dl.
            [], 
            // Additional options can be given for calling `child_process.execFile()`.
            { cwd: __dirname });
            video.pipe(fs.createWriteStream(`${basePath}${validName.trim()}.mp4`));
        });
    });
}
function getValidName(path = "", videoTitle = "", modificator) {
    console.log('mpodioficator  ', modificator);
    const fileName = `${videoTitle}${modificator || ""}`;
    if (fs.existsSync(`${basePath}${fileName.trim()}.mp4`)) {
        //file exists
        if (modificator !== undefined) {
            modificator++;
        }
        else {
            modificator = 0;
        }
        ;
        return getValidName(path, videoTitle, modificator);
    }
    return fileName;
}
cheerioExample();
