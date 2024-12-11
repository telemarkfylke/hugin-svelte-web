# Hugin - Frontend

Hugin er en KI-tjeneste utfiklet for og av Telemark fylkeskommune.
## Installasjon
1. Klon repoet
2. Lag en `.env` med utgangspunkt i filen `env.example`
3. Kjør `npm install`
4. Kjør `npm run dev`

## Om prosjektet
Frontenden er laget med Svelte og hostes på Vercel og må kommunisere med backenden for å fungere.

## Bidra
1. Lag en branch
2. Gjør endringene dine
3. Lag en pull request

## Lisens
Dette prosjektet er lisensiert under MIT-lisensen.

# Funksjonalitet/Routes
Førstesiden viser en oversikt over alle tilgjengelige funksjoner i Hugin. Disse er tilgangsstyrte og hva som vises vil avhenge av hvilken bruker som er logget inn.

## Om tjenesen
Dette er en ren informasjonsside som viser en kort beskrivelse av hva Hugin er og hva den kan brukes til.

## Chat
Dette er hovedfunksjonen i Hugin. Her kan brukere chatte med en ulike språkmodeller og assistenter. Brukeren kan legge inn kontekst og justere temperatur. Chatten støtter også bildeopplasting og kan respondere på spørsmål om det opplastede bildet.

## Dokumentsøk
Funksjon som lar brukeren laste opp og chatte med dokumentet. Responsen er basert på innholdet i dokumentet.

## Labs
Her ligger eksperimentelle funksjoner som ikke er klare for produksjon. Disse kan være funksjoner som er under utvikling eller som ikke er klare for produksjon.

## Transkripsjon
Funksjon som lar brukeren laste opp eller spille inn lyd og få transkribert tekst tilbake. Funksjonen baserer seg på nasjonalbibliotekets KI-mpodell for talegjenkjenning.
