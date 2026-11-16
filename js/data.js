// Koze — kontni leson yo.
// Chak fraz: [anglè, kreyòl, pwononsyasyon anglè ekri ak lèt kreyòl].
// ⚠️ Kreyòl la dwe revize pa yon moun ki pale l natif natal anvan lansman.

export const PATHS = [
  { id: 'baz', ikon: 'brick-wall', ton: 'blue', non: 'Baz', dekri: 'Fraz ou bezwen chak jou, kèlkeswa sa ou fè.' },
  { id: 'biznis', ikon: 'store', ton: 'red', non: 'Biznis online', dekri: 'Pale ak kliyan, vann, livrezon, rezo sosyal.' },
  { id: 'etid', ikon: 'graduation-cap', ton: 'sun', non: 'Etid', dekri: 'Lekòl, inivèsite, bous, egzamen.' },
  { id: 'vwayaj', ikon: 'plane', ton: 'blue', non: 'Vwayaj', dekri: 'Ayewopò, otèl, direksyon, taksi.' },
  { id: 'lavi', ikon: 'house', ton: 'leaf', non: 'Lavi chak jou', dekri: 'Magazen, bank, telefòn, randevou.' },
  { id: 'konstriksyon', ikon: 'hard-hat', ton: 'sun', non: 'Konstriksyon', dekri: 'Chantye, zouti, sekirite.' },
  { id: 'sante', ikon: 'stethoscope', ton: 'red', non: 'Swen sante', dekri: 'Pasyan, doktè, lopital, medikaman.' },
];

export const GOALS = [
  { id: 'travay', ikon: 'briefcase', label: 'Pou travay' },
  { id: 'etid', ikon: 'graduation-cap', label: 'Pou lekòl oswa inivèsite' },
  { id: 'vwayaj', ikon: 'plane', label: 'Pou vwayaje' },
  { id: 'biznis', ikon: 'store', label: 'Pou biznis mwen' },
  { id: 'lavi', ikon: 'heart', label: 'Pou lavi chak jou ak fanmi' },
];

// Chemen nou chwazi davans selon objektif la (moun nan ka chanje l).
export const GOAL_TO_PATH = { etid: 'etid', vwayaj: 'vwayaj', biznis: 'biznis', lavi: 'lavi' };

export const LEVELS = [
  { id: 'zewo', ikon: 'sprout', label: 'Mwen pa konn anyen', desc: 'N ap kòmanse depi nan baz la, dousman.' },
  { id: 'pi', ikon: 'leaf', label: 'Mwen konn kèk mo', desc: 'N ap fè w ekri pi souvan.' },
  { id: 'baz', ikon: 'tree-deciduous', label: 'Mwen konn baz la', desc: 'Ou ka sote leson baz yo epi ale dirèk nan chemen ou.' },
];

export const MINUTES = [
  { id: 5, ikon: 'coffee', label: '5 minit pa jou', desc: 'Dousman' },
  { id: 10, ikon: 'footprints', label: '10 minit pa jou', desc: 'Nòmal' },
  { id: 15, ikon: 'zap', label: '15 minit pa jou', desc: 'Serye' },
  { id: 20, ikon: 'rocket', label: '20 minit pa jou', desc: 'Entans' },
];

const L = (id, path, tit, sitiyasyon, objektif, rows) => ({
  id, path, tit, sitiyasyon, objektif,
  items: rows.map(([en, ht, son], i) => ({ id: `${id}.${i}`, en, ht, son })),
});

export const LESSONS = [
  // ---------- BAZ ----------
  L('baz-1', 'baz', 'Salitasyon', 'Ou rankontre yon moun pou premye fwa.',
    'di bonjou, mande moun nan kijan l ye epi di orevwa.', [
      ['Hello!', 'Alo! / Bonjou!', 'Elo!'],
      ['Good morning!', 'Bonjou! (nan maten)', 'Goud mòning!'],
      ['How are you?', 'Kijan ou ye?', 'Hao a yu?'],
      ['I am fine, thank you.', 'Mwen byen, mèsi.', 'Ay am fayn, tènk yu.'],
      ['Nice to meet you.', 'Mwen kontan konnen w.', 'Nays tou mit yu.'],
      ['Goodbye!', 'Orevwa!', 'Goudbay!'],
    ]),
  L('baz-2', 'baz', 'Prezante tèt ou', 'Yon moun vle konnen kiyès ou ye.',
    'di non ou, ki kote ou soti ak ki lang ou pale.', [
      ['What is your name?', 'Kijan ou rele?', 'Wat iz yò nem?'],
      ['My name is Marie.', 'Non mwen se Marie.', 'May nem iz Mari.'],
      ['Where are you from?', 'Ki kote ou soti?', 'Wè a yu fwòm?'],
      ['I am from Haiti.', 'Mwen soti Ayiti.', 'Ay am fwòm Heti.'],
      ['I speak Creole.', 'Mwen pale kreyòl.', 'Ay spik Kriyòl.'],
      ['I speak a little English.', 'Mwen pale yon ti kras anglè.', 'Ay spik e litèl Ingglich.'],
    ]),
  L('baz-3', 'baz', 'Lè ou pa konprann', 'Moun nan pale twò vit, ou pa konprann.',
    'mande moun nan repete, pale dousman oswa eksplike.', [
      ['I do not understand.', 'Mwen pa konprann.', 'Ay dou nòt ondèstand.'],
      ['Can you repeat, please?', 'Èske ou ka repete, souple?', 'Ken yu ripit, pliz?'],
      ['Speak slowly, please.', 'Pale dousman, souple.', 'Spik slowli, pliz.'],
      ['What does this mean?', 'Kisa sa vle di?', 'Wat dòz dis min?'],
      ['Excuse me.', 'Eskize m.', 'Ekskyouz mi.'],
      ['Thank you very much.', 'Mèsi anpil.', 'Tènk yu vèri moch.'],
    ]),

  // ---------- BIZNIS ONLINE ----------
  L('biznis-1', 'biznis', 'Kliyan ak pri', 'Yon kliyan ekri w sou WhatsApp pou l achte.',
    'bay pri, pale de livrezon ak peman.', [
      ['How much does it cost?', 'Konbyen li koute?', 'Hao moch dòz it kòst?'],
      ['The price is ten dollars.', 'Pri a se dis dola.', 'De prays iz tèn dalèz.'],
      ['Do you deliver?', 'Èske nou fè livrezon?', 'Dou yu dilivè?'],
      ['I accept payment online.', 'Mwen aksepte peman sou entènèt.', 'Ay aksèpt pèyment onlayn.'],
      ['Send me a message.', 'Voye yon mesaj ban mwen.', 'Sènd mi e mèsedj.'],
      ['Thank you for your order.', 'Mèsi pou kòmand ou.', 'Tènk yu fò yò òdè.'],
    ]),
  L('biznis-2', 'biznis', 'Rezo sosyal', 'Ou ap pibliye pwodui ou yo sou Instagram ak TikTok.',
    'fè piblisite pou pwodui ou epi reponn kliyan.', [
      ['Follow my page.', 'Swiv paj mwen.', 'Falo may pedj.'],
      ['New products are available.', 'Nouvo pwodui yo disponib.', 'Nyou pwòdokts a aveylabòl.'],
      ['Check the link in my bio.', 'Gade lyen ki nan bio mwen an.', 'Tchèk de link in may bayo.'],
      ['What size do you want?', 'Ki gwosè ou vle?', 'Wat sayz dou yu wont?'],
      ['Your order is on the way.', 'Kòmand ou an nan wout.', 'Yò òdè iz òn de we.'],
      ['We are open every day.', 'Nou louvri chak jou.', 'Wi a opèn èvri de.'],
    ]),

  // ---------- ETID ----------
  L('etid-1', 'etid', 'Nan klas', 'Ou nan klas, pwofesè a ap pale anglè.',
    'poze kesyon, mande eksplikasyon epi pale de devwa ak egzamen.', [
      ['I am a student.', 'Mwen se yon etidyan.', 'Ay am e styoudent.'],
      ['I have a question.', 'Mwen gen yon kesyon.', 'Ay hav e kwèstchen.'],
      ['Can you explain again?', 'Èske ou ka eksplike ankò?', 'Ken yu eksplen egen?'],
      ['What is the homework?', 'Ki devwa nou genyen?', 'Wat iz de homwòk?'],
      ['When is the exam?', 'Ki lè egzamen an ye?', 'Wèn iz di egzam?'],
      ['I need more time.', 'Mwen bezwen plis tan.', 'Ay nid mò taym.'],
    ]),
  L('etid-2', 'etid', 'Inivèsite ak bous', 'Ou vle al etidye aletranje.',
    'pale de etid ou, bous ou ak lavi sou kanpis la.', [
      ['I want to study in the United States.', 'Mwen vle al etidye Ozetazini.', 'Ay wont tou stadi in di Younayted Stets.'],
      ['I am applying for a scholarship.', 'M ap aplike pou yon bous.', 'Ay am aplaying fò e skolaship.'],
      ['My major is computer science.', 'Mwen etidye enfòmatik.', 'May medjò iz kompyoutè sayens.'],
      ['Where is the library?', 'Ki kote bibliyotèk la ye?', 'Wè iz de laybrèri?'],
      ['Can you help me with this?', 'Èske ou ka ede m ak sa?', 'Ken yu hèlp mi wid dis?'],
      ['I passed the test!', 'Mwen pase egzamen an!', 'Ay past de tèst!'],
    ]),

  // ---------- VWAYAJ ----------
  L('vwayaj-1', 'vwayaj', 'Nan ayewopò', 'Ou rive nan ayewopò, yon ajan ap poze w kesyon.',
    'montre paspò ou, jwenn pòt ou epi reponn ajan an.', [
      ['Here is my passport.', 'Men paspò mwen.', 'Hir iz may paspòt.'],
      ['Where is my gate?', 'Ki kote pòt anbakman mwen an ye?', 'Wè iz may get?'],
      ['I have one bag.', 'Mwen gen yon sèl valiz.', 'Ay hav wann bag.'],
      ['My flight is delayed.', 'Vòl mwen an an reta.', 'May flayt iz dile.'],
      ['I am visiting my family.', 'M ap vin vizite fanmi m.', 'Ay am vizitin may fanmi.'],
      ['How long will you stay?', 'Konbyen tan ou pral rete?', 'Hao long wil yu ste?'],
    ]),
  L('vwayaj-2', 'vwayaj', 'Otèl ak direksyon', 'Ou rive nan yon vil ou pa konnen.',
    'antre nan otèl ou, mande direksyon epi pran yon taksi.', [
      ['I have a reservation.', 'Mwen gen yon rezèvasyon.', 'Ay hav e rezèvechen.'],
      ['Where is the bathroom?', 'Ki kote twalèt la ye?', 'Wè iz de bathroum?'],
      ['Turn left.', 'Vire agoch.', 'Tèn lèft.'],
      ['Turn right.', 'Vire adwat.', 'Tèn rayt.'],
      ['It is near here.', 'Li tou pre isit la.', 'It iz nir hir.'],
      ['I need a taxi.', 'Mwen bezwen yon taksi.', 'Ay nid e taksi.'],
    ]),

  // ---------- LAVI CHAK JOU ----------
  L('lavi-1', 'lavi', 'Nan magazen', 'Ou bezwen achte kèk bagay.',
    'achte, mande pri epi peye.', [
      ['I want to buy this.', 'Mwen vle achte sa a.', 'Ay wont tou bay dis.'],
      ['Do you have water?', 'Èske ou gen dlo?', 'Dou yu hav wòtè?'],
      ['Can I pay with a card?', 'Èske m ka peye ak kat?', 'Ken ay pe wid e kad?'],
      ['It is too expensive.', 'Li twò chè.', 'It iz tou ekspènsiv.'],
      ['Where is the bank?', 'Ki kote bank lan ye?', 'Wè iz de bank?'],
      ['I am hungry.', 'Mwen grangou.', 'Ay am hongri.'],
    ]),
  L('lavi-2', 'lavi', 'Telefòn ak randevou', 'Ou bezwen rele yon moun pou fikse yon randevou.',
    'pran randevou, di lè ou ap rive epi di orevwa.', [
      ['Can I make an appointment?', 'Èske m ka pran yon randevou?', 'Ken ay mek an apòyntment?'],
      ['What time is it?', 'Ki lè li ye?', 'Wat taym iz it?'],
      ['Call me tomorrow.', 'Rele m demen.', 'Kòl mi toumòro.'],
      ['I am on my way.', 'Mwen nan wout.', 'Ay am òn may we.'],
      ['I will be late.', 'M ap an reta.', 'Ay wil bi let.'],
      ['See you tomorrow.', 'N a wè demen.', 'Si yu toumòro.'],
    ]),

  // ---------- KONSTRIKSYON ----------
  L('konstriksyon-1', 'konstriksyon', 'Sou chantye a', 'Premye jou ou sou yon chantye.',
    'konprann lòd chèf ou epi pale de travay la.', [
      ['Put on your helmet.', 'Mete kas ou.', 'Pout òn yò hèlmèt.'],
      ['Watch out!', 'Atansyon!', 'Wach awout!'],
      ['Bring me the hammer.', 'Pote mato a ban mwen.', 'Bring mi de hamè.'],
      ['We need more cement.', 'Nou bezwen plis siman.', 'Wi nid mò simènt.'],
      ['Where do I start?', 'Ki kote pou m kòmanse?', 'Wè dou ay start?'],
      ['The work is finished.', 'Travay la fini.', 'De wòk iz finicht.'],
    ]),
  L('konstriksyon-2', 'konstriksyon', 'Zouti ak sekirite', 'N ap travay ak zouti lou.',
    'mande zouti, fè atansyon epi di si ou blese.', [
      ['Hold the ladder.', 'Kenbe nechèl la.', 'Hold de ladè.'],
      ['Measure the wall.', 'Mezire mi an.', 'Mèjè de wòl.'],
      ['Be careful, it is heavy.', 'Fè atansyon, li lou.', 'Bi kèfoul, it iz hèvi.'],
      ['I need gloves.', 'Mwen bezwen gan.', 'Ay nid glovz.'],
      ['What time is the break?', 'Ki lè poz la?', 'Wat taym iz de brek?'],
      ['I am hurt.', 'Mwen blese.', 'Ay am hèt.'],
    ]),

  // ---------- SWEN SANTE ----------
  L('sante-1', 'sante', 'Ak pasyan an', 'Ou se èd swayan (CNA), ou ap okipe yon pasyan.',
    'mande pasyan an kijan l santi l epi ede l.', [
      ['How do you feel today?', 'Kijan ou santi w jodi a?', 'Hao dou yu fil toude?'],
      ['Did you take your medicine?', 'Èske ou pran medikaman ou?', 'Did yu tek yò mèdisin?'],
      ['Let me help you stand up.', 'Kite m ede w kanpe.', 'Lèt mi hèlp yu stand op.'],
      ['Are you in pain?', 'Èske ou gen doulè?', 'A yu in pen?'],
      ['I will check your blood pressure.', 'M ap tcheke tansyon ou.', 'Ay wil tchèk yò blod prèchè.'],
      ['Call me if you need help.', 'Rele m si ou bezwen èd.', 'Kòl mi if yu nid hèlp.'],
    ]),
  L('sante-2', 'sante', 'Kay doktè', 'Ou malad, ou al lopital.',
    'di sa ki fè ou mal epi mande èd.', [
      ['I am sick.', 'Mwen malad.', 'Ay am sik.'],
      ['It hurts here.', 'Li fè m mal la a.', 'It hèts hir.'],
      ['I have a fever.', 'Mwen gen lafyèv.', 'Ay hav e fivè.'],
      ['I need a doctor.', 'Mwen bezwen yon doktè.', 'Ay nid e daktè.'],
      ['I am allergic to penicillin.', 'Mwen fè alèji ak penisilin.', 'Ay am alèjik tou pènisilin.'],
      ['Where is the emergency room?', 'Ki kote sal ijans lan ye?', 'Wè iz di imèjensi roum?'],
    ]),
];
