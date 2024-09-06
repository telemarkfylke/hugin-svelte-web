// Dette er informasjon som brukes i for å vise informasjon om modellene som er tilgjengelige og hvilke felt som skal vises i frontend.
export const modelinfo = {
  option1: {
    navn: 'GPT-4o',
    description: 'Denne modellen bruker <a href="https://openai.com/index/hello-gpt-4o/">OpenAIsG PT-4o</a> til å generere tekst basert på en gitt kontekst og melding. GPT-4o er den nyeste versjonen av GPT-4, og er trent på en stor mengde data fra internett. Modellen er trent på å generere tekst som ligner på menneskelig skrevet tekst, og kan brukes til en rekke oppgaver som tekstgenerering, oversettelse og spørsmål-svar. Du må selv legge inn kontektst og temperatur slik at modellen får de egenskapene du ønsker. Denne modellen har også mulighet for bildeanalyse. Trykk på tannhjulet og last opp et bilde. Modellen vil analysere bildet og kan generere tekst basert på dette',
    synligKontekst: true,
    illustrasjon: 'GPT4o.png'
  },
  option2: {
    navn: 'NoraLLM',
    description: 'Nora er en familie med norske språkmodeller utviklet av språkteknologigruppen ved Universitet i Oslo (UiO), i samarbeid med blant annet Nasjonalbiblioteket, og er trent på norske tekster (bokmål og nynorsk). Til forskjell fra store språkmodelleer som GPT-4o, så er ikke Nora-modellen i Hugin en ferdigutviklet samtalerobot, som er laget for chat. Nora-modellen har som formål å vise hvordan en språkmodell som er trent på norske data kan skape tekst som bedre representerer norsk språk og kultur. I tillegg er mindre, åpne og spesialiserte modeller mer bærekraftige enn de virkelig store språkmodellene, fra de store multinasjonale teknologiselskapene.',
    synligKontekst: false,
    illustrasjon: 'nora.png'
  },
  option3: {
    navn: 'Matematikkens byggesteiner',
    description: '<a href="https://sindreheggen.wordpress.com/boker/">Matematikkens byggesteiner</a> er en lærebok som dekker de fleste temaer i matematikk fra grunnskolen til og med 1P/2P på videregående. Denne assistenten svarer på spørsmål om matematikk basert på innholdet i denne boken. Alle responser er basert på innholdet i boken, og assistenten er instruert til kun å gi svar som er relevante for matematikk. Læreboken er skrevet av Sindre Sogge Heggen og publisert på <a href="https://sindrsh.github.io/openmathbooks/" target="_blank">Github - Open Math Books</a> under en Creative Commons-lisens. CC BY-NC-SA 4.0<br><br><b>Husk at KI lager tekst som kan inneholde feil. Sjekk alltid flere kilder og bruk sunn fornuft når du bruker KI.<b>',
    synligKontekst: false,
    illustrasjon: 'matematikk.png'
  },
  option4: {
    navn: 'Teoretisk matematikk 1 - 1T og R1',
    description: '<a href="https://sindreheggen.wordpress.com/boker/">Teoretisk matematikk 1</a> er en lærebok som dekker de fleste temaer i matematikk for 1T og R1 på videregående. Denne assistenten svarer på spørsmål om matematikk basert på innholdet i disse bøkene. Alle responser er basert på innholdet i boken, og assistenten er instruert til kun å gi svar som er relevante for matematikk. Læreboken er skrevet av Sindre Sogge Heggen og publisert på https://sindrsh.github.io/openmathbooks/ under en Creative Commons-lisens. CC BY-NC-SA 4.0<br><br><b>Husk at KI lager tekst som kan inneholde feil. Sjekk alltid flere kilder og bruk sunn fornuft når du bruker KI.<b>',
    synligKontekst: false,
    illustrasjon: 'matematikk.png'
  },
  option5: {
    navn: 'Teoretisk matematikk 2 - R2',
    description: '<a href="https://sindreheggen.wordpress.com/boker/">Teoretisk matematikk 1</a> er en lærebok som dekker de fleste temaer i matematikk R2 på videregående. Denne assistenten svarer på spørsmål om matematikk basert på innholdet i disse bøkene. Alle responser er basert på innholdet i boken, og assistenten er instruert til kun å gi svar som er relevante for matematikk. Læreboken er skrevet av Sindre Sogge Heggen og publisert på https://sindrsh.github.io/openmathbooks/ under en Creative Commons-lisens. CC BY-NC-SA 4.0<br><br><b>Husk at KI lager tekst som kan inneholde feil. Sjekk alltid flere kilder og bruk sunn fornuft når du bruker KI.<b>',
    synligKontekst: false,
    illustrasjon: 'matematikk.png'
  },
  option6: {
    navn: 'NDLA Religion - eksperimentell assistent',
    description: 'NDLA Religion er en eksperimentell assistent som forholder seg NDLA sine ressurser om religion. Alle responser er basert på innholdet i disse ressursene. I tillegg til læringsressursene fra NDLA, er assistenten instruert til å respondere i henhold til læreplanen i faget. (REL01-02)<br><br><b>Husk at KI lager tekst som kan inneholde feil. Sjekk alltid flere kilder og bruk sunn fornuft når du bruker KI.<b>',
    synligKontekst: false,
    illustrasjon: 'NDLA.png'

  },
  option7: {
    navn: 'VTR - eksperimentell assistent',
    description: 'VTR er en eksperimentell ekspertbot som er trent på en håndull rapporter',
    synligKontekst: false,
    illustrasjon: ''

  },
  option8: {
    navn: 'Geologibotten - eksperimentell assistent',
    description: 'Eksperimentell bot til bruk for geologi',
    synligKontekst: false,
    illustrasjon: ''

  }
}
