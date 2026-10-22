import {RequestSchema,ResponseSchema,type SynthesisRequest} from '../../../../shared/synthesis';
export function createSynthesisClient(url:string|undefined,request:typeof fetch=fetch,timeout=35000) {
  return async (input:SynthesisRequest)=>{
    if(!url) throw new Error('Synthesis is not configured. Set EXPO_PUBLIC_SYNTHESIS_API_URL in the development build.');
    const parsed=new URL(url);
    const local=/^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(parsed.hostname);
    if(parsed.protocol!=='https:' && !(parsed.protocol==='http:' && local)) throw new Error('Synthesis requires HTTPS outside your local development network.');
    RequestSchema.parse(input);
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await request(`${url.replace(/\/$/,'')}/api/journal/synthesize`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:controller.signal});
      if(!response.ok) throw new Error(response.status===429 ? 'The service is busy. Please try again later.' : 'Synthesis failed. Your transcript is saved; please retry.');
      const result=ResponseSchema.parse(await response.json());
      if(result.entryId!==input.entryId || result.attemptId!==input.attemptId || result.transcriptRevision!==input.transcriptRevision) throw new Error('The service returned mismatched entry metadata. Please retry.');
      return result;
    } catch(error) {
      if(controller.signal.aborted) throw new Error('Synthesis timed out. Your transcript is saved; please retry.');
      if(error instanceof TypeError) throw new Error('Could not reach the synthesis service. Check your connection and retry.');
      if(error instanceof Error && error.name==='ZodError') throw new Error('The service returned an invalid story. Please retry.');
      throw error;
    } finally {clearTimeout(timer);}
  };
}
