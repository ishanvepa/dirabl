import express from 'express';
const app = express();
app.get('/health', (_req,res) => res.json({ok:true}));
app.listen(Number(process.env.PORT || 3001),'127.0.0.1');
