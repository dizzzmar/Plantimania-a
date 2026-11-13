// Utilidades aleatorias deterministas (misma semilla, misma planta).
function mulberry(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const U=(R,a,b)=>a+(b-a)*R();
const N=(R)=>{let u=R()||1e-9,v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
export {mulberry,U,N};
