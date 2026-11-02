import { expect, it } from "vitest";
import { selectLightningIds } from "../lightning-selection";
it("prioriza quatro questões dos assuntos errados sem duplicar IDs",()=>{
 const candidates=Array.from({length:10},(_,i)=>({id:`q${i}`,subject:i<5?"Java":"História"}));
 const result=selectLightningIds(candidates,[{questionId:"q0",question:{subject:"Java"}}],5,()=>0.5);
 expect(new Set(result).size).toBe(5);
 expect(result.filter(id=>Number(id.slice(1))<5).length).toBeGreaterThanOrEqual(4);
});
it("funciona sem histórico e muda o sorteio",()=>{
 const candidates=Array.from({length:15},(_,i)=>({id:`q${i}`,subject:null}));
 expect(selectLightningIds(candidates,[],5,()=>0.1)).not.toEqual(selectLightningIds(candidates,[],5,()=>0.8));
});
it("usa também questões erradas sem assunto e nunca duplica",()=>{
 const pool=[{id:"a",subject:null},{id:"a",subject:null},{id:"b",subject:null}];
 expect(new Set(selectLightningIds(pool,[{questionId:"a",question:{subject:null}}],5)).size).toBe(2);
});
