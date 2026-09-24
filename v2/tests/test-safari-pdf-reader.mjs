import assert from 'node:assert/strict';
import { extractPdfLines } from '../js/pdf-text.mjs';

let getTextContentCalled=false;
let released=false;
const chunks=[
  {items:[{str:'Regular Pay',transform:[1,0,0,1,10,100],width:50}]},
  {items:[{str:'36',transform:[1,0,0,1,100,100],width:10}]},
];
let i=0;
const fakePage={
  getTextContent(){getTextContentCalled=true;throw new Error('Safari-incompatible path used');},
  streamTextContent(){return{getReader(){return{async read(){return i<chunks.length?{value:chunks[i++],done:false}:{value:undefined,done:true}},releaseLock(){released=true}}}}},
};
const fakePdf={numPages:1,async getPage(){return fakePage}};
const fakePdfjs={getDocument(){return{promise:Promise.resolve(fakePdf)}}};
const fakeFile={async arrayBuffer(){return new Uint8Array([1,2,3]).buffer}};
const result=await extractPdfLines(fakeFile,fakePdfjs);
assert.equal(getTextContentCalled,false,'extractor must not use page.getTextContent()');
assert.equal(released,true,'stream reader lock should be released');
assert.equal(result.pageCount,1);
assert.ok(result.lines.some(line=>line.text.includes('Regular Pay')));
console.log(JSON.stringify({ok:true,checks:['streamTextContent.getReader path','getTextContent not used','reader lock released']},null,2));
