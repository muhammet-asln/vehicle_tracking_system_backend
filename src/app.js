import express from 'express';
import "dotenv/config.js";
import { userRoutes , authRoutes , kurumRoutes , mintikaRoutes, vehicleRoutes, tripRoutes } from './routes/index.js';
import  {applyAssociations} from './models/index.js';
import { connectDB } from './config/db.js';

import cors from 'cors';


const app = express();
app.use(express.json());
connectDB();
applyAssociations(); 

const allowedOrigins = [
    'https://ap.aractakip.site', 
    'http://localhost:3000',
    'http://localhost:5173',      
    'http://localhost:5173/'
      
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bu alan tarafından CORS politikasına izin verilmiyor.'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors({corsOptions}));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/users/', userRoutes);
app.use('/api/auth/', authRoutes);
app.use('/api/mintikalar', mintikaRoutes);
app.use('/api/kurumlar', kurumRoutes);   
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);

export default app; 
