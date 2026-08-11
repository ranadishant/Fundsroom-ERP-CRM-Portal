import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import challanRoutes from './routes/challans';
import statsRoutes from './routes/stats';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check & Root Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Fundsroom Mini ERP + CRM Backend API',
    frontendUrl: 'http://localhost:3000',
    healthCheck: 'http://localhost:5000/api/health'
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Fundsroom Mini ERP + CRM API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/stats', statsRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 Route
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API Route Not Found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Fundsroom Mini ERP + CRM Backend running on http://localhost:${PORT}`);
});

export default app;
