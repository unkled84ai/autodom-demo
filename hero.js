// Image-sampled particle renderer, rebuilt for the Autodom demo.
(()=>{
const canvas=document.querySelector('#car-canvas'),hero=document.querySelector('.hero'),button=document.querySelector('#motion-toggle');
const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:true});
const image=new Image(); image.src=window.AUTODOM_CAR_DATA||'assets/hero-car-autodom.png';
let w=1,h=1,dpr=1,count=0,clock=0,last=0,frame=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true,morph=0,target=0;
const pointer={x:-1000,y:-1000,tx:-1000,ty:-1000,on:0};
const reveal=document.createElement('div');reveal.className='hero-photo-reveal';hero.prepend(reveal);reveal.style.backgroundImage='url('+image.src+')';
if(!gl){hero.classList.add('hero-fallback');button.hidden=true;return}
const vertex=`#version 300 es
precision highp float;
in vec2 origin;in vec2 arrival;in vec2 lettering;in vec3 tint;in float dotSize;in float seed;
uniform vec2 resolution;uniform vec2 pointer;uniform float pointerOn;uniform float seconds;uniform float formation;uniform float change;uniform float pixelRatio;
out vec3 color;out float opacity;out float shine;
void main(){
float phase=clamp((formation-seed*.35)/.65,0.,1.);float assembled=phase>=1.?1.:1.-pow(2.,-10.*phase);
vec2 position=mix(arrival,origin,assembled);
float flow=seconds*.6;
position+=vec2(sin(origin.y*.011+flow+seed*1.3)+.6*sin(origin.x*.007-flow*.8),cos(origin.x*.011+flow*.9+seed*1.7)+.6*cos(origin.y*.008+flow*.6))*7.0*assembled;
if(pointerOn>.5){vec2 delta=position-pointer;float distance=length(delta)+.0001;float angle=atan(delta.y,delta.x);float radius=128.+seed*84.+sin(angle*5.+seed*18.+seconds*1.7)*16.+sin(angle*2.-seconds*1.15+seed*9.)*12.;float push=max(0.,1.-distance/radius);position+=delta/distance*push*push*150.;}
float explode=smoothstep(0.,.45,change),gather=smoothstep(.45,1.,change);
vec2 cloud=position+(position-resolution*vec2(.6,.48))*explode*.45+vec2(sin(seed*43.),cos(seed*57.))*explode*110.;position=mix(cloud,lettering,gather);
float cycle=mod(max(0.,seconds-.7),9.);shine=seconds>.7&&cycle<.9?1.-smoothstep(0.,110.,abs(position.x-cycle/.9*resolution.x)):0.;
gl_PointSize=dotSize*(.45+.55*assembled)*(1.+shine*.08)*(1.+explode*.7*seed)*(1.-gather*.45)*pixelRatio;
opacity=assembled*(.82+.18*sin(seconds*1.8+seed*9.))*(1.-gather*.33);color=tint;
vec2 clip=position/resolution*2.-1.;gl_Position=vec4(clip.x,-clip.y,0.,1.);
}`;
const fragment=`#version 300 es
precision highp float;in vec3 color;in float opacity;in float shine;out vec4 result;
void main(){float a=1.-smoothstep(0.,.5,length(gl_PointCoord-.5));if(a<.01)discard;result=vec4(mix(color,vec3(1.,.48,.06),shine*.25),min(1.,opacity*a*1.55));}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);gl.useProgram(program);
const uniforms={};for(const n of ['resolution','pointer','pointerOn','seconds','formation','change','pixelRatio'])uniforms[n]=gl.getUniformLocation(program,n);
let buffers=[];
function attr(name,values,size){const buffer=gl.createBuffer();buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0)}
function build(){
 if(!image.naturalWidth)return;
 const sample=document.createElement('canvas');sample.width=w<768?360:540;sample.height=Math.round(sample.width*image.naturalHeight/image.naturalWidth);const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,sample.width,sample.height);const pixels=ctx.getImageData(0,0,sample.width,sample.height).data;
 const cover=Math.max(w/image.naturalWidth,h/image.naturalHeight),scaleX=image.naturalWidth/sample.width*cover,scaleY=image.naturalHeight/sample.height*cover,ox=(w-image.naturalWidth*cover)*.6,oy=(h-image.naturalHeight*cover)*.5;
 const letters=document.createElement('canvas');letters.width=1000;letters.height=280;const lc=letters.getContext('2d');lc.fillStyle='white';lc.font='800 180px "Segoe UI",Arial,sans-serif';lc.textAlign='center';lc.textBaseline='middle';lc.fillText('АВТОДОМ',500,146);const lp=lc.getImageData(0,0,1000,280).data,targets=[];const lw=Math.min(w*.8,1100);for(let y=0;y<280;y+=2)for(let x=0;x<1000;x+=2)if(lp[(y*1000+x)*4+3]>110)targets.push([(w-lw)/2+x/1000*lw,h*.5-lw*.14+y/1000*lw]);
 const homes=[],starts=[],ends=[],colors=[],sizes=[],seeds=[];const keep=w<768?.48:1;
 for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++){const i=(y*sample.width+x)*4,lum=pixels[i]*.3+pixels[i+1]*.59+pixels[i+2]*.11;if(lum<12||Math.random()>keep)continue;const px=ox+(x+Math.random()-.5)*scaleX,py=oy+(y+Math.random()-.5)*scaleY;if(px< -30||px>w+30||py< -30||py>h+30||px<w*.3&&Math.random()>.5)continue;homes.push(px,py);const angle=Math.random()*Math.PI*2,r=140+Math.random()*Math.max(w,h)*.55;starts.push(px+Math.cos(angle)*r,py+Math.sin(angle)*r);const end=targets[Math.floor(Math.random()*targets.length)];ends.push(...end);const bright=Math.min(1,lum/125);colors.push(1,.16+.13*bright,.012*bright*bright);sizes.push(lum>110?4.4:2.9);seeds.push(Math.random())}
 buffers.forEach(b=>gl.deleteBuffer(b));buffers=[];attr('origin',homes,2);attr('arrival',starts,2);attr('lettering',ends,2);attr('tint',colors,3);attr('dotSize',sizes,1);attr('seed',seeds,1);count=sizes.length;canvas.dataset.particles=count;draw();
}
function resize(){w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;gl.viewport(0,0,canvas.width,canvas.height);build()}
function draw(){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(uniforms.resolution,w,h);gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);gl.uniform1f(uniforms.pointerOn,paused?0:pointer.on);gl.uniform1f(uniforms.seconds,clock);gl.uniform1f(uniforms.formation,paused?1:Math.min(1,clock/1.4));gl.uniform1f(uniforms.change,morph);gl.uniform1f(uniforms.pixelRatio,dpr);gl.drawArrays(gl.POINTS,0,count)}
gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
function tick(now){frame=0;if(paused||!visible||document.hidden)return;const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(elapsed,.1);last=now;clock+=elapsed;canvas.dataset.animationTime=clock.toFixed(2);morph+=(target-morph)*Math.min(1,dt*6);pointer.x+=(pointer.tx-pointer.x)*.18;pointer.y+=(pointer.ty-pointer.y)*.18;const on=pointer.on&&morph<.18;reveal.style.opacity=on?'1':'0';reveal.style.setProperty('--pointer-x',pointer.x+'px');reveal.style.setProperty('--pointer-y',pointer.y+'px');draw();frame=requestAnimationFrame(tick)}
function sync(){cancelAnimationFrame(frame);frame=0;canvas.dataset.motion=paused?'paused':'playing';button.setAttribute('aria-pressed',String(paused));button.innerHTML=paused?'▶ <span>Включить анимацию</span>':'Ⅱ <span>Остановить анимацию</span>';if(paused){reveal.style.opacity=0;morph=target;draw()}else if(visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick)}}
button.addEventListener('click',()=>{paused=!paused;sync()});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{paused=e.matches;sync()});
hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();pointer.tx=e.clientX-r.left;pointer.ty=e.clientY-r.top;if(pointer.x<0){pointer.x=pointer.tx;pointer.y=pointer.ty}pointer.on=1});hero.addEventListener('pointerleave',()=>{pointer.on=0});
function scroll(){const y=Math.max(0,-hero.getBoundingClientRect().top);if(y>56)target=1;else if(y<38)target=0;hero.classList.toggle('hero-leaving',y>24);if(paused){morph=target;draw()}}
window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',sync);window.addEventListener('pageshow',sync);window.addEventListener('focus',sync);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);hero.classList.add('hero-fallback')});canvas.addEventListener('webglcontextrestored',()=>location.reload());new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync()}).observe(hero);new ResizeObserver(resize).observe(canvas);image.onload=resize;image.onerror=()=>hero.classList.add('hero-fallback');scroll();resize();sync();
})();



