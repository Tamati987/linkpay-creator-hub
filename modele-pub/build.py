# Construit pub.html depuis pub-template.src.html : polices + 4 images (vai, phone, teiki, lagon) en data URI.
# Usage : python3 build.py <dossier_images>   (images nommées vai.jpg phone.jpg teiki.jpg lagon.jpg)
import base64,sys,os
d=sys.argv[1];s=open(os.path.join(os.path.dirname(__file__),'pub-template.src.html')).read()
F={'__F_B700__':'node_modules/@fontsource/baloo-2/files/baloo-2-latin-700-normal.woff2','__F_B800__':'node_modules/@fontsource/baloo-2/files/baloo-2-latin-800-normal.woff2','__F_N400__':'node_modules/@fontsource/nunito-sans/files/nunito-sans-latin-400-normal.woff2','__F_N700__':'node_modules/@fontsource/nunito-sans/files/nunito-sans-latin-700-normal.woff2'}
for k,f in F.items():s=s.replace(k,'data:font/woff2;base64,'+base64.b64encode(open(f,'rb').read()).decode())
for k in ['vai','phone','teiki','lagon']:s=s.replace(f'__I_{k.upper()}__','data:image/jpeg;base64,'+base64.b64encode(open(os.path.join(d,k+'.jpg'),'rb').read()).decode())
open('pub.html','w').write(s)
