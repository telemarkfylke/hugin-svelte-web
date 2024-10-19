import axios from 'axios'
import { params } from '$lib/data/modelparams'
import { getHuginToken } from '../useApi'
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// Importere skjemaer fra eget bibliotek etterhvert
const penRespons = z.object({
    tema: z.string(),
    respons: z.string(),
    nøkkelord: z.string(),
  });

export const getArticlesFromNDLA = async (searchString) => {
    const params = {
        "query": searchString,
        "page": 1,
        "page-size": 10,
        "language": "nb",
        "grep-codes": ["KE234","KE235","KM2652","KM2651","KM2627","KM2649","KM2648","KM2647","KM2646","KM2645"],
        "resource-type": "urn:resourcetype:academicArticle"
    }
    console.log(params)
    const response = await axios.get(`https://api.ndla.no/search-api/v1/search`, {
        params: params
    })
    return [response.data.results[0], response.data.results[1], response.data.results[2]]
    }

export const structureResponse = async (userParams) => {
        const payload = params.option12
        payload.message = userParams.message
        payload.messageHistory = userParams.messageHistory
        payload.kontekst = "Hent ut relevant informasjon fra responsen og strukturer den i vedlagte skjema. Du skal hente ut tre nøkkelord som skal brukes til søk"
        payload.temperatur = userParams.temperatur
        payload.bilde_base64String = userParams.base64String
        payload.response_format = zodResponseFormat(penRespons, "penRespons")
        payload.model = "gpt-4o-2024-08-06"
    
        const accessToken = await getHuginToken()
        // Call AZF-funksjon with payload
        const response = await axios.post(`${import.meta.env.VITE_AI_API_URI}/structuredOpenAi`, payload, {
        headers: {
            authorization: `Bearer ${accessToken}`
        }
        })
        return response.data.choices[0].message.parsed
    }