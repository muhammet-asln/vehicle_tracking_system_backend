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


app.use(cors({
  origin:  "https://ap.aractakip.site/", // localhost:3000
  credentials: true             
}));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/users/', userRoutes);
app.use('/api/auth/', authRoutes);
app.use('/api/mintikalar', mintikaRoutes);
app.use('/api/kurumlar', kurumRoutes);   
app.use('/api/vehicles', vehicleRoutes);


export default app; 
