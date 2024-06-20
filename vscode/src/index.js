const express = require("express");
const Pixel = require("./Pixel");
const app = express();

const CONFIG = {
    VIDEO_PATH: "./small.mp4",
    STABLE_LENGTH: 40,
    PORT: 8080,
    FRAME_RATE: 30,
    WIDTH: 356,
    HEIGHT: 200,
    DURATION_PADDING: 20,
    IMAGE_DIR: './images',
    _INTERVAL: 20,
};

let length = CONFIG.STABLE_LENGTH;
let currentCursor = 1;


const pixel = new Pixel(CONFIG.VIDEO_PATH, length, {
    frameRate: CONFIG.FRAME_RATE,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    durationPadding: CONFIG.DURATION_PADDING,
    imageDir: CONFIG.IMAGE_DIR
});
pixel.extractVideo();

app.get('/', (req, res) => {
    const cursorFrame = pixel.frameData[parseInt(req.headers.nextmapcursor) - 1];
    

    const nextCursorFrame = (length === CONFIG._INTERVAL) ? 0 : currentCursor + 1;
    length -= CONFIG._INTERVAL;
    
    res.json({
        frame: cursorFrame,
        nextCursor: nextCursorFrame
    });
    currentCursor++;
    if (nextCursorFrame === 0) {
        currentCursor = 1;
        length = CONFIG.STABLE_LENGTH;
    }
});

app.listen(CONFIG.PORT, () => {
    console.log(`Server is running on port ${CONFIG.PORT}`);
});