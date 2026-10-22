import {createApp} from './app.js';
import {createOpenAISynthesizer} from './services/openaiSynthesis.js';
if(process.env.NODE_ENV==='production') throw new Error('Public deployment is disabled. Implement authentication/attestation, durable quotas and TLS before production.');
if(!process.env.OPENAI_API_KEY) throw new Error('Set OPENAI_API_KEY in server/.env.');
const host=process.env.HOST || '127.0.0.1';
if(!/^(127\.0\.0\.1|localhost|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(host)) throw new Error('Bind to loopback or a private LAN IP only.');
const app=createApp(createOpenAISynthesizer(process.env.OPENAI_API_KEY,process.env.OPENAI_MODEL || 'gpt-6-luna'));
app.listen(Number(process.env.PORT || 3001),host);
