require('dotenv').config()
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const youtubedl = require('youtube-dl')
const sanitize = require("sanitize-filename");
const puppeteer = require('puppeteer');
const userAgent = require('user-agents');

// Globals
const videProviderBaseUrl: string = 'https://fast.wistia.net/embed/iframe/';
const basePath: string = `${__dirname}/videos/`;

const credentials: {
    email: any,
    password: any
} = {
    email: process.env.DB_USER,
    password: process.env.DB_PASS
}


if (!fs.existsSync(basePath)){
    fs.mkdirSync(basePath);
}

function delay(time: number) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }


(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); 
    await page.setUserAgent(userAgent.toString())
    await page.goto('https://sso.teachable.com/secure/210848/users/sign_in', {waitUntil: 'networkidle2'});
    await page.screenshot({path: 'example.png'});
    await page.type('#user_email', credentials.email);
    await page.type('#user_password', credentials.password);

    await page.keyboard.press('Enter');
    
    await page.waitForNavigation();
    await page.screenshot({path: 'example2.png'});
    await page.waitForNavigation();
    await page.screenshot({path: 'example3.png'});
    //In!
    await page.goto('https://sso.teachable.com/secure/210848/users/sign_in', {waitUntil: 'networkidle2'});
    
    await page.goto('https://pro.academind.com/courses/javascript-algorithms-the-fundamentals/lectures/16817672', {waitUntil: 'networkidle2'});
    
    await getVideoUrls(page);

    await browser.close();
})();


// getVideoUrls('https://pro.academind.com', '/courses/javascript-algorithms-the-fundamentals/lectures/16817672');

async function getVideoUrls(page: any) {
    try {
        console.log('Getting sections');     
        
        const anchors = await page.evaluate(
            (sel: any) => {
                let sections = Array.from(document.querySelectorAll(sel));
                let hrefs = [];
                let title;
                let toReturn: any = [];

                for (const section of sections) {
                    hrefs = [];
                    title = section.getElementsByClassName('section-title')[0].textContent;
                    const anchors: any = Array.from(section.getElementsByTagName('a'));
                    for (const href of anchors) {
                        if(!!href) {
                            hrefs.push(href.href);
                        }
                    }
                    toReturn.push({
                        title,
                        hrefs
                    });
                }                
                return toReturn;
            }, '.course-section');
        
        let sections: any = [];
        anchors.forEach((anchor: any, idx: number) => {
            if(anchor.hrefs.length) {
                sections.push({
                    title: idx + '. ' + sanitize(anchor.title).trim(),
                    hrefs: anchor.hrefs
                });
            }
        });
        // Visit each assets page one by one
        for (let section in sections) {
            console.log('Going to ', sections[section].title);
            
            if (!fs.existsSync(basePath + sections[section].title)){
                fs.mkdirSync(basePath + sections[section].title);
            }
            let i = 0;
            for (let idx in sections[section].hrefs) {
                
                await page.goto(sections[section].hrefs[idx], {waitUntil: 'networkidle0'});
    
                const videoTitle = await page.evaluate((elem: any) => {
                    const elements = Array.from(document.querySelectorAll(elem));
                    return elements[0].textContent
                }, '#lecture_heading');

                try {
                    console.log('Getting video keys');
                    
                    const videoKeys = await page.evaluate(
                        (sel: any) => {
                            let sections = Array.from(document.querySelectorAll(sel));
                            let keys = [];
                            let key;

                            for (const section of sections) {
                                key = section.getAttribute('data-wistia-id');
                                if(!!key) {
                                    keys.push(key);
                                }
                            }                
                            return keys;
                        }, '.attachment-wistia-player');

                    let video: any;
                    let validName: string;

                    for(let key of videoKeys) {                         
                        validName = getValidName(basePath + sections[section].title + '/', i, videoTitle);
                        console.log('Starting video download');
                        video = youtubedl(videProviderBaseUrl + key,
                            // Optional arguments passed to youtube-dl.
                            [],
                            // Additional options can be given for calling `child_process.execFile()`.
                            { cwd: __dirname });
                        // Will be called when the download starts.
                        video.on('info', function(info: any) {
                            console.log('Download started')
                            console.log('filename: ' + info._filename)
                            console.log('size: ' + info.size)
                        });
                        video.on('error', function error(err: any) {
                            console.log('Video download error:', err)
                        });
                        console.log('Finished video download');
                        console.log('Starting video saving');
                        
                        await new Promise<void>(resolve => {
                            const b = fs.createWriteStream(`${basePath + sections[section].title + '/'}${validName.trim()}.mp4`);
                            video.pipe(b);
                            b.on('finish', resolve);
                        });
                        console.log('Video saved in ' + basePath + sections[section].title + '/' + ' with name: ' + `${validName.trim()}.mp4`);
                        i++
                    }   
                } catch(error) {
                    console.log('ERROR - Can\'t get page content', error);
                }   
            }
        }
        
        console.log('Everything is now in your pc, use this script with caution and content permission');

       
    } catch(error) {
        console.log('ERROR - Can\'t get page content', error);
    }    
}

function getValidName(path: string="", counter: string | number, videoTitle: string="", modificator?: number): string {
    console.log('Getting valid name');
    const fileName: string = `${!!counter.toString() ? counter + '. ' : ''}${videoTitle.trim()}${modificator || ""}`;
    if (fs.existsSync(`${basePath}${sanitize(fileName)}.mp4`)) {
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