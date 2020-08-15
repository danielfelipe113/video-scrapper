const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const youtubedl = require('youtube-dl')
const sanitize = require("sanitize-filename");


// Globals
const videProviderBaseUrl: string = 'https://fast.wistia.net/embed/iframe/';
const basePath: string = `${__dirname}/videos/`;

if (!fs.existsSync(basePath)){
    fs.mkdirSync(basePath);
}



getVideoUrls('https://pro.academind.com', '/courses/javascript-algorithms-the-fundamentals/lectures/16817672');

async function getVideoUrls(baseUrl: string, path: string) {
    let pageContent;
    try {
        pageContent = await axios.get(baseUrl + path);
        const $ = cheerio.load(pageContent.data);
        console.log('Getting sections');
        $('.course-section')
            .map((idx: number, el: Cheerio) => {
                el = $(el);
                el.each((index: number, eachEl: CheerioElement) => {
                    const eachElCheer: Cheerio = $(eachEl);
                    const anchors = eachElCheer.find('a');
                    console.log('Getting anchors');
                    anchors.each((idx, anchor) => {
                        const anchorElem: Cheerio = $(anchor);
                        const anchorSrc = anchorElem.attr("href"); 
                        if(!!anchorSrc) {
                            getVideo(baseUrl+anchorSrc, idx);
                        }
                    })
                });
            });
    } catch(error) {
        
    }    
}

async function getVideo(url: string, counter?: string |number) {
    let pageContent;
    try {
        pageContent = await axios.get(url);
        const $ = cheerio.load(pageContent.data);
        const videoTitle = $("#lecture_heading").text().trim();
        const videoKeys = getVideoKeys($);    
        let video;
        let validName: string;
        videoKeys.forEach(videoKey => {
            validName = getValidName(basePath, counter, videoTitle,);
            console.log('Starting video download');
            video = youtubedl(videProviderBaseUrl + videoKey,
                // Optional arguments passed to youtube-dl.
                [],
                // Additional options can be given for calling `child_process.execFile()`.
                { cwd: __dirname })
            console.log('Finished video download');
            console.log('Starting video saving');
            video.pipe(fs.createWriteStream(`${basePath}${validName.trim()}.mp4`));
            console.log('Video saved in ' + basePath + ' with name: ' + `${validName.trim()}.mp4`);
        });
    } catch(error) {
        
    }    
}

function getVideoKeys(cheerioInstance: any) {
    const $ = cheerioInstance;
    let videoKeys: string[] = [];
    console.log('Getting video key');
    $(".attachment-wistia-player")
        .map((idx: number, el: Cheerio) => {            
            el = $(el);
            el.each((index: number, eachEl: CheerioElement) => {
                const eachElCheer: Cheerio = $(eachEl);
                const key = eachElCheer.attr("data-wistia-id");
                if(!!key) {
                    videoKeys.push(key);
                }
            });
        });
    return videoKeys;
}

function getValidName(path: string="", counter?: string | number, videoTitle: string="", modificator?: number): string {
    console.log('Getting valid name');
    const fileName: string = `${!!counter ? counter + '. ' : ''}${videoTitle}${modificator || ""}`;
    if (fs.existsSync(`${basePath}${sanitize(fileName.trim())}.mp4`)) {
        //file exists
        if(modificator !== undefined) {
            modificator++;
        } else {
            modificator = 0
        };
        return getValidName(path, counter, videoTitle, modificator);
    }
    return sanitize(fileName);
}