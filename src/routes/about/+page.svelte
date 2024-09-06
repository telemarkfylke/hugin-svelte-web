<script>
  import ravner from "$lib/images/ravner.jpg";
  import InfoBox from "$lib/components/InfoBox.svelte";
</script>

<!-- Abpout Hugin/Munin -->
<h1>Om Hugin/Munin</h1>


<img src={ravner} alt="Hugin/Munin" />

<p>
  Hugin og Munin er i den norrøne mytologien Odins to ravner. De følger ham overalt, og vagler seg på Odins skuldre når han sitter i høysetet, Lidskjalv i Valhall. Derfor er et av Odins mange navn «Ravneguden». Hugin og Munin kommer av norrønt for ‘tanke’ og ‘minne, erindring’ Snorre skriver i Gylvaginning at Odin ved daggry sender Hugin og Munin ut i verden. De flyr over alle verdens kroker før de, tidlig om formiddagen, vender tilbake og setter seg på Odins skuldre. Der forteller de ham hva de har sett og hørt, slik at Odin får vite alt som skjer. (Kilde: <a href="https://snl.no/Hugin_og_Munin"> SNL - Hugin og Munin</a>) Med denne symbolikken ønsker vi å ta med oss ChatVTFK over i de to nye fylkene. Hugin i Telemark, og Munin i Vestfold. Ikke bare som to kopier av den gamle versjonen, men en ny og videreutviklet versjon med nytt design og ny funksjonalitet.
</p>

<p>
  <b>Målgruppen for Hugin og Munin er elever og ansatte i Vestfold og Telemark fylkeskommuner. Det er i hovedsak OpenAI sin språkmodell GPT-4o som benyttes i tjenesten, men det vil på sikt bli utviklet flere funksjoner og være mulig å bytte mellom flere modeller og ulike varianter av modellene. Dette kan du lese mer om i informasjonsteksten når du velger modell.</b>
</p>

  <InfoBox title="Om NoraLLM">
    <h2>NoraLLM</h2>
    Nora er en familie med norske språkmodeller utviklet av språkteknologigruppen ved Universitet i Oslo (UiO), i samarbeid med blant annet Nasjonalbiblioteket, og er trent på norske tekster (bokmål og nynorsk). Til forskjell fra store språkmodelleer som GPT-4o, så er ikke Nora-modellen i Hugin en ferdigutviklet samtalerobot, som er laget for chat. Nora-modellen har som formål å vise hvordan en språkmodell som er trent på norske data kan skape tekst som bedre representerer norsk språk og kultur. I tillegg er mindre, åpne og spesialiserte modeller mer bærekraftige enn de virkelig store språkmodellene, fra de store multinasjonale teknologiselskapene.<h3>Bakgrunn</h3>Nora-modellen i Hugin, norllm-7b-warm-instruct, er en  språkmodell med syv milliarder parametre. Antall parametre sier noe om hvor mange forbindelser en modell har lært, det som også kalles "parametrisk minne". Språkmodeller "trenes" på store mengder tekst, og Nora er trent på blant annet en samling norske tekster (bokmål og nynorsk) kurert av Najonalbiblioteket som heter <a href="https://github.com/NbAiLab/notram/blob/master/guides/corpus_description.md">Norwegian Collossal Corpus (NCC)</a>. Dette er store mengder data fra norsk offentlig sektor, samt norske tekster som er åpent og fritt tilgjengelige. Treningen av Nora-modellene er er gjort ved superdatamaskinen EuroHPC LUMI, i Finland, som er europas raskeste og den <a href="https://www.top500.org/lists/top500/list/2024/06/">femte raskeste i verden</a>. Modellene trenes også videre gjennom justeringer og det slippes jevnlig oppdaterte versjoner, som så tas inn i Hugin. <a href="https://www.nora.ai">Les mer om Nora</a>".
  </InfoBox>

<InfoBox title="Formål og personvern">
<p>
    Hugin/Munin er utviklet av Vestfold og Telemark fylkeskommune, ved å ta i bruk
    OpenAI sitt ChatGPT-API og våre egenutviklede nettjenester. Det medfører at vi
    har kunnet jobbe etter prinsippet om innebygget personvern – å ta de mest
    personvernvennlige valgene fra starten av utviklingen. Valgene som er tatt
    skal resultere i en tjeneste med en akseptabel personvernmessig risiko.
    Formålet med Hugin og Munin er å tilby en chatbot-tjeneste til bruk i videregående
    opplæring. Den skal la elever og lærere ta i bruk kunstig intelligens, både
    for å øke elevens læringsutbytte, men også for å kunne bidra til refleksjon
    rundt viktig oppstående teknologi i tidlig fase. Hugin og Munin er den samme
    tjenesten som OpenAI sin ChatGPT men med noen viktige forskjeller. Hugin og Munin
    bruker et API for å kommunisere med ChatGPT. Det betyr at informasjon om den
    som bruker tjenesten aldri blir sendt ut fra skolens systemer. Når man bruker
    APIet til ChatGPT gjelder det strengere regler for hvordan informasjon som
    sendes inn i tjenesten behandles enn hvis man bruker den allment tilgjengelige
    ChatGPT-tjenesten. De viktigste forskjellene mellom Hugin/Munin og den ordinære
    ChatGPT er at:
</p>
<ul>
    <li>Data som sendes inn brukes ikke til å trene eller forbedre tjenesten.</li>
    <li>Data som sendes inn slettes etter 30 dager.</li>
    <li>Brukerens navn, kontaktinformasjon og andre personopplysninger fra nettleser overføres ikke til OpenAI.</li>
</ul>
<p>
    Behandlingsaktiviteter Følgende opplysninger behandles av Vestfold og Telemark fylkeskommune med formål om tilpasset opplæring og individuell vurdering.
</p>
<ul>
    <li>Navn</li>
    <li>Epost</li>
    <li>Fylkes- og skoletilhørighet</li>
</ul>
<p>
    Følgende opplysninger overføres underdatabehandler OpenAI og lagres i 30 dager før sletting:
</p>
<ul>
    <li>Tekst (spørringer) til Hugin og Munin, samt svarene den gir.</li>
    <li>Personopplysninger i treningsdata og modell ChatGPT 3.5 kan inneholde personopplysninger fra trening/utvikling og behandles for å gi den som utfører spørringen et resultat i likhet med et informasjonssøk fra åpne tilgjengelige kilder.</li>
</ul>
</InfoBox>
<style>
img {
    width: 15%;
    float: right;
    max-width: 500px;
    display: block;
    margin: 20px;
}
  p {
    margin: 40px 0;
  }

</style>
