export const vfkModels = [
  {
    id: '13',
    metadata: {
      navn: 'Mistral',
      default: true,
      flagClass: 'fi fi-eu',
      description: 'Dennne modellen bruker [Mistral](https://mistral.ai/news/pixtral-large). Mistral Large og Pixtral Large, er avanserte multimodal språkmodeller utviklet for å håndtere komplekse oppgaver som kombinerer tekst og bildeanalyse. Modellen er trent på en omfattende mengde data og er optimalisert for å generere tekst basert på en gitt kontekst, melding eller visuelle input. Mistral Large kan brukes til en rekke oppgaver som tekstgenerering, bildeanalyse og multimodal forståelse. For å bruke modellens bildeanalysefunksjon, kan du laste opp et bilde via opplastingsknappen. Modellen vil analysere bildet og generere tekst basert på innholdet. Dette gjør Mistral Large til et kraftig verktøy for både kreative og analytiske oppgaver.',
      synligKontekst: true,
      illustrasjon: '',
      tile: 'chat',
      endpoint: 'multimodalMistral',
      assistant: false,
      fileupload: false,
      imageuplaod: true,
      tools: []
    },
    params: {
      message: '',
      kontekst: '',
      model: 'pixtral-large-latest'
    }
  },
  {
    id: '0',
    metadata: {
      navn: 'ChatGPT-5',
      flagClass: 'fi fi-us',
      description: 'Denne modellen bruker [OpenAIs GPT-5](https://openai.com/nb-NO/gpt-5//) til å generere tekst basert på en gitt kontekst og melding. GPT-5 er den nyeste versjonen av GPT, og er trent på en stor mengde data fra internett. Modellen er trent på å generere tekst som ligner på menneskelig skrevet tekst, og kan brukes til en rekke oppgaver som tekstgenerering, oversettelse og spørsmål-svar. Du må selv legge inn kontektst og temperatur slik at modellen får de egenskapene du ønsker. Denne modellen har også mulighet for bilde og dokumentanalyse. Trykk på opplastingsknappene. Modellen vil analysere bildet eller dokumentet og kan generere tekst basert på dette.',
      synligKontekst: true,
      illustrasjon: '',
      tile: 'chat',
      endpoint: 'responseOpenAI',
      assistant: false,
      fileupload: true,
      imageuplaod: true,
      tools: []
    },
    params: {
      message: '',
      messageHistory: '',
      kontekst: '',
      model: 'gpt-5',
      base64String: ''
    }
  },
  {
    id: '6',
    metadata: {
      navn: 'OpenAI ChatGPT 4.1',
      flagClass: 'fi fi-us',
      description: 'Denne modellen bruker [OpenAIs GPT-4.1](https://openai.com/index/gpt-4-1/) til å generere tekst basert på en gitt kontekst og melding. GPT-4.1 er trent på en stor mengde data fra internett. Modellen er trent på å generere tekst som ligner på menneskelig skrevet tekst, og kan brukes til en rekke oppgaver som tekstgenerering, oversettelse og spørsmål-svar. Du må selv legge inn kontektst og temperatur slik at modellen får de egenskapene du ønsker. Denne modellen har også mulighet for bilde og dokumentanalyse. Trykk på opplastingsknappene. Modellen vil analysere bildet eller dokumentet og kan generere tekst basert på dette.',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'chat',
      endpoint: 'responseOpenAI',
      assistant: false,
      fileupload: true,
      imageuplaod: true,
      tools: []
    },
    params: {
      message: '',
      messageHistory: '',
      kontekst: '',
      model: 'gpt-4.1',
      base64String: ''
    }
  },
  {
    id: '1',
    metadata: {
      navn: 'NoraLLM',
      flagClass: 'fi fi-no',
      description: 'Nora er en familie med norske språkmodeller utviklet av språkteknologigruppen ved Universitet i Oslo (UiO), i samarbeid med blant annet Nasjonalbiblioteket, og er trent på norske tekster (bokmål og nynorsk). Til forskjell fra store språkmodelleer som GPT-4o, så er ikke Nora-modellen i Mugin en ferdigutviklet samtalerobot, som er laget for chat. Nora-modellen har som formål å vise hvordan en språkmodell som er trent på norske data kan skape tekst som bedre representerer norsk språk og kultur. I tillegg er mindre, åpne og spesialiserte modeller mer bærekraftige enn de virkelig store språkmodellene, fra de store multinasjonale teknologiselskapene.',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'labs',
      endpoint: 'noraChat',
      assistant: false
    },
    params: {
      question: '',
      parameters: {
        stream: false,
        max_tokens: 500,
        max_new_tokens: 1024,
        top_k: 64,
        top_p: 0.9,
        stop: ['<|im_end|>'],
        temperature: 0.2,
        do_sample: true,
        repetition_penalty: 1.0,
        return_full_text: true
      }
    }
  },
  {
    id: '2',
    metadata: {
      navn: 'Matematikkens byggesteiner',
      description: '[Matematikkens byggesteiner](https://sindreheggen.wordpress.com/boker/) er en lærebok som dekker de fleste temaer i matematikk fra grunnskolen til og med 1P/2P på videregående. Denne assistenten svarer på spørsmål om matematikk basert på innholdet i denne boken. Alle responser er basert på innholdet i boken, og assistenten er instruert til kun å gi svar som er relevante for matematikk. Læreboken er skrevet av Sindre Sogge Heggen og publisert på [Github - Open Math Books](https://sindrsh.github.io/openmathbooks/) under en Creative Commons-lisens. CC BY-NC-SA 4.0\n\n**Husk at KI lager tekst som kan inneholde feil. Sjekk alltid flere kilder og bruk sunn fornuft når du bruker KI.**',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'skolebotter',
      endpoint: 'assistantOpenAi',
      assistant: true
    },
    params: {
      message: '',
      kontekst: '',
      model: 'gpt-4o',
      assistant_id: import.meta.env.VITE_ASSISTANT_MB,
      new_thread: true,
      thread_id: ''
    }
  },
  {
    id: '16',
    metadata: {
      navn: 'Pythonhjelpen',
      description: 'Eksperimentell bot til bruk som programmeringsstøtte for elever',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'skolebotter',
      endpoint: 'assistantOpenAi',
      assistant: true
    },
    params: { // Pythonhjelpen
      message: '',
      kontekst: '',
      model: 'gpt-4o',
      assistant_id: import.meta.env.VITE_ASSISTANT_LABS_PYTHON,
      new_thread: true,
      thread_id: ''
    }
  },
  {
    id: '17',
    metadata: {
      navn: 'Servicedesk - ADP-støtte',
      description: 'Eksperimentell bot til bruk som programmeridcfdslfjkdsøfkjøsdfkøngsstøtte for elever',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'orgbotter',
      endpoint: 'assistantOpenAi',
      assistant: true
    },
    params: {
      message: '',
      kontekst: '',
      model: 'gpt-4o',
      assistant_id: import.meta.env.VITE_ASSISTANT_ADP,
      new_thread: true,
      thread_id: ''
    }
  },
  {
    id: '18',
    metadata: {
      navn: 'Helsefagarbeider - Lærer',
      description: 'Assistent som skal hjelpe lærere i regi av Nettskolen Vestfold i utviklingen av pedagogiske ressurser innen helsearbeiderfaget.',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'skolebotter',
      endpoint: 'assistantOpenAi',
      assistant: true,
      tools: 'NDLA'
    },
    params: {
      message: '',
      kontekst: '',
      model: 'gpt-4o',
      assistant_id: import.meta.env.VITE_ASSISTANT_HELSEFAG_LAERER,
      new_thread: true,
      thread_id: ''
    }
  },
  {
    id: '19',
    metadata: {
      navn: 'Helsefagarbeider - Elev',
      description: 'Assistent som skal hjelpe elever med å forstå fagstoff innen helsearbeiderfaget.',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'skolebotter',
      endpoint: 'assistantOpenAi',
      assistant: true,
      tools: 'NDLA'
    },
    params: {
      message: '',
      kontekst: '',
      model: 'gpt-4o',
      assistant_id: import.meta.env.VITE_ASSISTANT_HELSEFAG_ELEV,
      new_thread: true,
      thread_id: ''
    }
  },
  {
    id: '20',
    metadata: {
      navn: 'Azure frekksperten - Bruk på eget ansvar',
      description: 'Assistent som får jekka deg ned på jorda.',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'labs',
      endpoint: 'assistantOpenAi',
      assistant: true
    },
    params: {
      message: '',
      kontekst: '',
      model: 'gpt-4o',
      assistant_id: import.meta.env.VITE_ASSISTANT_AZURE_FREKKSPERTEN,
      new_thread: true,
      thread_id: ''
    }
  },
  {
    id: '21',
    metadata: {
      navn: 'Eksamenseksperten',
      description: 'Assistent som skal hjelpe elever, privatister og lærere med spørsmål om eksamen.',
      synligKontekst: false,
      illustrasjon: '',
      tile: 'labs',
      endpoint: 'assistantOpenAi',
      assistant: true,
      tools: ''
    },
    params: {
      message: '',
      kontekst: '',
      model: 'gpt-4o',
      assistant_id: import.meta.env.VITE_ASSISTANT_EKSAMEN_EKSPERTEN,
      new_thread: true,
      thread_id: ''
    }
  }
]
