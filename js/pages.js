// Paj enfòmasyon yo: FAQ, Règ konfidansyalite, Kondisyon itilizasyon.
// Tèks sa yo dekri sa app la fè vre. Si w chanje kijan Koze sèvi ak done yo
// (piblisite, peman, nouvo sèvis), mete paj sa yo ajou epi chanje UPDATED.
import { CONTACT_EMAIL } from './config.js';

export const UPDATED = '21 novanm 2026';
const contact = () => (CONTACT_EMAIL
  ? `ekri nou nan <a href="mailto:${CONTACT_EMAIL}" translate="no">${CONTACT_EMAIL}</a>`
  : 'kontakte nou (adrès imèl la ap parèt isit la byento)');

const q = (title, body) => `<details class="faq-q"><summary>${title}</summary><div>${body}</div></details>`;

export const PAGES = {
  faq: {
    title: 'Kesyon moun poze',
    body: () => `
      <h2 class="faq-h">Koze</h2>
      ${q('Èske Koze gratis?', '<p>Wi. Tout leson yo ak revizyon yo gratis. Kont lan gratis tou.</p>')}
      ${q('Èske m bezwen kreye yon kont?', '<p>Non. Ou ka aprann san kont: pwogrè ou rete sou telefòn ou. Yon kont pèmèt ou pa pèdi pwogrè ou si w chanje telefòn, epi aprann sou plizyè aparèy.</p>')}
      ${q('Èske Koze mache san entènèt?', '<p>Wi. Apre premye fwa ou louvri l, leson yo ak vwa yo mache san entènèt. Pwogrè ou ap sove nan kont ou lè entènèt la tounen.</p>')}
      ${q('Kijan pou m mete Koze sou ekran telefòn mwen?', '<p><b>Android (Chrome):</b> peze ⋮ anlè a dwat, epi <i>Ajoute nan ekran akèy</i> (<span lang="en" translate="no">Add to Home screen</span>).</p><p><b>iPhone (Safari):</b> peze bouton pataje a (kare ak flèch), epi <i>Sou ekran akèy</i> (<span lang="en" translate="no">Add to Home Screen</span>).</p>')}
      ${q('Kijan pou m resevwa yon rapèl chak jou?', '<p>Pwofil → <i>Rapèl chak jou</i>: limen l epi chwazi lè a. Ou resevwa l sèlman si w poko pratike jou sa a.</p><p><b>iPhone:</b> rapèl yo mache sèlman si Koze sou ekran akèy ou (Safari → bouton Pataje → <i>Sou ekran akèy</i>), epi ou louvri l depi la.</p>')}
      ${q('Kijan revizyon yo mache?', '<p>Chak fraz ou aprann tounen nan bon moman an: kèk jou apre, pi lwen chak fwa ou konnen l. Si w bliye l, li tounen pi vit. Se konsa w ap sonje l pou lontan.</p>')}
      <h2 class="faq-h">Son ak mikwo</h2>
      ${q('Mwen pa tande vwa a', '<p>Monte volim telefòn nan. Sou iPhone, tcheke bouton silans lan sou kote a. Si sa pa mache toujou, fèmen Koze epi louvri l ankò.</p>')}
      ${q('Mikwo a pa mache', '<p>Egzèsis pale yo mache nan Chrome (Android) ak Safari (iPhone). Lè telefòn nan mande w, peze <i>Pèmèt</i> (<span lang="en" translate="no">Allow</span>). Si w te refize, ale nan paramèt navigatè a pou w pèmèt mikwo a pou Koze. Ou ka toujou sote yon egzèsis pale.</p>')}
      ${q('Èske Koze anrejistre vwa mwen?', '<p>Non. Koze pa anrejistre ni kenbe vwa ou. Se navigatè telefòn ou (Google oswa Apple) ki konprann sa w di a, dapre pwòp règ pa yo.</p>')}
      <h2 class="faq-h">Kont ak modpas</h2>
      ${q('Mwen bliye modpas mwen', '<p>Sou ekran <i>Konekte</i>, peze <i>Ou bliye modpas ou?</i>, ekri imèl ou, epi peze lyen <span lang="en" translate="no">« Reset Password »</span> nan imèl nou voye a. Koze ap louvri pou w chwazi yon nouvo modpas.</p>')}
      ${q('Mwen pa resevwa imèl la', '<p>Tann 1 minit, epi gade nan <i>Spam</i> oswa <i>Promosyon</i>. Tcheke si w te ekri imèl la byen. Ou ka mande yon lòt imèl apre kèk minit.</p>')}
      ${q('Kijan pou m chwazi yon bon modpas?', '<p>Omwen 8 karaktè, ak lèt ak chif. Pi long pi bon: yon ti fraz tankou <i>MangoDous2024Lakay</i> pi fasil pou sonje e pi difisil pou devine. Pa sèvi ak menm modpas ou genyen pou imèl ou oswa bank ou.</p>')}
      ${q('Kijan pou m efase kont mwen?', '<p>Pwofil → <i>Efase kont mwen</i>. Kont ou ak tout pwogrè ki sove ladan l ap efase nèt, touswit.</p>')}
      ${q('Mwen gen yon lòt pwoblèm', `<p>Pou nenpòt kesyon, ${contact()}.</p>`)}`,
  },

  konfidansyalite: {
    title: 'Règ konfidansyalite',
    body: () => `
      <p class="muted small">Dènye chanjman: ${UPDATED}</p>
      <p class="lead-s">An kout: Koze kolekte sèlman sa l bezwen pou w aprann. Nou pa vann done ou. Nou pa mete piblisite. Ou ka efase kont ou nenpòt lè.</p>
      <h2>1. San kont</h2>
      <p>Si w pa kreye kont, tout pwogrè ou (leson ou fini, fraz w ap aprann, XP, preferans) rete <b>sou telefòn ou sèlman</b>. Nou pa resevwa anyen.</p>
      <h2>2. Ak yon kont</h2>
      <p>Lè w kreye yon kont, nou kenbe:</p>
      <ul>
        <li><b>Imèl ou</b>: pou konekte w, epi voye imèl kont lan (konfimasyon, chanje modpas). Nou pa voye piblisite.</li>
        <li><b>Modpas ou</b>: li chifre (bcrypt) anvan yo sere l. Pèsonn, ni nou menm, pa ka li l.</li>
        <li><b>Pwogrè ou</b>: chemen ou chwazi, nivo, leson ou fini, fraz w ap aprann, XP ak jou youn dèyè lòt.</li>
        <li><b>Done teknik</b>: dat ou kreye kont lan ak dènye koneksyon, epi adrès IP pou pwoteje kont yo kont atak.</li>
      </ul>
      <h2>3. Mikwo ak vwa</h2>
      <p>Koze pa anrejistre ni sere vwa ou. Pou egzèsis pale yo, se navigatè telefòn ou (Chrome/Google oswa Safari/Apple) ki tande epi ekri sa w di a, dapre pwòp règ konfidansyalite pa yo. Koze resevwa sèlman tèks la pou l tcheke repons ou.</p>
      <h2>4. Estatistik anonim</h2>
      <p>Pou nou konnen kote moun yo bloke epi amelyore leson yo, Koze voye ti enfòmasyon anonim: lè app la louvri, lè yon leson kòmanse, fini oswa kanpe, presizyon ou, si mikwo a mache, si rapèl yo limen. Chak telefòn gen yon nimewo o aza, ki pa lye ak imèl ou ni ak kont ou. Nou pa voye sa w ekri, sa w di nan mikwo a, ni pozisyon ou.</p>
      <p>Ou ka etenn sa nenpòt lè: Pwofil → <i>Ede amelyore Koze</i>.</p>
      <h2>5. Rapèl chak jou</h2>
      <p>Si w limen rapèl yo, telefòn ou ba nou yon adrès notifikasyon (navigatè a kreye l), lè w chwazi a, zòn lè ou, ak dènye jou ou te pratike, pou nou voye rapèl la sèlman si w poko pratike. Etenn rapèl yo nan Pwofil efase adrès sa a.</p>
      <h2>6. Kiyès ki ede nou</h2>
      <ul>
        <li><b>Supabase</b> (Etazini): kenbe kont yo ak pwogrè yo, sou sèvè ki pwoteje.</li>
        <li><b>GitHub Pages</b>: mete app la sou entènèt. Yo ka kenbe adrès IP vizitè yo pou sekirite.</li>
      </ul>
      <p>Nou pa vann, pa lwe, epi pa pataje done ou ak lòt moun pou piblisite. Nou ta bay done sèlman si lalwa oblije nou.</p>
      <h2>7. Sekirite</h2>
      <p>Tout koneksyon chifre (HTTPS). Chak moun ka wè sèlman pwòp pwogrè pa l (règ sekirite nan baz done a). Sesyon yo ekspire poukont yo, epi twòp move modpas bloke koneksyon an pou yon ti tan.</p>
      <h2>8. Dwa ou</h2>
      <ul>
        <li><b>Wè ak korije</b>: pwogrè ou ak imèl ou parèt nan Pwofil.</li>
        <li><b>Efase</b>: Pwofil → <i>Efase kont mwen</i> efase kont ou ak tout pwogrè ladan l nèt, touswit.</li>
        <li><b>Kite</b>: dekonekte nenpòt lè; pwogrè sou telefòn ou rete pou ou.</li>
      </ul>
      <h2>9. Timoun</h2>
      <p>Pou kreye yon kont, ou dwe gen omwen 13 an. Timoun ki pi piti ka aprann san kont, avèk paran yo.</p>
      <h2>10. Chanjman</h2>
      <p>Si yon jou nou chanje kijan nou sèvi ak done ou (pa egzanp piblisite oswa abònman), n ap mete paj sa a ajou epi n ap avèti w nan app la anvan.</p>
      <h2>11. Kontak</h2>
      <p>Pou nenpòt kesyon sou done ou, ${contact()}.</p>`,
  },

  kondisyon: {
    title: 'Kondisyon itilizasyon',
    body: () => `
      <p class="muted small">Dènye chanjman: ${UPDATED}</p>
      <p class="lead-s">Lè w sèvi ak Koze, ou dakò ak kondisyon sa yo.</p>
      <h2>1. Sèvis la</h2>
      <p>Koze se yon app gratis pou aprann anglè an kreyòl. Nou ka ajoute, chanje oswa retire leson ak fonksyon pou fè app la vin pi bon.</p>
      <h2>2. Kont ou</h2>
      <ul>
        <li>Ou dwe gen omwen 13 an pou kreye yon kont.</li>
        <li>Bay yon imèl ki pou ou, epi kenbe modpas ou sekrè. Ou responsab sa ki fèt ak kont ou.</li>
        <li>Si w panse yon lòt moun konnen modpas ou, chanje l touswit nan Pwofil.</li>
      </ul>
      <h2>3. Sa ki pa pèmèt</h2>
      <ul>
        <li>Eseye antre nan kont yon lòt moun, oswa atake, ralanti oswa kopye sèvis la ak robo.</li>
        <li>Kreye anpil kont pou abize sèvis la.</li>
      </ul>
      <p>Nou ka bloke oswa efase yon kont ki pa respekte règ sa yo.</p>
      <h2>4. Leson yo</h2>
      <p>Nou fè tout efò pou leson yo kòrèk, men Koze pa ranplase yon pwofesè, ni yon tradiktè ofisyèl pou papye legal, medikal oswa imigrasyon. Tèks, imaj, vwa ak ti zwazo Koze a se pou Koze: ou ka sèvi ak yo pou w aprann, pa pou w revann yo.</p>
      <h2>5. Garanti</h2>
      <p>Koze bay jan l ye a. Nou travay pou l toujou mache epi pou pwogrè ou pa pèdi, men nou pa ka garanti sa 100%. Kenbe telefòn ou ajou.</p>
      <h2>6. Fèmen kont</h2>
      <p>Ou ka efase kont ou nenpòt lè nan Pwofil. Si nou ta janm fèmen Koze, n ap avèti moun ki gen kont omwen 30 jou anvan.</p>
      <h2>7. Chanjman</h2>
      <p>Si nou chanje kondisyon sa yo, n ap mete dat la ajou epi avèti w nan app la.</p>
      <h2>8. Kontak</h2>
      <p>Pou nenpòt kesyon, ${contact()}.</p>`,
  },
};
