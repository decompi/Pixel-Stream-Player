const ffmpeg = require("ffmpeg");
const jimp = require("jimp");
const fluentffmpeg = require('fluent-ffmpeg');
const ffmpegpath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('node:path');
const fs = require('fs').promises;

fluentffmpeg.setFfmpegPath(ffmpegpath);

function colourToNumber(r, g, b) {
    return (r << 16) + (g << 8) + (b);
}

class Pixel {
    constructor(name, length, config = {}) {
        this.videoname = name;
        this.length = length;
        this.config = {
            frameRate: 30,
            width: 356,
            height: 200,
            durationPadding: 20,
            imageDir: './images',
            ...config
        };
        this.frameData = [];
        this.enabled = true;
    }

    async extractVideo() {
        const VIP = this;
        const framerate = 30;
        const width = 356;
        const height = 200;

        try {
            const process = new ffmpeg(this.videoname);
            const video = await process;

            try {
                const files = await fs.readdir('./images/');
                const unlinkPromises = files.map(file => fs.unlink(path.join('./images/', file)));
                await Promise.all(unlinkPromises);
                console.log('Old frames deleted successfully.');
            } catch (err) {
                console.error('Error deleting old frames:', err);
            }

            await new Promise((resolve, reject) => {
                video.fnExtractFrameToJPG(
                    "./images",
                    {
                        duration_time: this.length + 20,
                        frame_rate: framerate,
                        size: `${width}x${height}`,
                        keep_pixel_aspect_ratio: true,
                        keep_aspect_ratio: true,
                        file_name: "",
                    },
                    async (error, files) => {
                        if (error) return reject(error);
                        console.log('Frames extracted:', files.length);
                            try {
                                const frameData = [];
                                let secondFromRate = 0;
                                let imgCount = 0;
                                for (let second = 0; second < 20; second++) {
                                    if (!frameData[secondFromRate]) {
                                        frameData[secondFromRate] = [];
                                    }
                                    for (let frameInSecond = 0; frameInSecond < framerate; frameInSecond++) {
                                        imgCount++;
                                        const fileName = `_${imgCount}.jpg`;
                                        const direc = path.join('./images', fileName);
                                        try {
                                            const image = await jimp.read(direc);
                                            image.resize(width, height);
                                            for (let y = 0; y < height; y++) {
                                                if (!frameData[secondFromRate][y]) {
                                                    frameData[secondFromRate][y] = [];
                                                }
                                                for (let x = 0; x < width; x++) {
                                                    if (!frameData[secondFromRate][y][x]) {
                                                        frameData[secondFromRate][y][x] = [];
                                                    }
                                                    if (!frameData[secondFromRate][y][x][second]) {
                                                        frameData[secondFromRate][y][x][second] = [];
                                                    }
                                                    const rgbs = jimp.intToRGBA(image.getPixelColor(x, y));
                                                    const decimal = colourToNumber(rgbs.r, rgbs.g, rgbs.b);
                                                    frameData[secondFromRate][y][x][second][frameInSecond] = decimal;
                                                }
                                            }
                                        } catch (imageError) {
                                            console.error(`Failed to process image ${direc}:`, imageError);
                                        }
                                    }
                                    if ((second + 1) % 20 === 0 && (secondFromRate + 1) < (this.length / 20)) {
                                        second = 1;
                                        secondFromRate++;
                                    }
                                }
                                console.log('Frame data length:', frameData.length);
                                VIP.frameData = frameData;
                                resolve();
                            } catch (imageError) {
                                reject(imageError);
                            }
                    }
                );
            });

        } catch (e) {
            console.error('Error processing video:', e);
        }
    }

    /*
        async extractVideo() {
        const { frameRate, width, height, durationPadding, imageDir } = this.config;

        try {
            const process = new ffmpeg(this.videoname);
            const video = await process;

            try {
                const files = await fs.readdir(imageDir);
                const unlinkPromises = files.map(file => fs.unlink(path.join(imageDir, file)));
                await Promise.all(unlinkPromises);
                console.log('Old frames deleted successfully.');
            } catch (err) {
                console.error('Error deleting old frames:', err);
            }

            await new Promise((resolve, reject) => {
                video.fnExtractFrameToJPG(
                    imageDir,
                    {
                        duration_time: this.length + durationPadding,
                        frame_rate: frameRate,
                        size: `${width}x${height}`,
                        keep_pixel_aspect_ratio: true,
                        keep_aspect_ratio: true,
                        file_name: "",
                    },
                    async (error, files) => {
                        if (error) return reject(error);
                        console.log('Frames extracted:', files.length);
                        try {
                            const frameData = [];
                            let secondFromRate = 0;
                            let imgCount = 0;
                            for (let second = 0; second < this.length; second++) {
                                if (!frameData[secondFromRate]) {
                                    frameData[secondFromRate] = [];
                                }
                                for (let frameInSecond = 0; frameInSecond < frameRate; frameInSecond++) {
                                    imgCount++;
                                    const fileName = `_${imgCount}.jpg`;
                                    const direc = path.join(imageDir, fileName);
                                    try {
                                        const image = await jimp.read(direc);
                                        image.resize(width, height);
                                        for (let y = 0; y < height; y++) {
                                            if (!frameData[secondFromRate][y]) {
                                                frameData[secondFromRate][y] = [];
                                            }
                                            for (let x = 0; x < width; x++) {
                                                if (!frameData[secondFromRate][y][x]) {
                                                    frameData[secondFromRate][y][x] = [];
                                                }
                                                if (!frameData[secondFromRate][y][x][second]) {
                                                    frameData[secondFromRate][y][x][second] = [];
                                                }
                                                const rgbs = jimp.intToRGBA(image.getPixelColor(x, y));
                                                const decimal = colourToNumber(rgbs.r, rgbs.g, rgbs.b);
                                                frameData[secondFromRate][y][x][second][frameInSecond] = decimal;
                                            }
                                        }
                                    } catch (imageError) {
                                        console.error(`Failed to process image ${direc}:`, imageError);
                                    }
                                }
                                if ((second + 1) % 20 === 0 && (secondFromRate + 1) < (this.length / 20)) {
                                    second = 1;
                                    secondFromRate++;
                                }
                            }
                            console.log('Frame data length:', frameData.length);
                            this.frameData = frameData;
                            resolve();
                        } catch (imageError) {
                            reject(imageError);
                        }
                    }
                );
            });

        } catch (e) {
            console.error('Error processing video:', e);
        }
    }*/
}

module.exports = Pixel;
