// Bibliotek for å håndtere API-kall til AZF-funksjoner
import axios from 'axios'
import { params } from '$lib/data/modelparams'
import { getHuginToken } from '../useApi'
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// Importere skjemaer fra eget bibliotek etterhvert
const Superheltinfo = z.object({
  navn: z.string(),
  superkraft: z.string(),
  kjønn: z.string(),
  god: z.boolean(),
});

const MatteInfo = z.object({
  tema: z.string(),
  forklaring: z.string(),
  nøkkelord: z.string(),
});


export const testStructured = async (userParams) => {
  console.log(zodResponseFormat(Superheltinfo), "event")
   // Template API-call
   const payload = params.option12
   // payload.message = "Fyll ut informasjon om navn, superkraft, kjønn og om superhelten er god eller ikke. (True/False) i vedlagte skjema.  Her er superhelten: Gandalf"
   payload.message = userParams.message
   payload.messageHistory = userParams.messageHistory
   payload.kontekst = userParams.kontekst
   payload.temperatur = userParams.temperatur
   payload.bilde_base64String = userParams.base64String
   payload.response_format = zodResponseFormat(Superheltinfo, "SuperInfo")
   payload.model = "gpt-4o-2024-08-06"
 
  console.log(payload)

   const accessToken = await getHuginToken()
   // Call AZF-funksjon with payload
   const response = await axios.post(`${import.meta.env.VITE_AI_API_URI}/structuredOpenAi`, payload, {
     headers: {
       authorization: `Bearer ${accessToken}`
     }
   })
   console.log(response)
   //console.log(response.data.choices[0].message.content)
   //console.log(response.data.choices[0].message.parsed)
   return response
}