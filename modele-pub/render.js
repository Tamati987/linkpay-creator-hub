const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:1000}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+process.cwd()+'/pub.html');await p.evaluate(()=>Promise.all([document.fonts.ready,window.imgsReady]));await p.evaluate(()=>{window.__export=true});
const wav=await p.evaluate(()=>renderAudio());fs.writeFileSync('audio.wav',Buffer.from(wav,'base64'));
const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-i','audio.wav','-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','18','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart','pub.mp4'],{stdio:['pipe','ignore','inherit']});
for(let i=0;i<480;i++){const d=await p.evaluate(t=>{renderAt(t);return document.getElementById('c').toDataURL('image/jpeg',0.95)},i/30);
 if(!ff.stdin.write(Buffer.from(d.split(',')[1],'base64')))await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();})();
