const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3030;


const uploadDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}.wav`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });


app.use(express.static(uploadDir));


app.post('/apiiq/uploadRecording', upload.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.send(req.file.filename);
});


app.get('/apiiq/recordings', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).send('Error reading recordings.');
        res.json(files);
    });
});

app.get('/apiiq/blob/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
});

app.delete('/apiiq/recordings/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    fs.unlink(filePath, (err) => {
        if (err) return res.status(404).send('File not found');
        res.send('Deleted');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

