import {it,expect,vi} from 'vitest';
import request from 'supertest';
import {createApp} from '../server/src/app';
import {normalizeOutput,SynthesisError} from '../server/src/services/openaiSynthesis';
const input={entryId:'0f9c3d70-fd0a-4dcc-8555-2b91a3db54bf',attemptId:'a381af8c-660a-4742-82ec-5f73fb4ef89d',transcriptRevision:1,rawTranscript:'Today I walked.'};
const result={title:' A Walk ',story:' I walked today. ',tags:['Daily Life','Work','Reflection','work'],model:'mock'};
it('validates requests and wraps normalized model output with metadata',async()=>{
  const model=vi.fn(async()=>result),app=createApp(model);
  expect((await request(app).post('/api/journal/synthesize').send({...input,rawTranscript:''})).status).toBe(400);
  expect(model).not.toHaveBeenCalled();
  const response=await request(app).post('/api/journal/synthesize').send(input);
  expect(response.status).toBe(200);expect(response.body).toMatchObject({entryId:input.entryId,attemptId:input.attemptId,transcriptRevision:1,title:'A Walk',tags:['Daily Life','work','Reflection']});
});
it('rejects oversized and malformed JSON and does not leak upstream details',async()=>{
  const app=createApp(async()=>{throw new Error('secret transcript and key');});
  const response=await request(app).post('/api/journal/synthesize').send(input);
  expect(response.status).toBe(502);expect(JSON.stringify(response.body)).not.toContain('secret');
  expect((await request(app).post('/api/journal/synthesize').send({...input,rawTranscript:'a'.repeat(30001)})).status).toBe(400);
  expect((await request(app).post('/api/journal/synthesize').set('Content-Type','application/json').send('{')).status).toBe(400);
});
it('normalizes refusals/rate errors and bounds local usage',async()=>{
  const app=createApp(async()=>{throw new SynthesisError('SYNTHESIS_REFUSED',422,'Refused.');});
  for(let n=0;n<6;n++)expect((await request(app).post('/api/journal/synthesize').send(input)).status).toBe(422);
  expect((await request(app).post('/api/journal/synthesize').send(input)).status).toBe(429);
  expect(()=>normalizeOutput({title:'',story:'',tags:[]})).toThrow();
});
