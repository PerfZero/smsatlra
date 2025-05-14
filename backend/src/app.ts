import express from 'express';
import cors from 'cors';
import verificationRoutes from './routes/verification.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Роуты
app.use('/api/verification', verificationRoutes);

export default app; 