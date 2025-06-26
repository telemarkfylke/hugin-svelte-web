import axios from 'axios'
import { getHuginToken } from '../useApi'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const { VITE_AI_API_URI: aiApiUri } = import.meta.env

// Importere skjemaer fra eget bibliotek etterhvert
const penRespons = z.object({
  tema: z.string(),
  respons: z.string(),
  nøkkelord: z.string()
})

export const getArticlesFromNDLA = async (searchString) => {
  const params = {
    query: searchString,
    page: 1,
    'page-size': 10,
    language: 'nb',
    'grep-codes': ['KE234', 'KE235', 'KM2652', 'KM2651', 'KM2627', 'KM2649', 'KM2648', 'KM2647', 'KM2646', 'KM2645'],
    'resource-type': 'urn:resourcetype:academicArticle'
  }
  const { data } = await axios.get('https://api.ndla.no/search-api/v1/search', {
    params
  })

  // returns (up to) the three highest rated articles (highest score)
  return data.results.slice(0, 3)
}

export const generateKeywords = async (message) => {
  const systemprompt = 'Hent ut tre nøkkelord fra teksten under. Nøkkelordene skal være relevante for teksten og kan være substantiv, verb eller adjektiv. Nøkkelordene skal være på norsk og ikke inneholde spesialtegn eller tall. Skriv nøkkelordene med komma mellom hvert ord på formen: Nøkkelord1, Nøkkelord2, Nøkkelord3. Her kommer teksten:'
  const accessToken = await getHuginToken()
  const payload = {
    userMessage: systemprompt + message,
    response_id: null,
    imageBase64: '',
    dokFiles: '',
    model: 'gpt-4.1'
  }
  const keyWords = await axios.post(`${aiApiUri}/responseOpenAi`, payload, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })
  return keyWords.data.output_text
}

export const structureResponse = async (userParams) => {
  const payload = userParams.option12
  payload.message = userParams.message
  payload.messageHistory = userParams.messageHistory
  payload.kontekst = 'Hent ut relevant informasjon fra responsen og strukturer den i vedlagte skjema. Du skal hente ut tre nøkkelord som skal brukes til søk'
  payload.temperatur = userParams.temperatur
  payload.bilde_base64String = userParams.base64String
  payload.response_format = zodResponseFormat(penRespons, 'penRespons')
  payload.model = 'gpt-4.1'

  const accessToken = await getHuginToken()
  // Call AZF-funksjon with payload
  const response = await axios.post(`${aiApiUri}/structuredOpenAi`, payload, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })
  return response.data.choices[0].message.parsed
}
