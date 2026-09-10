(()=>{
const page=document.body.dataset.page||'';
const nav=[
 ['check','./','✓','Check retro'],
 ['codes','pay-codes.html','≡','Pay terms'],
 ['wages','wage-scale.html','$','Wage scale'],
 ['math','math.html','∑','The math'],
 ['privacy','privacy.html','🔒','Privacy'],
 ['about','about.html','ⓘ','About']
];
const h=document.querySelector('#siteHeader');
if(h)h.innerHTML=`<header class="site-header"><div class="brandbar"><a class="brandlink" href="./"><span class="brandname">Retro Pay Checker</span><span class="brandsub">Independent tool for UMass Memorial University Campus RNs</span></a><span class="authorchip">Created by Andrew Raposo</span></div><nav class="mainnav" aria-label="Main navigation">${nav.map(([id,href,icon,label])=>`<a href="${href}" ${id===page?'aria-current="page"':''}>${icon} ${label}</a>`).join('')}</nav></header>`;
const f=document.querySelector('#siteFooter');
if(f)f.innerHTML=`<footer class="footer"><b>Retro Pay Checker</b> · Created by Andrew Raposo<br><span>Independent community tool</span><br><span class="footer-note">Not affiliated with UMass Memorial or MNA</span></footer>`;
})();
