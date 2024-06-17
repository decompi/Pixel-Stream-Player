const express = require("express");
const Pixel = require("./Pixel");
const app = express();

const VIDEO_PATH = "./small.mp4";
const STABLE_LENGTH = 20; 
const PORT = 8080;

let length = STABLE_LENGTH;
let currentCursor = 1;
const LocalVideo = new Pixel(VIDEO_PATH, length);
LocalVideo.extractVideo();

app.get('/', (req, res) => {
    const cursorFrame = LocalVideo.frameData[parseInt(req.headers.nextmapcursor)-1]
    
    const nextCursorFrame = (length == 20) ? 0 : currentCursor+1
    length -= 20;        
    
    res.json({
        frame: cursorFrame,
        nextCursor: nextCursorFrame
    })
    currentCursor++;
    if(nextCursorFrame == 0) {
        currentCursor = 1
        length = STABLE_LENGTH;
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})