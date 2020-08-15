import { debug } from "console";

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const youtubedl = require('youtube-dl')



// Globals
const baseUrl: string = 'https://fast.wistia.net/embed/iframe/';
const basePath: string = `${__dirname}/videos/`;

if (!fs.existsSync(basePath)){
    fs.mkdirSync(basePath);
}

async function cheerioExample() {
    const pageContent = await axios.get('https://pro.academind.com/courses/javascript-algorithms-the-fundamentals/lectures/16817672');
    fs.writeFileSync(`${__dirname}/test.txt`, pageContent.data);
    const $ = cheerio.load(pageContent.data);
    let videoKeys: string[] = [];
    
    const videoTitle = $("#lecture_heading").text().trim();
    
    const presentations = $(".attachment-wistia-player")
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
    let video;
    let validName: string;
    videoKeys.forEach(videoKey => {
        validName = getValidName(basePath, videoTitle);
        
        video = youtubedl(baseUrl + videoKey,
            // Optional arguments passed to youtube-dl.
            [],
            // Additional options can be given for calling `child_process.execFile()`.
            { cwd: __dirname })
        video.pipe(fs.createWriteStream(`${basePath}${validName.trim()}.mp4`))
    });
}

function getValidName(path: string="", videoTitle: string="", modificator?: number): string {
    console.log('mpodioficator  ', modificator)
    const fileName: string = `${videoTitle}${modificator || ""}`;
    if (fs.existsSync(`${basePath}${fileName.trim()}.mp4`)) {
        //file exists
        if(modificator !== undefined) {
            modificator++;
        } else {
            modificator = 0
        };
        return getValidName(path, videoTitle, modificator);
    }
    return fileName;
}


cheerioExample();
