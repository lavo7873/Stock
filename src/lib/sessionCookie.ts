/** HMAC session cookie - Edge compatible */
const COOKIE_NAME="psr_admin";
const COOKIE_MAX_AGE=24*60*60;
const MIN_SECRET_LENGTH=16;
const isProd=process.env.NODE_ENV==="production";
let devSecretWarned=false;
function getSecret(){const s=(process.env.COOKIE_SIGNING_SECRET??process.env.NEXTAUTH_SECRET??"").trim();if(s&&s.length>=MIN_SECRET_LENGTH)return s;if(isProd)return null;if(!devSecretWarned){devSecretWarned=true;console.warn("[sessionCookie] COOKIE_SIGNING_SECRET missing or <16 chars");}return "dev-secret-insecure";}
function base64UrlEncode(buf: ArrayBuffer){const b=new Uint8Array(buf);let s="";for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function base64UrlDecodeToStr(s: string){let b=s.replace(/-/g,"+").replace(/_/g,"/");b+="=".repeat((4-b.length%4)%4);return decodeURIComponent(escape(atob(b)));}
async function hmacSha256(k: string, d: string){const kd=new TextEncoder().encode(k);const ck=await crypto.subtle.importKey("raw",kd,{name:"HMAC",hash:"SHA-256"},false,["sign"]);return crypto.subtle.sign("HMAC",ck,new TextEncoder().encode(d));}
export const SESSION_COOKIE_NAME=COOKIE_NAME;
export const SESSION_COOKIE_MAX_AGE=COOKIE_MAX_AGE;
export async function createSessionToken(u: string){const s=getSecret();if(isProd&&!s)throw new Error("COOKIE_SIGNING_SECRET required (min 16 chars)");const exp=Math.floor(Date.now()/1000)+COOKIE_MAX_AGE;const p=JSON.stringify({u,exp});const pb=btoa(unescape(encodeURIComponent(p))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");const sig=await hmacSha256(s!,pb);return pb+"."+base64UrlEncode(sig);}
export async function verifySessionToken(t: string){const s=getSecret();if(isProd&&!s)return{valid:false};const au=(process.env.ADMIN_USERNAME??process.env.ADMIN_USER??"admin").trim();if(!t||!t.includes("."))return{valid:false};const[pb,sb]=t.split(".");if(!pb||!sb)return{valid:false};try{const es=await hmacSha256(s!,pb);if(sb!==base64UrlEncode(es))return{valid:false};const pl=JSON.parse(base64UrlDecodeToStr(pb));if(!pl.exp||pl.exp<Math.floor(Date.now()/1000)||pl.u!==au)return{valid:false};return{valid:true,username:pl.u};}catch{return{valid:false};}}
