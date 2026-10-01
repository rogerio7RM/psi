from PIL import Image, ImageDraw, ImageFont
import os, math, hashlib, json, sys

BGDIR=sys.argv[1]
OUT=sys.argv[2]
os.makedirs(OUT, exist_ok=True)
BG=[os.path.join(BGDIR,f'background_{i}.png') for i in range(29,37)]
W,H=1080,1350
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
CYAN=(40,210,235); WHITE=(245,248,252); MUTED=(193,207,222)
GREEN=(63,220,130); RED=(255,91,91); GOLD=(242,194,82); ORANGE=(245,153,66)
PANEL=(5,18,38,225); PANEL2=(8,25,48,230); LINE=(50,103,140)

def ft(sz,b=False): return ImageFont.truetype(BOLD if b else FONT, sz)
def bg(path):
    im=Image.open(path).convert('RGBA').resize((W,H))
    ov=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
    d.rectangle((0,0,W,H),fill=(0,6,18,95))
    d.rounded_rectangle((48,68,1032,1288),34,fill=(1,10,26,190),outline=(46,105,145,145),width=2)
    return Image.alpha_composite(im,ov)
def wrap(draw,text,font,maxw):
    words=str(text).split(); out=[]; cur=''
    for w in words:
        n=(cur+' '+w).strip()
        if draw.textbbox((0,0),n,font=font)[2] <= maxw: cur=n
        else:
            if cur: out.append(cur)
            cur=w
    if cur: out.append(cur)
    return out
def txt(draw,x,y,text,size,color=WHITE,b=False,maxw=None,lh=None,anchor=None):
    f=ft(size,b)
    if maxw is None:
        draw.text((x,y),text,font=f,fill=color,anchor=anchor); return y+size
    if lh is None: lh=int(size*1.22)
    yy=y
    for line in wrap(draw,text,f,maxw):
        draw.text((x,yy),line,font=f,fill=color); yy+=lh
    return yy
def header(draw,num,title,subtitle=None,title_size=54):
    draw.text((82,99),'PRIMESPHERE INTELLIGENCE',font=ft(25,True),fill=CYAN)
    if num:
        draw.rounded_rectangle((916,91,994,135),14,fill=(10,42,67,235))
        draw.text((955,113),num,font=ft(21,True),fill=WHITE,anchor='mm')
    draw.text((82,160),title,font=ft(title_size,True),fill=WHITE)
    if subtitle: draw.text((82,226),subtitle,font=ft(25,True),fill=CYAN)
def footer(draw):
    draw.line((82,1233,998,1233),fill=(75,106,134),width=1)
    draw.text((82,1250),'01 OUT 2026 • @portfoliointelligence',font=ft(22,True),fill=MUTED)
def box(draw,xy,title,body,accent=CYAN,title_size=26,body_size=36):
    x1,y1,x2,y2=xy
    draw.rounded_rectangle(xy,22,fill=PANEL,outline=LINE,width=2)
    draw.text((x1+24,y1+20),title,font=ft(title_size,True),fill=accent)
    txt(draw,x1+24,y1+62,body,body_size,WHITE,False,x2-x1-48,int(body_size*1.16))
def spark(draw,x,y,chg,col):
    dy=max(-15,min(15,-chg*3.2))
    draw.line((x,y+15,x+55,y+15+dy),fill=col,width=4)
    draw.ellipse((x+51,y+11+dy,x+59,y+19+dy),fill=col)
def save(im,n):
    p=f'{OUT}/card_{n:02d}.png'; im.convert('RGB').save(p,quality=96)
    assert Image.open(p).size==(1080,1350)
    return p

im=bg(BG[0]); d=ImageDraw.Draw(im)
d.text((82,99),'PRIMESPHERE INTELLIGENCE',font=ft(25,True),fill=CYAN)
d.text((82,158),'Wall Street',font=ft(74,True),fill=WHITE)
d.rounded_rectangle((82,246,500,306),14,fill=(8,154,199,235)); d.text((291,277),'ANTES DA ABERTURA',font=ft(28,True),fill=WHITE,anchor='mm')
txt(d,82,350,'Tecnologia começa outubro mais forte, mas os Treasuries seguem pressionando o mercado amplo. Claims e ISM são os testes macro do dia.',42,WHITE,False,900,50)
d.text((82,520),'SNAPSHOT DO MERCADO',font=ft(27,True),fill=CYAN)
items=[('S&P 500 futuro','~0,0%',0,GOLD),('Nasdaq 100 futuro','+~0,5%',0.5,GREEN),('Dow futuro','-~0,5%',-0.5,RED),('Russell 2000','-~0,4%',-0.4,RED),('VIX','~16,8',0,GOLD),('10Y Treasury','~5,33%',0.4,RED),('WTI','~US$ 90',1.1,GREEN)]
pos=[(82,565,300,700),(318,565,536,700),(554,565,772,700),(790,565,998,700),(82,720,370,855),(390,720,684,855),(704,720,998,855)]
for (name,val,ch,col),xy in zip(items,pos):
    x1,y1,x2,y2=xy; d.rounded_rectangle(xy,20,fill=(3,16,33,225),outline=(42,91,126),width=2)
    d.text((x1+18,y1+17),name,font=ft(20,True),fill=MUTED)
    d.text((x1+18,y1+57),val,font=ft(26,True),fill=col if name!='VIX' else WHITE)
    spark(d,x2-76,y1+63,ch,col)
d.text((82,889),'Atualizado às 12:45 Madrid',font=ft(25,True),fill=GOLD)
txt(d,82,930,'Fonte principal: Morning Brief PrimeSphere. Snapshots arredondados e sujeitos a mudança antes da abertura.',27,MUTED,False,900,34)
footer(d); save(im,1)

im=bg(BG[1]); d=ImageDraw.Draw(im); header(d,'2/8','DESTAQUES DO DIA')
txt(d,82,245,'Painel com preço, variação e leitura editorial combinando movimento, catalisador e contexto. Dados Bigdata e notícias pré-market.',34,WHITE,False,910,41)
d.text((82,382),'Snapshot ~12:45 Madrid',font=ft(19,True),fill=GOLD)
xs=[88,300,515,700]
for x,h in zip(xs,['Ticker','Preço (US$)','Variação','Leitura']): d.text((x,430),h,font=ft(20,True),fill=CYAN)
d.line((82,466,998,466),fill=LINE,width=2)
rows=[('GOOGL','344,08','+0,93%','NEUTRO/+'),('VICR','324,18','+12,20%','POSITIVO'),('CEG','263,20','+3,60%','NEUTRO/+'),('MU','1.065,11','0,00%','POSITIVO'),('ACN','183,37','+3,53%','POSITIVO'),('AYI','310,71','+0,62%','NEUTRO/+'),('MKC','46,40','-4,13%','NEGATIVO'),('NKE','35,40','-1,23%','NEUTRO/-'),('ORCL','137,31','-0,35%','NEUTRO'),('NVDA','228,38','+0,51%','NEUTRO/+')]
rc={'POSITIVO':GREEN,'NEUTRO/+':GOLD,'NEUTRO':GOLD,'NEUTRO/-':ORANGE,'NEGATIVO':RED}
for i,(ticker,price,chg,reading) in enumerate(rows):
    y=478+i*57
    d.rounded_rectangle((82,y,998,y+50),11,fill=(7,26,46,205) if i%2==0 else (4,18,35,190))
    d.ellipse((92,y+7,128,y+43),fill=(14,64,89)); d.text((110,y+25),ticker[:2],font=ft(13,True),fill=WHITE,anchor='mm')
    d.text((138,y+11),ticker,font=ft(20,True),fill=WHITE); d.text((305,y+11),price,font=ft(20,True),fill=WHITE)
    col=GREEN if chg.startswith('+') else RED if chg.startswith('-') else GOLD
    d.text((520,y+11),chg,font=ft(20,True),fill=col)
    d.rounded_rectangle((700,y+7,962,y+43),11,fill=(18,31,46,230),outline=rc[reading],width=2)
    d.text((831,y+25),reading,font=ft(18,True),fill=rc[reading],anchor='mm')
d.rounded_rectangle((82,1070,998,1200),20,fill=PANEL2,outline=LINE,width=2)
txt(d,106,1095,'Leitura do painel: força concentrada em catalisadores específicos e IA, enquanto juros longos mantêm pressão sobre o mercado amplo.',31,WHITE,False,860,37)
footer(d); save(im,2)

im=bg(BG[2]); d=ImageDraw.Draw(im); header(d,'3/8','AGENDA DO DIA')
txt(d,82,246,'O dia combina emprego, atividade industrial e Fed. Depois do fechamento, Nike concentra a atenção corporativa.',38,WHITE,False,900,46)
box(d,(82,390,998,700),'MACRO & FED','',CYAN,27,34)
agenda=[('14:30','Jobless Claims','200 mil vs 197 mil'),('15:45','S&P Global PMI','anterior 57,0'),('16:00','ISM Manufacturing','55,0 vs 54,6'),('16:00','Fed Waller','discurso'),('16:30','EIA Gás Natural','64 B vs 53 B')]
y=445
for tm,name,val in agenda:
    d.text((108,y),tm,font=ft(27,True),fill=GOLD); d.text((235,y),name,font=ft(27,True),fill=WHITE); d.text((620,y),val,font=ft(24),fill=MUTED); y+=49
box(d,(82,735,998,1045),'EARNINGS','ACN, AYI e MKC reportam na abertura europeia/americana. NKE é o principal evento pós-fechamento, com call às 23:00 Madrid.',CYAN,27,38)
d.rounded_rectangle((82,1080,998,1195),20,fill=(22,57,74,235),outline=GOLD,width=2)
txt(d,108,1105,'DESTAQUE: 23:00 Madrid • NIKE Q1 FY27 • vendas, margens, canal wholesale e estratégia de produto.',30,GOLD,True,840,36)
footer(d); save(im,3)

im=bg(BG[3]); d=ImageDraw.Draw(im)
d.text((82,99),'PRIMESPHERE INTELLIGENCE',font=ft(25,True),fill=CYAN); d.rounded_rectangle((916,91,994,135),14,fill=(10,42,67,235)); d.text((955,113),'4/8',font=ft(21,True),fill=WHITE,anchor='mm')
d.text((82,160),'MARKET',font=ft(54,True),fill=WHITE); d.text((355,160),'PULSE',font=ft(54,True),fill=CYAN)
d.text((82,226),'IA x YIELDS',font=ft(25,True),fill=CYAN)
txt(d,82,268,'Nasdaq mostra força relativa com IA, enquanto Treasury acima de 5,3% continua apertando as condições financeiras.',36,WHITE,False,900,44)
box(d,(82,420,372,690),'SENTIMENTO','DIVERGENTE\nTecnologia melhor; Dow e small caps mais fracos.',GOLD,20,32)
box(d,(395,420,685,690),'FOCO','IA + JUROS\nMicron e Gemini apoiam tech; yields limitam expansão do rally.',CYAN,24,31)
box(d,(708,420,998,690),'FED','DADOS + JUROS\nClaims e ISM podem redefinir a leitura sobre atividade e política monetária.',CYAN,24,31)
d.text((82,745),'SETORES • FECHAMENTO ANTERIOR',font=ft(25,True),fill=CYAN)
d.text((100,790),'RELATIVA MELHOR',font=ft(19,True),fill=GREEN); d.text((555,790),'MAIORES QUEDAS',font=ft(19,True),fill=RED)
up=[('Tecnologia','XLK','+0,64%'),('Energia','XLE','-0,06%'),('Cons. discr.','XLY','-0,28%'),('Comunicação','XLC','-0,45%'),('Utilities','XLU','-0,68%')]
down=[('Staples','XLP','-1,52%'),('Saúde','XLV','-1,35%'),('Industriais','XLI','-1,27%'),('Financeiro','XLF','-1,13%'),('Real Estate','XLRE','-1,04%')]
for i,(a,b) in enumerate(zip(up,down)):
    y=825+i*65
    for k,(name,tkr,chg) in enumerate([a,b]):
        x=82 if k==0 else 535; col=GREEN if chg.startswith('+') else RED
        d.rounded_rectangle((x,y,x+420,y+53),12,fill=(7,24,43,205))
        d.text((x+18,y+14),f'{name}  {tkr}',font=ft(17,True),fill=WHITE); d.text((x+292,y+14),chg,font=ft(17,True),fill=col)
footer(d); save(im,4)

im=bg(BG[4]); d=ImageDraw.Draw(im)
d.text((82,99),'PRIMESPHERE INTELLIGENCE',font=ft(25,True),fill=CYAN); d.rounded_rectangle((916,91,994,135),14,fill=(10,42,67,235)); d.text((955,113),'5/8',font=ft(21,True),fill=WHITE,anchor='mm')
d.text((82,155),'BRASIL →',font=ft(47,True),fill=WHITE); d.text((82,210),'WALL STREET',font=ft(47,True),fill=WHITE)
d.text((82,270),'Câmbio e juros para o investidor brasileiro',font=ft(24,True),fill=CYAN)
metrics=[('USD/BRL','~5,18','estável'),('DXY','~101,7','forte'),('10Y','~5,33%','elevado'),('EWZ','US$ 37,25','+2,14%')]
for x,(name,val,chg) in zip([82,318,554,790],metrics):
    d.rounded_rectangle((x,315,x+208,468),22,fill=PANEL,outline=LINE,width=2)
    d.text((x+18,338),name,font=ft(18,True),fill=CYAN); d.text((x+18,378),val,font=ft(27,True),fill=WHITE); d.text((x+18,420),chg,font=ft(18,True),fill=GREEN if '+' in chg else GOLD)
box(d,(82,515,998,735),'CÂMBIO','Dólar global forte pode aumentar a volatilidade do USD/BRL. Para quem investe nos EUA, o câmbio continua sendo parte relevante do retorno em reais.',CYAN,27,36)
box(d,(82,765,998,985),'JUROS','Treasury de 10 anos acima de 5,3% mantém pressão sobre valuations. Growth e empresas de duration longa tendem a reagir mais aos movimentos dos yields.',GOLD,27,36)
box(d,(82,1015,998,1185),'LEITURA DO DIA','IA ajuda o Nasdaq, mas dólar e juros altos ainda pedem seletividade. Para o brasileiro, preço do ativo e câmbio precisam ser lidos juntos.',GREEN,26,34)
footer(d); save(im,5)

im=bg(BG[5]); d=ImageDraw.Draw(im); header(d,'6/8','TEMA DO DIA','IA CONTRA O CUSTO DO DINHEIRO')
txt(d,82,280,'O mercado começa outubro dividido entre dois vetores: novos catalisadores de IA sustentam tecnologia, enquanto yields altos restringem o apetite por risco.',36,WHITE,False,900,43)
d.rounded_rectangle((82,430,998,520),20,fill=(15,49,66,235),outline=GOLD,width=2); d.text((110,454),'NÚMERO-CHAVE',font=ft(20,True),fill=GOLD); d.text((340,452),'Treasury 10Y ~5,33%',font=ft(26,True),fill=WHITE)
box(d,(82,555,998,735),'1 • IA','Micron reforçou demanda de memória para data centers e Google lançou Gemini 4 Argon. O tema segue sustentando tecnologia.',CYAN,27,36)
box(d,(82,765,998,945),'2 • YIELDS','Juros longos em máximas de vários anos elevam a taxa de desconto e limitam a expansão de múltiplos.',GOLD,27,36)
box(d,(82,975,998,1170),'3 • O TESTE','Claims e ISM dirão se atividade e emprego justificam juros ainda altos. A reação do 10Y será o principal termômetro.',GREEN,27,36)
footer(d); save(im,6)

im=bg(BG[6]); d=ImageDraw.Draw(im); header(d,'7/8','O QUE OBSERVAR NA ABERTURA','CHECKLIST DE WALL STREET')
txt(d,82,278,'Quatro sinais podem definir se a força de tecnologia se espalha ou fica isolada.',36,WHITE,False,900,44)
checks=[('1','TREASURY 10Y','~5,33%','Se o yield subir após os dados, a pressão sobre valuations tende a aumentar.'),('2','NASDAQ 100','+~0,5% futuro','Observar se a liderança de IA se mantém e amplia a participação do mercado.'),('3','MICRON + SEMIS','resultado forte','HBM, memória e capex seguem como teste para a narrativa de IA.'),('4','ISM + CLAIMS','14:30 e 16:00','Surpresas fortes podem reforçar juros altos; dados fracos podem aliviar yields.')]
y=395
for n,title,ref,body in checks:
    d.rounded_rectangle((82,y,998,y+170),22,fill=PANEL,outline=LINE,width=2)
    d.ellipse((106,y+29,162,y+85),fill=(10,135,177)); d.text((134,y+57),n,font=ft(24,True),fill=WHITE,anchor='mm')
    d.text((185,y+25),title,font=ft(25,True),fill=CYAN); d.text((185,y+62),ref,font=ft(21,True),fill=GOLD)
    txt(d,185,y+101,body,30,WHITE,False,770,35); y+=185
d.rounded_rectangle((82,1145,998,1215),18,fill=(23,53,68,235),outline=GOLD,width=2)
d.text((108,1163),'SINAL MAIS IMPORTANTE',font=ft(17,True),fill=GOLD); d.text((380,1161),'Reação do 10Y aos dados macro.',font=ft(22,True),fill=WHITE)
footer(d); save(im,7)

im=bg(BG[7]); d=ImageDraw.Draw(im); header(d,'8/8','CONTEXTO ANTES DO RUÍDO')
box(d,(82,335,998,620),'RESUMO FINAL','Tecnologia começa o dia com apoio de IA, mas o mercado amplo continua limitado por juros longos elevados. Claims e ISM podem decidir qual força domina a sessão.',CYAN,28,40)
box(d,(82,660,998,900),'ACOMPANHE','primesphereintelligence.com\n@portfoliointelligence\n\nLeia o Morning Brief completo e acompanhe diariamente os principais vetores de Wall Street.',GREEN,28,38)
box(d,(82,940,998,1115),'AVISO EDUCACIONAL','Conteúdo informativo e educacional. Não constitui recomendação individual de investimento, oferta ou promessa de retorno.',GOLD,27,34)
d.rounded_rectangle((300,1145,780,1205),18,fill=(7,145,187,235)); d.text((540,1175),'ACOMPANHE A PRIMESPHERE',font=ft(23,True),fill=WHITE,anchor='mm')
footer(d); save(im,8)

h={}
for i in range(1,9):
    p=f'{OUT}/card_{i:02d}.png'
    h[f'card_{i:02d}.png']=hashlib.sha256(open(p,'rb').read()).hexdigest().upper()
open(f'{OUT}/hashes.json','w').write(json.dumps(h,indent=2))
print(json.dumps(h,indent=2))
