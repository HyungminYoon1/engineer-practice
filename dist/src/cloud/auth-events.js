// Same-origin notification only. Never send identities, passwords or tokens.
// Recipients must verify the managed session; this message is not authentication.
const channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('web-lab-auth-v1'):null;
export function announceAuthChange(){channel?.postMessage('changed');}
export function watchAuthChange(callback){if(!channel)return()=>{};const handle=e=>{if(e.data==='changed')callback();};channel.addEventListener('message',handle);return()=>channel.removeEventListener('message',handle);}
