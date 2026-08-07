let e=null;const a=1e3;self.onmessage=t=>{if(t.data.type==="start"){if(e)return;e=setInterval(()=>{self.postMessage({type:"gain"})},a)}else t.data.type==="stop"&&e&&(clearInterval(e),e=null)};
