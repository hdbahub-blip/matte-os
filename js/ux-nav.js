/* Matte OS 5.6: gives pages without their own bottom navigation (Studera, Study) the same way back as the rest of the app. */
(function(){'use strict';
if(document.querySelector('nav.nav,nav.bottom,.mo-dock'))return;
var d=document.createElement('nav');d.className='mo-dock';d.setAttribute('aria-label','Välj ämne eller spel');
d.innerHTML='<a href="../"><span aria-hidden="true">⌂</span>Start</a><a href="../#/trana"><span aria-hidden="true">∑</span>Matte</a><a href="../lara/#/sv"><span aria-hidden="true">S</span>Svenska</a><a href="../lara/#/en"><span aria-hidden="true">E</span>Engelska</a><a href="../tillsammans/"><span aria-hidden="true">◈</span>Spela</a>';
document.body.appendChild(d);})();
