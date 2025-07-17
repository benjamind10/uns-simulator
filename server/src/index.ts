import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/ping', (_req, res) => {
    res.send('pong 🏓');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
