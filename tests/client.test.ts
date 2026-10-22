import {it,expect,vi} from 'vitest';
import {createSynthesisClient} from '../app/src/services/api/synthesisClient';
const input={entryId:'0f9c3d70-fd0a-4dcc-8555-2b91a3db54bf',attemptId:'a381af8c-660a-4742-82ec-5f73fb4ef89d',transcriptRevision:1,rawTranscript:'Today I walked.'};
it('rejects missing config, insecure remote URLs, and mismatched metadata',async()=>{
  await expect(createSynthesisClient(undefined)(input)).rejects.toThrow('not configured');
  await expect(createSynthesisClient('http://example.com')(input)).rejects.toThrow('HTTPS');
  const fetcher=vi.fn(async()=>new Response(JSON.stringify({...input,rawTranscript:undefined,attemptId:'0f9c3d70-fd0a-4dcc-8555-2b91a3db54bf',title:'Walk',story:'I walked.',tags:['Life','Work','Reflection'],model:'mock'})));
  await expect(createSynthesisClient('https://example.com',fetcher)(input)).rejects.toThrow('mismatched');
});
it('handles HTTP errors, invalid output, network loss and timeout',async()=>{
  for(const status of [429,500]) await expect(createSynthesisClient('https://example.com',async()=>new Response('{}',{status}))(input)).rejects.toThrow();
  await expect(createSynthesisClient('https://example.com',async()=>new Response('invalid'))(input)).rejects.toThrow();
  await expect(createSynthesisClient('https://example.com',async()=>{throw new TypeError('offline');})(input)).rejects.toThrow('connection');
  const stalled:typeof fetch=async(_url,options)=>await new Promise((_resolve,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('aborted'))));
  await expect(createSynthesisClient('https://example.com',stalled,5)(input)).rejects.toThrow('timed out');
});
